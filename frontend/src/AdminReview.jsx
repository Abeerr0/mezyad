import React, { useEffect, useState } from 'react';

export default function AdminReview({ api, token, onUnauthorized }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [reviewFailure, setReviewFailure] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPending() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(api + '/items?status=PENDING_REVIEW', {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (response.status === 401) onUnauthorized();
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
      setMessage('اكتب سبب الرفض');
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
      if (response.status === 401) onUnauthorized();
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
      setDecision('');
      setReason('');
      setMessage(decision === 'APPROVED' ? 'تمت الموافقة على الإعلان' : 'تم رفض الإعلان');
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال، لم نتأكد من حفظ القرار؛ حدّث القائمة قبل المحاولة' : error.message);
      setDecision('');
      setReviewFailure(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel review-list">
      <p className="breadcrumb">حساب المشرف / {selectedId ? 'مراجعة الإعلان' : 'الإعلانات قيد المراجعة'}</p>
      <h2>{selectedId ? 'مراجعة الإعلان' : 'الإعلانات قيد المراجعة'}</h2>
      <p className="page-intro">{selectedId ? 'افحص المعلومات والصور المرفقة، ثم اتخذ قرارًا واضحًا بشأن الإعلان.' : 'افتح كل إعلان للتحقق من معلوماته وصوره قبل اتخاذ القرار.'}</p>
      {selectedId && <button disabled={busy} onClick={() => setSelectedId(null)}>العودة إلى الإعلانات</button>}
      <button disabled={loading || busy} onClick={() => setRefresh(refresh + 1)}>تحديث الإعلانات</button>
      {loading ? <p role="status">جاري تحميل الإعلانات المعلقة…</p> :
        error ? <p role="alert">{error}</p> :
        !items.length ? <p>لا توجد إعلانات بانتظار المراجعة.</p> :
        items.filter(item => !selectedId || item.id === selectedId).map(item => (
          <article key={item.id} className={selectedId ? 'review-detail' : 'review-card'}>
            <div className="listing-info">
            <h3>{item.title}</h3>
            <p className="listing-status">بانتظار المراجعة</p>
            <p>{item.description}</p>
            </div>
            <div className="review-images">{item.images?.length ? item.images.slice(0, selectedId ? undefined : 1).map(image => {
              const url = typeof image === 'string' ? image : image.image_url;
              return <img className="listing-photo" key={url} src={new URL(url, api).href} alt={item.title} />;
            }) : <p>لا توجد صور</p>}</div>
            {!selectedId ? <button onClick={() => setSelectedId(item.id)}>مراجعة الإعلان</button> : <div className="review-decisions"><button disabled={busy} onClick={() => setDecision('APPROVED')}>موافقة</button><button disabled={busy} onClick={() => setDecision('REJECTED')}>رفض</button></div>}
          </article>
        ))}
      <p role="status">{message}</p>
      {decision && selectedId && <div className="review-modal-backdrop"><div className={'review-modal ' + (decision === 'REJECTED' ? 'review-reject-modal' : '')} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        <h3 id="review-modal-title">{decision === 'REJECTED' ? 'رفض الإعلان' : 'تأكيد الموافقة على الإعلان'}</h3>
        <p>{items.find(item => item.id === selectedId)?.title}</p>
        {decision === 'APPROVED' && <><p>هل أنت متأكد من الموافقة على هذا الإعلان؟</p><p>سيصبح الإعلان معتمدًا، ويمكن للبائع إعداد المزاد. لن يُنشر المزاد تلقائيًا.</p></>}
        {decision === 'REJECTED' && <><label>سبب الرفض *<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={2000} rows={3} /></label><p>سيظهر السبب للبائع لمساعدته على تعديل الإعلان وإعادة تقديمه للمراجعة.</p></>}
        <p role="status">{message}</p>
        <div className="review-modal-actions"><button disabled={busy} onClick={() => { setDecision(''); setReason(''); setMessage(''); }}>إلغاء</button><button className="primary" disabled={busy} onClick={() => review(items.find(item => item.id === selectedId), decision, reason)}>{busy ? 'جاري الحفظ…' : decision === 'REJECTED' ? 'تأكيد الرفض' : 'تأكيد الموافقة'}</button></div>
      </div></div>}
      {reviewFailure && <div className="review-modal-backdrop"><div className="review-modal review-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="review-error-title">
        <h3 id="review-error-title">تعذر حفظ قرار المراجعة</h3>
        <p role="alert">{message}</p>
        <div className="review-modal-actions"><button onClick={() => setReviewFailure(false)}>إلغاء</button><button className="primary" onClick={() => { setReviewFailure(false); setRefresh(value => value + 1); }}>العودة والمحاولة مجددًا</button></div>
      </div></div>}
    </section>
  );
}
