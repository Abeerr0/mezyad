import {createRequire} from 'node:module';
import {base,fixtures,prepareListing,session} from './seller-support.js';
const requireBackend=createRequire(new URL('../../backend/package.json',import.meta.url));
const {Pool}=requireBackend('pg');
export {base,fixtures,session};
const createdAuctions=[],createdUsers=[];
// Fixture writes are limited to the harness-created schema in a disposable *_test database.
export async function testDatabase(action){
 const f=await fixtures(),url=new URL(process.env.TEST_DATABASE_URL);
 if(!url.pathname.endsWith('_test')||!/^frontend_browser_[a-f0-9]{12}$/.test(f.schema))throw Error('Disposable fixture database required');
 url.searchParams.set('options','-c search_path='+f.schema+',public');const pool=new Pool({connectionString:url.toString()});
 try{return await action(pool,f);}finally{await pool.end();}
}
export async function bidderAuction(request,{visibility='PUBLIC',eligibility='SUCCESS',title='Bidder batch '+crypto.randomUUID()}={}){
 const {item,seller}=await prepareListing(request,{title});
 const response=await request.post(base+'/auctions',{headers:{Authorization:'Bearer '+seller.token},data:{itemId:item.id,visibility,startingPrice:1000,minimumIncrement:50,startTime:new Date(Date.now()-3600000).toISOString(),endTime:new Date(Date.now()+3600000).toISOString()}});
 if(response.status()!==201)throw Error('Auction fixture creation failed');const auction=(await response.json()).data;createdAuctions.push({auctionId:auction.id,itemId:item.id});const bidder=await session(request,'bidder');
 if(eligibility)await setEligibility(auction.id,bidder.user.id,eligibility);
 return {item,auction,seller,bidder};
}
export async function setEligibility(auctionId,userId,status){
 if(!['SUCCESS','PENDING','FAILED'].includes(status))throw Error('Invalid fixture status');
 await testDatabase(pool=>pool.query("INSERT INTO bid_commitments(auction_id,user_id,status,sandbox_reference) VALUES($1,$2,$3,'LOCAL_V5_FIXTURE_NOT_BANK_VERIFIED') ON CONFLICT(auction_id,user_id) DO UPDATE SET status=EXCLUDED.status",[auctionId,userId,status]));
}
export async function challenger(request,auctionId){
 const f=await fixtures(),email='v5-'+crypto.randomUUID()+'@example.invalid';
 const registered=await request.post(base+'/auth/register',{data:{name:'Synthetic competing bidder',email,password:f.password}});if(registered.status()!==201)throw Error('Synthetic challenger registration failed');
 const auth=await request.post(base+'/auth/login',{data:{email,password:f.password}}),value=(await auth.json()).data;createdUsers.push(value.user.id);await setEligibility(auctionId,value.user.id,'SUCCESS');return value;
}
export async function expireAuction(id){await testDatabase(pool=>pool.query("UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id=$1",[id]));}
export async function loginBidder(page,role='bidder'){
 const f=await fixtures();await page.goto('/#login');await page.getByLabel('البريد الإلكتروني').fill(role+'@example.invalid');await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await page.getByRole('link',{name:'حسابي',exact:true}).waitFor();
}
export async function confirmBid(page,id,value='1000'){
 await page.goto('/#bid/'+id);await page.getByLabel('مبلغ مزايدتك (ر.س)').fill(value);await page.getByRole('button',{name:'مراجعة المزايدة'}).click();await page.getByRole('dialog').waitFor();
}
export async function placeBid(request,auth,id,amount,requestId=crypto.randomUUID()){
 return request.post(base+'/auctions/'+id+'/bids',{headers:{Authorization:'Bearer '+auth.token},data:{amount,requestId}});
}

export async function cleanupBidderFixtures(){
 const auctions=createdAuctions.splice(0),users=createdUsers.splice(0);if(!auctions.length&&!users.length)return;
 await testDatabase(async pool=>{
  for(const {auctionId,itemId} of auctions){
   await pool.query('DELETE FROM auction_results WHERE auction_id=$1',[auctionId]);
   await pool.query('DELETE FROM bids WHERE auction_id=$1',[auctionId]);
   await pool.query('DELETE FROM bid_commitments WHERE auction_id=$1',[auctionId]);
   await pool.query('DELETE FROM private_auction_access WHERE auction_id=$1',[auctionId]);
   await pool.query('DELETE FROM auctions WHERE id=$1',[auctionId]);
   await pool.query('DELETE FROM item_images WHERE item_id=$1',[itemId]);
   await pool.query('DELETE FROM items WHERE id=$1',[itemId]);
  }
  for(const id of users){await pool.query('DELETE FROM user_sessions WHERE user_id=$1',[id]);await pool.query('DELETE FROM users WHERE id=$1',[id]);}
 });
}
