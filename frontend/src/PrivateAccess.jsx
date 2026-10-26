import { useState } from 'react';

export default function PrivateAccess({ api, token, onOpen }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function enter(event) {
    event.preventDefault();
    if (busy) return;
    const fields = event.currentTarget.elements;
    const id = fields.auctionId.value.trim();
    const accessCode = fields.accessCode.value.trim();
    if (!id || !accessCode) {
      setMessage('اكتبي معرّف المزاد ورمز الدخول');
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
      onOpen(id);
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال، حاولي مرة ثانية' : error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel listing-form">
      <h2>الدخول لمزاد خاص</h2>
      <form onSubmit={enter}>
        <fieldset disabled={busy}>
          <label>معرّف المزاد<input name="auctionId" required /></label>
          <label>رمز الدخول<input name="accessCode" required /></label>
          <button type="submit">دخول المزاد</button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
