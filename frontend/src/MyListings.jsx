import React, { useEffect, useState } from 'react';
import ListingForm from './ListingForm';
import AuctionForm from './AuctionForm';

export default function MyListings({ api, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [auctionItemId, setAuctionItemId] = useState(null);

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
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'تعذّر تحميل إعلاناتك');
        if (!Array.isArray(result.data)) throw new Error('Invalid items response');
        if (active) setItems(result.data);
      } catch {
        if (active) setError('تعذّر تحميل إعلاناتك، حاولي التحديث');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadItems();
    return () => { active = false; };
  }, [api, token, refresh]);

  function saved(item) {
    setItems(items.map(oldItem => oldItem.id === item.id ? item : oldItem));
    setEditing(null);
    setSelectedId(item.id);
    setMessage('تمت إعادة إرسال الإعلان، بانتظار المراجعة');
  }

  const auctionItem = items.find(item => item.id === auctionItemId);
  if (auctionItem) return <AuctionForm api={api} token={token} item={auctionItem} startOpen onBack={() => setAuctionItemId(null)} />;

  return (
    <section className="panel own-listings">
      <p className="breadcrumb">حسابي / إعلاناتي</p>
      <h2>{selectedId ? 'تفاصيل الإعلان' : 'إعلاناتي'}</h2>
      {selectedId && <button onClick={() => setSelectedId(null)}>العودة إلى إعلاناتي</button>}
      <button disabled={loading || Boolean(editing)} onClick={() => setRefresh(refresh + 1)}>تحديث إعلاناتي</button>
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
            {selectedId && item.status === 'REJECTED' && <>
              <button disabled={Boolean(editing)} onClick={() => { setEditing(item); setMessage(''); }}>تعديل وإعادة إرسال</button>
            </>}
            {selectedId && item.status === 'APPROVED' && <button onClick={() => setAuctionItemId(item.id)}>إنشاء مزاد</button>}
          </article>
        ))}
      {editing && <ListingForm key={editing.id} api={api} token={token} item={editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      <p role="status">{message}</p>
    </section>
  );
}
