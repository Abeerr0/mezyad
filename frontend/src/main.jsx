import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
const API=import.meta.env.VITE_API_URL||'http://localhost:3000';
function App(){
 const [auctions,setAuctions]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',email:'',password:''}),[token,setToken]=useState(''),[message,setMessage]=useState('');
 const [accountBusy, setAccountBusy] = useState(false);
 async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
  const json=await r.json();if(!r.ok)throw Error(json.error?.message||'Request failed');return json.data;
 }
 async function load(){try{setAuctions(await request('/auctions'))}catch(e){setMessage(e.message)}}
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
    setSelected(null);
    setForm({ name: '', email: '', password: '' });
    setMessage('تم تسجيل الخروج');
  } catch (error) {
    setMessage('تعذّر تسجيل الخروج، حاولي مرة ثانية');
  }
}
 async function openAuction(id){try{setSelected(await request('/auctions/'+id))}catch(e){setMessage(e.message)}}
 return <main><header><h1>مِزياد</h1><p>منصة المزادات للأصول المميزة</p></header><section className="hero"><h2>مزادات مختارة</h2><p>تابعي المزادات العامة، مع تحديث البيانات من الخادم كل خمس ثوانٍ.</p></section><section className="cards">{auctions.length?auctions.map(a=><article key={a.id}><h3>{a.title}</h3><p>السعر الحالي: {a.current_price}</p><p>الحالة: {a.status}</p><button onClick={()=>openAuction(a.id)}>تفاصيل المزاد</button></article>):<p>لا توجد مزادات عامة متاحة حاليًا.</p>}</section>{selected&&<section className="panel"><button onClick={()=>setSelected(null)}>إغلاق</button><h2>{selected.title}</h2><p>السعر: {selected.current_price}</p><p>نهاية المزاد: {new Date(selected.end_time).toLocaleString('ar-SA')}</p><p>المزايدة تتطلب حسابًا والتزامًا معتمدًا. الربط البنكي التجريبي غير مفعّل بعد.</p></section>}<section className="panel"><h2>حسابي</h2><input placeholder="الاسم" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="كلمة المرور" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><div className="actions"><button disabled={accountBusy} onClick={()=>account('register')}>تسجيل جديد</button><button disabled={accountBusy} onClick={()=>account('login')}>دخول</button>{token && (
  <button type="button" disabled={accountBusy} onClick={logout}>
    خروج
  </button>
)}</div><p role="status">{message}</p>{token&&<p>تم تسجيل الدخول في هذه الجلسة.</p>}</section><footer>Mezyad MVP — Stage 4 development</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
