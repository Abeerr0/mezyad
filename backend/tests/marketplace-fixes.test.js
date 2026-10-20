import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {setupQa,databaseSkip,expectError} from './helpers/qa-fixtures.js';
let q;
before(async()=>{if(!databaseSkip)q=await setupQa('fixes');});
after(async()=>{if(q)await q.shutdown();});
const check=(name,fn)=>test(name,{skip:databaseSkip},fn);

check('invalid UUID paths return 400 JSON instead of database errors',async()=>{
  for(const [path,method,token,body] of [
    ['/items/no-id','GET',q.seller.token],['/items/no-id','PATCH',q.seller.token,{}],
    ['/admin/items/no-id/review','POST',q.admin.token,{decision:'APPROVED'}],
    ['/auctions/no-id','GET'],['/auctions/no-id/access','POST',q.bidder.token,{}],
    ['/auctions/no-id/commitment','GET',q.bidder.token],['/auctions/no-id/bids','GET',q.bidder.token],
  ])expectError(await q.api(path,{method,token,body}),400,'INVALID_ID');
});

check('QA-05 rate limit: repeated guesses are blocked and grant remains absent',async()=>{
  const a=await q.auction({visibility:'PRIVATE'});
  for(let i=0;i<10;i++)expectError(await q.api('/auctions/'+a.id+'/access',{method:'POST',token:q.bidder.token,body:{accessCode:'wrong'}}),403,'INVALID_CODE');
  expectError(await q.api('/auctions/'+a.id+'/access',{method:'POST',token:q.bidder.token,body:{accessCode:a.accessCode}}),429,'TOO_MANY_REQUESTS');
  assert.equal((await q.pool.query('SELECT count(*)::int AS n FROM private_auction_access WHERE auction_id=$1',[a.id])).rows[0].n,0);
  assert.equal((await q.api('/auctions/'+a.id+'/access',{method:'POST',token:q.bidder2.token,body:{accessCode:a.accessCode}})).status,200);
});

check('private commitment GET requires grant even when a synthetic row already exists',async()=>{
  const a=await q.auction({visibility:'PRIVATE'});await q.commitment(a);
  expectError(await q.api('/auctions/'+a.id+'/commitment',{token:q.bidder.token}),404,'NOT_FOUND');
  await q.grant(a);
  assert.equal((await q.api('/auctions/'+a.id+'/commitment',{token:q.bidder.token})).status,200);
});

check('scheduled auctions become active without a bid; expired list status and final detail agree',async()=>{
  const active=await q.auction({status:'SCHEDULED'});
  const expired=await q.auction({end:'-1 second',status:'SCHEDULED'});
  const list=await q.api('/auctions?status=ACTIVE&categoryId='+q.category.id);
  assert.equal(list.status,200);
  assert.ok(list.json.data.some(row=>row.id===active.id));
  assert.equal(list.json.data.some(row=>row.id===expired.id),false);
  const detail=await q.api('/auctions/'+active.id);
  assert.equal(detail.json.data.status,'ACTIVE');
  assert.equal((await q.api('/auctions/'+expired.id)).json.data.status,'CLOSED');
  expectError(await q.api('/auctions?categoryId=bad'),400,'INVALID_INPUT');
  expectError(await q.api('/auctions?status=bad'),400,'INVALID_INPUT');
});

check('admin can monitor private auctions; anonymous and USER cannot request all scope',async()=>{
  const a=await q.auction({visibility:'PRIVATE'});
  expectError(await q.api('/auctions?scope=all'),401,'UNAUTHORIZED');
  expectError(await q.api('/auctions?scope=all',{token:q.bidder.token}),403,'FORBIDDEN');
  const list=await q.api('/auctions?scope=all',{token:q.admin.token});
  assert.ok(list.json.data.some(row=>row.id===a.id));
  assert.equal((await q.api('/auctions/'+a.id,{token:q.admin.token})).status,200);
});

check('review requires nonblank reason and rejects overlong text; history validates paging',async()=>{
  const item=await q.item({status:'PENDING_REVIEW'});
  for(const reason of ['   ','x'.repeat(2001)])expectError(await q.api('/admin/items/'+item.id+'/review',{method:'POST',token:q.admin.token,body:{decision:'REJECTED',reason}}),400,'INVALID_INPUT');
  const a=await q.auction();
  for(const query of ['limit=101','limit=-1','offset=-1','offset=bad'])expectError(await q.api('/auctions/'+a.id+'/bids?'+query,{token:q.bidder.token}),400,'INVALID_INPUT');
});
