import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [auctions, setAuctions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {})
      }
    });
    const json = await response.json();
    if (!response.ok) throw Error(json.error?.message || 'تعذر إكمال الطلب');
    return json.data;
  }

  async function load() {
    try {
      setAuctions(await request('/auctions'));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function account(type) {
    try {
      const data = await request('/auth/' + type, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (data.token) setToken(data.token);
      setMessage(type === 'login' ? 'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openAuction(id) {
    try {
      setSelected(await request('/auctions/' + id));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const statusLabels = {
    SCHEDULED: 'مجدول',
    LIVE: 'مباشر',
    ACTIVE: 'نشط',
    CLOSED: 'منتهٍ',
    PENDING_REVIEW: 'بانتظار المراجعة',
    APPROVED: 'معتمد',
    REJECTED: 'مرفوض'
  };

  return (
    <main>
      <header>
        <h1>مِزياد</h1>
        <p>منصة المزادات للأصول المميزة</p>
      </header>

      <section className="hero">
        <h2>المزادات المتاحة</h2>
        <p>تصفحي المزادات العامة مع تحديث البيانات تلقائيًا.</p>
      </section>

      <section className="cards">
        {auctions.length ? auctions.map(auction => (
          <article key={auction.id}>
            <h3>{auction.title}</h3>
            <p>السعر الحالي: {auction.current_price}</p>
            <p>الحالة: {statusLabels[auction.status] || auction.status}</p>
            <button onClick={() => openAuction(auction.id)}>تفاصيل المزاد</button>
          </article>
        )) : <p>لا توجد مزادات عامة متاحة حاليًا.</p>}
      </section>

      {selected && (
        <section className="panel">
          <button onClick={() => setSelected(null)}>إغلاق</button>
          <h2>{selected.title}</h2>
          <p>السعر الحالي: {selected.current_price}</p>
          <p>نهاية المزاد: {new Date(selected.end_time).toLocaleString('ar-SA')}</p>
          <p>تتطلب المزايدة حسابًا والتزامًا معتمدًا. الربط البنكي التجريبي غير مفعّل حاليًا.</p>
        </section>
      )}

      <section className="panel">
        <h2>حسابي</h2>
        <input
          placeholder="الاسم"
          value={form.name}
          onChange={event => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="البريد الإلكتروني"
          type="email"
          value={form.email}
          onChange={event => setForm({ ...form, email: event.target.value })}
        />
        <input
          placeholder="كلمة المرور"
          type="password"
          value={form.password}
          onChange={event => setForm({ ...form, password: event.target.value })}
        />
        <div className="actions">
          <button onClick={() => account('register')}>إنشاء حساب</button>
          <button onClick={() => account('login')}>تسجيل الدخول</button>
        </div>
        <p role="status">{message}</p>
        {token && <p>تم تسجيل الدخول في هذه الجلسة.</p>}
      </section>

      <footer>مِزياد | منصة المزادات</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);


