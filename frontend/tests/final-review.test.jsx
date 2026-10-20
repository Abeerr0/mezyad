import React,{useState} from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AuctionAssistant,filterPublicAuctions,validPublicCatalog} from '../src/ui/AuctionAssistant.jsx';
import {App} from '../src/App.jsx';
import {MediaGallery} from '../src/ui/MediaGallery.jsx';
import {ListingAssistant} from '../src/marketplace/SellerPresentation.jsx';
import {Confirm} from '../src/marketplace/common.jsx';
import {ListingForm} from '../src/marketplace/ListingForm.jsx';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:uid(1),name:'مستخدم اختبار',email:'final@example.invalid',role:'USER'};
const auth={token:'a'.repeat(64),user};
const a={id:uid(2),item_id:uid(3),seller_id:uid(4),title:'مزاد من الخادم',description:'وصف حقيقي',category_name:'Rare Vehicles',visibility:'PUBLIC',images:['/images/porsche-carrera-gt.jpg'],starting_price:'1000',current_price:'1200',minimum_increment:'50',start_time:'2026-01-01T10:00:00Z',end_time:'2030-01-02T10:00:00Z',status:'ACTIVE',result:null};
const history=[{id:uid(5),amount:'1000',created_at:'2026-10-20T10:00:00Z'},{id:uid(6),amount:'1200',created_at:'2026-10-20T11:00:00Z'}];
const item={id:uid(3),seller_id:user.id,category_id:uid(7),title:'إعلان مرفوض',description:'وصف',status:'REJECTED',category_fields:{number:0},review_reason:'صورة أوضح'};
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler;
function Ready({children}){return useAuth().status==='authenticated'?children:null;}
const mount=element=>render(<AuthProvider><Ready>{element}</Ready></AuthProvider>);
beforeEach(()=>{
 sessionStorage.clear();saveSession(auth);window.history.replaceState(null,'','/#home');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
 URL.createObjectURL=vi.fn(file=> 'blob:final-'+file.name);URL.revokeObjectURL=vi.fn();
 handler=async(url)=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:uid(7),name:'Vehicle Plates'}]):url.endsWith('/items/'+item.id)?answer(item):url.endsWith('/auctions')?answer([{...a,bid_count:2}]):url.endsWith('/bids')?answer(history):answer(a);
 vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();document.body.style.overflow='';});
test('assistant uses only recorded public activity without invented bidder counts or predictions',async()=>{
 mount(<AuctionAssistant id={a.id}/>);expect(await screen.findByText(/مزايدة معروضة/)).toHaveTextContent(/^2 مزايدة معروضة$/);expect(screen.getAllByText('1,200',{selector:'bdi'}).length).toBeGreaterThan(0);expect(screen.getByText(/عدد المزايدين المختلفين غير متاح/)).toBeVisible();expect(screen.queryByText('8 مزايدات • 6 مزايدين')).toBeNull();expect(screen.queryByText('نشاط أعلى قرب الإغلاق')).toBeNull();expect(screen.getByRole('link',{name:'عرض تفاصيل المزاد'})).toHaveAttribute('href','#auction/'+a.id);expect(fetch.mock.calls.every(([,o])=>o.method==='GET')).toBe(true);
});
test('public price filtering uses inclusive current prices, category and valid ranges',()=>{
 const rows=[a,{...a,id:uid(8),category_name:'Camels',current_price:'2500'}];expect(filterPublicAuctions(rows,'Rare Vehicles','1200','1200')).toEqual([a]);expect(filterPublicAuctions(rows,'','2000','3000')).toHaveLength(1);
 for(const [minimum,maximum] of [['2000','1000'],['-1',''],['NaN',''],['','1e4'],['10.123','']])expect(filterPublicAuctions(rows,'',minimum,maximum)).toBeNull();
});
test('assistant category and price controls change only loaded public options',async()=>{
 const base=handler;handler=(url,o)=>url.endsWith('/auctions')?answer([a,{...a,id:uid(8),title:'مزاد آخر',current_price:'2500',category_name:'Camels'}]):base(url,o);const actor=userEvent.setup();mount(<AuctionAssistant/>);await screen.findByRole('option',{name:'مزاد آخر'});await actor.type(screen.getByLabelText('السعر من (ر.س)'),'2000');expect(screen.queryByRole('option',{name:a.title})).toBeNull();expect(screen.getByRole('option',{name:'مزاد آخر'})).toBeInTheDocument();await actor.selectOptions(screen.getByLabelText('الفئة'),'Rare Vehicles');expect(screen.getByText('لا توجد مزادات عامة تطابق هذه الخيارات.')).toBeVisible();expect(fetch.mock.calls.every(([url])=>url.endsWith('/me/items')||url.endsWith('/auctions'))).toBe(true);
});
test('assistant invalid range exposes a correction without selected auction data',async()=>{
 const actor=userEvent.setup();mount(<AuctionAssistant id={a.id}/>);await screen.findByText(/مزايدة معروضة/);await actor.type(screen.getByLabelText('السعر من (ر.س)'),'9000');await actor.type(screen.getByLabelText('السعر إلى (ر.س)'),'100');expect(screen.getByRole('alert')).toHaveTextContent('نطاق سعر صحيحًا');expect(screen.queryByText(/مزايدة معروضة/)).toBeNull();
});
test('assistant never requests a private or unknown ID outside the public catalog',async()=>{
 mount(<AuctionAssistant id={uid(99)}/>);expect(await screen.findByRole('alert')).toHaveTextContent('غير متاح في القائمة العامة');expect(fetch.mock.calls.some(([url])=>url.includes(uid(99)))).toBe(false);expect(screen.queryByRole('link',{name:'عرض تفاصيل المزاد'})).toBeNull();
});
test.each(['PRIVATE','UNKNOWN'])('assistant rejects catalog visibility %s',visibility=>expect(validPublicCatalog([{...a,visibility}])).toBe(false));
test('assistant rejects duplicate public IDs',()=>expect(validPublicCatalog([a,a])).toBe(false));
test('assistant verifies PUBLIC on detail before fetching history or showing protected content',async()=>{
 const base=handler;handler=(url,o)=>url.endsWith('/auctions/'+a.id)?answer({...a,visibility:'PRIVATE',title:'محتوى خاص سري'}):base(url,o);mount(<AuctionAssistant id={a.id}/>);expect(await screen.findByRole('alert')).toHaveTextContent('غير متاح للعرض العام');expect(screen.queryByText('محتوى خاص سري')).toBeNull();expect(fetch.mock.calls.some(([url])=>url.endsWith('/bids'))).toBe(false);
});
test('assistant empty state cannot insert sample statistics',async()=>{
 const base=handler;handler=(url,o)=>url.endsWith('/auctions')?answer([]):base(url,o);mount(<AuctionAssistant/>);expect(await screen.findByText('لا توجد مزادات عامة تطابق هذه الخيارات.')).toBeVisible();expect(screen.getByLabelText('اختر المزاد العام')).toBeDisabled();expect(screen.queryByText(/مزايدة معروضة/)).toBeNull();
});
test('assistant history failure retries the existing GET without writing',async()=>{
 const base=handler;let fail=true;handler=(url,o)=>url.endsWith('/bids')?fail?answer({code:'INTERNAL_ERROR'},503):answer(history):base(url,o);const actor=userEvent.setup();mount(<AuctionAssistant id={a.id}/>);expect(await screen.findByRole('alert')).toBeVisible();expect(screen.queryByText(/مزايدة معروضة/)).toBeNull();fail=false;await actor.click(screen.getByRole('button',{name:'إعادة المحاولة'}));expect(await screen.findByText(/مزايدة معروضة/)).toHaveTextContent(/^2 مزايدة معروضة$/);expect(fetch.mock.calls.every(([,o])=>o.method==='GET')).toBe(true);
});
test('guest assistant uses shared login and preserves the selected auction',async()=>{
 sessionStorage.clear();window.history.replaceState(null,'','/#assistant/'+a.id);render(<AuthProvider><App/></AuthProvider>);await screen.findByRole('heading',{name:'مرحبًا بعودتك'});expect(window.location.hash).toBe('#login?return='+encodeURIComponent('assistant/'+a.id));expect(fetch.mock.calls.some(([url])=>url.endsWith('/bids'))).toBe(false);
});
function ModalHarness({pending=false}){const [open,setOpen]=useState(false);return <div id="root"><button onClick={()=>setOpen(true)}>افتح التأكيد</button><button>زر الخلفية</button>{open&&<Confirm title="قرار" variant="admin" pending={pending} onConfirm={()=>{}} onCancel={()=>setOpen(false)}><label htmlFor="modal-input">ملاحظة</label><input id="modal-input"/></Confirm>}</div>;}
test('confirmation isolates background, traps focus and restores focus and scrolling',async()=>{
 document.body.style.overflow='auto';const actor=userEvent.setup();render(<ModalHarness/>);const open=screen.getByRole('button',{name:'افتح التأكيد'});await actor.click(open);const dialog=screen.getByRole('dialog');expect(document.getElementById('root')).toHaveAttribute('inert');expect(document.body.style.overflow).toBe('hidden');expect(dialog.closest('.admin-workspace')).not.toBeNull();expect(dialog).toHaveFocus();await actor.tab({shift:true});expect(within(dialog).getByRole('button',{name:'إلغاء'})).toHaveFocus();await actor.tab();expect(screen.getByLabelText('ملاحظة')).toHaveFocus();await actor.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();expect(document.getElementById('root')).not.toHaveAttribute('inert');expect(document.body.style.overflow).toBe('auto');expect(open).toHaveFocus();
});
test('pending confirmation cannot escape or tab into background',async()=>{
 const actor=userEvent.setup();render(<ModalHarness pending/>);await actor.click(screen.getByRole('button',{name:'افتح التأكيد'}));await actor.keyboard('{Escape}');expect(screen.getByRole('dialog')).toBeVisible();await actor.tab();expect(screen.getByLabelText('ملاحظة')).toHaveFocus();await actor.tab();expect(screen.getByLabelText('ملاحظة')).toHaveFocus();
});
test.each([{category_id:'bad'},{category_fields:[]},{category_fields:null}])('rejected edit refuses malformed category data %j',async extra=>{
 const base=handler;handler=(url,o)=>url.endsWith('/items/'+item.id)?answer({...item,...extra}):base(url,o);mount(<ListingForm id={item.id}/>);expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(screen.queryByLabelText('عنوان الإعلان')).toBeNull();expect(fetch.mock.calls.some(([,o])=>o.method==='PATCH')).toBe(false);
});
test('unknown catalog category cannot open a misleading edit form',async()=>{
 const base=handler;handler=(url,o)=>url.endsWith('/categories')?answer([{id:uid(88),name:'Camels'}]):base(url,o);mount(<ListingForm id={item.id}/>);expect(await screen.findByRole('alert')).toHaveTextContent('قسم الإعلان غير متاح');expect(screen.queryByLabelText('عنوان الإعلان')).toBeNull();expect(screen.getByRole('link',{name:'العودة إلى الإعلان'})).toHaveAttribute('href','#listing/'+item.id);
});
test('zero-valued category fields remain visible in rejected edit draft',async()=>{mount(<ListingForm id={item.id}/>);expect(await screen.findByLabelText('الرقم')).toHaveValue('0');});
test('empty image files cannot advance the listing photo step',async()=>{
 const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));await actor.upload(screen.getByLabelText('إضافة صور'),new File([],'empty.png',{type:'image/png'}));expect(screen.getByRole('alert')).toHaveTextContent('صورًا غير فارغة');expect(screen.getByRole('button',{name:'مراجعة الإعلان',exact:true})).toBeDisabled();expect(URL.createObjectURL).not.toHaveBeenCalled();
});
test('listing assistant uses the actual draft and keeps title suggestions separate from saved data',async()=>{
 const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');const helper=screen.getByRole('complementary',{name:'مساعد الإعلان'});expect(within(helper).getByText(item.title)).toBeVisible();expect(within(helper).getByText(/صور واضحة للمعروض/)).toBeVisible();expect(within(helper).queryByText('فيلا في حي حطين، الرياض')).toBeNull();await actor.clear(screen.getByLabelText('عنوان الإعلان'));await actor.type(screen.getByLabelText('عنوان الإعلان'),'عنوان من المسودة');expect(within(helper).getByText('عنوان من المسودة')).toBeVisible();expect(fetch.mock.calls.every(([,o])=>o.method==='GET')).toBe(true);
});
test('listing images can be added in batches, removed, and retained through direct review editing',async()=>{
 const actor=userEvent.setup();mount(<ListingForm id={item.id}/>);await screen.findByLabelText('عنوان الإعلان');await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));const input=screen.getByLabelText('إضافة صور');await actor.upload(input,new File(['first'],'first.png',{type:'image/png'}));await actor.upload(input,new File(['second'],'second.png',{type:'image/png'}));expect(screen.getAllByAltText(/صورة مختارة/)).toHaveLength(2);await actor.click(screen.getByRole('button',{name:'حذف الصورة 1'}));expect(screen.queryByText('first.png')).toBeNull();expect(screen.getByText('second.png')).toBeVisible();await actor.click(screen.getByRole('button',{name:'مراجعة الإعلان',exact:true}));await actor.click(screen.getByRole('button',{name:'تعديل التفاصيل'}));expect(screen.getByLabelText('عنوان الإعلان')).toHaveValue(item.title);await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));expect(screen.getAllByAltText(/صورة مختارة/)).toHaveLength(1);expect(fetch.mock.calls.every(([,o])=>o.method==='GET')).toBe(true);
});

test('gallery includes the primary thumbnail and returns to it without losing source identity',async()=>{
 const actor=userEvent.setup();render(<MediaGallery title="معروض" images={['/first.png','/second.png','/third.png']}/>);expect(screen.getAllByRole('button',{name:/عرض الصورة/})).toHaveLength(3);expect(screen.getByRole('button',{name:'عرض الصورة 1'})).toHaveAttribute('aria-pressed','true');await actor.click(screen.getByRole('button',{name:'عرض الصورة 3'}));expect(screen.getByAltText('معروض')).toHaveAttribute('src','/third.png');await actor.click(screen.getByRole('button',{name:'عرض الصورة 1'}));expect(screen.getByAltText('معروض')).toHaveAttribute('src','/first.png');expect(screen.getByRole('button',{name:'عرض الصورة 1'})).toHaveAttribute('aria-pressed','true');
});

test('listing title suggestion does not duplicate location already contained in the draft title',()=>{
 render(<ListingAssistant title="فيلا في حي حطين" description="وصف" details={{location:'حي حطين، الرياض'}} fields={[]} photoCount={1}/>);expect(screen.getByText('فيلا في حي حطين، الرياض')).toBeVisible();expect(screen.queryByText('فيلا في حي حطين، حي حطين، الرياض')).toBeNull();
});
