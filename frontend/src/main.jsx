import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
const API=import.meta.env.VITE_API_URL||'http://localhost:3000';
function App(){
 const [auctions,setAuctions]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',email:'',password:''}),[token,setToken]=useState(''),[message,setMessage]=useState('');
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
  setSelected(null);
  setAuctionId(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
    setMessage(
      type === 'login'
        ? 'تم تسجيل الدخول'
        : 'تم إنشاء الحساب'
    );
  } catch (error) {
    setMessage(error.message);
    } finally {
    setAccountBusy(false);
  }
}
async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
    setToken('');
    setSelected(null);setAuctionId(null);
    setForm({ name: '', email: '', password: '' });
    setMessage('تم تسجيل الخروج');
  } catch (error) {
    setMessage('تعذّر تسجيل الخروج، حاولي مرة ثانية');
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
      if (active) setDetailsError(error.message);
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
 return <main><header><h1>مِزياد</h1><p>منصة المزادات للأصول المميزة</p></header><section className="hero"><h2>مزادات مختارة</h2><p>تابعي المزادات العامة، مع تحديث البيانات من الخادم كل خمس ثوانٍ.</p></section><section className="cards">
  {auctionsLoading ? (
    <p role="status">جاري تحميل المزادات…</p>
  ) : auctionsError ? (
    <p role="alert">{auctionsError}</p>
  ) : auctions.length === 0 ? (
    <p>لا توجد مزادات عامة متاحة حاليًا.</p>
  ) : (
    auctions.map(a => (
      <article key={a.id}>
        {a.image_url ? (
          <img
            src={new URL(a.image_url, API).href}
            alt={a.title}
            style={{ width: '100%', height: 180, objectFit: 'cover' }}
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
</section>{auctionId && (
  <section className="panel">
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
        <h2>{selected.title}</h2>

        {selected.images?.length ? (
          selected.images.map(image => (
            <img
              key={image}
              src={new URL(image, API).href}
              alt={selected.title}
              style={{ width: '100%', maxWidth: 400 }}
            />
          ))
        ) : (
          <p>لا توجد صور</p>
        )}

        <p>{selected.description || 'الوصف غير متاح'}</p>
        <p>السعر الحالي: {selected.current_price} ريال</p>
        <p>
          بداية المزاد:
          {' '}{new Date(selected.start_time).toLocaleString('ar-SA')}
        </p>
        <p>
          نهاية المزاد:
          {' '}{new Date(selected.end_time).toLocaleString('ar-SA')}
        </p>
      </>
    ) : null}
  </section>
)}<section className="panel"><h2>حسابي</h2><input placeholder="الاسم" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="كلمة المرور" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><div className="actions"><button disabled={accountBusy} onClick={()=>account('register')}>تسجيل جديد</button><button disabled={accountBusy} onClick={()=>account('login')}>دخول</button>{token && (
  <button type="button" disabled={accountBusy} onClick={logout}>
    خروج
  </button>
)}</div><p role="status">{message}</p>{token&&<p>تم تسجيل الدخول في هذه الجلسة.</p>}</section><footer>Mezyad MVP — Stage 4 development</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
