import React,{useEffect,useRef,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {safeImage} from '../ui/Auctions.jsx';
import {ServerImage} from '../ui/MediaGallery.jsx';
import {Page,Field,Feedback,Confirm,useData,uuid,navigate} from './common.jsx';
import {BidderOutcome,BidPosition,ReceiptCopy} from './BidderPresentation.jsx';
import {formatAmount as amount,cents,validBidderAuction,validHistory,validCommitment,validResult,personalResult,validReceipt,minimumBid,auctionWindow,useNow,readIntent,saveIntent,clearIntent,higherAcceptedBid,useBidderAuction} from './bidderData.js';
import './bidder.css';

const Frame=({children})=><div className="bidder-workspace">{children}</div>;
function SignedIn({children}){
  const {status}=useAuth();
  if(status!=='authenticated')return <Page title="سجّل الدخول للمتابعة"><p role="status">{status==='checking'?'جارٍ التحقق من الجلسة…':'تحتاج إلى حساب مسجّل لإتمام هذه الخطوة.'}</p><a className="button secondary" href="#login">تسجيل الدخول</a></Page>;
  return children;
}
function AuctionFeedback({data,title}){const {failure,loading,reload}=data;return <Page title={title}><Feedback failure={failure} loading={loading} reload={reload}/><a className="button secondary" href="#auctions">العودة إلى المزادات</a></Page>;}
function ProductImage({auction,onRefresh}){return <ServerImage className="bid-image" src={auction.images[0]} alt={auction.title} onRefresh={onRefresh}/>;}
const bidPath=id=>'/api/v1/auctions/'+id;
const useAuction=useBidderAuction;

export function PrivateAccess({id}){return <Frame><SignedIn><AccessForm id={id}/></SignedIn></Frame>;}
function AccessForm({id}){
  const {request,session}=useAuth();
  const [auctionId,setAuctionId]=useState(id||''),[code,setCode]=useState(''),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[granted,setGranted]=useState(null),[approvedTarget,setApprovedTarget]=useState(null);
  const busy=useRef(false),alive=useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
  async function verifyDetails(target){
    const value=await request(bidPath(target));
    if(!validBidderAuction(value)||value.id!==target||value.visibility!=='PRIVATE'||value.seller_id===session.user.id)throw new ApiError('INVALID_RESPONSE');
    if(alive.current){setGranted(value);setFailure('');}
  }
  async function submit(event){
    event?.preventDefault();if(busy.current)return;
    setFailure('');let target=auctionId.trim();
    try{if(!uuid(target)){const link=new URL(target,window.location.origin);target=link.hash.match(/^#(?:private|auction)\/([a-f0-9-]{36})$/i)?.[1]||target;}}catch{/* The UUID validation below handles incomplete links. */}
    if(!uuid(target)||(!approvedTarget&&!code.trim())){setFailure('أدخل رابط المزاد أو معرّفه الصحيح ورمز الوصول.');return;}
    target=target.toLowerCase();busy.current=true;setPending(true);
    try{
      if(approvedTarget!==target){const value=await request(bidPath(target)+'/access',{method:'POST',body:{accessCode:code.trim()}});if(value?.accessGranted!==true)throw new ApiError('INVALID_RESPONSE');if(alive.current){setApprovedTarget(target);setCode('');}}
      await verifyDetails(target);
    }catch(error){if(alive.current)setFailure(errorMessage(error));}finally{busy.current=false;if(alive.current)setPending(false);}
  }
  if(granted)return <BidderOutcome node="425:171" title="تم قبول الرمز" itemTitle={'مزاد خاص / '+granted.title} actions={<><a className="button primary" href={'#commitment/'+granted.id}>تأكيد المشاركة</a><a className="button secondary" href={'#auction/'+granted.id}>عرض تفاصيل المزاد</a><a className="button secondary" href="#auctions">العودة إلى المزادات</a></>}><p>تم التحقق من صلاحية دخولك لهذا المزاد. تأكيد المشاركة مطلوب قبل المزايدة، ويظل قبولها مرتبطًا بمواعيد المزاد وقرار الخادم.</p></BidderOutcome>;
  return <Page title="الدخول إلى المزاد الخاص" trail="مزاد خاص" node="422:176"><img className="private-access-photo" src="/images/private-access-interior.png" alt=""/><form className="workspace-panel narrow-panel" onSubmit={submit} noValidate><p className="section-description">أدخل رمز الوصول الذي شاركه معك البائع.</p>{!id&&<Field label="رابط المزاد أو معرّفه" id="private-id"><input id="private-id" value={auctionId} onChange={event=>{setAuctionId(event.target.value);setApprovedTarget(null);}} dir="ltr" disabled={pending}/></Field>}{!approvedTarget&&<Field label="رمز الوصول" id="private-code"><input id="private-code" value={code} onChange={event=>setCode(event.target.value)} dir="ltr" autoComplete="off" disabled={pending} required aria-invalid={!!failure}/></Field>}{failure&&<p role="alert" className="feedback error">{failure}</p>}{approvedTarget&&<p className="field-hint">قُبل الرمز، وتعذر التحقق من تفاصيل المزاد. ستعيد المحاولة قراءة صلاحية الدخول فقط.</p>}<div className="workspace-actions"><button className="button primary" disabled={pending}>{pending?'جارٍ التحقق…':approvedTarget?'التحقق من صلاحية الدخول':'التحقق من الرمز'}</button><a className="button secondary" href="#auctions">العودة إلى المزادات</a></div></form></Page>;
}

export function Commitment({id}){return <Frame><SignedIn><CommitmentAuction id={id}/></SignedIn></Frame>;}
function CommitmentAuction({id}){
  const auction=useAuction(id),{session}=useAuth();
  if(!auction.data||auction.failure)return <AuctionFeedback data={auction} title="تأكيد المشاركة"/>;
  if(auction.data.seller_id===session.user.id)return <Page title="تأكيد المشاركة"><p role="alert">لا يمكنك المشاركة في مزاد تملكه.</p><a href={'#auction/'+id} className="button secondary">العودة إلى تفاصيل المزاد</a></Page>;
  return <CommitmentStatus id={id} auction={auction.data}/>;
}
async function getCommitment(request,id,signal){
  try{const value=await request(bidPath(id)+'/commitment',{signal});if(!validCommitment(value))throw new ApiError('INVALID_RESPONSE');return value;}
  catch(error){if(error.status===404&&error.code==='NOT_FOUND')return null;throw error;}
}
function CommitmentStatus({id,auction}){
  const {request}=useAuth(),now=useNow();
  const [record,setRecord]=useState(null),[mode,setMode]=useState('loading'),[failure,setFailure]=useState('');
  const busy=useRef(false),alive=useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
  const closed=auctionWindow(auction,now)==='closed';
  function apply(value){setRecord(value);setMode(value?{SUCCESS:'success',PENDING:'pending',FAILED:'failed'}[value.status]:'ready');}
  useEffect(()=>{const controller=new AbortController();getCommitment(request,id,controller.signal).then(value=>{if(!controller.signal.aborted)apply(value);}).catch(error=>{if(!controller.signal.aborted){setMode('uncertain');setFailure(errorMessage(error));}});return()=>controller.abort();},[id,request]);
  useEffect(()=>{if(mode!=='pending'||closed)return;const controller=new AbortController();let reading=false;const timer=setInterval(async()=>{if(busy.current||reading)return;reading=true;try{const value=await getCommitment(request,id,controller.signal);if(!controller.signal.aborted){apply(value);setFailure('');}}catch(error){if(!controller.signal.aborted){setMode('uncertain');setFailure(errorMessage(error));}}finally{reading=false;}},5000);return()=>{controller.abort();clearInterval(timer);};},[id,request,mode,closed]);
  async function refresh(){if(busy.current)return;busy.current=true;setMode('loading');setFailure('');try{const value=await getCommitment(request,id);if(alive.current)apply(value);}catch(error){if(alive.current){setMode('uncertain');setFailure(errorMessage(error));}}finally{busy.current=false;}}
  async function start(){
    if(busy.current||closed||['loading','pending','success','uncertain','submitting'].includes(mode))return;
    busy.current=true;setMode('submitting');setFailure('');
    try{const value=await request(bidPath(id)+'/commitment',{method:'POST'});if(!validCommitment(value))throw new ApiError('INVALID_RESPONSE');if(alive.current)apply(value);}
    catch(error){if(alive.current){setRecord(null);setFailure(errorMessage(error));setMode(error.code==='BANK_SANDBOX_UNAVAILABLE'?'unavailable':['TIMEOUT','NETWORK_ERROR','INVALID_RESPONSE'].includes(error.code)||error.status>=500?'uncertain':'failed');}}
    finally{busy.current=false;}
  }
  const back=<a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a>;
  if(['success','failed','unavailable','uncertain'].includes(mode)){
    const heading={success:'اكتمل تأكيد المشاركة',failed:'لم يكتمل تأكيد المشاركة',unavailable:'التأكيد غير متاح حاليًا',uncertain:'تعذر التحقق من حالة المشاركة'}[mode];
    const node={success:'422:343',failed:'422:389',unavailable:'422:435',uncertain:'422:389'}[mode];
    return <BidderOutcome node={node} title={heading} itemTitle={auction.title} kind={mode} actions={<>{mode==='success'&&!closed?<a className="button primary" href={'#bid/'+id}>متابعة إلى المزايدة</a>:mode==='uncertain'?<button className="button primary" onClick={refresh}>تحديث حالة المشاركة</button>:!closed&&<button className="button primary" onClick={start}>إعادة المحاولة</button>}{back}</>}><p>{mode==='success'?'أعاد الخادم حالة مشاركة مكتملة لهذا المزاد. يتحقق الخادم مجددًا من الأهلية والسعر والوقت عند إرسال أي مزايدة.':mode==='uncertain'?'لم يصل تأكيد موثوق للنتيجة. حدّث الحالة قبل بدء محاولة جديدة؛ لن نرسل تأكيد المشاركة تلقائيًا.':'لم تُسجل أهلية جديدة من هذه المحاولة، ولم نرسل مزايدة.'}</p>{failure&&<p className="feedback error" role="alert">{failure}</p>}{closed&&<p className="field-hint">انتهى موعد المزاد؛ اكتمال المشاركة لا يسمح بمزايدة متأخرة.</p>}</BidderOutcome>;
  }
  return <Page title="تأكيد المشاركة" trail="المزادات / تأكيد المشاركة" node="422:289"><p className="section-description">أكمل هذه الخطوة قبل أن تتمكن من إضافة مزايدة.</p><div className="bid-layout commitment-layout"><section className="workspace-panel"><h2>{auction.title}</h2><div className="detail-price"><span>السعر الحالي</span><strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong></div><p>حالة تأكيد المشاركة</p><p className="bidder-status-box" role={['loading','submitting','pending'].includes(mode)?'status':undefined}>{mode==='loading'?'جارٍ التحقق من حالة المشاركة…':mode==='submitting'?'جارٍ إرسال طلب تأكيد المشاركة…':record?.status==='PENDING'?'تأكيد المشاركة قيد المعالجة':'لم يبدأ التأكيد بعد'}</p><p className="field-hint">تأكيد المشاركة مطلوب قبل المزايدة. لا يُطلب منك دفع مبلغ هنا.</p>{closed&&<p role="status">انتهى موعد المزاد؛ لا يمكن بدء مشاركة جديدة.</p>}<div className="workspace-actions"><button className="button primary" disabled={closed||['loading','pending','submitting'].includes(mode)} onClick={start}>{mode==='pending'?'بانتظار نتيجة المشاركة':'ابدأ تأكيد المشاركة'}</button><button className="button secondary" disabled={mode==='submitting'||mode==='loading'} onClick={refresh}>تحديث حالة المشاركة</button>{back}</div></section><ProductImage auction={auction}/></div></Page>;
}

export function BidForm({id,onAccepted}){return <Frame><SignedIn><BidAuction id={id} onAccepted={onAccepted}/></SignedIn></Frame>;}
function BidAuction({id,onAccepted}){
  const auction=useAuction(id);
  if(!auction.data||auction.failure)return <AuctionFeedback data={auction} title="إضافة مزايدة"/>;
  return <BidEntry id={id} auction={auction.data} refreshAuction={auction.reload} onAccepted={onAccepted}/>;
}
const definitiveRejections=new Set(['INVALID_INPUT','OWNER','NO_ACCESS','COMMITMENT_REQUIRED','BID_TOO_LOW','AUCTION_NOT_ACTIVE']);
function BidEntry({id,auction,refreshAuction,onAccepted}){
  const {session}=useAuth(),now=useNow();
  const owner=auction.seller_id===session.user.id;
  return owner?<Page title="إضافة مزايدة"><p role="alert">لا يمكنك المزايدة على مزاد تملكه.</p><a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a></Page>:<EligibleBid key={id+session.user.id} id={id} auction={auction} now={now} refreshAuction={refreshAuction} onAccepted={onAccepted}/>;
}
function EligibleBid({id,auction,now,refreshAuction,onAccepted}){
  const {request,session}=useAuth();
  const history=useData(bidPath(id)+'/bids',validHistory,5000);
  const eligibility=useData(bidPath(id)+'/commitment',validCommitment);
  const [intent,setIntent]=useState(()=>readIntent(session.user.id,id)),[value,setValue]=useState(()=>String(readIntent(session.user.id,id)?.amount||''));
  const [confirm,setConfirm]=useState(false),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[rejected,setRejected]=useState(false);
  const prepared=useRef(null),busy=useRef(false),alive=useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
  const minimum=minimumBid(auction,history.data),windowState=auctionWindow(auction,now);
  const usable=history.data&&minimum!==null&&eligibility.data?.status==='SUCCESS'&&windowState==='open'&&!history.failure&&!eligibility.failure;
  function prepare(event){
    event?.preventDefault();if(busy.current||!usable)return;
    setFailure('');
    if(intent?.state==='duplicate'||intent?.invalid)return;
    if(intent){prepared.current=intent;setConfirm(true);return;}
    const parsed=cents(value);
    if(parsed===null||Number(value)<minimum){setFailure('أدخل مبلغًا لا يقل عن '+amount(minimum)+' ر.س');return;}
    if(!prepared.current||cents(prepared.current.amount)!==parsed)prepared.current={auctionId:id,userId:session.user.id,requestId:crypto.randomUUID(),amount:parsed/100,state:'uncertain'};
    setConfirm(true);
  }
  function refresh(){refreshAuction();history.reload();eligibility.reload();}
  async function send(){
    if(busy.current||!prepared.current)return;
    if(!usable){setConfirm(false);setFailure('تغيّرت الأهلية أو حالة المزاد. حدّث البيانات قبل تأكيد مزايدة جديدة.');refresh();return;}
    const attempt=prepared.current;
    if(auctionWindow(auction)!=='open'||(!intent&&attempt.amount<minimum)){setConfirm(false);setFailure('تغيّر السعر أو انتهى وقت المزاد. راجع البيانات الحالية قبل التأكيد.');refresh();return;}
    if(!saveIntent(attempt)){setConfirm(false);setFailure('تعذر حفظ معرّف طلب المزايدة في هذه الجلسة. لم نرسل المزايدة؛ تحقق من إتاحة تخزين الجلسة قبل المحاولة.');return;}
    busy.current=true;setPending(true);setIntent(attempt);setFailure('');
    try{
      const accepted=await request(bidPath(id)+'/bids',{method:'POST',body:{amount:attempt.amount,requestId:attempt.requestId}});
      if(!uuid(accepted?.bidId)||cents(accepted.amount)!==cents(attempt.amount)||cents(accepted.currentPrice)!==cents(attempt.amount))throw new ApiError('INVALID_RESPONSE');
      if(!alive.current)return;
      clearIntent(session.user.id,id);setIntent(null);
      onAccepted?.({auctionId:id,bidId:accepted.bidId,amount:attempt.amount,userId:session.user.id});navigate('bid-success/'+id);
    }catch(error){
      if(!alive.current)return;
      setFailure(errorMessage(error));
      if(definitiveRejections.has(error.code)&&[400,403,409].includes(error.status)){
        clearIntent(session.user.id,id);setIntent(null);prepared.current=null;setRejected(true);refresh();
      }else{
        const saved={...attempt,state:error.code==='DUPLICATE_REQUEST'?'duplicate':'uncertain'};
        saveIntent(saved);setIntent(saved);history.reload();refreshAuction();
      }
    }finally{busy.current=false;if(alive.current){setPending(false);setConfirm(false);}}
  }
  if(rejected)return <BidderOutcome node="424:181" title="لم تُقبل المزايدة" itemTitle={auction.title} actions={<><button className="button primary" onClick={()=>{setRejected(false);refresh();}}>مراجعة السعر وإعادة المحاولة</button><a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a></>}><p>تحقق الخادم من الطلب ولم يقبله. راجع السبب والبيانات المحدثة قبل إرسال مبلغ جديد.</p><p className="feedback error" role="alert">{failure}</p></BidderOutcome>;
  return <Page title="إضافة مزايدة" trail="المزادات / إضافة مزايدة" node="7:105"><p className="section-description">راجع قيمة العرض قبل تأكيده.</p><Feedback {...history}/><Feedback {...eligibility}/><div className="bid-layout"><section className="workspace-panel"><h2>{auction.title}</h2><div className="detail-price"><span>السعر الحالي</span><strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong></div><p>الحد الأدنى للمزايدة: <bdi dir="ltr">{minimum===null?'—':amount(minimum)}</bdi> ر.س</p><p className="bidder-deadline">الحد الأدنى للزيادة: <bdi dir="ltr">{amount(auction.minimum_increment)}</bdi> ر.س. يحدد الخادم السعر والوقت المقبولين عند الإرسال.</p>{windowState!=='open'?<p role="status">{windowState==='scheduled'?'لم يبدأ موعد المزاد بعد.':'المزاد غير متاح للمزايدة في الوقت الحالي.'}</p>:eligibility.data?.status!=='SUCCESS'&&!eligibility.loading?<a className="button secondary" href={'#commitment/'+id}>تأكيد المشاركة أولًا</a>:null}{failure&&<p className="feedback error" role="alert">{failure}</p>}
    {intent&&<aside className="bidder-retry" aria-label="متابعة الطلب السابق"><p>{intent.invalid?'تعذر قراءة معرّف الطلب السابق. لا يمكن إرسال مزايدة جديدة بأمان من هذه الجلسة.':intent.state==='duplicate'?'سبق معالجة معرّف هذا الطلب. لا يتيح الرد الحالي ربطه بمزايدة شخصية مؤكدة؛ راجع السجل والنتيجة دون إرسال طلب جديد.':'لم يصل تأكيد موثوق للطلب السابق. المبلغ ومعرّف الطلب محفوظان؛ أي إعادة إرسال ستستخدم الطلب نفسه.'}</p>{!intent.invalid&&intent.state!=='duplicate'&&<button type="button" className="button primary" onClick={prepare} disabled={!usable||pending}>إعادة إرسال نفس المزايدة</button>}<button type="button" className="button secondary" onClick={refresh} disabled={pending}>تحديث السعر والسجل</button></aside>}
    <form onSubmit={prepare} noValidate><Field label="مبلغ مزايدتك (ر.س)" id="bid-amount"><input id="bid-amount" inputMode="decimal" dir="ltr" value={value} onChange={event=>setValue(event.target.value)} disabled={!usable||pending||!!intent} required aria-invalid={!!failure}/></Field>{!intent&&<button className="button primary" disabled={!usable||pending}>مراجعة المزايدة</button>}</form><p className="field-hint">إرسال المزايدة لا يعني فوزك. لا توجد مدفوعات أو تسوية في هذه الخطوة.</p><a className="button secondary" href={'#auction/'+id}>العودة إلى تفاصيل المزاد</a></section><ProductImage auction={auction}/></div>
    {confirm&&<Confirm variant="bidder" title="تأكيد المزايدة" pending={pending} onConfirm={send} onCancel={()=>setConfirm(false)}><p>{auction.title}</p><p className="bid-confirm-amount"><bdi dir="ltr">{amount(prepared.current.amount)}</bdi> ر.س</p><p>يُتحقق من السعر والأهلية وموعد المزاد عند الإرسال.</p>{intent&&<p className="field-hint">ستُعاد نفس المزايدة بمعرّفها السابق؛ لن ننشئ طلبًا جديدًا.</p>}</Confirm>}
  </Page>;
}

export function BidReceipt({id,receipt}){return <Frame><SignedIn><ReceiptState id={id} receipt={receipt}/></SignedIn></Frame>;}
function ReceiptState({id,receipt}){
  const {session}=useAuth(),auction=useAuction(id);
  if(!auction.data||auction.failure)return <AuctionFeedback data={auction} title="متابعة المزايدة"/>;
  return <BidderOutcome node="7:136" title={validReceipt(receipt,id,session.user.id)?'تم تسجيل المزايدة':'متابعة المزايدة'} itemTitle={auction.data.title} actions={<><a className="button primary" href={'#auction/'+id}>متابعة المزاد</a><a className="button secondary" href={'#result/'+id}>عرض نتيجة المزاد</a></>}><ReceiptCopy receipt={receipt} id={id} userId={session.user.id}/></BidderOutcome>;
}
export function Outbid({id,receipt}){return <Frame><SignedIn><OutbidState id={id} receipt={receipt}/></SignedIn></Frame>;}
function OutbidState({id,receipt}){
  const {session}=useAuth(),auction=useAuction(id);
  if(!auction.data||auction.failure)return <AuctionFeedback data={auction} title="متابعة المزايدة"/>;
  return <OutbidHistory id={id} receipt={receipt} auction={auction.data} userId={session.user.id}/>;
}
function OutbidHistory({id,receipt,auction,userId}){
  const history=useData(bidPath(id)+'/bids',validHistory,5000),now=useNow();
  if(history.failure)return <Page title="متابعة المزايدة"><Feedback {...history}/></Page>;
  if(auctionWindow(auction,now)!=='open')return <BidPosition receipt={receipt} auction={auction} userId={userId} history={history.data} standalone/>;
  if(!history.data)return <Page title="متابعة المزايدة"><Feedback {...history}/></Page>;
  if(higherAcceptedBid(receipt,auction,userId,history.data))return <BidPosition receipt={receipt} auction={auction} userId={userId} history={history.data} standalone/>;
  return <BidderOutcome node="7:211" title="متابعة حالة المزايدة" itemTitle={auction.title} actions={<a className="button primary" href={'#auction/'+id}>العودة إلى المزاد</a>}><p>لا تتوفر بيانات موثوقة تثبت تجاوز مزايدتك في الجلسة الحالية. راجع السعر والسجل دون افتراض حالة شخصية.</p></BidderOutcome>;
}
export function AuctionResult({id,receipt}){
  const {session}=useAuth(),auction=useAuction(id);
  if(!auction.data||auction.failure)return <Frame><AuctionFeedback data={auction} title="نتيجة المزاد"/></Frame>;
  const a=auction.data,closed=a.status==='CLOSED',result=validResult(a.result),winner=result?a.result.winner_bid_id:undefined;
  const owner=a.seller_id===session?.user.id;
  if(owner)return <Frame><Page title="نتيجة مزادي" trail="مزاداتي / النتيجة" node="424:227"><div className="seller-outcome"><section className="seller-outcome-copy"><h2>{a.title}</h2><p className="status-pill">{!closed?'لم ينتهِ المزاد بعد':!result?'النتيجة غير متاحة':winner===null?'انتهى دون مزايدات':'انتهى المزاد بمزايدة فائزة'}</p>{closed&&result&&winner&&<p>أعلى مزايدة مقبولة: <bdi dir="ltr">{cents(a.result.winning_amount)!==null?amount(a.result.winning_amount):'غير متاح'}</bdi> ر.س</p>}{closed&&result&&<p>وقت الإغلاق: {new Date(a.result.closed_at).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory'})}</p>}<p className="field-hint">{closed&&result&&winner?'لا تتوفر بيانات المشتري هنا. نتيجة المزاد لا تعني إتمام دفع أو تسليم.':!closed?'تظهر النتيجة بعد تأكيد الخادم إغلاق المزاد.':!result?'لم يعد الخادم بنتيجة موثوقة. لا نفترض أن المزاد بلا مزايدات.':'لم تسجّل مزايدة فائزة في نتيجة هذا المزاد.'}</p><div className="workspace-actions"><a className="button primary" href="#activity">العودة إلى مزاداتي</a><a className="button secondary" href={'#auction/'+id}>عرض تفاصيل المزاد</a></div></section><ProductImage auction={a} onRefresh={auction.reload}/></div></Page></Frame>;
  const personal=closed&&result?personalResult(a,session?.user.id):null;
  const win=winner&&personal?.isWinner===true,notWinningBid=winner&&personal?.hasBid===true&&personal.isWinner===false;
  const heading=!closed?'المزاد لم ينتهِ بعد':!result?'نتيجة الإغلاق غير متاحة بعد':winner===null?'انتهى المزاد دون مزايدات':win?'فزت بالمزاد':notWinningBid?'لم تفز بالمزاد':'تم تحديد المزايدة الفائزة';
  const node=winner===null&&closed&&result?'425:59':notWinningBid?'424:135':'424:89';
  return <Frame><BidderOutcome node={node} title={heading} itemTitle={a.title} actions={<><a className="button primary" href="#activity">الانتقال إلى نشاطي</a><a className="button secondary" href={'#auction/'+id}>عرض تفاصيل المزاد</a><a className="button secondary" href="#auctions">استكشاف المزادات</a></>}>{closed&&result&&winner&&<p>المبلغ الفائز: <bdi dir="ltr">{cents(a.result.winning_amount)!==null?amount(a.result.winning_amount):'غير متاح'}</bdi> ر.س</p>}{win&&<p>أكد الخادم أن حسابك صاحب المزايدة الفائزة. نتيجة المزاد لا تعني إتمام دفع أو تسوية.</p>}{notWinningBid&&<p>أكد الخادم مشاركتك ووجود مزايدة فائزة لحساب آخر.</p>}{closed&&result&&winner&&!win&&!notWinningBid&&<p className="field-hint">{personal&&!personal.hasBid?'لم تسجّل مزايدة في هذا المزاد؛ لا نعرض خسارة لحساب لم يشارك.':'لا يمكن إثبات النتيجة الشخصية من البيانات المتاحة بعد إعادة التحميل. لا نستنتج هوية الفائز من السعر أو اسم السلعة.'}</p>}{closed&&!result&&<p>لم يعد الخادم بنتيجة إغلاق موثوقة. لا نستنتج من ذلك أن المزاد بلا مزايدات.</p>}{!closed&&<p>تظهر النتيجة النهائية بعد تأكيد الخادم إغلاق المزاد.</p>}</BidderOutcome></Frame>;
}
