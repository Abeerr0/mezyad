import React, { useEffect, useState } from 'react';
import ListingForm from './ListingForm';
import AuctionForm from './AuctionForm';

export default function MyListings({ api, token, onUnauthorized }) {
  // هنا نخزن اعلانات الحساب وحاله الطلب والاعلان المفتوح عشان ما نخلط العرض بالتعديل
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [auctionItemId, setAuctionItemId] = useState(null);

  // هنا نطلب اعلانات صاحب الجلسه فقط ونستخدم رمز دخوله عشان ما تظهر بيانات حساب ثاني
  useEffect(() => {
    let active = true;
    async function loadItems() {
      setLoading(true);
      setError('');
      try {
        const base = api.replace(/\/+$/, '');
        const response = await fetch(base + (base.endsWith('/api/v1') ? '/items' : '/api/v1/items'), {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (response.status === 401) onUnauthorized();
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'تعذّر تحميل إعلاناتك');
        if (!Array.isArray(result.data)) throw new Error('Invalid items response');
        // هنا نحط نتيجه الخادم في الصفحه اذا المستخدم ما غادرها اثناء التحميل
        if (active) setItems(result.data);
      } catch {
        if (active) setError('تعذّر تحميل إعلاناتك، حاول التحديث');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadItems();
    return () => { active = false; };
  }, [api, token, refresh]);

  // بعد حفظ تعديل الاعلان نحدثه في القائمه ونرجع لتفاصيله بدل ما نخليه بنسخته القديمه
  function saved(item) {
    setItems(items.map(oldItem => oldItem.id === item.id ? item : oldItem));
    setEditing(null);
    setSelectedId(item.id);
    setMessage('تمت إعادة إرسال الإعلان، بانتظار المراجعة');
  }

  // هنا نفصل صفحه انشاء المزاد ونموذج تعديل المرفوض عن عرض تفاصيل الاعلان
  const auctionItem = items.find(item => item.id === auctionItemId);
  if (auctionItem) return <AuctionForm api={api} token={token} item={auctionItem} startOpen onBack={() => setAuctionItemId(null)} onUnauthorized={onUnauthorized} />;
  if (editing) return <ListingForm key={editing.id} api={api} token={token} item={editing} onSaved={saved} onCancel={() => setEditing(null)} onUnauthorized={onUnauthorized} />;

  // هنا نعرض حاله كل اعلان وسبب الرفض ونخلي انشاء المزاد للاعلان المعتمد فقط
  return (
    <section className="panel own-listings">
      <p className="breadcrumb">حسابي / إعلاناتي</p>
      <h2>{selectedId ? 'تفاصيل الإعلان' : 'إعلاناتي'}</h2>
      {selectedId && <button onClick={() => setSelectedId(null)}>العودة إلى إعلاناتي</button>}
      {!selectedId && <button disabled={loading} onClick={() => setRefresh(refresh + 1)}>تحديث إعلاناتي</button>}
      {loading ? <p role="status">جاري تحميل إعلاناتك…</p> :
        error ? <p role="alert">{error}</p> :
        !items.length ? <p>ما عندك إعلانات حاليًا.</p> :
        items.filter(item => !selectedId || item.id === selectedId).map(item => (
          <article key={item.id}>
            {item.images?.[0] && <img className="listing-photo" src={new URL(typeof item.images[0] === 'string' ? item.images[0] : item.images[0].image_url, api).href} alt={item.title} />}
            <div className="listing-info">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="listing-status">الحالة: {{ PENDING_REVIEW: 'بانتظار المراجعة', APPROVED: 'معتمد', REJECTED: 'مرفوض' }[item.status] || item.status}</p>
            {item.status === 'REJECTED' && <p>سبب الرفض: {item.review_reason || 'لم يذكر سبب'}</p>}
            </div>
            {!selectedId && <button onClick={() => setSelectedId(item.id)}>عرض الإعلان</button>}
            {!selectedId && item.status === 'REJECTED' && <button onClick={() => { setEditing(item); setMessage(''); }}>تحديث إعلاني</button>}
            {selectedId && item.status === 'APPROVED' && <button onClick={() => setAuctionItemId(item.id)}>إنشاء مزاد</button>}
          </article>
        ))}
      <p role="status">{message}</p>
    </section>
  );
}
