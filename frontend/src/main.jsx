import React,{useEffect,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
import ListingForm from './ListingForm';
import MyListings from './MyListings';
import MyActivity from './MyActivity';
import AdminReview from './AdminReview';
import PrivateAccess from './PrivateAccess';
const API=import.meta.env.VITE_API_URL||'http://localhost:3000';
const AUTH_KEY = 'mezyad-session';
// هنا نقرا جلسه الدخول المحفوظه في نفس تبويب المتصفح عشان المستخدم ما يطلع مع تحديث الصفحه
function savedAuth() {
 try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)) || {}; } catch { return {}; }
}
const initialAuth = savedAuth();
// هنا نحدد الصفحه من الرابط والدور عشان الادمن يروح للمراجعه والمستخدم العادي ما يفتحها
function pageFromPath(token, user) {
 if (token && user?.role === 'ADMIN') return 'admin';
 if (location.pathname === '/activity') return token ? 'activity' : 'login';
 if (location.pathname === '/admin') return !token ? 'login' : user?.role === 'ADMIN' ? 'admin' : 'auctions';
 return 'auctions';
}
function App(){
 // هنا نخزن الصفحه والحساب والمزادات وحالات التحميل عشان كل جزء يعرض نتيجته الحاليه
 const [page, setPage] = useState(() => pageFromPath(initialAuth.token, initialAuth.user));
 const previousPage = useRef(page);
 const [activityTab, setActivityTab] = useState('مزايداتي');
 const auctionOrigin = useRef('auctions');
 const [category, setCategory] = useState('الكل');
 const [auctions,setAuctions]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',email:'',password:''}),[token,setToken]=useState(initialAuth.token || ''),[message,setMessage]=useState('');
 const [user, setUser] = useState(initialAuth.user || null);
 const [accountMenuOpen, setAccountMenuOpen] = useState(false);
 const accountMenuRef = useRef(null);
 const accountButtonRef = useRef(null);
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
 // هنا نقفل قائمه الحساب اذا ضغط المستخدم براها او ضغط Escape ونرجع التركيز للزر
 useEffect(() => {
  if (!accountMenuOpen) return;
  function closeOnOutside(event) {
   if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
  }
  function closeOnEscape(event) {
   if (event.key === 'Escape') {
    setAccountMenuOpen(false);
    accountButtonRef.current?.focus();
   }
  }
  document.addEventListener('pointerdown', closeOnOutside);
  document.addEventListener('keydown', closeOnEscape);
  return () => {
   document.removeEventListener('pointerdown', closeOnOutside);
   document.removeEventListener('keydown', closeOnEscape);
  };
 }, [accountMenuOpen]);
 useEffect(() => { setAccountMenuOpen(false); }, [page, token]);
 // هنا نمسح الجلسه المحليه اذا الخادم قال انها انتهت ونرجع المستخدم للدخول برساله واضحه
 function expiredSession() {
  sessionStorage.removeItem(AUTH_KEY);
  setToken('');
  setUser(null);
  setSelected(null);
  setAuctionId(null);
  if (location.pathname !== '/') history.replaceState(null, '', '/');
  setPage('login');
  setMessage('انتهت جلستك، سجّل الدخول مرة أخرى');
 }
 useEffect(() => {
  // هنا نتابع الرابط المباشر وزر الرجوع ونتاكد ان المستخدم العادي ما يدخل صفحه الادمن
  function syncPath() {
   const auth = savedAuth();
   if (location.pathname === '/admin' && auth.token && auth.user?.role !== 'ADMIN') {
    history.replaceState(null, '', '/');
    setMessage('ليس لديك صلاحية لمراجعة الإعلانات');
    setPage('auctions');
    return;
   }
   setPage(pageFromPath(auth.token, auth.user));
  }
  syncPath();
  addEventListener('popstate', syncPath);
  return () => removeEventListener('popstate', syncPath);
 }, []);
 useEffect(() => {
  // هنا نثبت الادمن على صفحه المراجعه حتى لو حاول يفتح صفحه مستخدم عادي
  if (token && user?.role === 'ADMIN' && page !== 'admin') setPage('admin');
 }, [token, user?.role, page]);
 useEffect(() => {
  // هنا نمسح خطا الدخول اذا ترك المستخدم صفحته عشان ما يبقى ظاهر بصفحه ثانيه
  if (previousPage.current === 'login' && page !== 'login') {
   setMessage(current => current === 'ليس لديك صلاحية لمراجعة الإعلانات' ? current : '');
  }
  previousPage.current = page;
 }, [page]);
 useEffect(() => {
  if (page === 'login' && (location.pathname === '/activity' || location.pathname === '/admin')) return;
  // هنا نخلي رابط المتصفح يمشي مع الصفحه المختاره عشان الفتح المباشر والتحديث يشتغلون
  const path = page === 'activity' ? '/activity' : page === 'admin' ? '/admin' : '/';
  if (location.pathname !== path) history.pushState(null, '', path);
 }, [page]);
 // هنا نرسل طلبات الواجهه للخادم ونضيف رمز الجلسه ونعالج 401 قبل عرض البيانات
 async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
  if (r.status === 401 && token && path !== '/auth/login' && path !== '/auth/register') expiredSession();
  const json=await r.json();if(!r.ok){const error=Error(json.error?.message||'Request failed');error.code=json.error?.code;error.status=r.status;throw error;}return json.data;
 }
 // هنا نحول رموز خطا المزايده المعروفه لرسائل عربيه بدون ما نظهر تفاصيل تقنيه للمستخدم
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
 // هنا نجيب المزادات العامه من الخادم ونحدثها كل خمس ثواني عشان السعر والحاله ما يعلقون
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
// هنا نفحص حقول التسجيل والدخول ثم نرسلها للخادم ونخزن الجلسه اذا نجح الدخول
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
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));
  setSelected(null);
  setAuctionId(null);
  // هنا نتاكد ان المستخدم العادي ما يكمل على رابط الادمن حتى بعد نجاح دخوله
  if (location.pathname === '/admin' && data.user?.role !== 'ADMIN') {
    history.replaceState(null, '', '/');
    setPage('auctions');
    setMessage('ليس لديك صلاحية لمراجعة الإعلانات');
    return;
  }
  setPage(pageFromPath(data.token, data.user));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
    if (type === 'register') {
      setPage('login');
      setMessage('تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن');
    } else {
      setMessage('');
    }
  } catch (error) {
    // هنا نترجم خطا بيانات الدخول المعروف ونخلي باقي اخطاء الخادم برسائلها المناسبه
    setMessage(type === 'login' && error.code === 'INVALID_CREDENTIALS'
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      : error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاول مرة أخرى' : error.message);
    } finally {
    setAccountBusy(false);
  }
}
// هنا نطلب الخروج من الخادم ونمسح جلسه المتصفح بعد نجاحه
async function logout() {
  if (accountBusy) return;
  setAccountBusy(true);
  setMessage('جاري تسجيل الخروج…');
  try {
    await request('/auth/logout', { method: 'POST' });
    sessionStorage.removeItem(AUTH_KEY);
    setToken('');
    setUser(null);
    if (location.pathname !== '/') history.replaceState(null, '', '/');
    setPage('login');
    setSelected(null);setAuctionId(null);
    setForm({ name: '', email: '', password: '' });
    setMessage('تم تسجيل الخروج');
  } catch (error) {
    if (error.status !== 401) setMessage('تعذّر تسجيل الخروج، حاول مرة أخرى');
  } finally {
    setAccountBusy(false);
  }
}
 // هنا نفتح مزاد جديد ونصفر مبلغ المزايده ورسائل المزاد السابق عشان ما تختلط البيانات
 function openAuction(id, origin = 'auctions') {
    if (id === auctionId) return;
  auctionOrigin.current = origin;
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

// هنا نطلب سجل المزايدات قبل حساب الحد الادنى واذا ما فيه جلسه نرجع للدخول
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

// هنا اذا تغير السعر من التحديث الموجود نعيد فحص اول مزايده بدل التخمين من السعر وحده
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

// هنا نحسب الحد الادنى من سعر البدايه اذا ما فيه مزايدات ومن السعر الحالي مع الزياده اذا فيه
const minimumBid = selected && bidCount !== null && !bidRefreshing
  ? (bidCount > 0 ? Math.round((Number(selected.current_price) + Number(selected.minimum_increment)) * 100) / 100 : Number(selected.starting_price))
  : null;

// هنا نفحص مبلغ المزايده في الواجهه ثم نفتح نافذه التاكيد قبل الارسال
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

// هنا نمنع الضغط المكرر ونرسل المبلغ مع نفس requestId لين يرد الخادم على الطلب
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
    // ليش نخزن المعرف هنا لان اعاده نفس الطلب لازم تحمل نفس المعرف لين نعرف نتيجته
    if (!bidRequestId.current) bidRequestId.current = crypto.randomUUID();
    const result = await request('/auctions/' + auctionId + '/bids', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(bidAmount), requestId: bidRequestId.current })
    });
    // هنا نتاكد ان الخادم رجع معرف المزايده قبل ما نظهر نجاح فعلي للمستخدم
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

  // هنا نحدث تفاصيل المزاد المفتوح كل خمس ثواني ونوقف الطلبات اذا تغير المزاد او الصفحه
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
 // هنا نخلي اسماء التصنيفات عربيه ونحتفظ بقيم الخادم عشان الفلتر يطابق بيانات المزادات
 const categories = [
  { label: 'الكل', value: null },
  { label: 'الإبل', value: 'Camels' },
  { label: 'العقارات', value: 'Real Estate' },
  { label: 'السيارات', value: 'Rare Vehicles' },
  { label: 'اللوحات', value: 'Vehicle Plates' },
 ];
 const activeCategory = categories.find(item => item.label === category) || categories[0];
 const shownAuctions = auctions.filter(a => !activeCategory.value || a.category_name === activeCategory.value);

 // هنا نعرض روابط الادمن لحاله وروابط المستخدم داخل قائمه الحساب ونحمي الصفحات حسب الجلسه

 return <main><header><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><nav aria-label="القائمة الرئيسية">{token && user?.role === 'ADMIN' ? <button disabled={accountBusy} onClick={logout}>تسجيل خروج</button> : <><button onClick={() => { setPage('auctions'); setAuctionId(null); setSelected(null); }}>المزادات</button>{token ? <div className="account-menu" ref={accountMenuRef}><button ref={accountButtonRef} className="account-menu-trigger" aria-expanded={accountMenuOpen} aria-haspopup="true" aria-controls="account-menu-options" onClick={() => setAccountMenuOpen(open => !open)}>الحساب <span className="account-menu-chevron" aria-hidden="true" /></button>{accountMenuOpen && <div id="account-menu-options" className="account-menu-options" dir="rtl"><button onClick={() => { setAccountMenuOpen(false); setPage('activity'); }}>حسابي</button><button onClick={() => { setAccountMenuOpen(false); setPage('new-listing'); }}>إعلان جديد</button><button onClick={() => { setAccountMenuOpen(false); setPage('my-listings'); }}>إعلاناتي</button><button onClick={() => { setAccountMenuOpen(false); setPage('private'); }}>مزاد خاص</button><button className="account-menu-logout" disabled={accountBusy} onClick={() => { setAccountMenuOpen(false); logout(); }}>تسجيل خروج</button></div>}</div> : <button onClick={() => { setPage('login'); setMessage(''); }}>تسجيل الدخول</button>}</>}</nav></header>{page === 'auctions' && <>{!auctionId && <div className="auction-browser"><section className="hero" id="auctions"><p className="breadcrumb">المزادات / جميع الأقسام</p><h2>المزادات</h2><p>تصفح المزادات</p></section>
 <div className="auction-filters" aria-label="أقسام المزادات">
   {categories.map(({ label }) => <button key={label} aria-pressed={activeCategory.label === label} onClick={() => setCategory(label)}>{label}</button>)}
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
      if (auctionOrigin.current === 'activity') setPage('activity');
      auctionOrigin.current = 'auctions';
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
              {minimumBid !== null && <p className="bid-minimum">الحد الأدنى للمزايدة: {minimumBid.toLocaleString('en-US')} ر.س</p>}
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
)}</>}{token && page === 'activity' && <MyActivity api={API} token={token} user={user} tab={activityTab} onTabChange={setActivityTab} onUnauthorized={expiredSession} onOpenAuction={id => { setPage('auctions'); openAuction(id, 'activity'); }} onMyListings={() => setPage('my-listings')} />}{token && page === 'new-listing' && <ListingForm key={token} api={API} token={token} onUnauthorized={expiredSession} />}{token && page === 'my-listings' && <MyListings key={token + '-items'} api={API} token={token} onUnauthorized={expiredSession} />}{token && page === 'private' && <PrivateAccess api={API} token={token} onUnauthorized={expiredSession} onBack={() => { setAuctionId(null); setSelected(null); setBidOpen(false); setBidConfirm(false); setBidAmount(''); setBidMessage(''); auctionOrigin.current = 'auctions'; setPage('auctions'); }} onOpen={id => { setPage('auctions'); openAuction(id); }} />}{token && user?.role === 'ADMIN' && page === 'admin' && <AdminReview key={token + '-admin'} api={API} token={token} onUnauthorized={expiredSession} />}{(page === 'login' || page === 'register') && <section className={'account-screen ' + page} id="account"><div className="account-form"><p className="eyebrow">{page === 'register' ? 'حساب جديد' : 'حساب مزياد'}</p><h1>{page === 'register' ? 'أنشئ حسابك' : 'مرحبًا بعودتك'}</h1><p className="account-intro">{page === 'register' ? 'أنشئ حسابًا للمتابعة والمشاركة في المزادات.' : 'سجّل دخولك لمتابعة مزايداتك ومزاداتك.'}</p><form noValidate onSubmit={event => { event.preventDefault(); account(page); }}><fieldset disabled={accountBusy}>{page === 'register' && <label>الاسم الكامل<input placeholder="اكتب اسمك الكامل" autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>البريد الإلكتروني<input placeholder="أدخل بريدك الإلكتروني" type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>كلمة المرور<input placeholder={page === 'register' ? 'أنشئ كلمة مرور' : 'أدخل كلمة المرور'} type="password" autoComplete={page === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="primary" type="submit">{accountBusy ? 'جاري تنفيذ الطلب…' : page === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>{page === 'login' && <p className="account-signup-prompt">ليس لديك حساب؟</p>}<button type="button" onClick={() => { setPage(page === 'register' ? 'login' : 'register'); setMessage(''); }}>{page === 'register' ? 'لدي حساب بالفعل' : 'إنشاء حساب'}</button></fieldset></form><p role="status">{message}</p></div></section>}{page !== 'login' && page !== 'register' && <p role="status">{message}</p>}<footer><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><p>مزادات مختارة لمعروضات عالية القيمة</p><div><span>© 2026 مزياد. جميع الحقوق محفوظة.</span><span>المملكة العربية السعودية</span></div></footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
