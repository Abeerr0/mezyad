// فحص SQL محلي إضافي؛ ما يغني عن اختبار PostgreSQL العادي وأقفال التزامن.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

if (!process.env.PGLITE_INSTALL_DIR) throw new Error('Set PGLITE_INSTALL_DIR to an isolated installation of @electric-sql/pglite');
const qaRequire=createRequire(join(resolve(process.env.PGLITE_INSTALL_DIR),'package.json'));
const {PGlite}=qaRequire('@electric-sql/pglite');
const {pgcrypto}=qaRequire('@electric-sql/pglite/contrib/pgcrypto');
const db=new PGlite({extensions:{pgcrypto}});
const checks=[];
let server,pool;
process.env.UPLOAD_DIR=await mkdtemp(join(tmpdir(),'mezyad-sql-smoke-'));
const check=(name,fn)=>{fn();checks.push({name,passed:true})};
try {
  await db.exec(await readFile(new URL('../../database/migrations/001_schema.sql',import.meta.url),'utf8'));
  for(let i=0;i<2;i++)await db.exec(await readFile(new URL('../../database/seeds/001_categories.sql',import.meta.url),'utf8'));
  const tables=await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
  check('existing migration creates ten tables',()=>assert.equal(tables.rows[0].n,10));
  const categories=await db.query('SELECT id FROM categories');
  check('category seed repeats without duplicates',()=>assert.equal(categories.rows.length,5));
  ({pool}=await import('../src/db.js'));
  // الاستعلامات تنفذ على محرك Postgres WASM، بدون نتائج SQL جاهزة أو تكامل بنكي وهمي.
  const sql=async(text,params=[])=>{const r=await db.query(text,params);return {...r,rowCount:Math.max(r.affectedRows||0,r.rows.length)}};
  pool.query=sql;
  let queue=Promise.resolve();
  pool.connect=async()=>{
    let unlock;const gate=new Promise(resolve=>{unlock=resolve});const before=queue;queue=before.then(()=>gate);await before;
    return {query:sql,release:unlock};
  };
  const {app}=await import('../src/app.js');
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const api=async(path,{token,body,form,method='GET'}={})=>{
    const response=await fetch(origin+'/api/v1'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:form??(body!==undefined?JSON.stringify(body):undefined)});
    return {status:response.status,json:await response.json(),headers:response.headers};
  };
  async function account(role='USER'){
    const body={name:'SQL QA fixture',email:randomUUID()+'@example.invalid',password:'Local-QA-password'};
    const created=await api('/auth/register',{method:'POST',body});assert.equal(created.status,201);
    if(role==='ADMIN')await sql("UPDATE users SET role='ADMIN' WHERE id=$1",[created.json.data.id]);
    const login=await api('/auth/login',{method:'POST',body});assert.equal(login.status,200);
    return {id:created.json.data.id,token:login.json.data.token};
  }
  const seller=await account(),buyer=await account(),other=await account(),admin=await account('ADMIN');
  const png=await sharp({create:{width:4,height:4,channels:3,background:'#e6d8ba'}}).png().toBuffer();
  function form(fields={location:'الرياض'}){
    const data=new FormData();data.set('categoryId',categories.rows[0].id);data.set('title','إعلان اختبار');data.set('description','بيانات مصطنعة للاختبار فقط');data.set('categoryFields',JSON.stringify(fields));data.append('images',new Blob([png],{type:'image/png'}),'photo.png');return data;
  }
  const created=await api('/items',{method:'POST',token:seller.token,form:form()});
  check('multipart listing persists canonical fields and image',()=>{assert.equal(created.status,201,JSON.stringify(created.json));assert.deepEqual(created.json.data.categoryFields,{location:'الرياض'});assert.equal(created.json.data.images.length,1)});
  const item=created.json.data;
  const beforeRows=(await sql('SELECT count(*)::int AS n FROM items')).rows[0].n;
  const beforeFiles=await readdir(process.env.UPLOAD_DIR);
  const broken=form();broken.append('images',new Blob(['corrupt'],{type:'image/png'}),'broken.png');
  const failedUpload=await api('/items',{method:'POST',token:seller.token,form:broken});
  const afterRows=(await sql('SELECT count(*)::int AS n FROM items')).rows[0].n;
  const afterFiles=await readdir(process.env.UPLOAD_DIR);
  check('corrupt second photo rolls back listing and removes the first file',()=>{assert.equal(failedUpload.status,400);assert.equal(afterRows,beforeRows);assert.deepEqual(afterFiles,beforeFiles)});

  for(const viewer of [seller,admin]){
    const result=await api('/items/'+item.id,{token:viewer.token});
    check('seller/admin can read listing photos: '+(viewer===seller?'seller':'admin'),()=>{assert.equal(result.status,200);assert.equal(result.json.data.images.length,1)});
  }
  const forbidden=await api('/items/'+item.id,{token:buyer.token});check('another user cannot read the listing',()=>assert.equal(forbidden.status,403));
  const rejected=await api('/admin/items/'+item.id+'/review',{method:'POST',token:admin.token,body:{decision:'REJECTED',reason:'صورة أوضح'}});
  check('admin rejection returns photos',()=>{assert.equal(rejected.status,200);assert.equal(rejected.json.data.images.length,1)});
  const bad=form();bad.set('category_fields','{"location":"متعارض"}');
  const conflict=await api('/items/'+item.id,{method:'PATCH',token:seller.token,form:bad});check('conflicting category aliases rejected',()=>assert.equal(conflict.status,400));
  const resubmitted=await api('/items/'+item.id,{method:'PATCH',token:seller.token,form:form({location:'جدة'})});
  check('rejected listing resubmission replaces photos and fields',()=>{assert.equal(resubmitted.status,200);assert.equal(resubmitted.json.data.status,'PENDING_REVIEW');assert.equal(resubmitted.json.data.reviewed_by,null);assert.deepEqual(resubmitted.json.data.categoryFields,{location:'جدة'})});
  const oldImage=await fetch(origin+item.images[0]);check('old photo removed after successful replacement',()=>assert.equal(oldImage.status,404));
  const newImage=await fetch(origin+resubmitted.json.data.images[0]);check('new signed photo is retrievable',()=>assert.equal(newImage.status,200));
  await api('/admin/items/'+item.id+'/review',{method:'POST',token:admin.token,body:{decision:'APPROVED'}});
  const a=await api('/auctions',{method:'POST',token:seller.token,body:{itemId:item.id,visibility:'PRIVATE',startingPrice:1000,minimumIncrement:50,startTime:new Date(Date.now()-60000).toISOString(),endTime:new Date(Date.now()+3600000).toISOString()}});
  assert.equal(a.status,201,JSON.stringify(a.json));const auction=a.json.data;
  const guest=await api('/auctions/'+auction.id);check('private details hidden from guests',()=>assert.equal(guest.status,404));
  const discovery=await api('/auctions');check('private auction absent from discovery',()=>assert.equal(discovery.json.data.some(row=>row.id===auction.id),false));
  const wrong=await api('/auctions/'+auction.id+'/access',{method:'POST',token:buyer.token,body:{accessCode:'wrong'}});
  const missing=await api('/auctions/'+randomUUID()+'/access',{method:'POST',token:buyer.token,body:{accessCode:'wrong'}});
  check('wrong and missing private invitations share the same response',()=>{assert.equal(wrong.status,missing.status);assert.deepEqual(wrong.json,missing.json)});
  const access=await api('/auctions/'+auction.id+'/access',{method:'POST',token:buyer.token,body:{accessCode:auction.accessCode}});assert.equal(access.status,200);
  const bank=await api('/auctions/'+auction.id+'/commitment',{method:'POST',token:buyer.token,body:{status:'SUCCESS',reference:'untrusted'}});
  const commitments=await sql('SELECT count(*)::int AS n FROM bid_commitments');
  check('unavailable bank never creates a SUCCESS from browser input',()=>{assert.equal(bank.status,503);assert.equal(commitments.rows[0].n,0)});
  const noCommit=await api('/auctions/'+auction.id+'/bids',{method:'POST',token:buyer.token,body:{amount:1000,requestId:randomUUID()}});check('missing verified commitment blocks bidding',()=>assert.equal(noCommit.status,403));
  // موافقة مصطنعة في قاعدة مؤقتة لاختبار ما بعد البنك فقط؛ ليست موافقة داخل التطبيق.
  await sql("INSERT INTO bid_commitments(auction_id,user_id,status,sandbox_reference) VALUES($1,$2,'SUCCESS','LOCAL_QA_FIXTURE_NOT_BANK_VERIFIED')",[auction.id,buyer.id]);
  const requestId=randomUUID();
  const bid=await api('/auctions/'+auction.id+'/bids',{method:'POST',token:buyer.token,body:{amount:1000,requestId}});
  const repeat=await api('/auctions/'+auction.id+'/bids',{method:'POST',token:buyer.token,body:{amount:1000,requestId}});
  check('sequential bid replay creates one bid',()=>{assert.equal(bid.status,201);assert.equal(repeat.status,409)});

  await api('/auctions/'+auction.id+'/access',{method:'POST',token:other.token,body:{accessCode:auction.accessCode}});
  await sql("INSERT INTO bid_commitments(auction_id,user_id,status,sandbox_reference) VALUES($1,$2,'SUCCESS','LOCAL_QA_FIXTURE_NOT_BANK_VERIFIED')",[auction.id,other.id]);
  const finalBid=await api('/auctions/'+auction.id+'/bids',{method:'POST',token:other.token,body:{amount:1100,requestId:randomUUID()}});
  assert.equal(finalBid.status,201);
  await sql("UPDATE auctions SET end_time=clock_timestamp()-interval '1 second' WHERE id=$1",[auction.id]);
  const winner=await api('/auctions/'+auction.id,{token:other.token});
  check('winner and own participation returned after fresh request',()=>{assert.equal(winner.json.data.status,'CLOSED');assert.equal(winner.json.data.result.isWinner,true);assert.equal(winner.json.data.participation.latestBidId,finalBid.json.data.bidId);assert.equal(Number(winner.json.data.result.winning_amount),1100)});

  const loser=await api('/auctions/'+auction.id,{token:buyer.token});
  check('losing viewer sees only their persisted participation',()=>{assert.equal(loser.json.data.result.isWinner,false);assert.equal(Number(loser.json.data.participation.highestBid),1000);assert.equal(loser.json.data.participation.latestBidId,bid.json.data.bidId);assert.equal('bidder_id' in loser.json.data.result,false)});
  const emptyItem=await api('/items',{method:'POST',token:seller.token,form:form({location:'الرياض'})});
  assert.equal(emptyItem.status,201);
  await api('/admin/items/'+emptyItem.json.data.id+'/review',{method:'POST',token:admin.token,body:{decision:'APPROVED'}});
  const emptyAuction=await api('/auctions',{method:'POST',token:seller.token,body:{itemId:emptyItem.json.data.id,visibility:'PUBLIC',startingPrice:1000,minimumIncrement:50,startTime:new Date(Date.now()-7200000).toISOString(),endTime:new Date(Date.now()-3600000).toISOString()}});
  assert.equal(emptyAuction.status,201);
  const adminList=await api('/admin/auctions?status=CLOSED',{token:admin.token});
  check('admin monitoring returns private closure result',()=>{assert.equal(adminList.status,200,JSON.stringify(adminList.json));const row=adminList.json.data.find(row=>row.id===auction.id);assert.equal(row.result.winner_bid_id,finalBid.json.data.bidId);assert.equal(row.bid_count,2)});

  check('monitoring finalizes a no-bids auction without a prior detail visit',()=>{const row=adminList.json.data.find(row=>row.id===emptyAuction.json.data.id);assert.equal(row.status,'CLOSED');assert.equal(row.result.winner_bid_id,null);assert.equal(row.result.winning_amount,null)});
  const publicResult=await api('/auctions/'+emptyAuction.json.data.id);
  check('guest result exposes neither personal participation nor bidder identity',()=>{assert.equal(publicResult.json.data.participation,null);assert.equal(publicResult.json.data.result.isWinner,null);assert.equal('bidder_id' in publicResult.json.data.result,false)});
  const dashboard=await api('/admin/dashboard',{token:admin.token});
  check('dashboard reports database counts',()=>{assert.equal(dashboard.status,200,JSON.stringify(dashboard.json));assert.equal(dashboard.json.data.listings.approved,2);assert.equal(dashboard.json.data.auctions.closed,2);assert.equal(dashboard.json.data.bids.count,2)});
  const denied=await api('/admin/dashboard',{token:other.token});check('ordinary user cannot open admin dashboard',()=>assert.equal(denied.status,403));
  const adminItems=await api('/items?status=APPROVED',{token:admin.token});check('admin listing filters include photos',()=>{assert.equal(adminItems.json.data.length,2);assert.equal(adminItems.json.data[0].images.length,1)});
  const disk=await readdir(process.env.UPLOAD_DIR);check('photo replacement leaves only the two current listing files',()=>assert.equal(disk.length,2));
  const version=(await db.query('SELECT version() AS version')).rows[0].version;
  console.log(JSON.stringify({engine:'PGlite',version,checks,passed:checks.length,nativePostgresConcurrencyVerified:false,bankProviderVerified:false},null,2));
} finally {
  if(server)await new Promise(resolve=>server.close(resolve));
  if(pool)await pool.end();
  await db.close();await rm(process.env.UPLOAD_DIR,{recursive:true,force:true});
}
