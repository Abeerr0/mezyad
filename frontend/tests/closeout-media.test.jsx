import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {act,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AuctionCreate} from '../src/marketplace/AuctionCreate.jsx';
import {MediaGallery,ServerImage} from '../src/ui/MediaGallery.jsx';
import {AuctionCard} from '../src/ui/Auctions.jsx';

const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:uid(1),role:'USER',name:'مالك المعروض',email:'closeout@example.invalid'};
const item={id:uid(2),seller_id:user.id,category_id:uid(3),title:'معروض المراجعة',description:'وصف المعروض من الخادم',status:'APPROVED'};
const signed=(n,signature='a')=>'/api/v1/images/'+uid(n)+'.jpg?expires=2000000000&signature='+signature.repeat(64);
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
const responseFor=body=>({id:uid(4),item_id:item.id,visibility:body.visibility,status:'SCHEDULED',title:item.title,description:item.description,seller_id:user.id,
 starting_price:String(body.startingPrice),current_price:String(body.startingPrice),minimum_increment:String(body.minimumIncrement),start_time:body.startTime,end_time:body.endTime,
 ...(body.visibility==='PRIVATE'?{accessCode:'one-time-server-private-code'}:{})});
function Ready({children}){return useAuth().status==='authenticated'?children:null;}
let posted,details,handler;
const writes=()=>fetch.mock.calls.filter(([,options])=>options.method==='POST');
const reads=()=>fetch.mock.calls.filter(([url,options])=>url.endsWith('/auctions/'+uid(4))&&options.method!=='POST');
function mountCreate(extra){saveSession({token:'a'.repeat(64),user});vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));return render(<AuthProvider><Ready><AuctionCreate id={item.id}/>{extra}</Ready></AuthProvider>);}
async function create(type='خاص'){
 const actor=userEvent.setup();await actor.click(await screen.findByRole('button',{name:'إنشاء مزاد '+type,exact:true}));
 for(const [label,value] of [['سعر البداية (ر.س)','1500'],['الحد الأدنى لزيادة المزايدة (ر.س)','50'],['بداية المزاد','2030-01-01T10:00'],['نهاية المزاد','2030-01-02T10:00']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 await actor.click(screen.getByRole('button',{name:'إنشاء مزاد '+type,exact:true}));
 await screen.findByRole('heading',{name:type==='خاص'?'تم جدولة المزاد الخاص':'تم جدولة المزاد',exact:true});return actor;
}
beforeEach(()=>{
 sessionStorage.clear();posted=null;details=0;
 handler=async(url,options)=>{
  if(url.endsWith('/me/items'))return answer([item]);
  if(url.endsWith('/items/'+item.id))return answer(item);
  if(url.endsWith('/me/auctions'))return answer([]);
  if(url.endsWith('/auctions')&&options.method==='POST'){posted=JSON.parse(options.body);return answer(responseFor(posted),201);}
  if(url.endsWith('/auctions/'+uid(4))){details++;return answer({...responseFor(posted),images:[signed(10,details===1?'a':'b')]});}
  throw Error('Unexpected closeout media request '+url);
 };
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

test('failed signed thumbnails keep valid native buttons and an outside keyboard retry',async()=>{
 const actor=userEvent.setup(),refresh=vi.fn(),errors=vi.spyOn(console,'error').mockImplementation(()=>{});
 const {container}=render(<MediaGallery title="معروض" images={[signed(10),signed(11)]} onRefresh={refresh}/>);
 const thumbnail=screen.getByRole('button',{name:'عرض الصورة 2'});
 fireEvent.error(within(thumbnail).getByRole('img'));
 expect(refresh).toHaveBeenCalledTimes(1);
 expect(thumbnail.querySelector('button')).toBeNull();
 expect(thumbnail.querySelector('div')).toBeNull();
 expect(container.querySelector('button button')).toBeNull();
 expect(errors.mock.calls.flat().join(' ')).not.toMatch(/validateDOMNesting|cannot be a descendant|cannot contain/i);
 const retry=screen.getByRole('button',{name:'تحديث روابط الصور المصغرة'});
 expect(retry.closest('.gallery-thumbs')).toBeNull();retry.focus();await actor.keyboard('{Enter}');expect(refresh).toHaveBeenCalledTimes(2);
 thumbnail.focus();await actor.keyboard('{Enter}');expect(thumbnail).toHaveAttribute('aria-pressed','true');
});

test('signature rotation retains thumbnail cooldown, selection and an open gallery',async()=>{
 vi.spyOn(Date,'now').mockReturnValue(1800000000000);
 const actor=userEvent.setup(),refresh=vi.fn(),images=[signed(10),signed(11)];
 const view=render(<MediaGallery title="معروض" images={images} onRefresh={refresh}/>);
 const first=screen.getByRole('button',{name:'عرض الصورة 1'});fireEvent.error(within(first).getByRole('img'));expect(refresh).toHaveBeenCalledTimes(1);
 await actor.click(screen.getByRole('button',{name:'عرض الصورة 2'}));await actor.click(screen.getByRole('button',{name:'فتح معرض الصور'}));
 view.rerender(<MediaGallery title="معروض" images={[signed(10,'b'),signed(11,'b')]} onRefresh={refresh}/>);
 expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('الصورة 2 من 2');
 fireEvent.error(first.querySelector('img'));expect(refresh).toHaveBeenCalledTimes(1);
 await actor.keyboard('{Escape}');expect(screen.getByRole('button',{name:'عرض الصورة 2'})).toHaveAttribute('aria-pressed','true');
 await actor.click(screen.getByRole('button',{name:'تحديث روابط الصور المصغرة'}));expect(refresh).toHaveBeenCalledTimes(2);
});

test('unsigned thumbnail failures never trigger a signed-link read or retry',()=>{
 const refresh=vi.fn();render(<MediaGallery title="معروض" images={['/first.jpg','/second.jpg']} onRefresh={refresh}/>);
 fireEvent.error(within(screen.getByRole('button',{name:'عرض الصورة 2'})).getByRole('img'));expect(refresh).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'تحديث روابط الصور المصغرة'})).toBeNull();
});

test('failed signed auction card keeps retry outside its detail link without changing navigation',async()=>{
 const refresh=vi.fn(),actor=userEvent.setup(),auction={id:uid(4),title:item.title,image_url:signed(10),status:'SCHEDULED',starting_price:'1500',current_price:'1500',bid_count:0};
 const {container}=render(<AuctionCard auction={auction} onRefresh={refresh}/>);
 const link=screen.getByRole('link',{name:'عرض مزاد '+item.title});fireEvent.error(within(link).getByRole('img'));
 expect(refresh).toHaveBeenCalledTimes(1);expect(link.querySelector('button')).toBeNull();expect(container.querySelector('a button')).toBeNull();
 const retry=screen.getByRole('button',{name:'تحديث صورة المزاد'});expect(retry.closest('a')).toBeNull();retry.focus();await actor.keyboard('{Enter}');expect(refresh).toHaveBeenCalledTimes(2);
 expect(link).toHaveAttribute('href','#auction/'+auction.id);expect(screen.getByRole('link',{name:'اعرض تفاصيل المزاد'})).toHaveAttribute('href','#auction/'+auction.id);expect(screen.getByText(/السعر الابتدائي:/)).toHaveTextContent('1,500');
});

test('automatic image retries stay bounded across new signatures with a manual fallback',async()=>{
 vi.spyOn(Date,'now').mockReturnValue(1800000000000);const refresh=vi.fn();
 const view=render(<ServerImage src={signed(10)} alt="معروض" onRefresh={refresh}/>);
 fireEvent.error(screen.getByRole('img'));expect(refresh).toHaveBeenCalledTimes(1);
 view.rerender(<ServerImage src={signed(10,'b')} alt="معروض" onRefresh={refresh}/>);fireEvent.error(screen.getByRole('img'));expect(refresh).toHaveBeenCalledTimes(1);
 await userEvent.click(screen.getByRole('button',{name:'تحديث روابط الصور'}));expect(refresh).toHaveBeenCalledTimes(2);
});

test.each(['عام','خاص'])('created %s auction renews signed images using GET only and keeps its creation result',async type=>{
 mountCreate();await create(type);const image=await screen.findByRole('img',{name:item.title});
 expect(reads()).toHaveLength(1);expect(writes()).toHaveLength(1);
 const code=type==='خاص'?screen.getByLabelText('رمز وصول المزاد الخاص').value:null;
 const invitation=type==='خاص'?screen.getByLabelText('رابط المزاد الخاص').value:null;
 fireEvent.error(image);
 await waitFor(()=>expect(screen.getByRole('img',{name:item.title})).toHaveAttribute('src','http://localhost:3000'+signed(10,'b')));
 expect(reads()).toHaveLength(2);expect(writes()).toHaveLength(1);
 expect(reads().every(([,options])=>options.method==='GET')).toBe(true);
 if(type==='خاص'){expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue(code);expect(screen.getByLabelText('رابط المزاد الخاص')).toHaveValue(invitation);}
});

test('failed post-creation media read offers a real retry without recreating a private auction',async()=>{
 const original=handler;let fail=true;
 handler=(url,options)=>url.endsWith('/auctions/'+uid(4))&&fail?Promise.reject(new TypeError('offline')):original(url,options);
 mountCreate();const actor=await create();
 await screen.findByText('تم إنشاء المزاد، وتعذر تحميل صورته الآن. يمكنك فتح تفاصيله للتحقق.');
 expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue('one-time-server-private-code');expect(writes()).toHaveLength(1);
 fail=false;await actor.click(screen.getByRole('button',{name:'إعادة تحميل صور المزاد'}));
 await screen.findByRole('img',{name:item.title});expect(writes()).toHaveLength(1);
 expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue('one-time-server-private-code');
});

test('auction type and success transitions focus main without stealing focus during image renewal',async()=>{
 mountCreate();const actor=userEvent.setup();
 const choose=await screen.findByRole('button',{name:'إنشاء مزاد خاص',exact:true});choose.focus();await actor.keyboard('{Enter}');
 expect(screen.getByRole('main')).toHaveFocus();
 const back=screen.getByRole('button',{name:'العودة إلى اختيار النوع'});back.focus();await actor.keyboard('{Enter}');expect(screen.getByRole('main')).toHaveFocus();
 await create();expect(screen.getByRole('main')).toHaveFocus();
 const code=screen.getByLabelText('رمز وصول المزاد الخاص');code.focus();fireEvent.error(await screen.findByRole('img',{name:item.title}));
 await waitFor(()=>expect(screen.getByRole('img',{name:item.title})).toHaveAttribute('src','http://localhost:3000'+signed(10,'b')));
 expect(code).toHaveFocus();
});

test.each([
 ['auction identity',{id:uid(20)}],['listing identity',{item_id:uid(21)}],['owner',{seller_id:uid(22)}],['visibility',{visibility:'PUBLIC'}],
])('created private auction rejects a renewed image response with mismatched %s',async(name,override)=>{
 const original=handler;handler=async(url,options)=>{
  if(url.endsWith('/auctions/'+uid(4))&&details>0){details++;return answer({...responseFor(posted),...override,images:['/foreign-item.jpg']});}
  return original(url,options);
 };
 mountCreate();await create();fireEvent.error(await screen.findByRole('img',{name:item.title}));
 await screen.findByText('تم إنشاء المزاد، وتعذر تحميل صورته الآن. يمكنك فتح تفاصيله للتحقق.');
 expect(screen.queryByRole('img',{name:item.title})).toBeNull();expect(document.querySelector('img[src="/foreign-item.jpg"]')).toBeNull();
 expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue('one-time-server-private-code');expect(writes()).toHaveLength(1);
});

test('unmount aborts the pending post-creation image read and ignores its late response',async()=>{
 const original=handler;let resolveImage,signal;
 handler=(url,options)=>url.endsWith('/auctions/'+uid(4))?(signal=options.signal,new Promise(resolve=>{resolveImage=resolve;})):original(url,options);
 const view=mountCreate();await create();expect(signal.aborted).toBe(false);view.unmount();expect(signal.aborted).toBe(true);
 resolveImage(answer({...responseFor(posted),images:['/late-image.jpg']}));await Promise.resolve();expect(writes()).toHaveLength(1);expect(screen.queryByRole('img')).toBeNull();
});

test('a replaced session aborts its pending media read and cannot overwrite the new validated images',async()=>{
 const original=handler;let resolveOld,oldSignal,detailCount=0;
 function RefreshSession(){const {signIn}=useAuth();return <button onClick={()=>signIn(user.email,'local-test-password')}>تجديد جلسة الاختبار</button>;}
 handler=(url,options)=>{
  if(url.endsWith('/auth/login'))return Promise.resolve(answer({token:'b'.repeat(64),user}));
  if(url.endsWith('/auctions/'+uid(4))){
   detailCount++;
   if(detailCount===1){oldSignal=options.signal;return new Promise(resolve=>{resolveOld=resolve;});}
   return Promise.resolve(answer({...responseFor(posted),images:[signed(10,'b')]}));
  }
  return original(url,options);
 };
 mountCreate(<RefreshSession/>);const actor=await create();expect(oldSignal.aborted).toBe(false);
 await actor.click(screen.getByRole('button',{name:'تجديد جلسة الاختبار'}));
 await waitFor(()=>expect(screen.getByRole('img',{name:item.title})).toHaveAttribute('src','http://localhost:3000'+signed(10,'b')));
 expect(oldSignal.aborted).toBe(true);
 await act(async()=>resolveOld(answer({...responseFor(posted),images:['/old-session-image.jpg']})));
 expect(screen.getByRole('img',{name:item.title})).toHaveAttribute('src','http://localhost:3000'+signed(10,'b'));
 expect(fetch.mock.calls.filter(([url,options])=>url.endsWith('/auctions')&&options.method==='POST')).toHaveLength(1);
 expect(screen.getByLabelText('رمز وصول المزاد الخاص')).toHaveValue('one-time-server-private-code');
});
