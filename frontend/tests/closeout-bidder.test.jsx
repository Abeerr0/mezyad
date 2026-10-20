import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {act,render,screen,waitFor} from '@testing-library/react';
import {AuthProvider} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {BidderOutcome,BidPosition} from '../src/marketplace/BidderPresentation.jsx';
import {Outbid} from '../src/marketplace/Participation.jsx';
import {higherAcceptedBid} from '../src/marketplace/bidderData.js';

const id=n=>'61000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:id(1),name:'اختبار حالة المزاد',email:'closeout-bidder@example.invalid',role:'USER'};
const auction={id:id(2),item_id:id(3),seller_id:id(4),title:'مزاد تجاوز المزايدة',description:'بيانات اختبار اصطناعية',category_name:'Rare Vehicles',visibility:'PUBLIC',images:['/images/porsche-carrera-gt.jpg'],status:'ACTIVE',current_price:'1050',starting_price:'1000',minimum_increment:'50',start_time:'2020-01-01T00:00:00Z',end_time:'2035-01-01T00:00:00Z',result:null,participation:{hasBid:true,bidCount:1,highestBid:'1000',latestBidId:id(5)}};
const history=[{id:id(5),amount:'1000',created_at:'2026-10-20T10:00:00Z'},{id:id(6),amount:'1050',created_at:'2026-10-20T10:01:00Z'}];
const response=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
const position=(data,standalone=false)=><BidPosition auction={data} userId={user.id} history={history} standalone={standalone}/>;

beforeEach(()=>{
  sessionStorage.clear();window.history.replaceState(null,'','/#home');
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

test('a closed auction keeps factual higher-bid data without showing an inline bid invitation',()=>{
  const closed={...auction,status:'CLOSED'};
  expect(higherAcceptedBid(null,closed,user.id,history)).toBe(true);
  const {container}=render(position(closed));
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole('heading',{name:'تم تجاوز مزايدتك'})).toBeNull();
});

test('standalone closed outbid leads to the result and never invites another bid',()=>{
  render(position({...auction,status:'CLOSED'},true));
  expect(screen.getByRole('heading',{level:1,name:'انتهى المزاد'})).toBeVisible();
  expect(screen.getByRole('link',{name:'عرض نتيجة المزاد'})).toHaveAttribute('href','#result/'+auction.id);
  expect(screen.getByRole('link',{name:'عرض تفاصيل المزاد'})).toHaveAttribute('href','#auction/'+auction.id);
  expect(document.querySelector('a[href="#bid/'+auction.id+'"]')).toBeNull();
});

test('elapsed deadline with ACTIVE status waits for server closure without inventing a result',()=>{
  const expired={...auction,end_time:'2020-01-02T00:00:00Z'};
  render(position(expired,true));
  expect(screen.getByRole('heading',{level:1,name:'انتهى وقت المزايدة'})).toBeVisible();
  expect(screen.getByText('انتهى موعد المزاد. ننتظر تأكيد الإغلاق والنتيجة من الخادم.')).toBeVisible();
  expect(screen.queryByRole('link',{name:'عرض نتيجة المزاد'})).toBeNull();
  expect(document.querySelector('a[href="#bid/'+auction.id+'"]')).toBeNull();
  expect(expired.status).toBe('ACTIVE');
});

test('scheduled outbid is a not-started state with no result or bid invitation',()=>{
  render(position({...auction,status:'SCHEDULED',start_time:'2030-01-01T00:00:00Z'},true));
  expect(screen.getByRole('heading',{name:'لم يبدأ المزاد بعد'})).toBeVisible();
  expect(screen.queryByRole('link',{name:'عرض نتيجة المزاد'})).toBeNull();
  expect(document.querySelector('a[href="#bid/'+auction.id+'"]')).toBeNull();
});

test('active outbid keeps its existing bid-review action',()=>{
  render(position(auction,true));
  expect(screen.getByRole('heading',{name:'تم تجاوز مزايدتك'})).toBeVisible();
  expect(screen.getByRole('link',{name:'مراجعة السعر وإضافة مزايدة'})).toHaveAttribute('href','#bid/'+auction.id);
});

function authenticate(handler){
  saveSession({token:'a'.repeat(64),user});
  vi.stubGlobal('fetch',vi.fn(async(url,options)=>url.endsWith('/me/items')?response([]):handler(url,options)));
}

test('direct closed Outbid renders a result destination even while history is loading',async()=>{
  let resolveHistory;
  authenticate(async url=>url.endsWith('/bids')?new Promise(resolve=>{resolveHistory=resolve;}):response({...auction,status:'CLOSED'}));
  render(<AuthProvider><Outbid id={auction.id}/></AuthProvider>);
  expect(await screen.findByRole('heading',{level:1,name:'انتهى المزاد'})).toBeVisible();
  expect(screen.getByRole('link',{name:'عرض نتيجة المزاد'})).toHaveAttribute('href','#result/'+auction.id);
  expect(screen.getByRole('main')).toHaveFocus();
  expect(document.querySelector('a[href="#bid/'+auction.id+'"]')).toBeNull();
  await waitFor(()=>expect(resolveHistory).toBeTypeOf('function'));
  await act(async()=>resolveHistory(response(history)));
});

test('Outbid deadline changes live without turning ACTIVE into a server-confirmed closure',async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
  const ending={...auction,end_time:'2026-10-20T12:00:01Z'};
  authenticate(async url=>response(url.endsWith('/bids')?history:ending));
  render(<AuthProvider><Outbid id={auction.id}/></AuthProvider>);
  await vi.waitFor(()=>expect(screen.getByRole('heading',{name:'تم تجاوز مزايدتك'})).toBeVisible());
  await act(async()=>vi.advanceTimersByTimeAsync(1000));
  expect(screen.getByRole('heading',{name:'انتهى وقت المزايدة'})).toBeVisible();
  expect(screen.queryByRole('link',{name:'عرض نتيجة المزاد'})).toBeNull();
  expect(document.querySelector('a[href="#bid/'+auction.id+'"]')).toBeNull();
  expect(ending.status).toBe('ACTIVE');
});

test('history authorization loss hides the closed auction title and result destination',async()=>{
  authenticate(async url=>url.endsWith('/bids')?response({code:'NO_ACCESS'},403):response({...auction,status:'CLOSED',visibility:'PRIVATE'}));
  render(<AuthProvider><Outbid id={auction.id}/></AuthProvider>);
  expect(await screen.findByRole('alert')).toHaveTextContent('يلزم قبول رمز الوصول');
  expect(screen.queryByRole('heading',{name:auction.title})).toBeNull();
  expect(screen.queryByRole('link',{name:'عرض نتيجة المزاد'})).toBeNull();
});

test('an asynchronously mounted bidder outcome provides and focuses the main content landmark',async()=>{
  let resolveDetail;
  authenticate(async url=>url.endsWith('/bids')?response(history):new Promise(resolve=>{resolveDetail=resolve;}));
  render(<AuthProvider><button type="button">تنقل خارج المحتوى</button><Outbid id={auction.id}/></AuthProvider>);
  await waitFor(()=>expect(resolveDetail).toBeTypeOf('function'));
  screen.getByRole('button',{name:'تنقل خارج المحتوى'}).focus();
  await act(async()=>resolveDetail(response({...auction,status:'CLOSED'})));
  expect(await screen.findByRole('heading',{name:'انتهى المزاد'})).toBeVisible();
  expect(screen.getByRole('main')).toHaveAttribute('id','main-content');
  expect(screen.getByRole('main')).toHaveAttribute('tabindex','-1');
  expect(screen.getByRole('main')).toHaveFocus();
});

test('polling an existing outcome does not steal focus from its action',()=>{
  const view=render(<BidderOutcome title="النتيجة" itemTitle={auction.title} actions={<button>متابعة</button>}/>);
  const action=screen.getByRole('button',{name:'متابعة'});action.focus();
  view.rerender(<BidderOutcome title="النتيجة المحدثة" itemTitle={auction.title} actions={<button>متابعة</button>}/>);
  expect(screen.getByRole('heading',{name:'النتيجة المحدثة'})).toBeVisible();
  expect(action).toHaveFocus();
});

test('mounting an outcome never steals focus from an active modal',()=>{
  const dialog=document.createElement('div');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
  const cancel=document.createElement('button');cancel.textContent='إلغاء النافذة';dialog.append(cancel);document.body.append(dialog);cancel.focus();
  try{
    render(<BidderOutcome title="نتيجة جاهزة" itemTitle={auction.title}/>);
    expect(cancel).toHaveFocus();
  }finally{dialog.remove();}
});

test('outcome focus waits for a closing confirmation to release its inert background',()=>{
  let focusFrame;
  vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{focusFrame=callback;return 7;});
  vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});
  const container=document.createElement('div');container.setAttribute('inert','');document.body.append(container);
  try{
    render(<BidderOutcome title="تم حفظ القرار" itemTitle={auction.title}/>,{container});
    expect(screen.getByRole('main')).not.toHaveFocus();
    container.removeAttribute('inert');act(()=>focusFrame());
    expect(screen.getByRole('main')).toHaveFocus();
  }finally{container.remove();}
});

test('auction failure feedback does not spread a React key into component props',async()=>{
  const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
  authenticate(async()=>response({code:'NOT_FOUND'},404));
  render(<AuthProvider><Outbid id={auction.id}/></AuthProvider>);
  expect(await screen.findByRole('alert')).toHaveTextContent('المحتوى المطلوب غير متاح');
  expect(errors.mock.calls.filter(args=>args.some(value=>/props object containing a "key" prop|key.*spread/i.test(String(value))))).toHaveLength(0);
});
