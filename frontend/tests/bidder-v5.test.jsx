import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {PrivateAccess,Commitment,BidForm,BidReceipt,AuctionResult,Outbid} from '../src/marketplace/Participation.jsx';
import {AuctionDetails} from '../src/ui/Auctions.jsx';
import {saveIntent,cents,minimumBid} from '../src/marketplace/bidderData.js';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:uid(1),name:'مزايد الاختبار',email:'bidder@example.invalid',role:'USER'};
const a={id:uid(2),item_id:uid(3),seller_id:uid(4),title:'بورش كاريرا GT',description:'وصف من الخادم',category_name:'Rare Vehicles',visibility:'PUBLIC',images:['/images/porsche-carrera-gt.jpg'],status:'ACTIVE',current_price:'1000',starting_price:'1000',minimum_increment:'50',start_time:'2020-01-01T10:00:00Z',end_time:'2035-01-01T10:00:00Z',result:null};
const commitment={id:uid(5),status:'SUCCESS'},bid={id:uid(6),amount:'1000',created_at:'2026-10-20T10:00:00Z'};
const receipt={auctionId:a.id,userId:user.id,bidId:bid.id,amount:1000};
const intent={auctionId:a.id,userId:user.id,requestId:uid(8),amount:1000,state:'uncertain'};
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler,auction,history,eligibility;
function Ready({children}){return useAuth().status==='checking'?null:children;}
const mount=node=>render(<AuthProvider><Ready>{node}</Ready></AuthProvider>);
const postBids=()=>fetch.mock.calls.filter(([u,o])=>u.endsWith('/bids')&&o.method==='POST');
const postCommitments=()=>fetch.mock.calls.filter(([u,o])=>u.endsWith('/commitment')&&o.method==='POST');
const getDetails=()=>fetch.mock.calls.filter(([u,o])=>u.endsWith('/auctions/'+a.id)&&o.method==='GET');
async function enter(actor,value='1000'){
 const input=await screen.findByLabelText('مبلغ مزايدتك (ر.س)');await waitFor(()=>expect(input).toBeEnabled());await actor.type(input,value);await actor.click(screen.getByRole('button',{name:'مراجعة المزايدة'}));
}
async function send(actor){await actor.click(screen.getByRole('button',{name:'تأكيد',exact:true}));}
beforeEach(()=>{
 window.history.replaceState(null,'','/#home');sessionStorage.clear();saveSession({token:'a'.repeat(64),user});vi.spyOn(window,'scrollTo').mockImplementation(()=>{});auction={...a};history=[];eligibility={...commitment};
 handler=async(u,o)=>{
  if(u.endsWith('/me/items'))return answer([]);
  if(u.endsWith('/auctions/'+a.id))return answer(auction);
  if(u.endsWith('/bids')&&o.method==='GET')return answer(history);
  if(u.endsWith('/bids')&&o.method==='POST'){const b=JSON.parse(o.body);return answer({bidId:bid.id,amount:b.amount,currentPrice:b.amount},201);}
  if(u.endsWith('/commitment'))return eligibility?answer(eligibility):answer({code:'NOT_FOUND'},404);
  if(u.endsWith('/access'))return answer({accessGranted:true});
  throw Error('Unexpected bidder request '+u);
 };vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
for(const node of [<PrivateAccess id={a.id}/>,<Commitment id={a.id}/>,<BidForm id={a.id}/>,<BidReceipt id={a.id}/>,<Outbid id={a.id}/>])test('guest cannot start protected bidder view '+node.type.name,async()=>{
 sessionStorage.clear();mount(node);expect(await screen.findByRole('heading',{name:'سجّل الدخول للمتابعة'})).toBeVisible();expect(fetch).not.toHaveBeenCalled();
});
test('private invalid code does not fetch protected details, eligibility or history',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/access')?answer({code:'INVALID_CODE'},403):base(u,o);const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'wrong');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('alert')).toHaveTextContent('رمز الوصول غير صحيح');expect(getDetails()).toHaveLength(0);expect(fetch.mock.calls.some(([u])=>u.endsWith('/bids')||u.endsWith('/commitment'))).toBe(false);
});
test('private accepted screen follows a matching protected PRIVATE detail read and never auto commits',async()=>{
 auction={...a,visibility:'PRIVATE'};const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'local-code');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('heading',{name:'تم قبول الرمز'})).toBeVisible();expect(screen.getByRole('link',{name:'تأكيد المشاركة'})).toHaveAttribute('href','#commitment/'+a.id);expect(window.location.hash).toBe('#home');expect(postCommitments()).toHaveLength(0);expect(getDetails()).toHaveLength(1);
});
for(const extra of [{id:uid(99)},{visibility:'PUBLIC'},{seller_id:user.id}])test('private grant with mismatched protected detail is not successful '+JSON.stringify(extra),async()=>{
 auction={...a,visibility:'PRIVATE',...extra};const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'local-code');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة');expect(screen.queryByRole('heading',{name:'تم قبول الرمز'})).toBeNull();expect(postCommitments()).toHaveLength(0);
});
test('grant followed by network failure retries GET only rather than sharing the code again',async()=>{
 auction={...a,visibility:'PRIVATE'};const base=handler;let fail=true;handler=(u,o)=>u.endsWith('/auctions/'+a.id)&&fail?answer({code:'NETWORK_ERROR'},503):base(u,o);const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'local-code');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('button',{name:'التحقق من صلاحية الدخول'})).toBeVisible();fail=false;await actor.click(screen.getByRole('button',{name:'التحقق من صلاحية الدخول'}));expect(await screen.findByRole('heading',{name:'تم قبول الرمز'})).toBeVisible();expect(fetch.mock.calls.filter(([u,o])=>u.endsWith('/access')&&o.method==='POST')).toHaveLength(1);expect(screen.queryByLabelText('رمز الوصول')).toBeNull();
});
test('a duplicate click during private access sends only one code request',async()=>{
 auction={...a,visibility:'PRIVATE'};const base=handler;let release;handler=(u,o)=>u.endsWith('/access')?new Promise(resolve=>{release=()=>resolve(answer({accessGranted:true}));}):base(u,o);const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'local-code');await actor.dblClick(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(screen.getByRole('button',{name:'جارٍ التحقق…'})).toBeDisabled();expect(fetch.mock.calls.filter(([u])=>u.endsWith('/access'))).toHaveLength(1);release();expect(await screen.findByRole('heading',{name:'تم قبول الرمز'})).toBeVisible();
});
for(const extra of [{status:'SCHEDULED',start_time:'2030-01-01T10:00:00Z'},{status:'CLOSED',end_time:'2026-01-01T10:00:00Z'},{seller_id:user.id}])test('details disable bidding for actual schedule, closure or ownership '+JSON.stringify(extra),async()=>{
 auction={...a,...extra};const participate=vi.fn();mount(<AuctionDetails id={a.id} onParticipate={participate} onRequireLogin={()=>{}}/>);await screen.findByRole('heading',{name:a.title});expect(screen.getByRole('button',{name:/لم يبدأ المزاد|انتهى المزاد|لا يمكنك المزايدة/})).toBeDisabled();expect(participate).not.toHaveBeenCalled();expect(postBids()).toHaveLength(0);
});
test('SCHEDULED whose start has arrived remains labelled by server and can proceed to eligibility',async()=>{
 auction={...a,status:'SCHEDULED'};const actor=userEvent.setup(),participate=vi.fn();mount(<AuctionDetails id={a.id} onParticipate={participate} onRequireLogin={()=>{}}/>);await actor.click(await screen.findByRole('button',{name:'أضف مزايدتك',exact:true}));expect(screen.getByText(/حالة الخادم ما زالت مجدولة/)).toBeVisible();expect(participate).toHaveBeenCalledOnce();expect(postCommitments()).toHaveLength(0);
});
test('private detail failure hides all metadata and never requests history or commitment',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/auctions/'+a.id)?answer({code:'NOT_FOUND'},404):base(u,o);mount(<AuctionDetails id={a.id} onRequireLogin={()=>{}}/>);expect(await screen.findByRole('alert')).toHaveTextContent('غير متاح');expect(screen.queryByRole('heading',{name:a.title})).toBeNull();expect(fetch.mock.calls.some(([u])=>u.endsWith('/bids')||u.endsWith('/commitment'))).toBe(false);
});
test('owner cannot load commitment or bidding eligibility data',async()=>{
 auction={...a,seller_id:user.id};mount(<Commitment id={a.id}/>);expect(await screen.findByRole('alert')).toHaveTextContent('مزاد تملكه');expect(fetch.mock.calls.some(([u])=>u.endsWith('/commitment'))).toBe(false);
});
for(const state of ['PENDING','FAILED','SUCCESS'])test('commitment '+state+' state uses only the server record',async()=>{
 eligibility={...commitment,status:state};mount(<Commitment id={a.id}/>);expect(await screen.findByText(state==='PENDING'?'تأكيد المشاركة قيد المعالجة':state==='SUCCESS'?'اكتمل تأكيد المشاركة':'لم يكتمل تأكيد المشاركة')).toBeVisible();expect(postCommitments()).toHaveLength(0);expect(screen.queryByRole('link',{name:'متابعة إلى المزايدة'})!==null).toBe(state==='SUCCESS');
});
test('pending commitment polls GET until server success without another initiation',async()=>{
 vi.useFakeTimers();eligibility={...commitment,status:'PENDING'};mount(<Commitment id={a.id}/>);await vi.waitFor(()=>expect(screen.getByText('تأكيد المشاركة قيد المعالجة')).toBeVisible());eligibility={...commitment,status:'SUCCESS'};await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.getByRole('heading',{name:'اكتمل تأكيد المشاركة'})).toBeVisible();expect(postCommitments()).toHaveLength(0);
});
test('unavailable bank remains unavailable and never renders success or a bid action',async()=>{
 eligibility=null;const base=handler;handler=(u,o)=>u.endsWith('/commitment')&&o.method==='POST'?answer({code:'BANK_SANDBOX_UNAVAILABLE'},503):base(u,o);const actor=userEvent.setup();mount(<Commitment id={a.id}/>);await actor.click(await screen.findByRole('button',{name:'ابدأ تأكيد المشاركة'}));expect(await screen.findByRole('heading',{name:'التأكيد غير متاح حاليًا'})).toBeVisible();expect(screen.getByRole('alert')).toHaveTextContent('لم يتم اعتماد المشاركة');expect(screen.queryByRole('link',{name:'متابعة إلى المزايدة'})).toBeNull();expect(postBids()).toHaveLength(0);
});
test('ambiguous commitment outcome requires GET verification before any further initiation',async()=>{
 eligibility=null;const base=handler;handler=(u,o)=>u.endsWith('/commitment')&&o.method==='POST'?answer({code:'TIMEOUT'},504):base(u,o);const actor=userEvent.setup();mount(<Commitment id={a.id}/>);await actor.click(await screen.findByRole('button',{name:'ابدأ تأكيد المشاركة'}));expect(await screen.findByRole('heading',{name:'تعذر التحقق من حالة المشاركة'})).toBeVisible();expect(screen.queryByRole('button',{name:'إعادة المحاولة'})).toBeNull();eligibility={...commitment};await actor.click(screen.getByRole('button',{name:'تحديث حالة المشاركة'}));expect(await screen.findByRole('heading',{name:'اكتمل تأكيد المشاركة'})).toBeVisible();expect(postCommitments()).toHaveLength(1);
});
test('expired auction cannot start commitment even if server would accept the route',async()=>{
 eligibility=null;auction={...a,end_time:'2026-01-01T10:00:00Z'};mount(<Commitment id={a.id}/>);const button=await screen.findByRole('button',{name:'ابدأ تأكيد المشاركة'});await waitFor(()=>expect(button).toBeDisabled());expect(postCommitments()).toHaveLength(0);
});
test('first bid accepts the starting price and requires explicit confirmation',async()=>{
 const actor=userEvent.setup(),accepted=vi.fn();mount(<BidForm id={a.id} onAccepted={accepted}/>);await enter(actor);expect(screen.getByRole('dialog')).toHaveTextContent('1,000');expect(postBids()).toHaveLength(0);await send(actor);await waitFor(()=>expect(accepted).toHaveBeenCalledWith(receipt));expect(postBids()).toHaveLength(1);expect(JSON.parse(postBids()[0][1].body).requestId).toMatch(/^[a-f0-9-]{36}$/);
});
test('later bids require current accepted price plus the configured increment',async()=>{
 history=[bid];const actor=userEvent.setup();mount(<BidForm id={a.id}/>);await enter(actor,'1000');expect(screen.getByRole('alert')).toHaveTextContent('1,050');expect(screen.queryByRole('dialog')).toBeNull();expect(postBids()).toHaveLength(0);
});
test('minimum never regresses below a more recent accepted history response',()=>{
 expect(minimumBid(a,[{...bid,amount:'1100'}])).toBe(1150);expect(cents('1e3')).toBeNull();expect(cents('1000.001')).toBeNull();expect(minimumBid(a,[])).toBe(1000);
});
test('cancelled bid confirmation writes neither a bid nor an unresolved request',async()=>{
 const actor=userEvent.setup();mount(<BidForm id={a.id}/>);await enter(actor);await actor.click(screen.getByRole('button',{name:'إلغاء',exact:true}));expect(postBids()).toHaveLength(0);expect([...Object.keys(sessionStorage)].filter(k=>k.startsWith('mezyad.bid.intent:'))).toHaveLength(0);
});
for(const code of ['TIMEOUT','NETWORK_ERROR','INVALID_RESPONSE'])test(code+' retry after remount keeps the exact same request ID and amount',async()=>{
 const base=handler;let fail=true;handler=(u,o)=>u.endsWith('/bids')&&o.method==='POST'&&fail?answer({code},504):base(u,o);const actor=userEvent.setup(),accepted=vi.fn(),rendered=mount(<BidForm id={a.id} onAccepted={accepted}/>);await enter(actor);await send(actor);expect(await screen.findByRole('button',{name:'إعادة إرسال نفس المزايدة'})).toBeVisible();expect(accepted).not.toHaveBeenCalled();const body=JSON.parse(postBids()[0][1].body);rendered.unmount();fail=false;mount(<BidForm id={a.id} onAccepted={accepted}/>);const retry=await screen.findByRole('button',{name:'إعادة إرسال نفس المزايدة'});await waitFor(()=>expect(retry).toBeEnabled());expect(screen.getByLabelText('مبلغ مزايدتك (ر.س)')).toBeDisabled();await actor.click(retry);await send(actor);await waitFor(()=>expect(accepted).toHaveBeenCalledOnce());expect(JSON.parse(postBids()[1][1].body)).toEqual(body);
});
test('duplicate response never claims success and blocks new request IDs for that unresolved attempt',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/bids')&&o.method==='POST'?answer({code:'DUPLICATE_REQUEST'},409):base(u,o);const actor=userEvent.setup(),accepted=vi.fn();mount(<BidForm id={a.id} onAccepted={accepted}/>);await enter(actor);await send(actor);expect(await screen.findByText(/لا يتيح الرد الحالي ربطه بمزايدة شخصية مؤكدة/)).toBeVisible();expect(accepted).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:'مراجعة المزايدة'})).toBeNull();expect(screen.queryByRole('button',{name:'إعادة إرسال نفس المزايدة'})).toBeNull();expect(postBids()).toHaveLength(1);expect(screen.getByLabelText('مبلغ مزايدتك (ر.س)')).toBeDisabled();
});
for(const [code,status] of [['BID_TOO_LOW',409],['AUCTION_NOT_ACTIVE',409],['OWNER',403],['NO_ACCESS',403],['COMMITMENT_REQUIRED',403]])test('server rejection '+code+' shows a real failure outcome without changing displayed price',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/bids')&&o.method==='POST'?answer({code},status):base(u,o);const actor=userEvent.setup(),accepted=vi.fn();mount(<BidForm id={a.id} onAccepted={accepted}/>);await enter(actor);await send(actor);expect(await screen.findByRole('heading',{name:'لم تُقبل المزايدة'})).toBeVisible();expect(accepted).not.toHaveBeenCalled();expect(postBids()).toHaveLength(1);expect(screen.getByRole('button',{name:'مراجعة السعر وإعادة المحاولة'})).toBeVisible();
});
for(const extra of [{bidId:'wrong'},{amount:1050},{currentPrice:1100}])test('invalid acceptance '+JSON.stringify(extra)+' keeps an unresolved intent rather than showing success',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/bids')&&o.method==='POST'?answer({bidId:bid.id,amount:1000,currentPrice:1000,...extra},201):base(u,o);const actor=userEvent.setup(),accepted=vi.fn();mount(<BidForm id={a.id} onAccepted={accepted}/>);await enter(actor);await send(actor);expect(await screen.findByRole('button',{name:'إعادة إرسال نفس المزايدة'})).toBeVisible();expect(accepted).not.toHaveBeenCalled();expect(window.location.hash).toBe('#home');
});
test('storage failure prevents sending an untraceable bid request',async()=>{
 const actor=userEvent.setup();mount(<BidForm id={a.id}/>);await enter(actor);vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('disabled');});await send(actor);expect(await screen.findByRole('alert')).toHaveTextContent('لم نرسل المزايدة');expect(postBids()).toHaveLength(0);
});
test('corrupt unresolved intent fails closed and cannot silently create a replacement request',async()=>{
 sessionStorage.setItem('mezyad.bid.intent:'+user.id+':'+a.id,'{broken');mount(<BidForm id={a.id}/>);expect(await screen.findByText(/تعذر قراءة معرّف الطلب السابق/)).toBeVisible();expect(screen.queryByRole('button',{name:'مراجعة المزايدة'})).toBeNull();expect(postBids()).toHaveLength(0);
});
test('another user or auction intent never replaces this bidder draft',async()=>{
 saveIntent({...intent,userId:uid(99)});saveIntent({...intent,auctionId:uid(98)});mount(<BidForm id={a.id}/>);const field=await screen.findByLabelText('مبلغ مزايدتك (ر.س)');await waitFor(()=>expect(field).toBeEnabled());expect(field).toHaveValue('');expect(screen.queryByRole('button',{name:'إعادة إرسال نفس المزايدة'})).toBeNull();
});
test('deadline reached while confirmation is open prevents a POST before the next poll',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-20T10:00:00Z'));auction={...a,end_time:'2026-10-20T10:00:02Z'};mount(<BidForm id={a.id}/>);await vi.waitFor(()=>expect(screen.getByLabelText('مبلغ مزايدتك (ر.س)')).toBeEnabled());fireEvent.change(screen.getByLabelText('مبلغ مزايدتك (ر.س)'),{target:{value:'1000'}});fireEvent.click(screen.getByRole('button',{name:'مراجعة المزايدة'}));expect(screen.getByRole('dialog')).toBeVisible();await act(async()=>{await vi.advanceTimersByTimeAsync(2100);});fireEvent.click(screen.getByRole('button',{name:'تأكيد',exact:true}));expect(postBids()).toHaveLength(0);expect(screen.queryByRole('dialog')).toBeNull();
});
test('receipt from a different user cannot render bid success',async()=>{
 mount(<BidReceipt id={a.id} receipt={{...receipt,userId:uid(99)}}/>);expect(await screen.findByRole('heading',{name:a.title})).toBeVisible();expect(screen.queryByText(/تم قبول مزايدتك/)).toBeNull();
});
for(const [name,result,known,heading] of [
 ['verified winner',{winner_bid_id:bid.id,closed_at:'2026-10-20T10:00:00Z',isWinner:true,winning_amount:'1000'},null,'فزت بالمزاد'],
 ['different winning bid',{winner_bid_id:uid(99),closed_at:'2026-10-20T10:00:00Z'},receipt,'تم تحديد المزايدة الفائزة'],
 ['reload without receipt',{winner_bid_id:bid.id,closed_at:'2026-10-20T10:00:00Z'},null,'تم تحديد المزايدة الفائزة'],
 ['no bids',{winner_bid_id:null,closed_at:'2026-10-20T10:00:00Z'},null,'انتهى المزاد دون مزايدات'],
 ['missing result',null,null,'نتيجة الإغلاق غير متاحة بعد'],
 ['malformed result',{},null,'نتيجة الإغلاق غير متاحة بعد'],
 ['foreign receipt',{winner_bid_id:bid.id,closed_at:'2026-10-20T10:00:00Z'},{...receipt,auctionId:uid(98)},'تم تحديد المزايدة الفائزة']
])test('result '+name+' uses explicit server evidence',async()=>{
 auction={...a,status:'CLOSED',result,...(name==='verified winner'?{participation:{hasBid:true,bidCount:1,highestBid:'1000',latestBidId:bid.id}}:{})};mount(<AuctionResult id={a.id} receipt={known}/>);expect(await screen.findByRole('heading',{name:heading,exact:true})).toBeVisible();if(name==='different winning bid'){expect(screen.queryByRole('heading',{name:'لم تفز بالمزاد',exact:true})).toBeNull();expect(screen.getByText(/لا يمكن إثبات النتيجة الشخصية/)).toBeVisible();}
});
test('matching winner ID with inconsistent price does not prove a personal win',async()=>{
 auction={...a,status:'CLOSED',current_price:'1050',result:{winner_bid_id:bid.id,closed_at:'2026-10-20T10:00:00Z'}};mount(<AuctionResult id={a.id} receipt={receipt}/>);expect(await screen.findByRole('heading',{name:'تم تحديد المزايدة الفائزة'})).toBeVisible();expect(screen.queryByRole('heading',{name:'فزت بالمزاد',exact:true})).toBeNull();
});
test('outbid requires a higher accepted bid, not merely a higher displayed price',async()=>{
 auction={...a,current_price:'1100'};mount(<Outbid id={a.id} receipt={receipt}/>);expect(await screen.findByRole('heading',{name:'متابعة حالة المزايدة'})).toBeVisible();expect(screen.queryByRole('heading',{name:'تم تجاوز مزايدتك',exact:true})).toBeNull();
});
test('verified higher bid shows Outbid without claiming who placed it',async()=>{
 auction={...a,current_price:'1100'};history=[{...bid,id:uid(99),amount:1100},bid];mount(<Outbid id={a.id} receipt={receipt}/>);expect(await screen.findByRole('heading',{name:'تم تجاوز مزايدتك'})).toBeVisible();expect(screen.getByText('لا يحدد السجل المتاح هوية صاحب المزايدة الأعلى.')).toBeVisible();expect(screen.getByRole('link',{name:'مراجعة السعر وإضافة مزايدة'})).toHaveAttribute('href','#bid/'+a.id);
});
test('polling loss of private authorization removes stale detail content',async()=>{
 vi.useFakeTimers();auction={...a,visibility:'PRIVATE'};let allowed=true;const base=handler;handler=(u,o)=>u.endsWith('/auctions/'+a.id)&&!allowed?answer({code:'NOT_FOUND'},404):base(u,o);mount(<AuctionDetails id={a.id} onRequireLogin={()=>{}}/>);await vi.waitFor(()=>expect(screen.getByRole('heading',{name:a.title})).toBeVisible());allowed=false;await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(screen.queryByRole('heading',{name:a.title})).toBeNull();expect(screen.queryByAltText(a.title)).toBeNull();expect(screen.getByRole('alert')).toHaveTextContent('غير متاح');
});
test('private API rate limit is visible and never creates an access success',async()=>{
 const base=handler;handler=(u,o)=>u.endsWith('/access')?answer({code:'RATE_LIMITED'},429):base(u,o);const actor=userEvent.setup();mount(<PrivateAccess id={a.id}/>);await actor.type(await screen.findByLabelText('رمز الوصول'),'local-code');await actor.click(screen.getByRole('button',{name:'التحقق من الرمز'}));expect(await screen.findByRole('alert')).toHaveTextContent('محاولات كثيرة');expect(getDetails()).toHaveLength(0);expect(screen.queryByRole('heading',{name:'تم قبول الرمز'})).toBeNull();
});
for(const result of [null,{}])test('detail summary never interprets an incomplete result as no bids '+JSON.stringify(result),async()=>{
 auction={...a,status:'CLOSED',result};mount(<AuctionDetails id={a.id} onRequireLogin={()=>{}}/>);expect(await screen.findByText('نتيجة الإغلاق غير متاحة بعد.')).toBeVisible();expect(screen.queryByText('انتهى المزاد دون مزايدات.')).toBeNull();
});
test('detail summary does not announce a final result before server closure',async()=>{
 auction={...a,result:{winner_bid_id:null,closed_at:'2026-10-20T10:00:00Z'}};mount(<AuctionDetails id={a.id} onRequireLogin={()=>{}}/>);await screen.findByRole('heading',{name:a.title});expect(screen.queryByText('انتهى المزاد دون مزايدات.')).toBeNull();
});
test('a failed bid-history refresh clears the previously displayed private history',async()=>{
 vi.useFakeTimers();auction={...a,visibility:'PRIVATE'};history=[bid];let denied=false;const base=handler;handler=(u,o)=>u.endsWith('/bids')&&denied?answer({code:'NOT_FOUND'},404):base(u,o);mount(<AuctionDetails id={a.id} onRequireLogin={()=>{}}/>);await vi.waitFor(()=>expect(document.querySelectorAll('.bid-history li')).toHaveLength(1));denied=true;await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(document.querySelector('.bid-history')).toBeNull();expect(screen.getByRole('alert')).toHaveTextContent('غير متاح');
});
