import {test,expect} from '@playwright/test';
import {prepareListing,loginSeller} from './seller-support.js';
import {base,fixtures,session,testDatabase,bidderAuction,setEligibility,challenger,expireAuction,loginBidder,placeBid,cleanupBidderFixtures} from './bidder-support.js';

const localItems=[],localAuctions=[];
const headers=auth=>({Authorization:'Bearer '+auth.token});
const upload=()=>({name:'closeout.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGM4s6UKK2IYWhIAgid+gc+bshcAAAAASUVORK5CYII=','base64')});
async function uploadedItem(request){
 const f=await fixtures(),seller=await session(request,'seller');
 const response=await request.post(base+'/items',{headers:headers(seller),multipart:{categoryId:f.category,title:'صور مراجعة فعلية '+crypto.randomUUID(),description:'معروض اصطناعي في قاعدة اختبار معزولة',category_fields:JSON.stringify({model:'GT',year:'2024'}),images:upload()}});
 expect(response.status()).toBe(201);const item=(await response.json()).data;localItems.push(item.id);return {item,seller};
}
test.afterEach(async()=>{
 await cleanupBidderFixtures();
 const auctions=localAuctions.splice(0),items=localItems.splice(0);
 if(!auctions.length&&!items.length)return;
 // testDatabase verifies both the disposable *_test database and harness schema.
 await testDatabase(async pool=>{
  for(const id of auctions){
   await pool.query('DELETE FROM auction_results WHERE auction_id=$1',[id]);
   await pool.query('DELETE FROM bids WHERE auction_id=$1',[id]);
   await pool.query('DELETE FROM bid_commitments WHERE auction_id=$1',[id]);
   await pool.query('DELETE FROM private_auction_access WHERE auction_id=$1',[id]);
   await pool.query('DELETE FROM auctions WHERE id=$1',[id]);
  }
  for(const id of items){await pool.query('DELETE FROM item_images WHERE item_id=$1',[id]);await pool.query('DELETE FROM items WHERE id=$1',[id]);}
 });
});

test('real high-value decimal auction renders and accepts the exact reviewed amount',async({page,request})=>{
 const {item,seller}=await prepareListing(request,{title:'سعر عشري مرتفع '+crypto.randomUUID()});localItems.push(item.id);
 const response=await request.post(base+'/auctions',{headers:headers(seller),data:{itemId:item.id,visibility:'PUBLIC',startingPrice:10000000.03,minimumIncrement:0.01,startTime:new Date(Date.now()-3600000).toISOString(),endTime:new Date(Date.now()+3600000).toISOString()}});
 expect(response.status()).toBe(201);const auction=(await response.json()).data;localAuctions.push(auction.id);
 const bidder=await session(request,'bidder');
 // Synthetic local eligibility enables downstream real bids; it is not bank verification.
 await setEligibility(auction.id,bidder.user.id,'SUCCESS');
 await loginBidder(page);await page.goto('/#auction/'+auction.id);
 await expect(page.getByRole('heading',{name:item.title,exact:true})).toBeVisible();await expect(page.getByText('10,000,000.03',{exact:true}).first()).toBeVisible();
 await page.goto('/#bid/'+auction.id);await page.getByLabel('مبلغ مزايدتك (ر.س)').fill('10000000.03');await page.getByRole('button',{name:'مراجعة المزايدة'}).click();
 await expect(page.getByRole('dialog')).toContainText('10,000,000.03');
 const accepted=page.waitForResponse(r=>r.url()===base+'/auctions/'+auction.id+'/bids'&&r.request().method()==='POST');
 await page.getByRole('button',{name:'تأكيد',exact:true}).click();const actual=await accepted;expect(actual.status()).toBe(201);expect((await actual.json()).data.amount).toBe(10000000.03);
 await expect(page.getByRole('status')).toContainText('تم قبول مزايدتك');
 const saved=(await (await request.get(base+'/auctions/'+auction.id,{headers:headers(bidder)})).json()).data;
 expect(saved.current_price).toBe('10000000.03');expect(saved.participation.highestBid).toBe('10000000.03');
 await page.goto('/#bid/'+auction.id);await expect(page.getByText(/الحد الأدنى للمزايدة:/)).toContainText('10,000,000.04');
});

test('real closed outbid auction offers its final result instead of another bid and keeps the personal result after reload',async({page,request})=>{
 const {auction,bidder,item}=await bidderAuction(request),other=await challenger(request,auction.id);
 expect((await placeBid(request,bidder,auction.id,1000)).status()).toBe(201);expect((await placeBid(request,other,auction.id,1050)).status()).toBe(201);
 await loginBidder(page);await page.goto('/#auction/'+auction.id);await expect(page.getByRole('heading',{name:'تم تجاوز مزايدتك',exact:true})).toBeVisible();
 await expireAuction(auction.id);
 // Navigating to the same hash does not require a new detail read; reload the
 // fixture transition explicitly rather than racing the five-second poll.
 const closedRead=page.waitForResponse(r=>r.url()===base+'/auctions/'+auction.id&&r.request().method()==='GET'&&r.status()===200);
 await page.reload();expect((await (await closedRead).json()).data.status).toBe('CLOSED');
 await expect(page.getByRole('heading',{name:item.title,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'انتهى المزاد',exact:true})).toBeDisabled();
 await expect(page.getByRole('heading',{name:'تم تجاوز مزايدتك',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'عرض حالة المزايدة'})).toHaveCount(0);
 await page.goto('/#outbid/'+auction.id);await expect(page.getByRole('heading',{name:'انتهى المزاد',exact:true})).toBeVisible();
 await expect(page.locator('a[href="#bid/'+auction.id+'"]')).toHaveCount(0);
 await page.getByRole('link',{name:'عرض نتيجة المزاد',exact:true}).click();await expect(page.getByRole('heading',{name:'لم تفز بالمزاد',exact:true})).toBeVisible();
 await expect(page.getByText('1,050',{exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'لم تفز بالمزاد',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'فزت بالمزاد',exact:true})).toHaveCount(0);
 const final=(await (await request.get(base+'/auctions/'+auction.id,{headers:headers(bidder)})).json()).data;
 expect(final.status).toBe('CLOSED');expect(final.result.isWinner).toBe(false);expect(final.participation.hasBid).toBe(true);expect(final.result.winning_amount).toBe('1050.00');
});

test('real ADMIN permission revocation hides previously displayed listing data before any decision is posted',async({page,request})=>{
 const {item}=await uploadedItem(request),f=await fixtures();await loginBidder(page,'admin');await page.goto('/#admin/'+item.id);
 await expect(page.getByRole('heading',{name:item.title,exact:true})).toBeVisible();
 await expect.poll(()=>page.locator('.gallery-main').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
 let posts=0;page.on('request',r=>{if(r.url()===base+'/admin/items/'+item.id+'/review'&&r.method()==='POST')posts++;});
 await testDatabase(pool=>pool.query("UPDATE users SET role='USER' WHERE id=$1",[f.users.admin]));
 try{
  await page.getByRole('button',{name:'الموافقة على الإعلان',exact:true}).click();
  const denied=page.waitForResponse(r=>r.url()===base+'/items/'+item.id&&r.request().method()==='GET'&&r.status()===403);
  await page.getByRole('button',{name:'تأكيد الموافقة',exact:true}).click();await denied;
  await expect(page.getByRole('heading',{name:'لا تملك صلاحية مراجعة الإعلان',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:item.title,exact:true})).toHaveCount(0);await expect(page.locator('.gallery-main')).toHaveCount(0);await expect(page.getByText(f.users.seller,{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'الموافقة على الإعلان',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'رفض الإعلان',exact:true})).toBeDisabled();expect(posts).toBe(0);
 }finally{await testDatabase(pool=>pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[f.users.admin]));}
});

test('private creation renews an explicitly fault-expired image through a real GET while retaining its one-time code',async({page,request})=>{
 const {item}=await uploadedItem(request),admin=await session(request,'admin');
 expect((await request.post(base+'/admin/items/'+item.id+'/review',{headers:headers(admin),data:{decision:'APPROVED'}})).status()).toBe(200);
 await loginSeller(page);await page.goto('/#auction-new/'+item.id);await page.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}).click();
 await page.getByLabel('سعر البداية (ر.س)').fill('1500');await page.getByLabel('الحد الأدنى لزيادة المزايدة (ر.س)').fill('50');await page.getByLabel('بداية المزاد').fill(new Date(Date.now()+3600000).toISOString().slice(0,16));await page.getByLabel('نهاية المزاد').fill(new Date(Date.now()+7200000).toISOString().slice(0,16));
 let created=null,posts=0,reads=0;const imageRequests=[];
 page.on('request',r=>{if(r.url().includes('/api/v1/images/'))imageRequests.push(r.url());});
 await page.route('**/api/v1/auctions',async route=>{
  if(route.request().method()!=='POST')return route.continue();posts++;
  const response=await route.fetch();expect(response.status()).toBe(201);created=(await response.json()).data;localAuctions.push(created.id);await route.fulfill({response});
 });
 await page.route('**/api/v1/auctions/*',async route=>{
  if(!created||route.request().url()!==base+'/auctions/'+created.id||route.request().method()!=='GET')return route.continue();
  reads++;const response=await route.fetch();expect(response.status()).toBe(200);
  if(reads===1){
   // Fault injection is limited to the expiry query of a real authorized detail response.
   // The image server genuinely rejects it; the next GET and renewed image remain real.
   const json=await response.json();expect(json.data.images).toHaveLength(1);json.data.images=json.data.images.map(source=>source.replace(/expires=\d+/,'expires=1000000000'));return route.fulfill({response,json});
  }
  return route.fulfill({response});
 });
 await page.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}).click();
 await expect(page.getByRole('heading',{name:'تم جدولة المزاد الخاص',exact:true})).toBeVisible();
 await expect.poll(()=>page.locator('.seller-media-large').evaluate(image=>image.tagName==='IMG'&&image.complete&&image.naturalWidth>0)).toBe(true);
 expect(posts).toBe(1);expect(reads).toBe(2);expect(created.accessCode).toBeTruthy();await expect(page.getByLabel('رمز وصول المزاد الخاص')).toHaveValue(created.accessCode);await expect(page.getByLabel('رابط المزاد الخاص')).toHaveValue(new URL('/#private/'+created.id,page.url()).href);
 await expect(page.getByRole('button',{name:'نسخ رمز الوصول',exact:true})).toBeEnabled();expect(imageRequests.some(source=>source.includes('expires=1000000000'))).toBe(true);expect(imageRequests.every(source=>!/[?&](token|access_token|authorization)=/i.test(source))).toBe(true);
});
