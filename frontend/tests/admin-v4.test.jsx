import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AdminReview} from '../src/marketplace/AdminReview.jsx';
import {AdminDashboard,AdminAuctions} from '../src/marketplace/AdminWorkspace.jsx';
import {ListingForm} from '../src/marketplace/ListingForm.jsx';
import {App} from '../src/App.jsx';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const admin={id:uid(1),name:'مشرف الاختبار',email:'admin@example.invalid',role:'ADMIN'};
const category={id:uid(2),name:'Real Estate'};
const item={id:uid(3),seller_id:uid(4),category_id:category.id,title:'فيلا حطين',description:'تفاصيل الإعلان من الخادم',category_fields:{area:'450',location:'الرياض'},status:'PENDING_REVIEW',reviewed_by:null,reviewed_at:null,review_reason:null};
const auction={id:uid(5),item_id:item.id,title:item.title,status:'ACTIVE',starting_price:'14000000',current_price:'14500000',visibility:'PUBLIC',start_time:'2026-10-20T10:00:00Z',end_time:'2030-01-01T10:00:00Z',result:null};
const result=(decision='APPROVED',extra={})=>({...item,status:decision,reviewed_by:admin.id,reviewed_at:'2026-10-20T12:00:00Z',review_reason:decision==='REJECTED'?'أكمل وصف المعروض':null,...extra});
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler,current;
function Ready({children}){return useAuth().status==='checking'?null:children;}
const mount=node=>render(<AuthProvider><Ready>{node}</Ready></AuthProvider>);
const posts=()=>fetch.mock.calls.filter(([url,o])=>url.endsWith('/review')&&o.method==='POST');
async function confirm(actor,decision='APPROVED'){
 await actor.click(await screen.findByRole('button',{name:decision==='APPROVED'?'الموافقة على الإعلان':'رفض الإعلان',exact:true}));
 if(decision==='REJECTED')await actor.type(screen.getByLabelText('سبب الرفض'),'أكمل وصف المعروض');
 await actor.click(screen.getByRole('button',{name:decision==='APPROVED'?'تأكيد الموافقة':'تأكيد الرفض',exact:true}));
}
beforeEach(()=>{
 sessionStorage.clear();saveSession({token:'a'.repeat(64),user:admin});window.history.replaceState(null,'','/#home');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});URL.createObjectURL=vi.fn(()=> 'blob:photo');URL.revokeObjectURL=vi.fn();current={...item};
 handler=async(url,o)=>{
  if(url.endsWith('/me/items'))return answer([]);if(url.endsWith('/categories'))return answer([category]);if(url.endsWith('/items?status=PENDING_REVIEW'))return answer(current.status==='PENDING_REVIEW'?[current]:[]);
  if(url.endsWith('/items/'+item.id))return answer(current);
  if(url.endsWith('/review')){const b=JSON.parse(o.body);current=result(b.decision,{review_reason:b.reason||null});return answer(current);}
  if(url.endsWith('/auctions'))return answer([auction]);if(url.endsWith('/auctions/'+auction.id))return answer(auction);throw Error('Unexpected request '+url);
 };vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
for(const node of [<AdminReview/>,<AdminReview id={item.id}/>,<AdminDashboard/>,<AdminAuctions/>,<AdminAuctions id={auction.id}/>])test('direct admin component denies USER before loading privileged data '+node.type.name+String(node.props.id||''),async()=>{
 saveSession({token:'a'.repeat(64),user:{...admin,role:'USER'}});mount(node);expect(await screen.findByRole('alert')).toHaveTextContent('مخصصة للمشرف');expect(fetch.mock.calls.every(([url])=>url.endsWith('/me/items'))).toBe(true);expect(posts()).toHaveLength(0);
});
for(const route of ['admin','admin-dashboard','admin-auctions'])test('guarded admin route '+route+' remains denied for USER',async()=>{
 saveSession({token:'a'.repeat(64),user:{...admin,role:'USER'}});window.history.replaceState(null,'','/#'+route);mount(<App/>);expect(await screen.findByRole('alert')).toHaveTextContent('مخصصة للمشرف');expect(posts()).toHaveLength(0);
});
test('dashboard counts only real pending and public active records and marks missing totals unavailable',async()=>{
 mount(<AdminDashboard/>);expect(await screen.findByRole('heading',{name:item.title})).toBeVisible();const cards=screen.getByLabelText('ملخص لوحة المشرف');expect(within(cards).getByText('المزادات العامة الجارية')).toBeVisible();expect(within(cards).getAllByText('1')).toHaveLength(2);expect(within(cards).getAllByText('غير متاح')).toHaveLength(2);expect(screen.getByText('تاريخ الإرسال غير متاح')).toBeVisible();expect(screen.getByLabelText('صورة الإعلان غير متاحة')).toBeVisible();expect(fetch.mock.calls.some(([url])=>/stats|analytics|users/.test(url))).toBe(false);
});
test('queue empty state and refresh read current pending list',async()=>{
 current=result();const actor=userEvent.setup();mount(<AdminReview/>);expect(await screen.findByText('لا توجد إعلانات بانتظار المراجعة.')).toBeVisible();current={...item};await actor.click(screen.getByRole('button',{name:'تحديث القائمة'}));expect(await screen.findByRole('link',{name:'مراجعة الإعلان'})).toHaveAttribute('href','#admin/'+item.id);
});
test('queue loading and network failure never produce a fake count or listing',async()=>{
 const base=handler;let release;handler=(u,o)=>u.endsWith('status=PENDING_REVIEW')?new Promise(resolve=>{release=()=>resolve(answer({code:'NETWORK_ERROR'},503));}):base(u,o);mount(<AdminReview/>);await waitFor(()=>expect(release).toBeTypeOf('function'));expect(screen.getAllByRole('status').length).toBeGreaterThan(0);release();expect(await screen.findByRole('alert')).toHaveTextContent('تعذر الاتصال');expect(screen.queryByRole('link',{name:'مراجعة الإعلان'})).toBeNull();
});
test('approval preflight and matching response show result without creating an auction',async()=>{
 const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('status')).toHaveTextContent('تمت الموافقة');expect(posts()).toHaveLength(1);expect(fetch.mock.calls.filter(([u])=>u.endsWith('/items/'+item.id))).toHaveLength(2);expect(fetch.mock.calls.some(([u,o])=>u.endsWith('/auctions')&&o.method==='POST')).toBe(false);expect(screen.getByRole('link',{name:'العودة إلى الإعلانات قيد المراجعة'})).toHaveAttribute('href','#admin');
});
test('rejection validates whitespace inside modal, traps textarea focus, and cancellation sends no decision',async()=>{
 const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await actor.click(await screen.findByRole('button',{name:'رفض الإعلان',exact:true}));const reason=screen.getByLabelText('سبب الرفض');await actor.type(reason,'   ');await actor.click(screen.getByRole('button',{name:'تأكيد الرفض'}));expect(screen.getByRole('alert')).toHaveTextContent('سببًا واضحًا');expect(reason).toHaveAttribute('aria-invalid','true');await actor.click(screen.getByRole('button',{name:'إلغاء'}));expect(screen.queryByRole('dialog')).toBeNull();expect(posts()).toHaveLength(0);
});
test('rejection sends the trimmed reason and presents the actual rejected result',async()=>{
 const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor,'REJECTED');expect(await screen.findByRole('status')).toHaveTextContent('تم رفض الإعلان');expect(screen.getByText('أكمل وصف المعروض')).toBeVisible();expect(JSON.parse(posts()[0][1].body)).toEqual({decision:'REJECTED',reason:'أكمل وصف المعروض'});
});
test('pending confirmation locks repeated click, cancellation and Escape',async()=>{
 const base=handler;let release;handler=(u,o)=>u.endsWith('/review')?new Promise(resolve=>{release=()=>resolve(answer(result()));}):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);await waitFor(()=>expect(release).toBeTypeOf('function'));expect(screen.getByRole('button',{name:'جارٍ الإرسال…'})).toBeDisabled();expect(screen.getByRole('button',{name:'إلغاء'})).toBeDisabled();await actor.keyboard('{Escape}');expect(screen.getByRole('dialog')).toBeVisible();expect(posts()).toHaveLength(1);release();expect(await screen.findByRole('status')).toHaveTextContent('تمت الموافقة');
});
test('stale content discovered by preflight must be reviewed before any POST',async()=>{
 const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await actor.click(await screen.findByRole('button',{name:'الموافقة على الإعلان'}));current={...item,title:'العنوان الجديد'};await actor.click(screen.getByRole('button',{name:'تأكيد الموافقة'}));expect(await screen.findByRole('alert')).toHaveTextContent('تغيرت تفاصيل الإعلان');expect(screen.getByRole('heading',{name:'العنوان الجديد'})).toBeVisible();expect(posts()).toHaveLength(0);expect(screen.queryByRole('dialog')).toBeNull();
});
test('already reviewed preflight displays current result without POST',async()=>{
 const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await actor.click(await screen.findByRole('button',{name:'الموافقة على الإعلان'}));current=result('REJECTED');await actor.click(screen.getByRole('button',{name:'تأكيد الموافقة'}));expect(await screen.findByRole('status')).toHaveTextContent('الحالة الحالية');expect(screen.getByText('أكمل وصف المعروض')).toBeVisible();expect(posts()).toHaveLength(0);
});
for(const code of ['NETWORK_ERROR','TIMEOUT','INVALID_STATE'])test(code+' after committed decision reconciles via GET with no repeat POST',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/review')?(current=result(),answer({code},code==='INVALID_STATE'?409:504)):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('status')).toHaveTextContent('الحالة الحالية');expect(screen.queryByRole('button',{name:'الموافقة على الإعلان'})).toBeNull();expect(posts()).toHaveLength(1);expect(fetch.mock.calls.filter(([u])=>u.endsWith('/items/'+item.id))).toHaveLength(3);
});
test('ambiguous failure with pending read requires explicit new confirmation rather than auto retry',async()=>{
 const base=handler;let fail=true;handler=(u,o)=>u.endsWith('/review')&&fail?answer({code:'NETWORK_ERROR'},503):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('alert')).toHaveTextContent('ما زال قيد المراجعة');expect(posts()).toHaveLength(1);expect(screen.queryByRole('dialog')).toBeNull();fail=false;await confirm(actor);expect(await screen.findByRole('status')).toHaveTextContent('تمت الموافقة');expect(posts()).toHaveLength(2);
});
test('failed reconciliation disables decision until explicit GET verifies status',async()=>{
 const base=handler;let attempted=false,readFailure=true;handler=(u,o)=>u.endsWith('/review')?(attempted=true,answer({code:'TIMEOUT'},504)):u.endsWith('/items/'+item.id)&&attempted&&readFailure?answer({code:'NETWORK_ERROR'},503):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('button',{name:'تحقق من حالة الإعلان'})).toBeVisible();expect(screen.getByRole('button',{name:'الموافقة على الإعلان'})).toBeDisabled();readFailure=false;await actor.click(screen.getByRole('button',{name:'تحقق من حالة الإعلان'}));expect(await screen.findByRole('alert')).toHaveTextContent('ما زال قيد المراجعة');expect(screen.getByRole('button',{name:'الموافقة على الإعلان'})).toBeEnabled();expect(posts()).toHaveLength(1);
});
test('preflight network failure sends no decision and locks until verification',async()=>{
 const base=handler;let reads=0;handler=(u,o)=>u.endsWith('/items/'+item.id)&&++reads>1?answer({code:'TIMEOUT'},504):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('alert')).toHaveTextContent('لم نرسل قرارًا');expect(posts()).toHaveLength(0);expect(screen.getByRole('button',{name:'الموافقة على الإعلان'})).toBeDisabled();
});
test('403 after decision locks permissions rather than offering another review attempt',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/review')?answer({code:'FORBIDDEN'},403):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('alert')).toHaveTextContent('مشرف مخوّل');expect(screen.getByRole('button',{name:'الموافقة على الإعلان'})).toBeDisabled();expect(screen.queryByRole('button',{name:'تحقق من حالة الإعلان'})).toBeNull();expect(posts()).toHaveLength(1);
});
for(const [name,extra] of [['wrong id',{id:uid(90)}],['wrong reviewer',{reviewed_by:uid(90)}],['wrong category',{category_id:uid(90)}],['missing timestamp',{reviewed_at:null}],['changed fields',{category_fields:{area:'999'}}]])test('invalid review response '+name+' is not trusted; real state is read',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/review')?answer(result('APPROVED',extra)):base(u,o);const actor=userEvent.setup();mount(<AdminReview id={item.id}/>);await confirm(actor);expect(await screen.findByRole('alert')).toHaveTextContent('ما زال قيد المراجعة');expect(screen.queryByText('تمت الموافقة على الإعلان بنجاح، ويمكن للبائع الآن إعداد المزاد.')).toBeNull();expect(posts()).toHaveLength(1);
});
test('monitoring separates scheduled prices and public-only scope, without mutation controls',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions')?answer([{...auction,status:'SCHEDULED'}]):base(u,o);const actor=userEvent.setup();mount(<AdminAuctions/>);expect(await screen.findByRole('heading',{name:item.title})).toBeVisible();expect(screen.getByText(/السعر الابتدائي: 14,000,000/)).toBeVisible();expect(screen.getByText(/المزادات العامة فقط/)).toBeVisible();await actor.click(screen.getByRole('button',{name:'مزاد جارٍ'}));expect(screen.getByText('لا توجد مزادات ضمن هذه الحالة.')).toBeVisible();expect(posts()).toHaveLength(0);
});
test('monitor detail displays actual no-bid result without bidder or seller controls',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions/'+auction.id)?answer({...auction,status:'CLOSED',result:{winner_bid_id:null,closed_at:'2026-10-20T12:00:00Z'}}):base(u,o);mount(<AdminAuctions id={auction.id}/>);expect(await screen.findByRole('heading',{name:'انتهى المزاد دون مزايدات'})).toBeVisible();expect(screen.queryByRole('button',{name:/مزايد|إنشاء/})).toBeNull();expect(screen.getByRole('link',{name:'العودة إلى متابعة المزادات'})).toHaveAttribute('href','#admin-auctions');
});
test('unlisted private ID is not fetched by ADMIN monitoring',async()=>{
 mount(<AdminAuctions id={uid(90)}/>);expect(await screen.findByRole('alert')).toHaveTextContent('غير موجود ضمن المزادات العامة');expect(fetch.mock.calls.some(([u])=>u.endsWith('/auctions/'+uid(90)))).toBe(false);
});
for(const role of ['ADMIN','USER'])test('shared login routes '+role+' to the correct home with no role selector',async()=>{
 sessionStorage.clear();const base=handler;handler=(u,o)=>u.endsWith('/auth/login')?answer({token:'b'.repeat(64),user:{...admin,role}}):u.endsWith('/me/auctions')?answer([]):base(u,o);window.history.replaceState(null,'','/#login');const actor=userEvent.setup();mount(<App/>);await actor.type(screen.getByLabelText('البريد الإلكتروني'),admin.email);await actor.type(screen.getByLabelText('كلمة المرور',{exact:true}),'Local-test-Password1!');await actor.click(screen.getByRole('button',{name:'تسجيل الدخول',exact:true}));await waitFor(()=>expect(window.location.hash).toBe(role==='ADMIN'?'#admin-dashboard':'#account'));expect(screen.queryByRole('combobox',{name:/صلاحية|دور/})).toBeNull();
});
async function submitEdit(actor){await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));await actor.upload(screen.getByLabelText('إضافة صور'),new File(['fixture'],'fixture.png',{type:'image/png'}));await actor.click(screen.getByRole('button',{name:'مراجعة الإعلان',exact:true}));await actor.click(screen.getByRole('button',{name:'إرسال للمراجعة'}));}
for(const [name,extra] of [['id',{id:uid(90)}],['category',{category_id:uid(90)}],['seller',{seller_id:uid(90)}],['title',{title:'عنوان مختلف'}],['description',{description:'وصف مختلف'}],['fields',{category_fields:{area:'999'}}]])test('resubmission mismatched '+name+' cannot display or navigate to success',async()=>{
 saveSession({token:'a'.repeat(64),user:{...admin,id:item.seller_id,role:'USER'}});current={...item,status:'REJECTED',review_reason:'صحح الوصف'};const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)&&o.method==='PATCH'?answer({...item,...extra}):base(u,o);const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');await submitEdit(actor);expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(window.location.hash).toBe('#home');expect(screen.getByRole('button',{name:'إرسال للمراجعة'})).toBeEnabled();
});
test('matching resubmission is read back using the same item ID before navigation',async()=>{
 saveSession({token:'a'.repeat(64),user:{...admin,id:item.seller_id,role:'USER'}});current={...item,status:'REJECTED'};const base=handler;handler=(u,o)=>u.endsWith('/items/'+item.id)&&o.method==='PATCH'?(current={...item},answer(current)):base(u,o);const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');await submitEdit(actor);await waitFor(()=>expect(window.location.hash).toBe('#listing/'+item.id));expect(fetch.mock.calls.filter(([u,o])=>u.endsWith('/items/'+item.id)&&o.method==='GET')).toHaveLength(2);
});
for(const mismatch of ['category','fields','readback'])test('new listing '+mismatch+' mismatch cannot show success or navigate',async()=>{
 saveSession({token:'a'.repeat(64),user:{...admin,id:item.seller_id,role:'USER'}});const base=handler;
 handler=(u,o)=>{
  const expected={...item,title:'إعلان جديد',description:'وصف من البائع',category_fields:{}};
  if(u.endsWith('/items')&&o.method==='POST')return answer({...expected,...(mismatch==='category'?{category_id:uid(90)}:mismatch==='fields'?{category_fields:{area:'999'}}:{})},201);
  if(u.endsWith('/items/'+item.id)&&mismatch==='readback')return answer({...expected,id:uid(90)});
  return base(u,o);
 };
 const actor=userEvent.setup();mount(<ListingForm/>);await actor.click(await screen.findByRole('radio',{name:/العقارات/}));await actor.click(screen.getByRole('button',{name:'المتابعة إلى تفاصيل المعروض'}));await actor.type(screen.getByLabelText('عنوان الإعلان'),'إعلان جديد');await actor.type(screen.getByLabelText('وصف المعروض'),'وصف من البائع');await submitEdit(actor);expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(window.location.hash).toBe('#home');expect(screen.getByRole('button',{name:'إرسال للمراجعة'})).toBeEnabled();
});
test('monitor polling refreshes one public list and never expands into per-auction requests',async()=>{
 vi.useFakeTimers();try{mount(<AdminAuctions/>);await vi.waitFor(()=>expect(screen.getByRole('heading',{name:item.title})).toBeVisible());const before=fetch.mock.calls.filter(([u])=>u.endsWith('/auctions')).length;await vi.advanceTimersByTimeAsync(5000);await vi.waitFor(()=>expect(fetch.mock.calls.filter(([u])=>u.endsWith('/auctions')).length).toBe(before+1));expect(fetch.mock.calls.some(([u])=>/\/auctions\//.test(u))).toBe(false);expect(posts()).toHaveLength(0);}finally{vi.useRealTimers();}
});
test('admin logout failure keeps the session visible and successful logout returns to shared login',async()=>{
 const base=handler;let fail=true;handler=(u,o)=>u.endsWith('/auth/logout')?answer(fail?{code:'NETWORK_ERROR'}:{signedOut:true},fail?503:200):base(u,o);window.history.replaceState(null,'','/#admin-dashboard');const actor=userEvent.setup();mount(<App/>);await actor.click(await screen.findByRole('button',{name:'تسجيل الخروج',exact:true}));expect(await screen.findByRole('alert')).toHaveTextContent('تعذر الاتصال');expect(screen.getByRole('link',{name:'حسابي',exact:true})).toBeVisible();fail=false;await actor.click(screen.getByRole('button',{name:'تسجيل الخروج',exact:true}));expect(await screen.findByRole('heading',{name:'مرحبًا بعودتك'})).toBeVisible();expect(sessionStorage.getItem('mezyad.account.session')).toBeNull();
});
