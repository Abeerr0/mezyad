import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import {BidPosition} from '../marketplace/BidderPresentation.jsx';
import {formatAmount,useBidderAuction,validHistory,validResult,useNow,auctionWindow} from '../marketplace/bidderData.js';
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

export function Countdown({ endTime }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const deadline = Date.parse(endTime);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
  return <p className="countdown" role="timer" aria-live="off" dir="ltr">
    {!Number.isFinite(deadline) ? '—' : seconds === 0 ? 'انتهى المزاد' : time}
  </p>;
}
export function safeImage(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { if (new URL(value).protocol === 'https:') return value; } catch { /* Invalid URL. */ }
  return null;
}

export function AuctionCard({ auction, index = 0 }) {
  const image = safeImage(auction.image_url);
  const scheduled = auction.status === 'SCHEDULED';
  const hasStartingPrice = Number.isFinite(Number(auction.starting_price)) && Number(auction.starting_price) > 0;
  return <article className="auction-card">
    <a className="auction-image-link" href={'#auction/' + auction.id} aria-label={'عرض مزاد ' + auction.title}>
      {image ? <img src={image} alt={auction.title}/> : <div className="image-placeholder">لا تتوفر صورة</div>}
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
  const { request } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [failure, setFailure] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [category]);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const data = await request('/api/v1/auctions', { signal: controller.signal });
        if (!Array.isArray(data) || !data.every(validAuction)) throw new ApiError('INVALID_RESPONSE');
        if (!controller.signal.aborted) { setAuctions(data); setFailure(''); }
      } catch (error) {
        if (!controller.signal.aborted) setFailure(errorMessage(error));
      } finally {
        busy = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [request]);
  const selectedCategory = categories.find(value => value.key === category);
  const visible = auctions.filter(value => !selectedCategory || value.category_name === selectedCategory.name);
  const pageCount = Math.max(1, Math.ceil(visible.length / 6));
  useEffect(() => setPage(value => Math.min(value, pageCount)), [pageCount]);
  const currentPage = Math.min(page, pageCount);
  const displayed = home ? visible.filter(auction => auction.status === 'ACTIVE').slice(0, 3)
    : visible.slice((currentPage - 1) * 6, currentPage * 6);
  return <>
    {failure && <p className="feedback error" role="alert">{failure}</p>}
    <div className="auction-grid" aria-busy={loading}>
      {loading ? <p className="empty-state" role="status">جارٍ تحميل المزادات…</p>
        : displayed.length ? displayed.map((auction, index) => <AuctionCard key={auction.id} auction={auction} index={index + (home ? 0 : (currentPage - 1) * 6)}/>)
          : <p className="empty-state">لا توجد مزادات متاحة في هذا القسم حاليًا.</p>}
    </div>
    {!home && !loading && pageCount > 1 && <nav className="browse-pagination" aria-label="صفحات المزادات">
      <span>الصفحات</span>
      {Array.from({ length: pageCount }, (_, index) => <button key={index} type="button"
        aria-label={'الصفحة ' + (index + 1)} aria-current={currentPage === index + 1 ? 'page' : undefined}
        onClick={() => setPage(index + 1)}>{index + 1}</button>)}
    </nav>}
  </>;
}

export function AuctionDetails({ id, onRequireLogin,onParticipate,receipt }) {
  const {status,session}=useAuth(),data=useBidderAuction(id),now=useNow();
  const auction=data.data,failure=data.failure;
  const [imageIndex,setImageIndex]=useState(0);
  useEffect(()=>setImageIndex(0),[id]);
  const windowState=auctionWindow(auction,now),owner=auction?.seller_id===session?.user.id;
  function participation(){
    if(!auction||failure||owner||windowState!=='open')return;
    if(status!=='authenticated'){onRequireLogin();return;}
    if(onParticipate)onParticipate();else window.location.hash='commitment/'+id;
  }
  if (!auction) return <main className="content-shell detail-page">
    {failure ? <div className="feedback error" role="alert"><p>{failure}</p><button className="button secondary" onClick={data.reload}>إعادة المحاولة</button><a className="button secondary" href={'#private/'+id}>لدي رمز وصول</a></div> : <p role="status">جارٍ تحميل تفاصيل المزاد…</p>}
    <a className="button secondary" href="#auctions">العودة إلى المزادات</a>
  </main>;
  const images = (auction.images || []).map(safeImage).filter(Boolean);
  const selectedImage = images[imageIndex] || safeImage(auction.image_url);
  const thumbnails = images.slice(1);
  return <main className="content-shell detail-page" data-design-node={auction.status==='SCHEDULED'?'432:66':'2:140'}>
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
        <a className="button secondary" href="#auctions">العودة إلى المزادات</a>
      </section>
      <section className="detail-gallery" aria-label="صور المعروض">
        {selectedImage ? <img className="gallery-main" src={selectedImage} alt={auction.title}/> : <div className="gallery-main image-placeholder">لا تتوفر صورة</div>}
        <div className="gallery-thumbs">{Array.from({ length: Math.max(thumbnails.length, 3) }, (_, index) => thumbnails[index]
          ? <button type="button" key={index} aria-label={'عرض الصورة ' + (index + 2)} aria-pressed={imageIndex === index + 1} onClick={() => setImageIndex(index + 1)}><img src={thumbnails[index]} alt={auction.title + ' — الصورة ' + (index + 2)}/></button>
          : <div className="image-placeholder" key={index} aria-label="مكان صورة إضافية"/> )}</div>
        {imageIndex > 0 && <button className="text-action gallery-return" type="button" onClick={() => setImageIndex(0)}>الصورة الرئيسية</button>}
      </section>
    </div>
    {status==='authenticated'&&<BidHistory id={id} auction={auction} receipt={receipt} userId={session.user.id}/>}
    {auction.status==='CLOSED'&&<a className="button primary" href={'#result/'+id}>عرض نتيجة المزاد</a>}
    <section className="item-description"><h2>عن هذا المعروض</h2><p>{auction.description}</p></section>
    <section className="detail-insights" aria-label="متابعة المزاد">
      <div><h2>الوقت المتبقي</h2><Countdown endTime={auction.end_time}/><p>بحسب موعد نهاية المزاد.</p></div>
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
