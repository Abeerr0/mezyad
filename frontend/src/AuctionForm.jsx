import React, { useState } from 'react';

export default function AuctionForm({ api, token, item, startOpen = false, onBack, onUnauthorized }) {
  // هنا نخزن نوع المزاد وحاله الارسال ونتيجته عشان النموذج ما يكرر الانشاء
  const [open, setOpen] = useState(startOpen);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [auction, setAuction] = useState(null);
  const [duplicate, setDuplicate] = useState(false);
  const [visibility, setVisibility] = useState('');

  // هنا نتاكد ان الاعلان معتمد والمبالغ والاوقات صحيحه قبل ما نرسل طلب انشاء المزاد
  async function createAuction(event) {
    event.preventDefault();
    if (busy || auction || duplicate || item.status !== 'APPROVED') return;
    const data = new FormData(event.currentTarget);
    const startingPrice = Number(data.get('startingPrice'));
    const minimumIncrement = Number(data.get('minimumIncrement'));
    const start = new Date(data.get('startTime'));
    const end = new Date(data.get('endTime'));
    if (![startingPrice, minimumIncrement].every(value => Number.isFinite(value) && value > 0 && value <= 999999999999.99)) {
      setMessage('اكتب سعر بداية وأقل زيادة أكبر من صفر');
      return;
    }
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setMessage('اختر وقت البداية والنهاية، والنهاية تكون بعد البداية');
      return;
    }
    setBusy(true);
    setMessage('جاري إنشاء المزاد…');
    try {
      // بعدين نرسل نوع المزاد وسعره واوقاته للخادم مع رمز دخول صاحب الاعلان
      const response = await fetch(api + '/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          itemId: item.id,
          visibility: data.get('visibility'),
          startingPrice,
          minimumIncrement,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      });
      if (response.status === 401) onUnauthorized();
      const result = await response.json();
      // اذا الخادم قال المزاد موجود نوقف الاعاده عشان ما ننشئ مزاد ثاني لنفس الاعلان
      if (response.status === 409 && result.error?.code === 'DUPLICATE_AUCTION') {
        setDuplicate(true);
        throw new Error('الإعلان له مزاد بالفعل، ما نقدر ننشئ مزادًا مكررًا');
      }
      if (!response.ok) throw new Error(response.status >= 500
        ? 'تعذر انشاء المزاد حاليا. تحقق من مزاداتك قبل المحاوله مره اخرى.'
        : result.error?.message || 'تعذّر إنشاء المزاد');
      // هنا نتاكد ان الرد رجع مزاد مربوط بنفس الاعلان قبل ما نعرض رساله النجاح
      if (!result.data?.id || result.data.item_id !== item.id) throw new Error('تعذّر تأكيد إنشاء المزاد؛ تحقق قبل إعادة الإرسال');
      setAuction(result.data);
      setMessage(result.data.visibility === 'PRIVATE' && !result.data.accessCode
        ? 'تم إنشاء المزاد، لكن رمز الخاص ما وصل؛ راجع الفريق قبل المحاولة مرة أخرى'
        : 'تم إنشاء المزاد');
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاول لاحقًا' : error.message);
    } finally {
      setBusy(false);
    }
  }

  if (item.status !== 'APPROVED') return null;
  if (!open) return <button onClick={() => setOpen(true)}>إنشاء مزاد</button>;

  // هنا نخلي المستخدم يختار عام او خاص وبعدها يطلع له نموذج الاعداد المناسب
  if (!visibility) return (
    <section className="auction-type-screen">
      <p className="breadcrumb">حسابي / إعلاناتي / اختر نوع المزاد</p>
      <h2>اختر نوع المزاد</h2>
      <p className="page-intro">تم اعتماد إعلانك. اختر نوع المزاد المناسب لسلعتك للمتابعة إلى الإعدادات.</p>
      <p className="auction-type-item">{item.title}</p>
      <div className="auction-type-options">
        <article><img src="/design/auction-public.svg" alt="" /><h3>مزاد عام</h3><p>يظهر في قائمة المزادات العامة، ويمكن للمستخدمين الاطلاع عليه والمشاركة وفق شروط المزاد.</p><button className="primary" onClick={() => setVisibility('PUBLIC')}>إنشاء مزاد عام</button></article>
        <article><img src="/design/auction-private.svg" alt="" /><h3>مزاد خاص</h3><p>لا يظهر في المزادات العامة، ويتطلب الدخول إليه رمز وصول تشاركه مع المدعوين.</p><button className="primary" onClick={() => setVisibility('PRIVATE')}>إنشاء مزاد خاص</button></article>
      </div>
      <button onClick={() => onBack ? onBack() : setOpen(false)}>العودة إلى إعلاناتي</button>
    </section>
  );

  return (
    <section className="listing-form auction-form">
      <p className="breadcrumb">إعلاناتي / إعلان معتمد / إعداد المزاد</p>
      <h2>إعداد المزاد</h2>
      <p className="page-intro">حدّد سعر البداية والحد الأدنى لزيادة المزايدة ومواعيد المزاد.</p>
      {!auction && !duplicate && <form onSubmit={createAuction}>
        <fieldset disabled={busy}>
          <label>الإعلان المعتمد<input value={item.title} readOnly /></label>
          <input type="hidden" name="visibility" value={visibility} />
          <label>سعر البداية بالريال<input name="startingPrice" type="number" min="0.01" max="999999999999.99" step="0.01" required /></label>
          <label>أقل زيادة بالريال<input name="minimumIncrement" type="number" min="0.01" max="999999999999.99" step="0.01" required /></label>
          <label>بداية المزاد — بتوقيت جهازك<input name="startTime" type="datetime-local" required /></label>
          <label>نهاية المزاد — بتوقيت جهازك<input name="endTime" type="datetime-local" required /></label>
          <button className="primary" type="submit">{busy ? 'جاري الإنشاء…' : 'إنشاء المزاد'}</button>
          <button type="button" onClick={() => onBack ? onBack() : setOpen(false)}>إلغاء</button>
          <button type="button" onClick={() => setVisibility('')}>تغيير نوع المزاد</button>
        </fieldset>
      </form>}
      <p role="status">{message}</p>
      {auction?.visibility === 'PRIVATE' && auction.accessCode && <p>رمز المزاد الخاص — احتفظ به: <strong dir="ltr">{auction.accessCode}</strong></p>}
      {auction && <button type="button" onClick={() => onBack ? onBack() : setOpen(false)}>العودة إلى إعلاناتي</button>}
    </section>
  );
}
