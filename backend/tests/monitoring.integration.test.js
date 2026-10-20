import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {setupQa,databaseSkip,expectError} from './helpers/qa-fixtures.js';
let q;
before(async()=>{if(!databaseSkip)q=await setupQa('monitoring');});
after(async()=>{if(q)await q.shutdown();});
const check=(name,fn)=>test(name,{skip:databaseSkip},fn);

check('dashboard and monitoring are ADMIN-only including private auctions',async()=>{
  for(const path of ['/admin/dashboard','/admin/auctions']){
    expectError(await q.api(path),401,'UNAUTHORIZED');
    expectError(await q.api(path,{token:q.seller.token}),403,'FORBIDDEN');
  }
  const privateAuction=await q.auction({visibility:'PRIVATE'});
  const result=await q.api('/admin/auctions?visibility=PRIVATE',{token:q.admin.token});
  assert.equal(result.status,200);
  assert.ok(result.json.data.some(row=>row.id===privateAuction.id));
  assert.ok(result.json.data.every(row=>row.visibility==='PRIVATE'&&!('access_code_hash' in row)));
});

check('dashboard counts match persisted listings and database-time auction states',async()=>{
  await q.item({status:'PENDING_REVIEW'});await q.item({status:'REJECTED'});
  await q.auction({start:'1 hour',end:'2 hours',status:'SCHEDULED'});
  await q.auction({status:'SCHEDULED'});await q.auction({end:'-1 second'});
  const response=await q.api('/admin/dashboard',{token:q.admin.token});
  assert.equal(response.status,200);
  const rows=(await q.pool.query('SELECT status,count(*)::int AS n FROM items GROUP BY status')).rows;
  const count=status=>rows.find(row=>row.status===status)?.n||0;
  assert.deepEqual(response.json.data.listings,{pendingReview:count('PENDING_REVIEW'),approved:count('APPROVED'),rejected:count('REJECTED')});
  const expected=(await q.pool.query(`SELECT
    count(*) FILTER (WHERE status<>'CLOSED' AND start_time>clock_timestamp())::int AS scheduled,
    count(*) FILTER (WHERE status<>'CLOSED' AND start_time<=clock_timestamp() AND end_time>clock_timestamp())::int AS active,
    count(*) FILTER (WHERE status='CLOSED' OR end_time<=clock_timestamp())::int AS closed FROM auctions`)).rows[0];
  assert.deepEqual(response.json.data.auctions,expected);
});

check('admin monitoring finalizes expired auctions and exposes stable winner/no-bids results',async()=>{
  const a=await q.auction();await q.commitment(a);
  const accepted=await q.bid(a,1100);assert.equal(accepted.status,201);
  await q.pool.query("UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",[a.id]);
  const empty=await q.auction({end:'-1 second'});
  const response=await q.api('/admin/auctions?status=CLOSED',{token:q.admin.token});
  assert.equal(response.status,200);
  const winner=response.json.data.find(row=>row.id===a.id),noBids=response.json.data.find(row=>row.id===empty.id);
  assert.equal(winner.result.winner_bid_id,accepted.json.data.bidId);
  assert.equal(Number(winner.result.winning_amount),1100);
  assert.equal(winner.bid_count,1);assert.equal(winner.bidder_count,1);
  assert.equal(noBids.result.winner_bid_id,null);
  assert.equal((await q.state(a)).result_count,1);
  await q.api('/admin/auctions?status=CLOSED',{token:q.admin.token});
  assert.equal((await q.state(a)).result_count,1);
});

check('winner survives page reload and participation remains scoped to the authenticated viewer',async()=>{
  const a=await q.auction();await q.commitment(a,q.bidder);await q.commitment(a,q.bidder2);
  await q.bid(a,1000,q.bidder);const winning=await q.bid(a,1100,q.bidder2);
  await q.pool.query("UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",[a.id]);
  const path='/auctions/'+a.id;
  const winner=await q.api(path,{token:q.bidder2.token});
  assert.equal(winner.json.data.result.isWinner,true);
  assert.equal(winner.json.data.participation.latestBidId,winning.json.data.bidId);
  assert.equal(winner.json.data.participation.bidCount,1);
  assert.equal(Number(winner.json.data.participation.highestBid),1100);
  const loser=await q.api(path,{token:q.bidder.token});
  assert.equal(loser.json.data.result.isWinner,false);
  assert.equal(Number(loser.json.data.participation.highestBid),1000);
  assert.equal(loser.json.data.participation.hasBid,true);
  const guest=await q.api(path);
  assert.equal(guest.json.data.result.isWinner,null);assert.equal(guest.json.data.participation,null);
  assert.equal('bidder_id' in guest.json.data.result,false);
});

check('monitoring validates filters/paging and admins can review all listing states',async()=>{
  for(const filter of ['status=BAD','visibility=SECRET','limit=101','offset=-1'])expectError(await q.api('/admin/auctions?'+filter,{token:q.admin.token}),400,'INVALID_INPUT');
  const rejected=await q.item({status:'REJECTED'});
  const response=await q.api('/items?status=REJECTED',{token:q.admin.token});
  assert.ok(response.json.data.some(row=>row.id===rejected.id));
  assert.ok(response.json.data.every(row=>row.status==='REJECTED'));
  expectError(await q.api('/items?status=BAD',{token:q.admin.token}),400,'INVALID_INPUT');
});
