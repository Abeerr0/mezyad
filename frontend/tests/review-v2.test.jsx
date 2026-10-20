import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {act,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AccountActivity} from '../src/ui/AccountActivity.jsx';
import {AuctionCard,AuctionList} from '../src/ui/Auctions.jsx';
import {AuctionCreate} from '../src/marketplace/AuctionCreate.jsx';
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',itemId='30000000-0000-4000-8000-000000000001';
const user={id:owner,name:'Review user',email:'review@example.invalid',role:'USER'};
const listing={id:itemId,seller_id:owner,category_id:itemId,title:'إعلاني المعتمد',description:'وصف الإعلان',status:'APPROVED',category_fields:{}};
const auction=(index,sellerId=other)=>({id:'20000000-0000-4000-8000-'+String(index).padStart(12,'0'),seller_id:sellerId,title:'مزاد '+index,images:['/images/hittin-villa.jpg'],image_url:'/images/hittin-villa.jpg',current_price:'1250',starting_price:'1000',bid_count:2,status:'ACTIVE',category_name:'Real Estate',end_time:'2035-01-01'});
const summary=({id,title,status,end_time})=>({id,title,status,end_time});
const response=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler;
const mount=node=>render(<AuthProvider>{node}</AuthProvider>);
const flush=()=>act(async()=>{});
const detailCalls=()=>fetch.mock.calls.filter(([url])=>/\/auctions\/[a-f0-9-]{36}$/.test(url));
const configure=records=>{handler=async url=>{
 if(url.endsWith('/me/items'))return response([listing]);
 if(url.endsWith('/me/auctions'))return response(records.map(summary));
 const detail=records.find(item=>url.endsWith('/auctions/'+item.id));
 if(detail)return response(detail);throw Error('Unexpected v2 request: '+url);
};};
beforeEach(()=>{sessionStorage.clear();saveSession({token:'a'.repeat(64),user});window.history.replaceState(null,'','/#account');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.spyOn(document,'hidden','get').mockReturnValue(false);configure([auction(1),auction(2,owner)]);vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});

test('owned auctions, participated auctions and listing moderation have separate data and destinations',async()=>{
 const actor=userEvent.setup();mount(<AccountActivity/>);
 expect(await screen.findByRole('heading',{name:'مزاد 1',exact:true})).toBeVisible();expect(screen.queryByRole('heading',{name:'مزاد 2',exact:true})).toBeNull();expect(screen.queryByRole('heading',{name:listing.title})).toBeNull();
 await actor.click(screen.getByRole('tab',{name:'مزاداتي',exact:true}));expect(await screen.findByRole('heading',{name:'مزاد 2',exact:true})).toBeVisible();expect(screen.getByRole('link',{name:'عرض المزاد'})).toHaveAttribute('href','#auction/'+auction(2).id);expect(screen.queryByRole('link',{name:'عرض الإعلان'})).toBeNull();
 await actor.click(screen.getByRole('tab',{name:'إعلاناتي'}));expect(await screen.findByRole('heading',{name:listing.title})).toBeVisible();expect(screen.getByRole('link',{name:'عرض الإعلان'})).toHaveAttribute('href','#listing/'+itemId);expect(screen.queryByRole('heading',{name:'مزاد 2',exact:true})).toBeNull();
});
test('lazy account tabs reuse cache and profile stops all activity polling',async()=>{
 vi.useFakeTimers();const actor={click:async element=>{fireEvent.click(element);await flush();}};mount(<AccountActivity/>);await flush();expect(detailCalls()).toHaveLength(2);
 // One /me/items request belongs to AuthProvider session validation, not listing-tab loading.
 expect(fetch.mock.calls.filter(([url])=>url.endsWith('/me/items'))).toHaveLength(1);
 await actor.click(screen.getByRole('tab',{name:'مزاداتي',exact:true}));await flush();await actor.click(screen.getByRole('tab',{name:'مزايداتي',exact:true}));await flush();expect(detailCalls()).toHaveLength(2);expect(fetch.mock.calls.filter(([url])=>url.endsWith('/me/auctions'))).toHaveLength(1);
 await actor.click(screen.getByRole('tab',{name:'البيانات الشخصية'}));const count=fetch.mock.calls.length;await act(async()=>{await vi.advanceTimersByTimeAsync(30000);});expect(fetch.mock.calls).toHaveLength(count);
 await actor.click(screen.getByRole('tab',{name:'إعلاناتي'}));await flush();expect(fetch.mock.calls.filter(([url])=>url.endsWith('/me/items'))).toHaveLength(2);
});
test('only the visible active-tab page refreshes after initial server ownership classification',async()=>{
 vi.useFakeTimers();configure(Array.from({length:12},(_,i)=>auction(i+1,i<8?other:owner)));mount(<AccountActivity/>);await flush();expect(detailCalls()).toHaveLength(12);expect(screen.getAllByRole('link',{name:'عرض المزاد'})).toHaveLength(6);const before=detailCalls().length;
 await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(detailCalls().slice(before).map(([url])=>url.split('/').at(-1))).toEqual(Array.from({length:6},(_,i)=>auction(i+1).id));expect(fetch.mock.calls.filter(([url])=>url.endsWith('/me/auctions'))).toHaveLength(1);
});
test('account polling updates prices and removes records no longer returned by the server',async()=>{
 vi.useFakeTimers();let records=[auction(1)];handler=async url=>url.endsWith('/me/items')?response([]):url.endsWith('/me/auctions')?response(records.map(summary)):response(records[0]);mount(<AccountActivity/>);await flush();expect(screen.getByText('1,250')).toBeVisible();
 records=[{...auction(1),current_price:'1500'}];await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.getByText('1,500')).toBeVisible();records=[];await act(async()=>{await vi.advanceTimersByTimeAsync(25000);});expect(screen.getByText('لا توجد مزايدات مرتبطة بحسابك حاليًا.')).toBeVisible();expect(screen.queryByRole('heading',{name:'مزاد 1',exact:true})).toBeNull();
});
test('hidden account pages pause polling and resume when visible',async()=>{
 vi.useFakeTimers();mount(<AccountActivity/>);await flush();vi.spyOn(document,'hidden','get').mockReturnValue(true);const count=fetch.mock.calls.length;await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});expect(fetch.mock.calls).toHaveLength(count);vi.spyOn(document,'hidden','get').mockReturnValue(false);await act(async()=>{document.dispatchEvent(new Event('visibilitychange'));});expect(fetch.mock.calls.length).toBeGreaterThan(count);
});
test('listing tab rejects a listing attributed to another owner',async()=>{
 configure([auction(1)]);const base=handler;handler=async(url,options)=>url.endsWith('/me/items')?response([{...listing,seller_id:other}]):base(url,options);const actor=userEvent.setup();mount(<AccountActivity/>);await screen.findByRole('heading',{name:'مزاد 1',exact:true});await actor.click(screen.getByRole('tab',{name:'إعلاناتي'}));expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة الخادم');expect(screen.queryByRole('heading',{name:listing.title})).toBeNull();
});
test('empty My Auctions never substitutes approved listings for auctions',async()=>{
 configure([auction(1)]);const actor=userEvent.setup();mount(<AccountActivity/>);await screen.findByRole('heading',{name:'مزاد 1',exact:true});await actor.click(screen.getByRole('tab',{name:'مزاداتي',exact:true}));expect(await screen.findByText('لم تنشئ مزادًا بعد.')).toBeVisible();expect(screen.queryByRole('heading',{name:listing.title})).toBeNull();
});
test('a refresh failure explicitly marks last-known account data as potentially stale',async()=>{
 vi.useFakeTimers();mount(<AccountActivity/>);await flush();const base=handler;handler=async(url,options)=>/\/auctions\/[a-f0-9-]{36}$/.test(url)?response({code:'NETWORK_ERROR'},503):base(url,options);await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.getByRole('alert')).toHaveTextContent('قد لا يعكس العرض آخر تغييرات المزاد');expect(screen.getByRole('heading',{name:'مزاد 1',exact:true})).toBeVisible();
});
for(const category of ['Camels','Real Estate','Rare Vehicles','Vehicle Plates']){
 test('scheduled '+category+' shares the same truthful status presentation',()=>{const data={...auction(1),category_name:category,status:'SCHEDULED',bid_count:0};const {container}=render(<AuctionCard auction={data}/>);expect(container.querySelector('.price')).toHaveTextContent('حالة المزادقريبًا');expect(screen.getByRole('link',{name:'اعرض تفاصيل المزاد'})).toHaveAttribute('href','#auction/'+data.id);expect(screen.queryByText('أعلى مزايدة')).toBeNull();expect(container.querySelector('.scheduled-price')).toHaveTextContent('السعر الابتدائي: 1,000');});
}
test('active cards preserve current accepted price rather than substituting starting price',()=>{const {container}=render(<AuctionCard auction={auction(1)}/>);expect(container.querySelector('.price')).toHaveTextContent('أعلى مزايدة1,250');expect(container.querySelector('.price')).not.toHaveTextContent('1,000');});
test('pagination stays clamped after a list shrinks and later grows',async()=>{
 vi.useFakeTimers();let records=Array.from({length:8},(_,i)=>auction(i+1));handler=async()=>response(records);const actor={click:async element=>{fireEvent.click(element);await flush();}};mount(<AuctionList/>);await flush();await actor.click(screen.getByRole('button',{name:'الصفحة 2'}));expect(screen.getByRole('heading',{name:'مزاد 7',exact:true})).toBeVisible();
 records=[auction(1)];await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.getByRole('heading',{name:'مزاد 1',exact:true})).toBeVisible();records=Array.from({length:8},(_,i)=>auction(i+1));await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.getByRole('button',{name:'الصفحة 1'})).toHaveAttribute('aria-current','page');expect(screen.getByRole('heading',{name:'مزاد 1',exact:true})).toBeVisible();expect(screen.queryByRole('heading',{name:'مزاد 7',exact:true})).toBeNull();
});
for(const status of ['PENDING_REVIEW','REJECTED']){
 test(status+' cannot reach type selection or send an auction request',async()=>{handler=async url=>url.endsWith('/me/items')?response([]):response({...listing,status});mount(<AuctionCreate id={itemId}/>);expect(await screen.findByRole('alert')).toHaveTextContent('إعلان معتمد تملكه');expect(screen.queryByRole('button',{name:'إنشاء مزاد عام'})).toBeNull();expect(screen.queryByRole('button',{name:'إنشاء مزاد خاص'})).toBeNull();expect(fetch.mock.calls.some(([,options])=>options.method!=='GET')).toBe(false);});
}
