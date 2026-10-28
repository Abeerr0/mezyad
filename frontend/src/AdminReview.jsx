import React, { useEffect, useState } from 'react';

export default function AdminReview({ api, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadPending() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(api + '/items?status=PENDING_REVIEW', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'تعذّر تحميل الإعلانات');
        if (!Array.isArray(result.data)) throw new Error('تعذّر تحميل الإعلانات');
        if (active) {
          setItems(result.data);
          setSelectedId(id => id && !result.data.some(item => item.id === id) ? null : id);
        }
      } catch (error) {
        if (active) setError(error instanceof TypeError ? 'تعذّر الاتصال بالخادم' : error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPending();
    return () => { active = false; };
  }, [api, token, refresh]);

  async function review(item, decision, reason = '') {
    if (busy) return;
    if (decision === 'REJECTED' && !reason.trim()) {
      setMessage('اكتبي سبب الرفض');
      return;
    }
    setBusy(true);
    setMessage('جاري حفظ القرار…');
    try {
      const response = await fetch(api + '/admin/items/' + item.id + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ decision, reason: reason.trim() })
      });
      const result = await response.json();
      if (response.status === 409) {
        setSelectedId(null);
        setRefresh(refresh + 1);
        throw new Error('الإعلان تمت مراجعته أو تغيرت حالته؛ بنحدّث القائمة');
      }
      if (!response.ok) throw new Error(result.error?.message || 'تعذّر حفظ القرار');
      if (result.data?.id !== item.id || result.data.status !== decision) throw new Error('تعذّر تأكيد حفظ القرار');
      setItems(items.filter(oldItem => oldItem.id !== item.id));
      setSelectedId(null);
      setMessage(decision === 'APPROVED' ? 'تمت الموافقة على الإعلان' : 'تم رفض الإعلان');
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال، لم نتأكد من حفظ القرار؛ حدّثي القائمة قبل المحاولة' : error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel review-list">
      <h2>{selectedId ? 'مراجعة الإعلان' : 'الإعلانات قيد المراجعة'}</h2>
      {selectedId && <button disabled={busy} onClick={() => setSelectedId(null)}>العودة إلى الإعلانات</button>}
      <button disabled={loading || busy} onClick={() => setRefresh(refresh + 1)}>تحديث الإعلانات</button>
      {loading ? <p role="status">جاري تحميل الإعلانات المعلقة…</p> :
        error ? <p role="alert">{error}</p> :
        !items.length ? <p>لا توجد إعلانات بانتظار المراجعة.</p> :
        items.filter(item => !selectedId || item.id === selectedId).map(item => (
          <article key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {item.images?.length ? item.images.map(image => {
              const url = typeof image === 'string' ? image : image.image_url;
              return <img className="listing-photo" key={url} src={new URL(url, api).href} alt={item.title} />;
            }) : <p>لا توجد صور</p>}
            {!selectedId ? <button onClick={() => setSelectedId(item.id)}>مراجعة الإعلان</button> : <form onSubmit={event => { event.preventDefault(); review(item, 'REJECTED', event.currentTarget.elements.reason.value); }}>
              <fieldset disabled={busy}>
                <label>سبب الرفض<textarea name="reason" maxLength={2000} rows={2} /></label>
                <button type="button" onClick={() => review(item, 'APPROVED')}>موافقة</button>
                <button type="submit">رفض</button>
              </fieldset>
            </form>}
          </article>
        ))}
      <p role="status">{message}</p>
    </section>
  );
}
