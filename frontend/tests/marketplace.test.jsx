import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {Activity} from '../src/marketplace/Activity.jsx';
import {AdminReview} from '../src/marketplace/AdminReview.jsx';
import {AuctionCreate} from '../src/marketplace/AuctionCreate.jsx';
import {ListingForm} from '../src/marketplace/ListingForm.jsx';
import {PrivateAccess,Commitment,BidForm,AuctionResult,BidReceipt} from '../src/marketplace/Participation.jsx';
import {App} from '../src/App.jsx';
import {requestApi} from '../src/api.js';

const id='20000000-0000-4000-8000-000000000002',itemId='10000000-0000-4000-8000-000000000002';
const user={id:'10000000-0000-4000-8000-000000000009',name:'Test User',email:'ui@example.invalid',role:'USER'};
const listing={id:itemId,seller_id:user.id,category_id:itemId,title:'إعلان تجريبي',description:'وصف تجريبي',status:'APPROVED',category_fields:{}};
const a={id,visibility:'PUBLIC',item_id:itemId,seller_id:itemId,title:'مزاد السيارة',description:'وصف تجريبي',images:['/images/porsche-carrera-gt.jpg'],current_price:'1000',starting_price:'1000',minimum_increment:'50',status:'ACTIVE',start_time:'2020-01-01',end_time:'2035-01-01',result:null};
const c={id:itemId,status:'SUCCESS'};
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler;
// Protected routes in App mount after stored-session verification completes.
// Mirror that lifecycle so tests never click a detached pre-verification node.
function AfterSessionCheck({children}){return useAuth().status==='checking'?null:children;}
const mount=element=>render(<AuthProvider><AfterSessionCheck>{element}</AfterSessionCheck></AuthProvider>);
beforeEach(()=>{
  window.history.replaceState(null,'','/#home');sessionStorage.clear();saveSession({token:'a'.repeat(64),user});
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  vi.stubGlobal('URL',URL);URL.createObjectURL=vi.fn(()=> 'blob:local-preview');URL.revokeObjectURL=vi.fn();
  handler=async(url,options)=>{
    if(url.endsWith('/me/items'))return answer([listing]);
    if(url.endsWith('/me/auctions'))return answer([{...a,end_time:a.end_time}]);
    if(url.endsWith('/categories'))return answer([{id:itemId,name:'Rare Vehicles'}]);
    if(url.endsWith('/items/'+itemId))return answer(listing);
    if(url.endsWith('/items?status=PENDING_REVIEW'))return answer([{...listing,status:'PENDING_REVIEW'}]);
    if(url.endsWith('/auctions/'+id))return answer(a);
    if(url.endsWith('/commitment')&&options.method==='GET')return answer(c);
    if(url.endsWith('/bids')&&options.method==='GET')return answer([]);
    throw new Error('Unexpected test request');
  };
  vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

test('multipart client sends the original FormData without a JSON content type',async()=>{
  const data=new FormData();data.set('title','fixture');handler=async(_url,options)=>{expect(options.body).toBe(data);expect(options.headers['Content-Type']).toBeUndefined();return answer({id:itemId});};
  expect(await requestApi('/api/v1/items',{method:'POST',body:data})).toEqual({id:itemId});
});
test('activity shows own listings and participated auctions with item-specific destinations',async()=>{
  mount(<Activity/>);expect(await screen.findByRole('heading',{name:listing.title})).toBeVisible();expect(await screen.findByRole('heading',{name:a.title})).toBeVisible();
  expect(screen.getByRole('link',{name:'عرض الإعلان'})).toHaveAttribute('href','#listing/'+itemId);expect(screen.getByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+id);
});
test('guest route retains the intended listing page through login',async()=>{
  sessionStorage.clear();window.history.replaceState(null,'','/#listing/new');mount(<App/>);await waitFor(()=>expect(window.location.hash).toBe('#login?return=listing%2Fnew'));
});
test('USER cannot open admin review UI or fetch its pending queue',async()=>{
  window.history.replaceState(null,'','/#admin');mount(<App/>);expect(await screen.findByRole('alert')).toHaveTextContent('مخصصة للمشرف');expect(fetch.mock.calls.some(([url])=>url.includes('status=PENDING_REVIEW'))).toBe(false);
});
test('admin approval requires confirmation and a matching server result',async()=>{
  saveSession({token:'a'.repeat(64),user:{...user,role:'ADMIN'}});
  handler=async(url,options)=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:itemId,name:'Rare Vehicles'}]):url.endsWith('/review')?answer({...listing,status:'APPROVED',reviewed_by:user.id,reviewed_at:'2026-10-20T10:00:00Z',review_reason:null}):answer({...listing,status:'PENDING_REVIEW'});
  const actor=userEvent.setup();mount(<AdminReview id={itemId}/>);await actor.click(await screen.findByRole('button',{name:'الموافقة على الإعلان'}));expect(screen.getByRole('dialog')).toBeVisible();
  expect(fetch.mock.calls.some(([url])=>url.endsWith('/review'))).toBe(false);await actor.click(screen.getByRole('button',{name:'تأكيد الموافقة',exact:true}));expect(await screen.findByRole('status')).toHaveTextContent('تمت الموافقة');await actor.click(screen.getByRole('link',{name:'العودة إلى الإعلانات قيد المراجعة'}));await waitFor(()=>expect(window.location.hash).toBe('#admin'));
});
test('admin cannot reject using a whitespace-only reason',async()=>{
  saveSession({token:'a'.repeat(64),user:{...user,role:'ADMIN'}});handler=async url=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:itemId,name:'Rare Vehicles'}]):answer({...listing,status:'PENDING_REVIEW'});
  const actor=userEvent.setup();mount(<AdminReview id={itemId}/>);await actor.click(await screen.findByRole('button',{name:'رفض الإعلان'}));await actor.type(screen.getByLabelText('سبب الرفض'),'   ');await actor.click(screen.getByRole('button',{name:'تأكيد الرفض'}));expect(screen.getByRole('alert')).toHaveTextContent('سببًا واضحًا');expect(screen.getByRole('dialog')).toBeVisible();expect(fetch.mock.calls.some(([url])=>url.endsWith('/review'))).toBe(false);
});
test('admin returns from a reviewed item to a fresh queue without reusing item-shaped data',async()=>{
  saveSession({token:'a'.repeat(64),user:{...user,role:'ADMIN'}});
  let reviewed=false;
  handler=async(url,options)=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:itemId,name:'Rare Vehicles'}]):url.endsWith('/items?status=PENDING_REVIEW')?answer(reviewed?[]:[{...listing,status:'PENDING_REVIEW'}]):url.endsWith('/review')?(reviewed=true,answer({...listing,status:'APPROVED',reviewed_by:user.id,reviewed_at:'2026-10-20T10:00:00Z',review_reason:null})):answer({...listing,status:'PENDING_REVIEW'});
  window.history.replaceState(null,'','/#admin/'+itemId);
  const actor=userEvent.setup();mount(<App/>);await actor.click(await screen.findByRole('button',{name:'الموافقة على الإعلان'}));await actor.click(screen.getByRole('button',{name:'تأكيد الموافقة',exact:true}));await actor.click(await screen.findByRole('link',{name:'العودة إلى الإعلانات قيد المراجعة'}));
  expect(await screen.findByText('لا توجد إعلانات بانتظار المراجعة.')).toBeVisible();expect(window.location.hash).toBe('#admin');
});
test('auction setup refuses unapproved listing and another seller ownership',async()=>{
  handler=async url=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:itemId,name:'Rare Vehicles'}]):answer({...listing,status:'PENDING_REVIEW'});mount(<AuctionCreate id={itemId}/>);expect(await screen.findByRole('alert')).toHaveTextContent('إعلان معتمد تملكه');expect(screen.queryByLabelText('سعر البداية (ر.س)')).toBeNull();
});
test('private auction creation preserves the selected listing and exposes one-time code',async()=>{
  handler=async(url,options)=>url.endsWith('/auctions')&&options.method==='POST'?answer({id,item_id:itemId,visibility:'PRIVATE',accessCode:'test-code',status:'SCHEDULED',starting_price:JSON.parse(options.body).startingPrice,current_price:JSON.parse(options.body).startingPrice,minimum_increment:JSON.parse(options.body).minimumIncrement,start_time:JSON.parse(options.body).startTime,end_time:JSON.parse(options.body).endTime},201):url.endsWith('/me/items')?answer([]):answer(listing);
  const actor=userEvent.setup();mount(<AuctionCreate id={itemId}/>);await actor.click(await screen.findByRole('button',{name:'إنشاء مزاد خاص'}));await actor.type(screen.getByLabelText('سعر البداية (ر.س)'),'1000');await actor.type(screen.getByLabelText('الحد الأدنى لزيادة المزايدة (ر.س)'),'50');
  await actor.type(screen.getByLabelText('بداية المزاد'),'2030-01-01T10:00');await actor.type(screen.getByLabelText('نهاية المزاد'),'2030-01-02T10:00');await actor.click(screen.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}));
  expect(await screen.findByLabelText('رمز وصول المزاد الخاص')).toHaveValue('test-code');expect(screen.getByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+id);
});
test('wrong private code stays on the same auction and never claims access',async()=>{
  handler=async url=>url.endsWith('/me/items')?answer([]):answer({code:'INVALID_CODE'},403);
  const actor=userEvent.setup();mount(<PrivateAccess id={id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'wrong');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('alert')).toHaveTextContent('رمز الوصول غير صحيح');expect(window.location.hash).toBe('#home');
});
test('correct private code opens that exact auction',async()=>{
  handler=async url=>url.endsWith('/me/items')?answer([]):url.endsWith('/access')?answer({accessGranted:true}):answer({...a,visibility:'PRIVATE'});const actor=userEvent.setup();mount(<PrivateAccess id={id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'right');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('heading',{name:'تم قبول الرمز'})).toBeVisible();await actor.click(screen.getByRole('link',{name:'عرض تفاصيل المزاد'}));await waitFor(()=>expect(window.location.hash).toBe('#auction/'+id));
});
test('unavailable provider cannot create success or a bid request',async()=>{
  handler=async(url,options)=>url.endsWith('/me/items')?answer([]):url.endsWith('/commitment')?(options.method==='POST'?answer({code:'BANK_SANDBOX_UNAVAILABLE'},503):answer({code:'NOT_FOUND'},404)):answer(a);
  const actor=userEvent.setup();mount(<Commitment id={id}/>);await actor.click(await screen.findByRole('button',{name:'ابدأ تأكيد المشاركة'}));expect(await screen.findByRole('alert')).toHaveTextContent('لم يتم اعتماد المشاركة');expect(screen.queryByRole('link',{name:'متابعة إلى المزايدة'})).toBeNull();expect(fetch.mock.calls.some(([url,opts])=>url.endsWith('/bids')&&opts.method==='POST')).toBe(false);
});
test('bid confirmation sends correct auction, amount and one UUID, then waits for server acceptance',async()=>{
  let submitted;handler=async(url,options)=>url.endsWith('/me/items')?answer([]):url.endsWith('/commitment')?answer(c):url.endsWith('/bids')?(options.method==='POST'?(submitted=JSON.parse(options.body),answer({bidId:itemId,amount:1000,currentPrice:1000},201)):answer([])):answer(a);
  const onAccepted=vi.fn(),actor=userEvent.setup();mount(<BidForm id={id} onAccepted={onAccepted}/>);const field=await screen.findByLabelText('مبلغ مزايدتك (ر.س)');await waitFor(()=>expect(field).toBeEnabled());await actor.type(field,'1000');await actor.click(screen.getByRole('button',{name:'مراجعة المزايدة'}));expect(submitted).toBeUndefined();await actor.click(screen.getByRole('button',{name:'تأكيد',exact:true}));await waitFor(()=>expect(onAccepted).toHaveBeenCalled());expect(submitted.amount).toBe(1000);expect(submitted.requestId).toMatch(/^[a-f0-9-]{36}$/);expect(window.location.hash).toBe('#bid-success/'+id);
});
test('pending commitment disables bidding before confirmation',async()=>{
  handler=async(url)=>url.endsWith('/me/items')?answer([]):url.endsWith('/commitment')?answer({...c,status:'PENDING'}):url.endsWith('/bids')?answer([]):answer(a);mount(<BidForm id={id} onAccepted={()=>{}}/>);expect(await screen.findByRole('link',{name:'تأكيد المشاركة أولًا'})).toBeVisible();expect(screen.getByLabelText('مبلغ مزايدتك (ر.س)')).toBeDisabled();
});
test('no-bid result and unknown identity do not invent a personal winner',async()=>{
  handler=async url=>url.endsWith('/me/items')?answer([]):answer({...a,status:'CLOSED',result:{winner_bid_id:null,closed_at:'2026-10-20T12:00:00Z'}});mount(<AuctionResult id={id}/>);expect(await screen.findByRole('heading',{name:'انتهى المزاد دون مزايدات'})).toBeVisible();
});
test('an unrelated receipt never produces bid-success text',async()=>{
  mount(<BidReceipt id={id} receipt={{auctionId:itemId,amount:1000}}/>);await screen.findByRole('heading',{name:a.title});expect(screen.queryByText(/تم قبول مزايدتك/)).toBeNull();
});
test('listing sends real FormData and keeps failure visible without false publication',async()=>{
  handler=async(url,options)=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:itemId,name:'Rare Vehicles'}]):url.endsWith('/items')&&options.method==='POST'?answer({code:'INVALID_INPUT'},400):answer([]);
  const actor=userEvent.setup();mount(<ListingForm/>);await actor.click(await screen.findByRole('radio',{name:/السيارات النادرة/}));await actor.click(screen.getByRole('button',{name:'المتابعة إلى تفاصيل المعروض'}));await actor.type(await screen.findByLabelText('عنوان الإعلان'),'إعلان تجريبي');await actor.selectOptions(screen.getByLabelText('القسم'),itemId);await actor.type(screen.getByLabelText('وصف المعروض'),'وصف من بيانات المستخدم');await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));await actor.upload(screen.getByLabelText('إضافة صور'),new File(['fixture'],'fixture.png',{type:'image/png'}));await actor.click(screen.getByRole('button',{name:'مراجعة الإعلان'}));await actor.click(screen.getByRole('button',{name:'إرسال للمراجعة'}));expect(await screen.findByRole('alert')).toHaveTextContent('تحقق من البيانات');const call=fetch.mock.calls.find(([url,opts])=>url.endsWith('/items')&&opts.method==='POST');expect(call[1].body).toBeInstanceOf(FormData);expect(call[1].body.getAll('images')).toHaveLength(1);expect(window.location.hash).toBe('#home');
});
