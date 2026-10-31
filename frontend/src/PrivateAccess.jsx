import React, { useState } from "react";

export default function PrivateAccess({ api, token, onOpen, onBack, onUnauthorized }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function enter(event) {
    event.preventDefault();
    if (busy) return;
    const fields = event.currentTarget.elements;

    // تم التعديل من عبير: نحتاج الرمز بس، والباك يحدد معرّف المزاد.
    const accessCode = fields.accessCode.value.trim();

    // تم التعديل من عبير: نتأكد إن الرمز مكتوب قبل نرسل الطلب.
    if (!accessCode) {
      setMessage("اكتب رمز الدخول");
      return;
    }

    setBusy(true);
    setMessage("جاري التحقق من الرمز…");
    try {
      // تم التعديل من عبير: نرسل الرمز لمسار الدخول الجديد في الباك.
      const response = await fetch(api + "/auctions/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ accessCode }),
      });
      if (response.status === 401) onUnauthorized?.();

      const result = await response.json();
      if (!response.ok) {
        const errors = {
          INVALID_CODE: "رمز الدخول غير صحيح",
          NOT_FOUND: "المزاد غير موجود",
          INVALID_ID: "معرّف المزاد غير صحيح",
          OWNER: "لا يمكنك المشاركة في مزادك",
        };
        throw new Error(
          errors[result.error?.code] || result.error?.message || "تعذّر الدخول",
        );
      }

      // تم التعديل من عبير: نتأكد من السماح بالدخول ورجوع معرّف المزاد.
      if (result.data?.accessGranted !== true || !result.data?.auctionId) {
        throw new Error("لم يتم تأكيد السماح بالدخول");
      }

      setMessage("تم السماح بالدخول للمزاد");

      // تم التعديل من عبير: نفتح المزاد بالمعرّف اللي رجع من الباك.
      onOpen(result.data.auctionId);
    } catch (error) {
      setMessage(
        error instanceof TypeError
          ? "تعذّر الاتصال، حاول مرة أخرى"
          : error.message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-screen private-access">
      <div className="account-form">
        <p className="eyebrow">مزاد خاص</p>
        <h1>الدخول إلى المزاد الخاص</h1>
        <p className="account-intro">أدخل رمز الوصول الذي شاركه معك البائع.</p>
        <form onSubmit={enter}>
          <fieldset disabled={busy}>
            {/* تم التعديل من عبير: شلنا حقل المعرّف لأن الدخول صار بالرمز فقط. */}
            <label>
              رمز الدخول
              <input name="accessCode" placeholder="أدخل رمز الدخول" required />
            </label>
            <button className="primary" type="submit">
              التحقق من الرمز
            </button>
            <button type="button" onClick={onBack}>
              العودة إلى المزادات
            </button>
          </fieldset>
        </form>
        <p role="status">{message}</p>
      </div>
    </section>
  );
}
