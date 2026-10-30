import React, { useState } from 'react';

export default function PrivateAccess({ api, token, onOpen, onBack }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [grantedId, setGrantedId] = useState('');

  async function enter(event) {
    event.preventDefault();
    if (busy) return;
    const fields = event.currentTarget.elements;
    const id = fields.auctionId.value.trim();
    const accessCode = fields.accessCode.value.trim();
    if (!id || !accessCode) {
      setMessage('اكتب معرّف المزاد ورمز الدخول');
      return;
    }
    setBusy(true);
    setMessage('جاري التحقق من الرمز…');
    try {
      const response = await fetch(api + '/auctions/' + encodeURIComponent(id) + '/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ accessCode })
      });
      const result = await response.json();
      if (!response.ok) {
        const errors = {
          INVALID_CODE: 'رمز الدخول غير صحيح',
          NOT_FOUND: 'المزاد غير موجود',
          INVALID_ID: 'معرّف المزاد غير صحيح',
          OWNER: 'ما تقدرين تنضمين كمزايدة لمزادك'
        };
        throw new Error(errors[result.error?.code] || result.error?.message || 'تعذّر الدخول');
      }
      if (result.data?.accessGranted !== true) throw new Error('لم يتم تأكيد السماح بالدخول');
      setMessage('تم السماح بالدخول للمزاد');
      setGrantedId(id);
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال، حاول مرة أخرى' : error.message);
    } finally {
      setBusy(false);
    }
  }

  if (grantedId) return <section className="private-access-success">
    <p className="breadcrumb">مزاد خاص / تم قبول رمز الوصول</p>
    <h1>تم قبول الرمز</h1>
    <p>يمكنك الآن متابعة تفاصيل المزاد.</p>
    <button className="primary" onClick={() => onOpen(grantedId)}>عرض تفاصيل المزاد</button>
    <button onClick={onBack}>العودة إلى المزادات</button>
  </section>;

  return (
    <section className="account-screen private-access">
      <div className="account-form">
      <p className="eyebrow">مزاد خاص</p>
      <h1>الدخول إلى المزاد الخاص</h1>
      <p className="account-intro">أدخل رمز الوصول الذي شاركه معك البائع.</p>
      <form onSubmit={enter}>
        <fieldset disabled={busy}>
          <label>معرّف المزاد<input name="auctionId" required /></label>
          <label>رمز الوصول<input name="accessCode" placeholder="أدخل رمز المزاد" required /></label>
          <button className="primary" type="submit">التحقق من الرمز</button>
          <button type="button" onClick={onBack}>العودة إلى المزادات</button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
      </div>
    </section>
  );
}
