import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
import ListingForm from './ListingForm';
import MyListings from './MyListings';
import AdminReview from './AdminReview';
import PrivateAccess from './PrivateAccess';
const API=import.meta.env.VITE_API_URL||'http://localhost:3000';
function App(){
 const [page, setPage] = useState('auctions');
 const [auctions,setAuctions]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',email:'',password:''}),[token,setToken]=useState(''),[message,setMessage]=useState('');
 const [user, setUser] = useState(null);
 const [accountBusy, setAccountBusy] = useState(false);
 const [auctionsLoading, setAuctionsLoading] = useState(true);
const [auctionsError, setAuctionsError] = useState('');
const [auctionId, setAuctionId] = useState(null);
const [detailsLoading, setDetailsLoading] = useState(false);
const [detailsError, setDetailsError] = useState('');
 async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
  const json=await r.json();if(!r.ok)throw Error(json.error?.message||'Request failed');return json.data;
 }
 async function load() {
  try {
    const data = await request('/auctions');
    setAuctions(data);
    setAuctionsError('');
  } catch (error) {
    setAuctionsError('تعذّر تحميل المزادات، تأكدي من الاتصال');
  } finally {
    setAuctionsLoading(false);
  }
}
 useEffect(()=>{load();const id=setInterval(load,5000);return()=>clearInterval(id)},[]);
async function account(type) {
  if (accountBusy) return;
  if (type === 'register') {
    if (!form.name.trim()) {
      setMessage('اكتبي الاسم');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setMessage('اكتبي بريدًا إلكترونيًا صحيحًا');
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
    throw new Error('تعذّر تسجيل الدخول، حاولي مرة ثانية');
  }

  setToken(data.token);
  setUser(data.user);
  setSelected(null);
  setAuctionId(null);
  setPage('auctions');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
    setMessage(
      type === 'login'
        ? 'تم تسجيل الدخول'
        : 'تم إنشاء الحساب'
    );
  } catch (error) {
    setMessage(error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاولي مرة ثانية' : error.message);
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
    setMessage('تعذّر تسجيل الخروج، حاولي مرة ثانية');
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
}

useEffect(() => {
  if (!auctionId) return;

  let active = true;
  let timer;

  async function loadDetails() {
    try {
      const data = await request('/auctions/' + auctionId);

      if (active) {
        setSelected(data);
        setDetailsError('');
      }
    } catch (error) {
      if (active) setDetailsError(error instanceof TypeError ? 'تعذّر تحميل التفاصيل، تأكدي من الاتصال' : error.message);
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
}, [auctionId, token]);
 return <main><header><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><nav aria-label="القائمة الرئيسية"><button onClick={() => { setPage('auctions'); setAuctionId(null); setSelected(null); }}>المزادات</button>{token ? <><button onClick={() => setPage('new-listing')}>إعلان جديد</button><button onClick={() => setPage('my-listings')}>إعلاناتي</button><button onClick={() => setPage('private')}>مزاد خاص</button>{user?.role === 'ADMIN' && <button onClick={() => setPage('admin')}>مراجعة الإعلانات</button>}<button disabled={accountBusy} onClick={logout}>خروج</button></> : <button onClick={() => { setPage('login'); setMessage(''); }}>تسجيل الدخول</button>}</nav></header>{page === 'auctions' && <>{!auctionId && <><section className="hero" id="auctions"><p className="breadcrumb">المزادات / جميع الأقسام</p><h2>المزادات</h2><p>تصفح المزادات</p></section><section className="cards">
  {auctionsLoading ? (
    <p role="status">جاري تحميل المزادات…</p>
  ) : auctionsError ? (
    <p role="alert">{auctionsError}</p>
  ) : auctions.length === 0 ? (
    <p>لا توجد مزادات عامة متاحة حاليًا.</p>
  ) : (
    auctions.map(a => (
      <article key={a.id}>
        {(a.image_url || a.images?.[0]?.image_url) ? (
          <img
            src={new URL(a.image_url || a.images[0].image_url, API).href}
            alt={a.title}

          />
        ) : (
          <p>لا توجد صورة</p>
        )}
        <h3>{a.title}</h3>
        <p>السعر الحالي: {a.current_price} ريال</p>
        <p>
          الحالة: {{
            SCHEDULED: 'قادم',
            ACTIVE: 'نشط',
            CLOSED: 'منتهي'
          }[a.status] || a.status}
        </p>
        <button onClick={() => openAuction(a.id)}>
          تفاصيل المزاد
        </button>
      </article>
    ))
  )}
</section></>}{auctionId && (
  <section className="details-page">
    <button onClick={() => {
      setAuctionId(null);
      setSelected(null);
    }}>
      إغلاق
    </button>

    {detailsLoading ? (
      <p role="status">جاري تحميل التفاصيل…</p>
    ) : detailsError ? (
      <p role="alert">{detailsError}</p>
    ) : selected && selected.id === auctionId ? (
      <>
        <div className="details-summary"><h2>{selected.title}</h2><p>السعر الحالي: {selected.current_price} ريال</p><p>بداية المزاد: {new Date(selected.start_time).toLocaleString('ar-SA')}</p><p>نهاية المزاد: {new Date(selected.end_time).toLocaleString('ar-SA')}</p></div><div className="details-images">

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
      </>
    ) : null}
  </section>
)}</>}{token && page === 'new-listing' && <ListingForm key={token} api={API} token={token} />}{token && page === 'my-listings' && <MyListings key={token + '-items'} api={API} token={token} />}{token && page === 'private' && <PrivateAccess api={API} token={token} onBack={() => setPage('auctions')} onOpen={id => { setPage('auctions'); openAuction(id); }} />}{token && user?.role === 'ADMIN' && page === 'admin' && <AdminReview key={token + '-admin'} api={API} token={token} />}{(page === 'login' || page === 'register') && <section className={'account-screen ' + page} id="account"><div className="account-form"><p className="eyebrow">{page === 'register' ? 'حساب جديد' : 'حساب مزياد'}</p><h1>{page === 'register' ? 'أنشئ حسابك' : 'مرحبًا بعودتك'}</h1><p className="account-intro">{page === 'register' ? 'أنشئ حسابًا للمتابعة والمشاركة في المزادات.' : 'سجّل دخولك لمتابعة مزايداتك ومزاداتك.'}</p><form onSubmit={event => { event.preventDefault(); account(page); }}><fieldset disabled={accountBusy}>{page === 'register' && <label>الاسم الكامل<input placeholder="اكتب اسمك الكامل" autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>البريد الإلكتروني<input placeholder="أدخل بريدك الإلكتروني" type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>كلمة المرور<input placeholder={page === 'register' ? 'أنشئ كلمة مرور' : 'أدخل كلمة المرور'} type="password" autoComplete={page === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="primary" type="submit">{accountBusy ? 'جاري تنفيذ الطلب…' : page === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button><button type="button" onClick={() => { setPage(page === 'register' ? 'login' : 'register'); setMessage(''); }}>{page === 'register' ? 'لدي حساب بالفعل' : 'إنشاء حساب'}</button></fieldset></form><p role="status">{message}</p></div></section>}{page !== 'login' && page !== 'register' && <p role="status">{message}</p>}<footer><img className="brand" src="/design/mezyad-logo.png" alt="مزياد" /><p>مزادات مختارة لمعروضات عالية القيمة</p><div><span>© 2026 مزياد. جميع الحقوق محفوظة.</span><span>المملكة العربية السعودية</span></div></footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
