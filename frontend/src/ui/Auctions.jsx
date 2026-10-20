import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import {BidPosition} from '../marketplace/BidderPresentation.jsx';
import {formatAmount,useBidderAuction,validHistory,validResult,useNow,auctionWindow} from '../marketplace/bidderData.js';
import {MediaGallery,ServerImage} from './MediaGallery.jsx';
import {safeImage} from './media.js';
export {safeImage} from './media.js';
import './shared.css';
import { errorMessage, ApiError } from '../api.js';

export const categories = [
  { key: 'camels', label: 'الإبل', name: 'Camels' },
  { key: 'property', label: 'العقارات', name: 'Real Estate' },
  { key: 'cars', label: 'السيارات النادرة', name: 'Rare Vehicles' },
  { key: 'plates', label: 'اللوحات المميزة', name: 'Vehicle Plates' },
];
export const amount = formatAmount;
export const statusLabel = status => ({ ACTIVE: 'جارٍ', SCHEDULED: 'قريبًا', CLOSED: 'منتهي' }[status] || '—');
const validAuction = value => value && typeof value.id === 'string'
  && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value.id)
  && typeof value.title === 'string' && !!value.title.trim()
  && Number(value.current_price) > 0 && Number.isFinite(Number(value.current_price))
  && ['ACTIVE', 'SCHEDULED', 'CLOSED'].includes(value.status);

export function Countdown({ endTime, startTime, status }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const scheduled=status==='SCHEDULED'&&Date.parse(startTime)>now;
  const deadline = Date.parse(scheduled?startTime:endTime);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
  return <p className="countdown" role="timer" aria-live="off" dir="ltr">
    {status==='CLOSED'?'انتهى المزاد':!Number.isFinite(deadline) ? '—' : seconds === 0 ? 'انتهى المزاد' : time}
  </p>;
}

export function AuctionCard({ auction, index = 0 }) {
  const image = safeImage(auction.image_url);
  const scheduled = auction.status === 'SCHEDULED';
  const hasStartingPrice = Number.isFinite(Number(auction.starting_price)) && Number(auction.starting_price) > 0;
  return <article className="auction-card">
    <a className="auction-image-link" href={'#auction/' + auction.id} aria-label={'عرض مزاد ' + auction.title}>
      <ServerImage src={image} alt={auction.title}/>
    </a>
    <div className="card-title"><h3>{auction.title}</h3><span dir="ltr">{String(index + 1).padStart(2, '0')}</span></div>
    <div className="price"><span>{scheduled ? 'حالة المزاد' : Number(auction.bid_count) > 0 ? 'أعلى مزايدة' : 'السعر الابتدائي'}</span>
      <strong>{scheduled ? 'قريبًا' : <><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</>}</strong></div>
    {scheduled && <p className="scheduled-price">{hasStartingPrice ? 'السعر الابتدائي' : 'السعر الحالي'}: <bdi dir="ltr">{amount(hasStartingPrice ? auction.starting_price : auction.current_price)}</bdi> ر.س</p>}
    <a className="button secondary" href={'#auction/' + auction.id}>
      {auction.status === 'SCHEDULED' ? 'اعرض تفاصيل المزاد' : 'عرض المزاد'}
    </a>
  </article>;
}

export function AuctionList({ category, home = false }) {
  const {request}=useAuth();
  const [auctions,setAuctions]=useState(null),[failure,setFailure]=useState(''),[loading,setLoading]=useState(true);
  const [page,setPage]=useState(1),[query,setQuery]=useState(''),[state,setState]=useState('ALL'),[revision,setRevision]=useState(0);
  useEffect(()=>setPage(1),[category,query,state]);
  useEffect(()=>{
    const controller=new AbortController();let busy=false;
    setLoading(true);
    async function load(){
      if(busy)return;busy=true;
      try{
        const data=await request('/api/v1/auctions',{signal:controller.signal});
        if(!Array.isArray(data)||!data.every(validAuction)||new Set(data.map(a=>a.id)).size!==data.length)throw new ApiError('INVALID_RESPONSE');
        if(!controller.signal.aborted){setAuctions(data);setFailure('');}
      }catch(error){if(!controller.signal.aborted)setFailure(errorMessage(error));}
      finally{busy=false;if(!controller.signal.aborted)setLoading(false);}
    }
    void load();const interval=setInterval(load,5000);
    return()=>{controller.abort();clearInterval(interval);};
  },[request,revision]);
  const selectedCategory=categories.find(value=>value.key===category);
  const search=query.trim().normalize('NFKC').toLocaleLowerCase('ar');
  const visible=(auctions||[]).filter(value=>(!selectedCategory||value.category_name===selectedCategory.name)
    &&(state==='ALL'||value.status===state)&&(!search||value.title.normalize('NFKC').toLocaleLowerCase('ar').includes(search)));
  const pageCount=Math.max(1,Math.ceil(visible.length/6));
  useEffect(()=>setPage(value=>Math.min(value,pageCount)),[pageCount]);
  const currentPage=Math.min(page,pageCount),displayed=home?visible.filter(a=>a.status==='ACTIVE').slice(0,3):visible.slice((currentPage-1)*6,currentPage*6);
  return <>
    {!home&&<><form className="browse-tools" role="search" aria-label="البحث في المزادات العامة" onSubmit={e=>e.preventDefault()}>
      <div className="search-field"><label htmlFor="auction-search">ابحث باسم المزاد</label><input id="auction-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="اسم المعروض"/></div>
      <div className="status-field"><label htmlFor="auction-state">حالة المزاد</label><select id="auction-state" value={state} onChange={e=>setState(e.target.value)}><option value="ALL">جميع الحالات</option><option value="SCHEDULED">مجدول</option><option value="ACTIVE">جارٍ</option><option value="CLOSED">منتهي</option></select></div>
      {(query||state!=='ALL')&&<button className="text-action" type="button" onClick={()=>{setQuery('');setState('ALL');}}>مسح البحث والتصفية</button>}
    </form><p className="browse-summary" role="status">{auctions?<>عدد النتائج: <bdi>{visible.length}</bdi>. البحث والتصفية ضمن المزادات العامة المحمّلة.</>:'جارٍ تحميل قائمة المزادات العامة…'}</p></>}
    {failure&&<div className="feedback error catalog-failure" role="alert"><p>{failure}</p>{auctions&&<p>تعذر تحديث القائمة. الأسعار والحالات المعروضة قديمة؛ افتح المزاد للتحقق من آخر تحديث.</p>}<div className="workspace-actions"><button type="button" className="button secondary" disabled={loading} onClick={()=>setRevision(n=>n+1)}>إعادة المحاولة</button></div></div>}
    <div className="auction-grid" aria-busy={loading}>
      {loading&&!auctions?<p className="empty-state" role="status">جارٍ تحميل المزادات…</p>:displayed.length?displayed.map((auction,index)=><AuctionCard key={auction.id} auction={auction} index={index+(home?0:(currentPage-1)*6)}/>):!failure&&<p className="empty-state">{query||state!=='ALL'?'لا توجد مزادات تطابق البحث والتصفية.':'لا توجد مزادات متاحة في هذا القسم حاليًا.'}</p>}
    </div>
    {!home&&!loading&&pageCount>1&&<nav className="browse-pagination" aria-label="صفحات المزادات"><span>الصفحات</span>{Array.from({length:pageCount},(_,index)=><button key={index} type="button" aria-label={'الصفحة '+(index+1)} aria-current={currentPage===index+1?'page':undefined} onClick={()=>setPage(index+1)}>{index+1}</button>)}</nav>}
  </>;
}

export function AuctionDetails({ id, onRequireLogin,onParticipate,receipt }) {
  const {status,session}=useAuth(),data=useBidderAuction(id),now=useNow();
  const auction=data.data,failure=data.failure;
  const windowState=auctionWindow(auction,now),owner=auction?.seller_id===session?.user.id;
  function participation(){
    if(!auction||failure||owner||windowState!=='open')return;
    if(status!=='authenticated'){onRequireLogin();return;}
    if(onParticipate)onParticipate();else window.location.hash='commitment/'+id;
  }
  if (!auction) return <main id="main-content" tabIndex={-1} className="content-shell detail-page">
    {failure ? <div className="feedback error" role="alert"><p>{failure}</p><button className="button secondary" onClick={data.reload}>إعادة المحاولة</button><a className="button secondary" href={'#private/'+id}>لدي رمز وصول</a></div> : <p role="status">جارٍ تحميل تفاصيل المزاد…</p>}
    <a className="button secondary" href="#auctions">العودة إلى المزادات</a>
  </main>;
  const images = (auction.images || []).map(safeImage).filter(Boolean);
  if(!images.length&&safeImage(auction.image_url))images.push(safeImage(auction.image_url));
  return <main id="main-content" tabIndex={-1} className="content-shell detail-page" data-design-node={auction.status==='SCHEDULED'?'432:66':'2:140'}>
    <p className="breadcrumb"><a href="#home">الرئيسية</a> / <a href="#auctions">المزادات</a> / {auction.title}</p>
    <div className="detail-grid">
      <section className="detail-summary">
        <p className="eyebrow">{categories.find(value => value.name === auction.category_name)?.label} / مزاد {statusLabel(auction.status)}</p>
        <h1>{auction.title}</h1>
        <div className="detail-price"><p>{auction.status==='SCHEDULED'?'السعر الابتدائي':'السعر الحالي'}</p><strong><bdi dir="ltr">{amount(auction.status==='SCHEDULED'?auction.starting_price:auction.current_price)}</bdi> ر.س</strong></div>
        <dl className="detail-status"><dt>حالة المزاد</dt><dd>{statusLabel(auction.status)}</dd><dt>نهاية المزاد</dt>
          <dd>{new Date(auction.end_time).toLocaleString('ar-SA-u-nu-latn', { calendar: 'gregory' })}</dd></dl>
        <p className="detail-description">راجع صور المعروض ووصفه قبل المشاركة في المزاد.</p>
        {failure && <p className="feedback error" role="alert">{failure}</p>}
        {windowState==='scheduled'&&<p className="scheduled-information">لم يبدأ موعد المزاد بعد. البداية: {new Date(auction.start_time).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory'})}.</p>}
        {auction.status==='SCHEDULED'&&windowState==='open'&&<p className="scheduled-information">حلّ موعد البداية، وحالة الخادم ما زالت مجدولة. يتحقق الخادم من قبول أول مزايدة عند إرسالها.</p>}
        {owner&&<p className="owner-information" role="status">هذا مزاد تملكه؛ لا يمكنك المشاركة فيه كمزايد.</p>}
        {windowState==='closed'&&auction.status!=='CLOSED'&&<p className="scheduled-information">انتهى موعد المزاد. ننتظر تأكيد الإغلاق والنتيجة من الخادم.</p>}
        <button className="button primary" type="button" disabled={owner||windowState!=='open'||!!failure} onClick={participation}>
          {owner?'لا يمكنك المزايدة على مزادك':windowState==='closed'?'انتهى المزاد':windowState==='scheduled'?'لم يبدأ المزاد بعد':'أضف مزايدتك'}
        </button>
        <a className="button secondary" href={owner?'#activity':'#auctions'}>{owner?'العودة إلى مزاداتي':'العودة إلى المزادات'}</a>
      </section>
      <MediaGallery images={images} title={auction.title}/>
    </div>
    {status==='authenticated'&&<BidHistory id={id} auction={auction} receipt={receipt} userId={session.user.id}/>}
    {auction.status==='CLOSED'&&<a className="button primary" href={'#result/'+id}>عرض نتيجة المزاد</a>}
    <div className="detail-bid-rules"><p>السعر الابتدائي: <bdi dir="ltr">{amount(auction.starting_price)}</bdi> ر.س</p><p>الحد الأدنى للزيادة: <bdi dir="ltr">{amount(auction.minimum_increment)}</bdi> ر.س</p><p>النوع: {auction.visibility==='PRIVATE'?'مزاد خاص':'مزاد عام'}</p></div>
    <section className="item-description"><h2>عن هذا المعروض</h2><p>{auction.description}</p></section>
    <section className="detail-insights" aria-label="متابعة المزاد">
      <div><h2>{windowState==='scheduled'?'يبدأ المزاد خلال':'الوقت المتبقي'}</h2><Countdown endTime={auction.end_time} startTime={auction.start_time} status={auction.status}/><p>{windowState==='scheduled'?'بحسب موعد بداية المزاد.':'بحسب موعد نهاية المزاد.'}</p></div>
      <div><h2>السعر الحالي</h2><strong><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</strong><p>السعر المعروض من بيانات المزاد.</p></div>
      <div><h2>ملخص النشاط</h2><strong>{statusLabel(auction.status)}</strong><p>يمكنك متابعة السعر وحالة المزاد هنا.</p></div>
    </section>
    {auction.status==='CLOSED' && <p className="feedback" role="status">{!validResult(auction.result)?'نتيجة الإغلاق غير متاحة بعد.':auction.result.winner_bid_id===null?'انتهى المزاد دون مزايدات.':'انتهى المزاد وتم تحديد المزايدة الفائزة.'}</p>}
  </main>;
}

function BidHistory({id,auction,receipt,userId}){
  const {request}=useAuth();const [data,setData]=useState(null),[failure,setFailure]=useState('');
  useEffect(()=>{const c=new AbortController();let busy=false;async function load(){if(busy)return;busy=true;try{const value=await request('/api/v1/auctions/'+id+'/bids',{signal:c.signal});if(!validHistory(value))throw new ApiError('INVALID_RESPONSE');if(!c.signal.aborted){setData(value);setFailure('');}}catch(error){if(!c.signal.aborted){setData(null);setFailure(errorMessage(error));}}finally{busy=false;}}load();const timer=setInterval(load,5000);return()=>{c.abort();clearInterval(timer);};},[id,request]);
  return <section className="activity-section">{!failure&&data&&<BidPosition receipt={receipt} auction={auction} userId={userId} history={data}/>}<h2>سجل المزايدات</h2>{failure&&<p className="feedback error" role="alert">{failure}</p>}{!data&&!failure&&<p role="status">جارٍ تحميل السجل…</p>}{data?.length===0&&<p className="empty-state">لم تسجّل مزايدات في هذا المزاد بعد.</p>}{!!data?.length&&<ol className="bid-history">{data.map(b=><li key={b.id}><bdi dir="ltr">{amount(b.amount)}</bdi> ر.س <time dateTime={b.created_at}>{new Date(b.created_at).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory'})}</time></li>)}</ol>}</section>;
}
