import { useEffect, useState } from 'react';
import ListingForm from './ListingForm';

export default function MyListings({ api, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function loadItems() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(api + '/items', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'تعذّر تحميل إعلاناتك');
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
    setMessage('تمت إعادة إرسال الإعلان، بانتظار المراجعة');
  }

  return (
    <section className="panel">
      <h2>إعلاناتي</h2>
      <button disabled={loading || Boolean(editing)} onClick={() => setRefresh(refresh + 1)}>تحديث إعلاناتي</button>
      {loading ? <p role="status">جاري تحميل إعلاناتك…</p> :
        error ? <p role="alert">{error}</p> :
        !items.length ? <p>ما عندك إعلانات حاليًا.</p> :
        items.map(item => (
          <article key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p>الحالة: {{ PENDING_REVIEW: 'بانتظار المراجعة', APPROVED: 'معتمد', REJECTED: 'مرفوض' }[item.status] || item.status}</p>
            {item.status === 'REJECTED' && <>
              <p>سبب الرفض: {item.review_reason || 'لم يذكر سبب'}</p>
              <button disabled={Boolean(editing)} onClick={() => { setEditing(item); setMessage(''); }}>تعديل وإعادة إرسال</button>
            </>}
          </article>
        ))}
      {editing && <ListingForm key={editing.id} api={api} token={token} item={editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      <p role="status">{message}</p>
    </section>
  );
}
