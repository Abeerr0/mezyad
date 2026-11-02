import React, { useEffect, useState } from 'react';

export default function AdminReview({ api, token, onUnauthorized }) {
  // هنا نخزن اعلانات المراجعه وحالات التحميل والقرار عشان الادمن يشوف وضع كل طلب بوضوح
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
  const [tab, setTab] = useState('dashboard');
  const [listingStatus, setListingStatus] = useState('PENDING_REVIEW');
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');

  // هنا نجيب بيانات البطاقات والتبويبات من الطلبات الحقيقيه عشان ما نعرض ارقام من عندنا
  useEffect(() => {
    let active = true;
    async function loadOverview() {
      setOverviewError('');
      try {
        const paths = ['/items?status=APPROVED', '/items?status=REJECTED', '/auctions?scope=all&status=ACTIVE'];
        const responses = await Promise.all(paths.map(path => fetch(api + path, {
          headers: { Authorization: 'Bearer ' + token }
        })));
        if (responses.some(response => response.status === 401)) onUnauthorized();
        const results = await Promise.all(responses.map(response => response.json()));
        if (responses.some(response => !response.ok) || results.some(result => !Array.isArray(result.data))) {
          throw new Error('تعذّر تحميل إحصاءات المشرف');
        }
        if (active) setOverview({ approved: results[0].data, rejected: results[1].data, auctions: results[2].data });
      } catch (error) {
        if (active) { setOverview(null); setOverviewError(error instanceof TypeError ? 'تعذّر الاتصال بالخادم' : error.message); }
      }
    }
    loadOverview();
    return () => { active = false; };
  }, [api, token, refresh]);

  // هنا نجيب الاعلانات اللي تنتظر قرار الادمن ونوقف التحديث اذا طلع من الصفحه
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

  // هنا نرسل موافقه او رفض للاعلان ونطلب سبب واضح اذا كان القرار رفض
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
      // اذا تغير الاعلان عند شخص ثاني نحدث القائمه بدل ما نعرض قرار قديم
      if (response.status === 409) {
        setSelectedId(null);
        setRefresh(refresh + 1);
        throw new Error('الإعلان تمت مراجعته أو تغيرت حالته؛ بنحدّث القائمة');
      }
      if (!response.ok) throw new Error(result.error?.message || 'تعذّر حفظ القرار');
      // هنا نتاكد ان الخادم رجع نفس الاعلان ونفس القرار قبل ما نظهر النجاح
      if (result.data?.id !== item.id || result.data.status !== decision) throw new Error('تعذّر تأكيد حفظ القرار');
      setItems(items.filter(oldItem => oldItem.id !== item.id));
      setSelectedId(null);
      setDecision('');
      setReason('');
      setMessage(decision === 'APPROVED' ? 'تمت الموافقة على الإعلان' : 'تم رفض الإعلان');
      setRefresh(value => value + 1);
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال، لم نتأكد من حفظ القرار؛ حدّث القائمة قبل المحاولة' : error.message);
      setDecision('');
      setReviewFailure(true);
    } finally {
      setBusy(false);
    }
  }

  const reviewedItems = listingStatus === 'APPROVED' ? overview?.approved : overview?.rejected;
  const listTitle = listingStatus === 'APPROVED' ? 'الإعلانات المعتمدة' : listingStatus === 'REJECTED' ? 'الإعلانات المرفوضة' : 'الإعلانات قيد المراجعة';

  // هنا التبويبات تغير العرض والبطاقات تعرض العدد الحقيقي ونوافذ القرار تمنع التاكيد بالغلط
  return (
    <section className="panel review-list">
      <div className="admin-tabs" role="tablist" aria-label="أقسام المشرف">
        {[['dashboard', 'لوحة التحكم'], ['pending', 'الإعلانات قيد المراجعة'], ['auctions', 'متابعة المزادات']].map(([key, label]) =>
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); setListingStatus('PENDING_REVIEW'); setSelectedId(null); }}>{label}</button>
        )}
      </div>
      <p className="breadcrumb">حساب المشرف / {selectedId ? 'مراجعة الإعلان' : tab === 'dashboard' ? 'لوحة التحكم' : tab === 'auctions' ? 'متابعة المزادات' : listTitle}</p>
      <h2>{selectedId ? 'مراجعة الإعلان' : tab === 'dashboard' ? 'لوحة تحكم المشرف' : tab === 'auctions' ? 'متابعة المزادات' : listTitle}</h2>
      <p className="page-intro">{selectedId ? 'افحص المعلومات والصور المرفقة، ثم اتخذ قرارًا واضحًا بشأن الإعلان.' : 'راجع الإعلانات واتخذ القرار، وتابع حالات المزادات ونتائجها.'}</p>
      {tab === 'dashboard' && <>
        {overviewError ? <p role="alert">{overviewError}</p> : loading || !overview ? <p role="status">جاري تحميل إحصاءات المشرف…</p> : error ? <p role="alert">{error}</p> :
          <div className="admin-stats">
            {[
              ['الإعلانات بانتظار المراجعة', items.length, 'pending', 'PENDING_REVIEW'],
              ['الإعلانات المعتمدة', overview.approved.length, 'pending', 'APPROVED'],
              ['الإعلانات المرفوضة', overview.rejected.length, 'pending', 'REJECTED'],
              ['المزادات الجارية', overview.auctions.length, 'auctions', 'PENDING_REVIEW']
            ].map(([label, count, nextTab, nextStatus]) =>
              <button key={label} onClick={() => { setTab(nextTab); setListingStatus(nextStatus); setSelectedId(null); }}><span>{label}</span><strong>{count}</strong></button>
            )}
          </div>}
        <h3>إعلانات بانتظار قرارك</h3>
      </>}
      {tab === 'auctions' ? (
        overviewError ? <p role="alert">{overviewError}</p> : !overview ? <p role="status">جاري تحميل المزادات…</p> :
        overview.auctions.length ? <div className="admin-auctions">{overview.auctions.map(auction =>
          <article key={auction.id}><h3>{auction.title}</h3><p>الحالة: جارٍ</p><p>السعر الحالي: {Number(auction.current_price).toLocaleString('en-US')} ر.س</p></article>
        )}</div> : <p>لا توجد مزادات جارية حاليًا.</p>
      ) : listingStatus !== 'PENDING_REVIEW' ? (
        overviewError ? <p role="alert">{overviewError}</p> : !overview ? <p role="status">جاري تحميل الإعلانات…</p> :
        reviewedItems.length ? reviewedItems.map(item => <article className="review-card admin-status-card" key={item.id}>
          <div className="review-images">{item.images?.[0] && <img className="listing-photo" src={new URL(typeof item.images[0] === 'string' ? item.images[0] : item.images[0].image_url, api).href} alt={item.title} />}</div>
          <div className="listing-info"><h3>{item.title}</h3><p>{item.description}</p><p className="listing-status">{listTitle}</p></div>
        </article>) : <p>لا توجد إعلانات في هذه الحالة.</p>
      ) : <>
        {selectedId && <button disabled={busy} onClick={() => setSelectedId(null)}>العودة إلى الإعلانات</button>}
        <button disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>تحديث الإعلانات</button>
        {loading ? <p role="status">جاري تحميل الإعلانات المعلقة…</p> :
          error ? <p role="alert">{error}</p> :
          !items.length ? <p>لا توجد إعلانات بانتظار المراجعة.</p> :
          items.filter(item => !selectedId || item.id === selectedId).map(item => (
            <article key={item.id} className={selectedId ? 'review-detail' : 'review-card'}>
              <div className="listing-info"><h3>{item.title}</h3><p className="listing-status">بانتظار المراجعة</p><p>{item.description}</p></div>
              <div className="review-images">{item.images?.length ? item.images.slice(0, selectedId ? undefined : 1).map(image => {
                const url = typeof image === 'string' ? image : image.image_url;
                return <img className="listing-photo" key={url} src={new URL(url, api).href} alt={item.title} />;
              }) : <p>لا توجد صور</p>}</div>
              {!selectedId ? <button onClick={() => setSelectedId(item.id)}>مراجعة الإعلان</button> : <div className="review-decisions"><button disabled={busy} onClick={() => setDecision('APPROVED')}>موافقة</button><button disabled={busy} onClick={() => setDecision('REJECTED')}>رفض</button></div>}
            </article>
          ))}
      </>}
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
