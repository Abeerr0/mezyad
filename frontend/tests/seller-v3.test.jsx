import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {ListingForm} from '../src/marketplace/ListingForm.jsx';
import {Activity,ListingDetails} from '../src/marketplace/Activity.jsx';
import {AuctionCreate} from '../src/marketplace/AuctionCreate.jsx';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:uid(1),role:'USER',name:'Seller',email:'seller@example.invalid'};
const catalog=[{id:uid(21),name:'Real Estate'},{id:uid(22),name:'Rare Vehicles'}];
const item={id:uid(3),seller_id:user.id,category_id:catalog[1].id,title:'سيارة البائع',description:'تفاصيل من الخادم',category_fields:{model:'GT'},status:'APPROVED'};
const a={id:uid(5),item_id:item.id,seller_id:user.id,title:item.title,description:item.description,visibility:'PUBLIC',status:'SCHEDULED',images:['/images/porsche-carrera-gt.jpg'],current_price:'1500',starting_price:'1500',minimum_increment:'50',start_time:'2030-01-01T10:00:00.000Z',end_time:'2030-01-02T10:00:00.000Z'};
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
const summary=x=>({id:x.id,title:x.title,status:x.status,end_time:x.end_time});
let handler;
function Ready({children}){return useAuth().status==='checking'?null:children;}
const mount=node=>render(<AuthProvider><Ready>{node}</Ready></AuthProvider>);
const creates=()=>fetch.mock.calls.filter(([url,o])=>url.endsWith('/auctions')&&o.method==='POST');
const writes=()=>fetch.mock.calls.filter(([,o])=>['POST','PATCH'].includes(o.method));
const result=(body,extra={})=>({...a,item_id:body.itemId,visibility:body.visibility,starting_price:String(body.startingPrice),current_price:String(body.startingPrice),minimum_increment:String(body.minimumIncrement),start_time:body.startTime,end_time:body.endTime,...(body.visibility==='PRIVATE'?{accessCode:'server-generated-code'}:{}),...extra});
async function setup(actor,type='عام'){
 await actor.click(await screen.findByRole('button',{name:'إنشاء مزاد '+type,exact:true}));
 await actor.type(screen.getByLabelText('سعر البداية (ر.س)'),'1500');await actor.type(screen.getByLabelText('الحد الأدنى لزيادة المزايدة (ر.س)'),'50');
 await actor.type(screen.getByLabelText('بداية المزاد'),'2030-01-01T10:00');await actor.type(screen.getByLabelText('نهاية المزاد'),'2030-01-02T10:00');
}
async function sendListing(actor){await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));await actor.upload(screen.getByLabelText('إضافة صور'),new File(['image'],'clear.png',{type:'image/png'}));await actor.click(screen.getByRole('button',{name:'مراجعة الإعلان',exact:true}));await actor.click(screen.getByRole('button',{name:'إرسال للمراجعة'}));}
beforeEach(()=>{
 sessionStorage.clear();saveSession({token:'a'.repeat(64),user});window.history.replaceState(null,'','/#home');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});URL.createObjectURL=vi.fn(()=> 'blob:photo');URL.revokeObjectURL=vi.fn();
 handler=async(url,o)=>{
  if(url.endsWith('/me/items'))return answer([item]);if(url.endsWith('/categories'))return answer(catalog);if(url.endsWith('/me/auctions'))return answer([]);if(url.endsWith('/items/'+item.id))return answer(item);if(url.endsWith('/auctions/'+a.id))return answer(a);if(url.endsWith('/auctions')&&o.method==='POST')return answer(result(JSON.parse(o.body)),201);throw Error('Unexpected seller request '+url);
 };vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
test('live category IDs open the existing form and preserve the draft without writing',async()=>{
 const actor=userEvent.setup();mount(<ListingForm/>);expect(await screen.findByRole('heading',{name:'اختر فئة السلعة'})).toBeVisible();const next=await screen.findByRole('button',{name:'المتابعة إلى تفاصيل المعروض'});expect(next).toBeDisabled();expect(await screen.findAllByRole('radio')).toHaveLength(2);expect(screen.queryByRole('radio',{name:/الإبل/})).toBeNull();
 await actor.click(screen.getByRole('radio',{name:/السيارات النادرة/}));await actor.click(next);expect(screen.getByLabelText('القسم')).toHaveValue(catalog[1].id);await actor.type(screen.getByLabelText('عنوان الإعلان'),'مسودة محفوظة');await actor.click(screen.getByRole('button',{name:'تغيير القسم'}));expect(screen.getByRole('radio',{name:/السيارات النادرة/})).toBeChecked();await actor.click(screen.getByRole('button',{name:'المتابعة إلى تفاصيل المعروض'}));expect(screen.getByLabelText('عنوان الإعلان')).toHaveValue('مسودة محفوظة');expect(writes()).toHaveLength(0);
});
test('empty category response offers no invented card or continuation',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/categories')?answer([]):base(u,o);mount(<ListingForm/>);expect(await screen.findByText('لا توجد أقسام متاحة حاليًا. أعد المحاولة لاحقًا.')).toBeVisible();expect(screen.queryAllByRole('radio')).toHaveLength(0);expect(screen.getByRole('button',{name:'المتابعة إلى تفاصيل المعروض'})).toBeDisabled();
});
test('category errors can be retried without static fallback categories',async()=>{
 const base=handler;let fail=true;handler=(u,o)=>u.endsWith('/categories')?answer(fail?{code:'NETWORK_ERROR'}:catalog,fail?503:200):base(u,o);const actor=userEvent.setup();mount(<ListingForm/>);expect(await screen.findByRole('alert')).toHaveTextContent('تعذر الاتصال');expect(screen.queryAllByRole('radio')).toHaveLength(0);fail=false;await actor.click(screen.getByRole('button',{name:'إعادة المحاولة'}));expect(await screen.findByRole('radio',{name:/العقارات/})).toBeVisible();
});
test('dashboard separates owned auctions, participation and listing records',async()=>{
 const own={...a,title:'مزاد أملكه'},other={...a,id:uid(6),item_id:uid(7),seller_id:uid(9),title:'مزاد شاركت فيه'},base=handler;handler=(u,o)=>u.endsWith('/me/auctions')?answer([summary(own),summary(other)]):u.endsWith('/auctions/'+own.id)?answer(own):u.endsWith('/auctions/'+other.id)?answer(other):base(u,o);
 mount(<Activity/>);const owned=await screen.findByRole('region',{name:'المزادات التي أنشأتها'});expect(await within(owned).findByRole('heading',{name:own.title})).toBeVisible();expect(within(owned).queryByRole('heading',{name:other.title})).toBeNull();const joined=screen.getByRole('region',{name:'مشاركاتي في مزادات الآخرين'});expect(within(joined).getByRole('heading',{name:other.title})).toBeVisible();expect(within(joined).queryByRole('heading',{name:own.title})).toBeNull();expect(within(owned).getByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+own.id);
});
test('listing filters preserve actual statuses and rejection notes',async()=>{
 const rows=['APPROVED','PENDING_REVIEW','REJECTED'].map((status,i)=>({...item,id:uid(30+i),title:'إعلان '+i,status,review_reason:status==='REJECTED'?'الصورة غير واضحة':null})),base=handler;handler=(u,o)=>u.endsWith('/me/items')?answer(rows):base(u,o);const actor=userEvent.setup();mount(<Activity/>);await screen.findByRole('heading',{name:'إعلان 0'});await actor.click(screen.getByRole('button',{name:/تحتاج تعديلًا/}));expect(screen.getByRole('heading',{name:'إعلان 2'})).toBeVisible();expect(screen.queryByRole('heading',{name:'إعلان 0'})).toBeNull();expect(screen.getByText('الصورة غير واضحة')).toBeVisible();expect(screen.getByRole('link',{name:'عرض الإعلان'})).toHaveAttribute('href','#listing/'+uid(32));
});
test('foreign listings cannot be displayed as seller records',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/me/items')?answer([{...item,seller_id:uid(9)}]):base(u,o);mount(<Activity/>);expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(screen.queryByRole('heading',{name:item.title})).toBeNull();
});
test('rejection shows the server reason, edit route and no auction shortcut',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)?answer({...item,status:'REJECTED',review_reason:'أضف صورة توضح اللوحة'}):base(u,o);mount(<ListingDetails id={item.id}/>);expect(await screen.findByText('أضف صورة توضح اللوحة')).toBeVisible();expect(screen.getByRole('heading',{name:'لم يُعتمد الإعلان'})).toBeVisible();expect(screen.getByRole('link',{name:'تعديل وإعادة إرسال'})).toHaveAttribute('href','#listing-edit/'+item.id);expect(screen.queryByRole('link',{name:'إعداد المزاد'})).toBeNull();expect(writes()).toHaveLength(0);
});
for(const state of ['PENDING_REVIEW','APPROVED','FOREIGN'])test(state+' cannot open the owned-rejected edit form',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)?answer({...item,status:state==='FOREIGN'?'REJECTED':state,seller_id:state==='FOREIGN'?uid(9):user.id}):base(u,o);mount(<ListingForm id={item.id}/>);expect(await screen.findByRole('alert')).toHaveTextContent('لا تملك صلاحية');expect(screen.queryByLabelText('عنوان الإعلان')).toBeNull();expect(writes()).toHaveLength(0);
});
test('edit keeps the category and multipart draft visible after upload failure',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)?(o.method==='PATCH'?answer({code:'INVALID_INPUT'},400):answer({...item,status:'REJECTED',review_reason:'حدّث الوصف'})):base(u,o);const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);expect(await screen.findByLabelText('عنوان الإعلان')).toHaveValue(item.title);expect(screen.getByLabelText('القسم')).toBeDisabled();expect(screen.getByText('حدّث الوصف')).toBeVisible();await actor.type(screen.getByLabelText('وصف المعروض'),' — توضيح إضافي');await sendListing(actor);expect(await screen.findByRole('alert')).toHaveTextContent('لم يصل تأكيد حفظ الإعلان وصوره');expect(window.location.hash).toBe('#home');const [,o]=writes()[0];expect(o.method).toBe('PATCH');expect(o.body).toBeInstanceOf(FormData);expect(o.body.get('categoryId')).toBe(catalog[1].id);expect(o.body.has('visibility')).toBe(false);expect(o.body.getAll('images')).toHaveLength(1);expect(screen.queryByText('تم إرسال الإعلان بنجاح')).toBeNull();
});
test('resubmission conflict stops repeated edits and offers a state recheck',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)?(o.method==='PATCH'?answer({code:'INVALID_STATE'},409):answer({...item,status:'REJECTED'})):base(u,o);const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');await sendListing(actor);expect(await screen.findByRole('alert')).toHaveTextContent('تغيّرت حالة الإعلان');expect(screen.queryByRole('button',{name:'إرسال للمراجعة'})).toBeNull();expect(screen.getByRole('link',{name:'عرض حالة الإعلان'})).toHaveAttribute('href','#listing/'+item.id);
});
for(const type of ['PUBLIC','PRIVATE'])test(type+' success waits for complete matching server fields',async()=>{
 const base=handler;let release;handler=(u,o)=>u.endsWith('/auctions')&&o.method==='POST'?new Promise(resolve=>{release=()=>resolve(answer(result(JSON.parse(o.body)),201));}):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor,type==='PRIVATE'?'خاص':'عام');expect(creates()).toHaveLength(0);await actor.click(screen.getByRole('button',{name:'إنشاء مزاد '+(type==='PRIVATE'?'خاص':'عام'),exact:true}));expect(screen.queryByRole('heading',{name:/تم جدولة/})).toBeNull();expect(screen.getByRole('button',{name:'جارٍ إنشاء المزاد…'})).toBeDisabled();release();expect(await screen.findByRole('heading',{name:type==='PRIVATE'?'تم جدولة المزاد الخاص':'تم جدولة المزاد',exact:true})).toBeVisible();expect(screen.getByText('1,500')).toBeVisible();expect(screen.getByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+a.id);expect(Object.keys(JSON.parse(creates()[0][1].body)).sort()).toEqual(['endTime','itemId','minimumIncrement','startTime','startingPrice','visibility']);if(type==='PRIVATE')expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue('server-generated-code');else expect(screen.queryByLabelText('رمز وصول المزاد الخاص')).toBeNull();
});
for(const [name,extra] of [['missing status',{status:undefined}],['foreign item',{item_id:uid(99)}],['wrong visibility',{visibility:'PRIVATE'}],['wrong amount',{starting_price:999}],['invalid deadline',{end_time:'invalid'}]])test('bad creation result '+name+' never shows success',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions')&&o.method==='POST'?answer(result(JSON.parse(o.body),extra),201):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor);await actor.click(screen.getByRole('button',{name:'إنشاء مزاد عام',exact:true}));expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(screen.queryByRole('heading',{name:'تم جدولة المزاد',exact:true})).toBeNull();expect(screen.queryByRole('link',{name:'عرض المزاد'})).toBeNull();
});
test('an empty private code is not a successful private creation',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions')&&o.method==='POST'?answer(result(JSON.parse(o.body),{accessCode:'   '}),201):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor,'خاص');await actor.click(screen.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}));expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(screen.queryByLabelText('رمز وصول المزاد الخاص')).toBeNull();
});
test('approved listing with a known auction replaces setup with its verified destination',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/me/auctions')?answer([summary(a)]):base(u,o);mount(<ListingDetails id={item.id}/>);expect(await screen.findByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+a.id);expect(screen.queryByRole('link',{name:'إعداد المزاد'})).toBeNull();expect(writes()).toHaveLength(0);
});
test('direct setup with a known linked auction cannot create a second one',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/me/auctions')?answer([summary(a)]):base(u,o);mount(<AuctionCreate id={item.id}/>);expect(await screen.findByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+a.id);expect(screen.queryByRole('button',{name:'إنشاء مزاد عام'})).toBeNull();expect(creates()).toHaveLength(0);
});
test('unknown duplicate 409 stops creation without inventing an auction link',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions')&&o.method==='POST'?answer({code:'DUPLICATE_AUCTION'},409):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor);await actor.click(screen.getByRole('button',{name:'إنشاء مزاد عام',exact:true}));expect(await screen.findByText(/لم نتمكن من تحديد رابط المزاد/)).toBeVisible();expect(screen.getByRole('alert')).toHaveTextContent('مرتبط بمزاد');expect(screen.queryByRole('link',{name:'عرض المزاد'})).toBeNull();expect(screen.queryByRole('button',{name:'إنشاء مزاد عام'})).toBeNull();expect(creates()).toHaveLength(1);
});
test('duplicate race re-reads the server before showing the existing auction link',async()=>{
 const base=handler;let race=false;handler=(u,o)=>u.endsWith('/me/auctions')?answer(race?[summary(a)]:[]):u.endsWith('/auctions')&&o.method==='POST'?(race=true,answer({code:'DUPLICATE_AUCTION'},409)):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor);await actor.click(screen.getByRole('button',{name:'إنشاء مزاد عام',exact:true}));expect(await screen.findByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+a.id);expect(creates()).toHaveLength(1);expect(screen.queryByRole('heading',{name:'تم جدولة المزاد',exact:true})).toBeNull();
});

test('a mismatched post-creation photo response never displays another seller image',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions/'+a.id)?answer({...a,seller_id:uid(9),images:['/images/foreign-item.jpg']}):base(u,o);const actor=userEvent.setup();mount(<AuctionCreate id={item.id}/>);await setup(actor);await actor.click(screen.getByRole('button',{name:'إنشاء مزاد عام',exact:true}));expect(await screen.findByRole('heading',{name:'تم جدولة المزاد',exact:true})).toBeVisible();expect(await screen.findByText('تم إنشاء المزاد، وتعذر تحميل صورته الآن. يمكنك فتح تفاصيله للتحقق.')).toBeVisible();expect(screen.queryByRole('img',{name:item.title})).toBeNull();expect(screen.getByText('لا تتوفر صورة للمعروض')).toBeVisible();
});
