import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {requestApi} from '../src/api.js';
import {safeImage} from '../src/ui/media.js';
import {MediaGallery,ServerImage} from '../src/ui/MediaGallery.jsx';
import {ItemSpecifications} from '../src/ui/ItemSpecifications.jsx';
import {ListingForm} from '../src/marketplace/ListingForm.jsx';
import {AdminDashboard,AdminAuctions} from '../src/marketplace/AdminWorkspace.jsx';
import {AuctionResult} from '../src/marketplace/Participation.jsx';
import {higherAcceptedBid,personalResult} from '../src/marketplace/bidderData.js';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:uid(1),role:'USER',name:'اختبار تكامل',email:'integration@example.invalid'};
const category={id:uid(2),name:'Rare Vehicles'};
const photo='/api/v1/images/'+uid(99)+'.jpg?expires=2000000000&signature='+'a'.repeat(64);
const item={id:uid(3),seller_id:user.id,category_id:category.id,status:'REJECTED',title:'معروض الاختبار',description:'وصف المعروض',review_reason:'صحح المعلومات',category_fields:{year:'2024'},images:[photo]};
const auction={id:uid(4),seller_id:uid(8),item_id:item.id,title:item.title,images:[photo],starting_price:'1000',minimum_increment:'50',current_price:'9999',start_time:'2020-01-01',end_time:'2030-01-01',status:'CLOSED',visibility:'PUBLIC',result:{winner_bid_id:uid(5),winning_amount:'1250',isWinner:true,closed_at:'2026-10-20'},participation:{hasBid:true,bidCount:2,highestBid:'1250',latestBidId:uid(5)}};
const response=(data,meta)=>({ok:true,status:200,json:async()=>({data,...(meta?{meta}:{})})});
function Ready({children}){return useAuth().status==='authenticated'?children:null;}
function mount(component,handler,role='USER'){
 saveSession({token:'a'.repeat(64),user:{...user,role}});vi.stubGlobal('fetch',vi.fn((url,options)=>url.endsWith('/me/items')?Promise.resolve(response([])):handler(url,options)));
 return render(<AuthProvider><Ready>{component}</Ready></AuthProvider>);
}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
test('signed image paths retain signature bytes and use only the Backend base',()=>{
 expect(safeImage(photo)).toBe('http://localhost:3000'+photo);expect(safeImage('/images/design.png')).toBe('/images/design.png');expect(safeImage('http://localhost:3000'+photo)).toBe('http://localhost:3000'+photo);expect(safeImage('/api/v1/images/x?token=account-secret')).toBeNull();expect(safeImage('//untrusted.invalid/image.png')).toBeNull();expect(safeImage('https://user:secret@example.invalid/a')).toBeNull();
});
test('metadata is opt in and existing callers retain their data-only contract',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>response([1],{limit:6,offset:12})));
 expect(await requestApi('/api/v1/admin/auctions')).toEqual([1]);expect(await requestApi('/api/v1/admin/auctions',{responseMeta:true})).toEqual({data:[1],meta:{limit:6,offset:12}});
});
test('failed signed image triggers one read refresh with an explicit manual retry',async()=>{
 const reload=vi.fn();render(<ServerImage src={photo} alt="سلعة" onRefresh={reload}/>);fireEvent.error(screen.getByRole('img'));expect(reload).toHaveBeenCalledTimes(1);await userEvent.click(screen.getByRole('button',{name:'تحديث روابط الصور'}));expect(reload).toHaveBeenCalledTimes(2);
});
test('rotating a signature does not close the open gallery or lose selected image',async()=>{
 const images=[photo,photo.replace(uid(99),uid(98))];const v=render(<MediaGallery images={images} title="معروض"/>);await userEvent.click(screen.getByRole('button',{name:'عرض الصورة 2'}));await userEvent.click(screen.getByRole('button',{name:'فتح معرض الصور'}));v.rerender(<MediaGallery images={images.map(x=>x.replace('2000000000','2000000500'))} title="معروض"/>);expect(screen.getByRole('dialog')).toBeVisible();expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('الصورة 2 من 2');
});
test('specifications display the actual zero and category labels without fabricated values',()=>{
 render(<ItemSpecifications fields={{area:0,location:'الرياض',age:'4',letters:'ن ج د',model:'GT',missing:null}}/>);expect(screen.getByText('المساحة (م²)')).toBeVisible();expect(screen.getByText('0')).toBeVisible();expect(screen.getByText('حروف اللوحة')).toBeVisible();expect(screen.queryByText('missing')).toBeNull();
});
test('rejected item can retain persisted photos and verifies readback before success',async()=>{
 let saved=false,body;const actor=userEvent.setup();window.history.replaceState(null,'','/#listing-edit/'+item.id);
 mount(<ListingForm id={item.id}/>,async(url,o)=>url.endsWith('/categories')?response([category]):o.method==='PATCH'?(body=o.body,saved=true,response({...item,status:'PENDING_REVIEW'})):response({...item,status:saved?'PENDING_REVIEW':'REJECTED'}));
 await screen.findByLabelText('عنوان الإعلان');await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));expect(screen.getByAltText(item.title)).toHaveAttribute('src','http://localhost:3000'+photo);expect(screen.queryByRole('button',{name:'حذف الصورة المحفوظة'})).toBeNull();await actor.click(screen.getByRole('button',{name:'مراجعة الإعلان',exact:true}));await actor.click(screen.getByRole('button',{name:'إرسال للمراجعة'}));await waitFor(()=>expect(window.location.hash).toBe('#listing/'+item.id));expect(body.getAll('images')).toHaveLength(0);expect(JSON.parse(body.get('category_fields'))).toEqual(item.category_fields);
});
test('new photo selection enforces six files and 5 MiB without losing prior draft',async()=>{
 const actor=userEvent.setup();URL.createObjectURL=vi.fn(()=> 'blob:local');URL.revokeObjectURL=vi.fn();mount(<ListingForm id={item.id}/>,async u=>u.endsWith('/categories')?response([category]):response(item));await screen.findByLabelText('عنوان الإعلان');await actor.click(screen.getByRole('button',{name:'متابعة إلى الصور'}));const input=screen.getByLabelText('إضافة صور');
 const seven=Array.from({length:7},(_,n)=>new File(['x'],n+'.png',{type:'image/png'}));await actor.upload(input,seven);expect(screen.getByRole('alert')).toHaveTextContent('6 صور');const large=new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'});await actor.upload(input,large);expect(screen.getByRole('alert')).toHaveTextContent('5 MiB');expect(screen.getByRole('radio',{name:'الإبقاء على الصور المحفوظة'})).toBeChecked();expect(screen.queryByLabelText('عنوان الإعلان')).toBeNull();
});
test.each([true,false])('personal result survives absent receipt and uses server identity %s',async isWinner=>{
 mount(<AuctionResult id={auction.id}/>,async()=>response({...auction,result:{...auction.result,isWinner}}));expect(await screen.findByRole('heading',{name:isWinner?'فزت بالمزاد':'لم تفز بالمزاد',exact:true})).toBeVisible();expect(screen.getByText('1,250')).toBeVisible();expect(screen.queryByText('9,999')).toBeNull();
});
test('nonparticipant is not described as losing even with a final winner',async()=>{
 mount(<AuctionResult id={auction.id}/>,async()=>response({...auction,result:{...auction.result,isWinner:false},participation:{hasBid:false,bidCount:0,highestBid:null,latestBidId:null}}));expect(await screen.findByText(/لم تسجّل مزايدة/)).toBeVisible();expect(screen.queryByRole('heading',{name:'لم تفز بالمزاد'})).toBeNull();
});
test('contradictory participation cannot prove a win and outbid uses personal highest bid',()=>{
 expect(personalResult({...auction,participation:{hasBid:false,bidCount:0,highestBid:null,latestBidId:null}},user.id)).toBeNull();expect(higherAcceptedBid(null,{...auction,status:'ACTIVE',current_price:'1300'},user.id,[])).toBe(true);expect(higherAcceptedBid(null,{...auction,current_price:'1250'},user.id,[])).toBe(false);
});
test('dashboard renders the authenticated aggregate response including true zero counts',async()=>{
 mount(<AdminDashboard/>,async url=>url.endsWith('/admin/dashboard')?response({listings:{pendingReview:0,approved:7,rejected:2},auctions:{scheduled:3,active:4,closed:5},bids:{count:20}}):response([]),'ADMIN');const label=await screen.findByRole('heading',{name:'الإعلانات المعتمدة'});await waitFor(()=>expect(label.closest('section')).toHaveTextContent('7'));expect(screen.getAllByRole('heading',{name:'الإعلانات بانتظار المراجعة',level:2})[0].closest('section')).toHaveTextContent('0');
});
test('admin private filter and paging preserve limit and offset from the envelope',async()=>{
 const calls=[];mount(<AdminAuctions/>,async url=>{calls.push(url);const query=new URL(url).searchParams,offset=Number(query.get('offset'));return response(Array.from({length:offset?1:6},(_,n)=>({...auction,id:uid(30+offset+n),title:'مزاد '+(offset+n),bid_count:2,bidder_count:1})),{limit:6,offset});},'ADMIN');await screen.findByRole('heading',{name:'مزاد 0'});const actor=userEvent.setup();await actor.click(screen.getByRole('button',{name:'التالي'}));await screen.findByRole('heading',{name:'مزاد 6'});expect(calls.some(u=>u.includes('offset=6'))).toBe(true);await actor.selectOptions(screen.getByLabelText('نوع المزاد'),'PRIVATE');await waitFor(()=>expect(calls.some(u=>u.includes('offset=0')&&u.includes('visibility=PRIVATE'))).toBe(true));
});
