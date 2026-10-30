import React,{useEffect,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
import ListingForm from './ListingForm';
import MyListings from './MyListings';
import MyActivity from './MyActivity';
import AdminReview from './AdminReview';
import PrivateAccess from './PrivateAccess';
const API=import.meta.env.VITE_API_URL||'http://localhost:3000';
function App(){
 const [page, setPage] = useState('auctions');
 const [category, setCategory] = useState('الكل');
 const [auctions,setAuctions]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',email:'',password:''}),[token,setToken]=useState(''),[message,setMessage]=useState('');
 const [user, setUser] = useState(null);
 const [accountBusy, setAccountBusy] = useState(false);
 const [auctionsLoading, setAuctionsLoading] = useState(true);
const [auctionsError, setAuctionsError] = useState('');
const [auctionId, setAuctionId] = useState(null);
const [detailsLoading, setDetailsLoading] = useState(false);
const [detailsError, setDetailsError] = useState('');
const [bidOpen, setBidOpen] = useState(false);
const [bidAmount, setBidAmount] = useState('');
const [bidCount, setBidCount] = useState(null);
const [bidPriceAtCount, setBidPriceAtCount] = useState(null);
const [bidRefreshing, setBidRefreshing] = useState(false);
const [bidBusy, setBidBusy] = useState(false);
const [bidConfirm, setBidConfirm] = useState(false);
const [bidMessage, setBidMessage] = useState('');
const [bidSucceeded, setBidSucceeded] = useState(false);
const bidSending = useRef(false);
const bidRequestId = useRef(null);
 async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
  const json=await r.json();if(!r.ok){const error=Error(json.error?.message||'Request failed');error.code=json.error?.code;error.status=r.status;throw error;}return json.data;
 }
 function bidError(error) {
  if (error instanceof TypeError) return 'تعذّر الاتصال بالخادم، حاول مرة أخرى';
  const messages = {
    BID_TOO_LOW: 'المبلغ أقل من الحد الأدنى للمزايدة. حدّث التفاصيل وحاول مرة أخرى.',
    DUPLICATE_REQUEST: 'سبق معالجة هذه المزايدة. حدّث التفاصيل قبل المحاولة مرة أخرى.',
    AUCTION_NOT_ACTIVE: 'المزاد غير نشط حاليًا.',
    COMMITMENT_REQUIRED: 'يلزم تأكيد المشاركة قبل تقديم المزايدة.',
    BANK_SANDBOX_UNAVAILABLE: 'خدمة البنك التجريبية غير متاحة حاليًا.',
    NO_ACCESS: 'يلزم رمز وصول صحيح للمزاد الخاص.',
    OWNER: 'لا يمكنك المزايدة على مزادك.'
  };
  if (error.code || error.status) console.error('Bid API error:', error.code, error.status);
  return messages[error.code] || 'تعذّر إكمال طلب المزايدة، حاول مرة أخرى';
 }
 async function load() {
  try {
    const data = await request('/auctions');
    if (!Array.isArray(data)) throw new Error('Invalid auctions response');
    setAuctions(data);
    setAuctionsError('');
  } catch (error) {
    setAuctionsError('تعذّر تحميل المزادات، تأكد من الاتصال');
  } finally {
    setAuctionsLoading(false);
  }
}
 useEffect(()=>{load();const id=setInterval(load,5000);return()=>clearInterval(id)},[]);
async function account(type) {
  if (accountBusy) return;
  if (type === 'login') {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setMessage('اكتب بريدًا إلكترونيًا صحيحًا');
      return;
    }
    if (!form.password) {
      setMessage('اكتب كلمة المرور');
      return;
    }
  }
  if (type === 'register') {
    if (!form.name.trim()) {
      setMessage('اكتب الاسم');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setMessage('اكتب بريدًا إلكترونيًا صحيحًا');
      return;
    }

    if (form.password.length < 8) {
      setMessage('كلمة المرور لازم تكون 8 أحرف على الأقل');
      return;
    }
  }
  setAccountBusy(true);
setMessage('جاري تنفيذ الطلب…');

  try {
    const data = await request('/auth/' + type, {
      method: 'POST',
      body: JSON.stringify(form)
    });

if (type === 'login') {
  if (!data.token) {
    throw new Error('تعذّر تسجيل الدخول، حاول مرة أخرى');
  }

  setToken(data.token);
  setUser(data.user);
  setSelected(null);
  setAuctionId(null);
  setPage('auctions');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
    setMessage(type === 'login' ? '' : 'تم إنشاء الحساب');
  } catch (error) {
    setMessage(error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاول مرة أخرى' : error.message);
    } finally {
    setAccountBusy(false);
  }
}
async function logout() {
  if (accountBusy) return;
  setAccountBusy(true);
  setMessage('جاري تسجيل الخروج…');
  try {
    await request('/auth/logout', { method: 'POST' });
    setToken('');
    setUser(null);
    setPage('login');
    setSelected(null);setAuctionId(null);
    setForm({ name: '', email: '', password: '' });
    setMessage('تم تسجيل الخروج');
  } catch (error) {
    setMessage('تعذّر تسجيل الخروج، حاول مرة أخرى');
  } finally {
    setAccountBusy(false);
  }
}
 function openAuction(id) {
    if (id === auctionId) return;
  setSelected(null);
  setDetailsError('');
  setDetailsLoading(true);
  setAuctionId(id);
  setBidOpen(false);
  setBidAmount('');
  setBidCount(null);
  setBidPriceAtCount(null);
  setBidRefreshing(false);
  setBidMessage('');
  setBidSucceeded(false);
  bidRequestId.current = null;
}

async function openBid() {
  if (!token) {
    setPage('login');
    setMessage('سجّل الدخول لإضافة مزايدة');
    return;
  }
  setBidOpen(true);
  setBidMessage('');
  setBidSucceeded(false);
  setBidCount(null);
  setBidRefreshing(false);
  const price = Number(selected.current_price);
  try {
    const bids = await request('/auctions/' + auctionId + '/bids');
    if (!Array.isArray(bids)) throw new Error('تعذّر التحقق من الحد الأدنى للمزايدة');
    setBidCount(bids.length);
    setBidPriceAtCount(price);
  } catch (error) {
    setBidMessage(bidError(error));
  }
}

useEffect(() => {
  if (!bidOpen || bidCount !== 0 || bidPriceAtCount === null || !selected || Number(selected.current_price) === bidPriceAtCount) return;
  let active = true;
  const price = Number(selected.current_price);
  setBidRefreshing(true);
  request('/auctions/' + auctionId + '/bids').then(bids => {
    if (!Array.isArray(bids)) throw new Error('Invalid bids response');
    if (active) { setBidCount(bids.length); setBidPriceAtCount(price); setBidRefreshing(false); setBidMessage(''); }
  }).catch(error => { if (active) { setBidCount(null); setBidRefreshing(false); setBidMessage(bidError(error)); } });
  return () => { active = false; };
}, [bidOpen, bidCount, bidPriceAtCount, selected?.current_price, auctionId, token]);

const minimumBid = selected && bidCount !== null && !bidRefreshing
  ? (bidCount > 0 ? Math.round((Number(selected.current_price) + Number(selected.minimum_increment)) * 100) / 100 : Number(selected.starting_price))
  : null;

function checkBid(event) {
  event.preventDefault();
  if (bidBusy || minimumBid === null || selected?.status !== 'ACTIVE') return;
  const amount = Number(bidAmount);
  if (!bidAmount.trim() || !Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(bidAmount) || amount < minimumBid) {
    setBidMessage('أدخل مبلغًا صحيحًا لا يقل عن ' + minimumBid.toLocaleString('en-US') + ' ر.س');
    return;
  }
  setBidMessage('');
  setBidConfirm(true);
}

async function sendBid() {
  if (bidSending.current || bidBusy || !bidConfirm || minimumBid === null || selected?.status !== 'ACTIVE') return;
  if (Number(bidAmount) < minimumBid) {
    setBidConfirm(false);
    setBidMessage('المبلغ أقل من الحد الأدنى للمزايدة. حدّث التفاصيل وحاول مرة أخرى.');
    return;
  }
  bidSending.current = true;
  setBidBusy(true);
  setBidConfirm(false);
  setBidMessage('جاري إرسال المزايدة…');
  try {
    if (!bidRequestId.current) bidRequestId.current = crypto.randomUUID();
    const result = await request('/auctions/' + auctionId + '/bids', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(bidAmount), requestId: bidRequestId.current })
    });
    if (!result?.bidId) throw new Error('لم يؤكد الخادم حفظ المزايدة');
    setBidSucceeded(true);
    bidRequestId.current = null;
    setBidMessage('تم تقديم مزايدتك بنجاح');
    setBidCount(count => count + 1);
    setSelected(current => current && current.id === auctionId ? { ...current, current_price: result.currentPrice } : current);
  } catch (error) {
    setBidMessage(bidError(error));
  } finally {
    bidSending.current = false;
    setBidBusy(false);
  }
}

useEffect(() => {
  if (page !== 'auctions' || !auctionId) return;

  let active = true;
  let timer;

  async function loadDetails() {
    try {
      const data = await request('/auctions/' + auctionId);
      if (!data || data.id !== auctionId) throw new Error('تعذّر تحميل التفاصيل، حاول لاحقًا');

      if (active) {
        setSelected(data);
        setDetailsError('');
      }
    } catch (error) {
      if (active) setDetailsError(error instanceof TypeError ? 'تعذّر تحميل التفاصيل، تأكد من الاتصال' : error.message);
    } finally {
      if (active) {
        setDetailsLoading(false);
        timer = setTimeout(loadDetails, 5000);
      }
    }
  }

  loadDetails();

  return () => {
    active = false;
    clearTimeout(timer);
  };
}, [page, auctionId, token]);
 const categories = ['الكل', ...new Set(auctions.map(a => a.category_name).filter(Boolean))];
 const activeCategory = categories.includes(category) ? category : 'الكل';
 const shownAuctions = auctions.filter(a => activeCategory === 'الكل' || a.category_name === activeCategory);

 return <main><header><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><nav aria-label="القائمة الرئيسية"><button onClick={() => { setPage('auctions'); setAuctionId(null); setSelected(null); }}>المزادات</button>{token ? <><button onClick={() => setPage('activity')}>حسابي</button><button onClick={() => setPage('new-listing')}>إعلان جديد</button><button onClick={() => setPage('my-listings')}>إعلاناتي</button><button onClick={() => setPage('private')}>مزاد خاص</button>{user?.role === 'ADMIN' && <button onClick={() => setPage('admin')}>مراجعة الإعلانات</button>}<button disabled={accountBusy} onClick={logout}>خروج</button></> : <button onClick={() => { setPage('login'); setMessage(''); }}>تسجيل الدخول</button>}</nav></header>{page === 'auctions' && <>{!auctionId && <div className="auction-browser"><section className="hero" id="auctions"><p className="breadcrumb">المزادات / جميع الأقسام</p><h2>المزادات</h2><p>تصفح المزادات</p></section>
 <div className="auction-filters" aria-label="أقسام المزادات">
   {categories.map(name => <button key={name} aria-pressed={activeCategory === name} onClick={() => setCategory(name)}>{name}</button>)}
 </div><section className="cards">
  {auctionsLoading ? (
    <p role="status">جاري تحميل المزادات…</p>
  ) : auctionsError ? (
    <p role="alert">{auctionsError}</p>
  ) : shownAuctions.length === 0 ? (
    <p>لا توجد مزادات عامة متاحة حاليًا.</p>
  ) : (
    shownAuctions.map((a, index) => {
      const image = a.image_url || (typeof a.images?.[0] === 'string' ? a.images[0] : a.images?.[0]?.image_url);
      return (
      <article key={a.id}>
        {image ? (
          <img
            src={new URL(image, API).href}
            alt={a.title}

          />
        ) : (
          <p className="no-image">لا توجد صورة</p>
        )}
        <div className="card-title"><h3>{a.title}</h3><span>{String(index + 1).padStart(2, '0')}</span></div>
        <p className="card-price"><span>السعر الحالي</span><strong>{Number(a.current_price).toLocaleString('en-US')} ر.س</strong></p>
        <p className="auction-status">
          الحالة: {{
            SCHEDULED: 'قادم',
            ACTIVE: 'نشط',
            CLOSED: 'منتهي'
          }[a.status] || a.status}
        </p>
        <button onClick={() => openAuction(a.id)}>
          عرض المزاد
        </button>
      </article>
      );
    })
  )}
</section></div>}{auctionId && (
  <section className={bidOpen ? 'details-page bid-page' : 'details-page'}>
    {!bidOpen && <button onClick={() => {
      setAuctionId(null);
      setSelected(null);
    }}>
      العودة إلى المزادات
    </button>}

    {detailsLoading ? (
      <p role="status">جاري تحميل التفاصيل…</p>
    ) : detailsError ? (
      <p role="alert">{detailsError}</p>
    ) : selected && selected.id === auctionId ? (
      <>
        {bidOpen ? <>
          <div className="bid-summary">
            <p className="breadcrumb">المزادات / تفاصيل المزاد / إضافة مزايدة</p>
            <h2>أضف مزايدتك</h2>
            <p className="bid-intro">راجع قيمة مزايدتك قبل التأكيد.</p>
            <h3>{selected.title}</h3>
            <p className="bid-current"><span>أعلى مزايدة حاليًا</span><strong>{Number(selected.current_price).toLocaleString('en-US')} ر.س</strong></p>
            <form onSubmit={checkBid}>
              <label htmlFor="bid-amount">قيمة مزايدتك (ر.س)</label>
              <input id="bid-amount" type="number" inputMode="decimal" min={minimumBid ?? undefined} step="0.01" placeholder="أدخل مبلغًا أعلى من أعلى مزايدة" value={bidAmount} onChange={event => { setBidAmount(event.target.value); setBidMessage(''); setBidSucceeded(false); }} disabled={bidBusy || minimumBid === null || selected.status !== 'ACTIVE'} />
              <p className="bid-help">إضافة المزايدة تعني إرسال عرضك على هذا المعروض. البيع لا يكتمل بمجرد انتهاء المزاد.</p>
              {minimumBid === null && <p role="status">جاري التحقق من الحد الأدنى للمزايدة…</p>}
              {selected.status !== 'ACTIVE' && <p role="status">المزاد غير نشط حاليًا.</p>}
              {bidMessage && <p role={bidSucceeded ? 'status' : 'alert'}>{bidMessage}</p>}
              <button className="primary" type="submit" disabled={bidBusy || minimumBid === null || selected.status !== 'ACTIVE'}>{bidBusy ? 'جاري إرسال المزايدة…' : 'تأكيد المزايدة'}</button>
            </form>
            <button className="bid-back" type="button" onClick={() => { setBidOpen(false); setBidConfirm(false); }}>العودة إلى تفاصيل المزاد</button>
          </div>
          <div className="bid-image">{selected.images?.[0] ? <img src={new URL(typeof selected.images[0] === 'string' ? selected.images[0] : selected.images[0].image_url, API).href} alt={selected.title} /> : <p>لا توجد صورة</p>}</div>
          {bidConfirm && <div className="bid-overlay" role="presentation"><div className="bid-dialog" role="dialog" aria-modal="true" aria-labelledby="bid-confirm-title"><h3 id="bid-confirm-title">تأكيد المزايدة</h3><p>قيمة المزايدة: {Number(bidAmount).toLocaleString('en-US')} ر.س</p><div><button type="button" onClick={() => setBidConfirm(false)}>إلغاء</button><button className="primary" type="button" onClick={sendBid} disabled={bidBusy || minimumBid === null}>تأكيد المزايدة</button></div></div></div>}
        </> : <>
        <div className="details-summary"><h2>{selected.title}</h2><p className="details-price"><span>السعر الحالي</span><strong>{Number(selected.current_price).toLocaleString('en-US')} ر.س</strong></p><p>بداية المزاد: {new Date(selected.start_time).toLocaleString('ar-SA')}</p><p>نهاية المزاد: {new Date(selected.end_time).toLocaleString('ar-SA')}</p></div><div className="details-images">

        {selected.images?.length ? (
          selected.images.map(image => (
            <img
              key={typeof image === 'string' ? image : image.id}
              src={new URL(typeof image === 'string' ? image : image.image_url, API).href}
              alt={selected.title}

            />
          ))
        ) : (
          <p>لا توجد صور</p>
        )}

        </div><section className="details-description"><h3>عن هذا المعروض</h3><p>{selected.description || 'الوصف غير متاح'}</p></section>
        {selected.status === 'ACTIVE' && <button className="open-bid" type="button" onClick={openBid}>أضف مزايدتك</button>}
        </>}
      </>
    ) : null}
  </section>
)}</>}{token && page === 'activity' && <MyActivity api={API} token={token} user={user} onOpenAuction={id => { setPage('auctions'); openAuction(id); }} onMyListings={() => setPage('my-listings')} />}{token && page === 'new-listing' && <ListingForm key={token} api={API} token={token} />}{token && page === 'my-listings' && <MyListings key={token + '-items'} api={API} token={token} />}{token && page === 'private' && <PrivateAccess api={API} token={token} onBack={() => setPage('auctions')} onOpen={id => { setPage('auctions'); openAuction(id); }} />}{token && user?.role === 'ADMIN' && page === 'admin' && <AdminReview key={token + '-admin'} api={API} token={token} />}{(page === 'login' || page === 'register') && <section className={'account-screen ' + page} id="account"><div className="account-form"><p className="eyebrow">{page === 'register' ? 'حساب جديد' : 'حساب مزياد'}</p><h1>{page === 'register' ? 'أنشئ حسابك' : 'مرحبًا بعودتك'}</h1><p className="account-intro">{page === 'register' ? 'أنشئ حسابًا للمتابعة والمشاركة في المزادات.' : 'سجّل دخولك لمتابعة مزايداتك ومزاداتك.'}</p><form onSubmit={event => { event.preventDefault(); account(page); }}><fieldset disabled={accountBusy}>{page === 'register' && <label>الاسم الكامل<input placeholder="اكتب اسمك الكامل" autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>البريد الإلكتروني<input placeholder="أدخل بريدك الإلكتروني" type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>كلمة المرور<input placeholder={page === 'register' ? 'أنشئ كلمة مرور' : 'أدخل كلمة المرور'} type="password" autoComplete={page === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="primary" type="submit">{accountBusy ? 'جاري تنفيذ الطلب…' : page === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>{page === 'login' && <p className="account-signup-prompt">ليس لديك حساب؟</p>}<button type="button" onClick={() => { setPage(page === 'register' ? 'login' : 'register'); setMessage(''); }}>{page === 'register' ? 'لدي حساب بالفعل' : 'إنشاء حساب'}</button></fieldset></form><p role="status">{message}</p></div></section>}{page !== 'login' && page !== 'register' && <p role="status">{message}</p>}<footer><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><p>مزادات مختارة لمعروضات عالية القيمة</p><div><span>© 2026 مزياد. جميع الحقوق محفوظة.</span><span>المملكة العربية السعودية</span></div></footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
