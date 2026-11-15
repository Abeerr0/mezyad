// نستورد اداة توليد الارقام العشوائيه
import { randomInt } from "node:crypto";
// نستورد مكتبة ارسال الايميل
import nodemailer from "nodemailer";
// نستورد مكتبة حساب بصمة الرمز
import bcrypt from "bcryptjs";
// نستورد دالة تنفيذ استعلامات قاعدة البيانات
import { query } from "./db.js";
// نستورد دالة readFile عشان نقرأ صورة الشعار
import { readFile } from "node:fs/promises";
// نحفظ هنا اداة الارسال ونبدأها فاضيه
let transporter = null;

// داله getEmailSender تجهز اداة ارسال الايميل وترجعها
// نخلي كود تجهيز الارسال في مكان واحد عشان نعدله مره وحده لكل الرسائل
// وما نحتاج نكرر التعديل داخل كل داله
//ارسال الايميل يبدا من هنا
function getEmailSender() {
  // نبدأ فحص اعدادات خدمة البريد
  if (
    // نرفض اذا عنوان خادم البريد مو موجود
    !process.env.SMTP_HOST ||
    // نرفض اذا اسم مستخدم حساب الارسال مو موجود
    !process.env.SMTP_USER ||
    // نرفض اذا كلمة مرور خدمة البريد مو موجوده
    !process.env.SMTP_PASS
    // اذا فيه اعداد ناقص ندخل هنا
  ) {
    // نوقف الارسال ونوضح ان الاعدادات ناقصه
    throw new Error("Email settings are missing");
    // نهاية فحص اعدادات البريد
  }
  // نجهز اداة الارسال اذا ما تجهزت قبل
  if (!transporter) {
    // ناخذ المنفذ من الاعدادات ونستخدم ٤٦٥ اذا ما تحدد
    const port = Number(process.env.SMTP_PORT || 465);
    // نتاكد ان المنفذ عدد صحيح داخل النطاق
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      // نوقف الداله اذا المنفذ غير صالح
      throw new Error("Invalid SMTP port");
      // نهاية فحص المنفذ
    }
    // نجهز اداة الارسال ونحفظها في المتغير
    transporter = nodemailer.createTransport({
      // عنوان خادم البريد من الاعدادات
      host: process.env.SMTP_HOST,
      // المنفذ اللي تاكدنا منه فوق
      port: port,
      // نبدأ باتصال مشفر اذا المنفذ ٤٦٥
      secure: port === 465,
      // مع المنافذ الثانيه نشترط ترقية الاتصال الى اتصال مشفر
      requireTLS: port !== 465,
      // بيانات الدخول لحساب البريد المرسل
      auth: {
        // اسم مستخدم حساب الارسال
        user: process.env.SMTP_USER,
        // كلمة مرور خدمة البريد ومع Gmail تكون كلمة مرور التطبيق
        pass: process.env.SMTP_PASS,
        // نهاية بيانات الدخول
      },
      // ننتظر انشاء الاتصال ١٠ ثواني كحد اقصى
      connectionTimeout: 10000,
      // نوقف الاتصال اذا ما صار فيه نشاط لمدة ١٥ ثانيه
      socketTimeout: 15000,
      // نهاية تجهيز اداة الارسال
    });
    // نهاية شرط تجهيز الاداة اول مره
  }
  // نرجع اداة الارسال لاستخدامها في ارسال البريد
  return transporter;
}

// داله newEmailCode تولد رمز تحقق عشوائي من ست ارقام
// نستخدمها عشان نجهز رمز تاكيد ايميل المستخدم
export function newEmailCode() {
  // نولد رقم من صفر الى ٩٩٩٩٩٩
  const number = randomInt(0, 1000000);
  // نحوله لنص من ٦ خانات ونكمله باصفار من اليسار اذا احتجنا
  return String(number).padStart(6, "0");
  // نهاية دالة توليد الرمز
}

// داله sendVerificationCode ترسل رمز التحقق لايميل المستخدم
// نستخدمها عشان يوصل الرمز للمستخدم ويكتبه في شاشة التحقق
export async function sendVerificationCode(email, code) {
  // نبدأ فحص الايميل
  if (
    // نرفض اذا الايميل مو نص
    typeof email !== "string" ||
    // نرفض اذا صيغة الايميل غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    // اذا تحقق اي سبب للرفض ندخل هنا
  ) {
    // نوقف الداله بخطا يوضح ان الايميل غير صالح
    throw new Error("Invalid email");
    // نهاية فحص الايميل
  }
  // نرفض اذا الرمز مو نص من ٦ ارقام
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    // نوقف الداله اذا صيغة الرمز غلط
    throw new Error("Invalid verification code");
    // نهاية فحص الرمز
  }
  // نجهز اداة ارسال البريد او نستخدم الاداة الموجوده
  const mailer = getEmailSender();
  // نقرأ صورة شعار مزياد من المجلد الخاص بالايميلات
  const logo = await readFile(
    new URL("../mezyad-logo-for-emails/mezyad-logo.png", import.meta.url)
  );
  // نرسل الرساله ونحفظ رد خادم البريد
  const result = await mailer.sendMail({
    // ناخذ عنوان المرسل ونستخدم حساب الارسال اذا ما تحدد
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    // نرسل الرساله الى ايميل المستخدم
    to: email,
    // عنوان الرساله اللي يظهر في البريد
    subject: "رمز التحقق من مزياد",
    // نجهز محتوى الرساله
    text:
      // نكتب بداية الرساله
      "رمز التحقق الخاص بك في مزياد: " +
      // نضيف رمز التحقق الاصلي
      code +
      // نضيف مدة الصلاحيه والتنبيه في سطور جديده
      "\nالرمز صالح لمدة 10 دقائق.\nإذا لم تسجل في مزياد، تجاهل الرسالة.",
    // هنا تصميم رسالة HTML فيها رمز التحقق المرسل للايميل وقت انشاء الحساب
    // هنا يبدا كود HTML اللي نستخدمه لتصميم رسالة التحقق من الايميل وقت انشاء الحساب
    html: `
      <div
        dir="rtl"
        lang="ar"
        style="font-family: Tahoma, Arial, sans-serif; color: #292d25; max-width: 560px; margin: auto; padding: 24px;"
      >
        <!-- نعرض شعار مزياد ونضيف خط فاصل تحته -->
        <div style="padding-bottom: 16px; border-bottom: 1px solid #deddd3;">
          <img
            src="cid:mezyad-logo"
            alt="مزياد"
            width="225"
            style="display: block; max-width: 100%; height: auto;"
          >
        </div>
        <!-- نوضح نوع الرساله -->
        <p style="color: #a17b43; font-size: 12px; margin-top: 24px;">
          تأكيد البريد الإلكتروني
        </p>
        <!-- نكتب عنوان الرساله -->
        <h2>حياك في مزياد</h2>
        <!-- نوضح للمستخدم وين يكتب الرمز -->
        <p style="line-height: 2;">
          باقي خطوة لتأكيد بريدك
          اكتب الرمز التالي في شاشة التحقق عشان تكمل تسجيل حسابك
        </p>
        <!-- نعرض رمز التحقق الخاص بالمستخدم -->
        <p
          dir="ltr"
          style="font-size: 32px; letter-spacing: 6px; text-align: center;"
        >
          ${code}
        </p>
        <!-- نوضح مدة صلاحية الرمز -->
        <p style="text-align: center;">
          صالح لمدة ١٠ دقائق
        </p>
        <!-- نوضح للمستخدم متى يتجاهل الرساله -->
        <p style="line-height: 2;">
          إذا ما أنشأت حسابًا في مزياد تقدر تتجاهل الرسالة
        </p>
        <!-- نضيف خط فاصل وتنبيه عن رمز التحقق -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="font-size: 12px; color: #686b60;">
            رمز التحقق خاص بك ولا تشاركه مع أي شخص
          </p>
        </div>
      </div>
    `,
    // نرفق صورة الشعار عشان تظهر داخل الرساله
    attachments: [
      {
        // اسم ملف الشعار
        filename: "mezyad-logo.png",
        // بيانات الصوره اللي قريناها
        content: logo,
        // نربط الصوره بالاسم الموجود داخل التصميم
        cid: "mezyad-logo",
      },
    ],
    // نهاية ارسال الرساله وحفظ الرد
  });
  // نتاكد ان خادم البريد قبل المستلم
  if (!result.accepted || result.accepted.length === 0) {
    // نرجع خطا اذا خادم البريد ما قبل المستلم
    throw new Error("Email was not accepted");
    // نهاية فحص قبول المستلم
  }
  // نهاية دالة ارسال الرمز
}

// داله saveAndSendCode تولد رمز التحقق وتحفظ بصمته وتحاول ترسله للمستخدم
// نستخدمها عشان نربط الرمز بحساب المستخدم ونحدد وقت انتهائه
export async function saveAndSendCode(user) {
  // نولد رمز تحقق جديد
  const code = newEmailCode();
  // نحسب بصمة الرمز والرقم ١٢ يحدد تكلفة الحساب
  const codeHash = await bcrypt.hash(code, 12);
  // ننفذ التحديث ونحفظ نتيجته
  const saved = await query(
    // نحفظ بصمة الرمز في حساب المستخدم
    "UPDATE users SET email_code_hash=$2, " +
      // نحدد انتهاء الرمز بعد عشر دقايق من وقت قاعدة البيانات
      "email_code_expires_at=now()+interval '10 minutes', " +
      // نصفر المحاولات ونسجل وقت تجهيز الارسال
      "email_code_attempts=0, email_code_sent_at=now() " +
      // نحدث المستخدم اللي ايميله ما تحقق ونرجع معرفه
      "WHERE id=$1 AND email_verified_at IS NULL RETURNING id",
    // معرف المستخدم يروح مكان $1 والبصمه تروح مكان $2
    [user.id, codeHash],
    // نهاية تنفيذ استعلام التحديث
  );
  // نفحص اذا ما تم تحديث اي حساب
  if (!saved.rowCount) {
    // نوقف هنا ونرجع فشل
    return false;
    // نهاية فحص نتيجة التحديث
  }
  // نحاول ارسال الرمز بعد حفظ بصمته
  try {
    // نرسل ايميل المستخدم والرمز الاصلي وننتظر النتيجه
    await sendVerificationCode(user.email, code);
    // نرجع نجاح بعد قبول خادم البريد للرساله
    return true;
    // اذا صار خطا في محاولة الارسال ندخل هنا
  } catch (error) {
    // نطبع نوع الخطا بدون رمز التحقق
    console.error("Email send failed", error.code || "SMTP_ERROR");
    // نرجع ان الارسال فشل
    return false;
    // نهاية معالجة خطا الارسال
  }
  // نهاية دالة حفظ الرمز وارساله
}
// هنا يبدا كود ايميلات نتيجة المزاد

// داله escapeHtml نستخدمها قبل ما نحط بيانات المستخدم داخل تصميم الايميل
// عشان لو عنوان الاصل او اسم صاحب المزاد فيه رموز HTML
// تظهر مثل ما كتبها المستخدم وما تغير تصميم الرساله
function escapeHtml(value) {
  // نحول القيمة الى نص عشان نقدر نبدل الرموز اللي فيها
  return String(value)
    // نبدل الرمز & اول عشان ما تتغير الرموز اللي بنضيفها بعدها
    .replaceAll("&", "&amp;")
    // نبدل علامة اصغر من عشان ما تنقرا بداية كود HTML
    .replaceAll("<", "&lt;")
    // نبدل علامة اكبر من عشان تظهر كنص داخل الرساله
    .replaceAll(">", "&gt;")
    // نبدل علامة التنصيص المزدوج عشان تظهر مثل ما كتبها المستخدم
    .replaceAll('"', "&quot;")
    // نبدل علامة التنصيص المفرد عشان تظهر مثل ما كتبها المستخدم
    .replaceAll("'", "&#39;");
}

// داله sendWinnerEmail ترسل نتيجة المزاد للفائز
// نستخدمها بعد حفظ النتيجه عشان يعرف الفائز تفاصيل المزاد ويتواصل مع صاحبه
export async function sendWinnerEmail(email, auction) {
  // نتاكد ان ايميل الفائز مكتوب بصيغة صحيحه
  if (
    // نرفض اذا ايميل الفائز مو نص
    typeof email !== "string" ||
    // نرفض اذا صيغة ايميل الفائز غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    // نوقف دالة الارسال اذا ايميل الفائز غير صحيح
    throw new Error("Invalid email");
  }
  // نتاكد ان بيانات المزاد والتواصل والمبلغ موجوده وصحيحه
  if (
    // نرفض اذا بيانات المزاد مو موجوده
    !auction ||
    // نرفض اذا رقم المزاد مو موجود
    !auction.id ||
    // نرفض اذا عنوان الاصل مو موجود او فاضي
    !auction.title ||
    // نرفض اذا اسم صاحب المزاد مو موجود او فاضي
    !auction.seller_name ||
    // نرفض اذا ايميل صاحب المزاد مو نص
    typeof auction.seller_email !== "string" ||
    // نرفض اذا صيغة ايميل صاحب المزاد غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auction.seller_email) ||
    // نحول المبلغ لرقم ونرفض اذا ما كان رقم او كانت قيمته غير محدوده
    !Number.isFinite(Number(auction.winning_amount)) ||
    // نرفض اذا المبلغ الفائز صفر او اقل
    Number(auction.winning_amount) <= 0
    // اذا تحقق اي شرط من شروط الرفض ندخل هنا
  ) {
    // نوقف دالة الارسال ونوضح ان بيانات رسالة المزاد غير صحيحه
    throw new Error("Invalid auction email data");
    // نهاية فحص بيانات المزاد
  }
  // نجهز عنوان الاصل للعرض داخل التصميم
  const title = escapeHtml(auction.title);
  // نجهز رقم المزاد للعرض داخل التصميم
  const auctionId = escapeHtml(auction.id);
  // نجهز المبلغ الفائز للعرض داخل التصميم
  const amount = escapeHtml(auction.winning_amount);
  // نجهز اسم صاحب المزاد للعرض داخل التصميم
  const sellerName = escapeHtml(auction.seller_name);
  // نجهز ايميل صاحب المزاد للعرض داخل التصميم
  const sellerEmail = escapeHtml(auction.seller_email);
  // نجهز الايميل لاستخدامه داخل رابط التواصل
  const sellerLink = encodeURIComponent(auction.seller_email);
  // نستخدم اداة ارسال الايميل الموجوده
  const mailer = getEmailSender();
  // نقرأ صورة شعار مزياد من المجلد الخاص بالايميلات
  const logo = await readFile(
    // نحدد مكان صورة الشعار حسب مكان هذا الملف
    new URL("../mezyad-logo-for-emails/mezyad-logo.png", import.meta.url)
  );
  // نرسل رسالة الفائز ونحفظ رد خادم البريد
  const result = await mailer.sendMail({
    // ناخذ عنوان المرسل من اعدادات البريد
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    // نرسل الرساله الى ايميل الفائز
    to: email,
    // عنوان الرساله اللي يظهر في البريد
    subject: "نتيجة المزاد من مزياد",
    // نجهز نسخة نصية من الرساله
    text:
      // نبدأ الرساله بابلاغ المستخدم بفوزه
      "مبروك عرضك هو الفائز\n" +
      // نضيف عنوان الاصل وننزل سطر جديد
      "الأصل " + auction.title + "\n" +
      // نضيف رقم المزاد وننزل سطر جديد
      "رقم المزاد " + auction.id + "\n" +
      // نضيف المبلغ الفائز بالريال السعودي
      "العرض الفائز " + auction.winning_amount + " ريال سعودي\n" +
      // نضيف اسم صاحب المزاد
      "صاحب المزاد " + auction.seller_name + "\n" +
      // نضيف ايميل صاحب المزاد للتواصل معه
      "بريد التواصل " + auction.seller_email + "\n" +
      // نوضح ان الرساله اشعار بنتيجة المزاد
      "هذا إشعار بنتيجة المزاد\n" +
      // نوضح ان الدفع ونقل الملكيه خارج مزياد حاليا
      "الدفع ونقل الملكية لا يتمان من خلال مزياد حاليًا",
    // هنا تصميم رسالة HTML للفائز فيها نتيجة المزاد وبيانات التواصل مع صاحبه
    // هنا يبدا كود HTML اللي نستخدمه لتصميم رسالة الفائز بالمزاد
    html: `
      <div
        dir="rtl"
        lang="ar"
        style="font-family: Tahoma, Arial, sans-serif; color: #292d25; max-width: 560px; margin: auto; padding: 24px;"
      >
        <!-- نعرض شعار مزياد ونضيف خط فاصل تحته -->
        <div style="padding-bottom: 16px; border-bottom: 1px solid #deddd3;">
          <img
            src="cid:mezyad-logo"
            alt="مزياد"
            width="225"
            style="display: block; max-width: 100%; height: auto;"
          >
        </div>
        <!-- نوضح ان الرساله تخص نتيجة المزاد -->
        <p style="color: #a17b43; font-size: 12px; margin-top: 24px;">
          إشعار نتيجة المزاد
        </p>
        <!-- نبلغ المستخدم بفوزه -->
        <h2 style="margin: 24px 0;">مبروك عرضك هو الفائز</h2>
        <!-- نوضح للفائز سبب الرساله والبيانات الموجودة فيها -->
        <p style="line-height: 2;">
          انتهى المزاد وكان عرضك أعلى عرض مقبول<br>
          هذي تفاصيل النتيجة وبيانات التواصل مع صاحب المزاد
        </p>
        <!-- نعرض عنوان الاصل -->
        <p style="line-height: 2;">
          الأصل<br>
          <strong>${title}</strong>
        </p>
        <!-- نعرض رقم المزاد -->
        <p>رقم المزاد</p>
        <p dir="ltr" style="text-align: right; overflow-wrap: anywhere;">
          ${auctionId}
        </p>
        <!-- نعرض المبلغ الفائز -->
        <p style="line-height: 2;">
          العرض الفائز<br>
          <strong>${amount} ريال سعودي</strong>
        </p>
        <!-- نعرض اسم صاحب المزاد وايميله للتواصل -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="color: #a17b43;">التواصل مع صاحب المزاد</p>
          <p>${sellerName}</p>
          <p>
            <a
              href="mailto:${sellerLink}"
              dir="ltr"
              style="color: #292d25;"
            >${sellerEmail}</a>
          </p>
          <p style="line-height: 2;">
            يمكنك مراسلة صاحب المزاد لترتيب المعاينة وإكمال الإجراءات الرسمية المناسبة للأصل
          </p>
        </div>
        <!-- نوضح ان الرساله اشعار بالنتيجه -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="font-size: 12px; color: #686b60; line-height: 2;">
            هذا إشعار بنتيجة المزاد<br>
            الدفع ونقل الملكية لا يتمان من خلال مزياد حاليًا
          </p>
        </div>
      </div>
    `,
    // نرفق صورة الشعار ونربطها بالتصميم
    attachments: [
      {
        // اسم ملف الشعار اللي نرفقه
        filename: "mezyad-logo.png",
        // بيانات صورة الشعار اللي قريناها
        content: logo,
        // نربط صورة الشعار بالاسم الموجود داخل التصميم
        cid: "mezyad-logo",
      },
    ],
  });
  // نتاكد ان خادم البريد قبل المستلم
  if (!result.accepted || result.accepted.length === 0) {
    // نوقف الداله اذا خادم البريد ما قبل المستلم
    throw new Error("Email was not accepted");
  }
}

// داله sendSellerEmail ترسل نتيجة المزاد لصاحب المزاد اذا فيه فائز
// نستخدمها عشان يعرف صاحب المزاد المبلغ الفائز وبيانات الفائز للتواصل معه
export async function sendSellerEmail(email, auction) {
  // نتاكد ان ايميل صاحب المزاد مكتوب بصيغة صحيحه
  if (
    // نرفض اذا ايميل صاحب المزاد مو نص
    typeof email !== "string" ||
    // نرفض اذا صيغة ايميل صاحب المزاد غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    // نوقف دالة الارسال اذا ايميل صاحب المزاد غير صحيح
    throw new Error("Invalid email");
  }
  // نتاكد ان بيانات المزاد والفائز والمبلغ موجوده وصحيحه
  if (
    // نرفض اذا بيانات المزاد مو موجوده
    !auction ||
    // نرفض اذا رقم المزاد مو موجود
    !auction.id ||
    // نرفض اذا عنوان الاصل مو موجود او فاضي
    !auction.title ||
    // نرفض اذا اسم الفائز مو موجود او فاضي
    !auction.winner_name ||
    // نرفض اذا ايميل الفائز مو نص
    typeof auction.winner_email !== "string" ||
    // نرفض اذا صيغة ايميل الفائز غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auction.winner_email) ||
    // نحول المبلغ لرقم ونرفض اذا ما كان رقم او كانت قيمته غير محدوده
    !Number.isFinite(Number(auction.winning_amount)) ||
    // نرفض اذا المبلغ الفائز صفر او اقل
    Number(auction.winning_amount) <= 0
    // اذا تحقق اي شرط من شروط الرفض ندخل هنا
  ) {
    // نوقف دالة الارسال ونوضح ان بيانات رسالة المزاد غير صحيحه
    throw new Error("Invalid auction email data");
  }
  // نجهز عنوان الاصل للعرض داخل التصميم
  const title = escapeHtml(auction.title);
  // نجهز رقم المزاد للعرض داخل التصميم
  const auctionId = escapeHtml(auction.id);
  // نجهز المبلغ الفائز للعرض داخل التصميم
  const amount = escapeHtml(auction.winning_amount);
  // نجهز اسم الفائز للعرض داخل التصميم
  const winnerName = escapeHtml(auction.winner_name);
  // نجهز ايميل الفائز للعرض داخل التصميم
  const winnerEmail = escapeHtml(auction.winner_email);
  // نجهز ايميل الفائز لاستخدامه داخل رابط التواصل
  const winnerLink = encodeURIComponent(auction.winner_email);
  // نستخدم اداة ارسال الايميل الموجوده
  const mailer = getEmailSender();
  // نقرأ صورة شعار مزياد من المجلد الخاص بالايميلات
  const logo = await readFile(
    // نحدد مكان صورة الشعار حسب مكان هذا الملف
    new URL("../mezyad-logo-for-emails/mezyad-logo.png", import.meta.url)
  );
  // نرسل رسالة صاحب المزاد ونحفظ رد خادم البريد
  const result = await mailer.sendMail({
    // ناخذ عنوان المرسل من اعدادات البريد
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    // نرسل الرساله الى ايميل صاحب المزاد
    to: email,
    // عنوان الرساله اللي يظهر في البريد
    subject: "نتيجة مزادك من مزياد",
    // نجهز نسخة نصية من الرساله
    text:
      // نبلغ صاحب المزاد بانتهاء المزاد وتحديد الفائز
      "انتهى مزادك وتم تحديد الفائز\n" +
      // نضيف عنوان الاصل وننزل سطر جديد
      "الأصل " + auction.title + "\n" +
      // نضيف رقم المزاد وننزل سطر جديد
      "رقم المزاد " + auction.id + "\n" +
      // نضيف المبلغ الفائز بالريال السعودي
      "العرض الفائز " + auction.winning_amount + " ريال سعودي\n" +
      // نضيف اسم الفائز
      "الفائز " + auction.winner_name + "\n" +
      // نضيف ايميل الفائز للتواصل معه
      "بريد التواصل " + auction.winner_email + "\n" +
      // نوضح ان الرساله اشعار بنتيجة المزاد
      "هذا إشعار بنتيجة المزاد\n" +
      // نوضح ان الدفع ونقل الملكيه خارج مزياد حاليا
      "الدفع ونقل الملكية لا يتمان من خلال مزياد حاليًا",
    // هنا يبدا كود HTML اللي نستخدمه لتصميم رسالة صاحب المزاد اذا فيه فائز
    html: `
      <div
        dir="rtl"
        lang="ar"
        style="font-family: Tahoma, Arial, sans-serif; color: #292d25; max-width: 560px; margin: auto; padding: 24px;"
      >
        <!-- نعرض شعار مزياد ونضيف خط فاصل تحته -->
        <div style="padding-bottom: 16px; border-bottom: 1px solid #deddd3;">
          <img
            src="cid:mezyad-logo"
            alt="مزياد"
            width="225"
            style="display: block; max-width: 100%; height: auto;"
          >
        </div>
        <!-- نوضح ان الرساله تخص نتيجة المزاد -->
        <p style="color: #a17b43; font-size: 12px; margin-top: 24px;">
          إشعار نتيجة المزاد
        </p>
        <!-- نبلغ صاحب المزاد بانتهاء المزاد وتحديد الفائز -->
        <h2 style="margin: 24px 0;">انتهى مزادك وتم تحديد الفائز</h2>
        <!-- نوضح لصاحب المزاد البيانات الموجودة في الرساله -->
        <p style="line-height: 2;">
          انتهى مزاد الأصل المعروض من حسابك وتم تحديد العرض الفائز<br>
          هذي تفاصيل النتيجة وبيانات التواصل مع الفائز
        </p>
        <!-- نعرض عنوان الاصل -->
        <p style="line-height: 2;">
          الأصل<br>
          <strong>${title}</strong>
        </p>
        <!-- نعرض رقم المزاد -->
        <p>رقم المزاد</p>
        <p dir="ltr" style="text-align: right; overflow-wrap: anywhere;">
          ${auctionId}
        </p>
        <!-- نعرض المبلغ الفائز -->
        <p style="line-height: 2;">
          العرض الفائز<br>
          <strong>${amount} ريال سعودي</strong>
        </p>
        <!-- نعرض اسم الفائز وايميله للتواصل -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="color: #a17b43;">التواصل مع الفائز</p>
          <p>${winnerName}</p>
          <p>
            <a
              href="mailto:${winnerLink}"
              dir="ltr"
              style="color: #292d25;"
            >${winnerEmail}</a>
          </p>
          <!-- نوضح الخطوه التالية لصاحب المزاد -->
          <p style="line-height: 2;">
            يمكنك مراسلة الفائز لترتيب المعاينة وإكمال الإجراءات الرسمية المناسبة للأصل
          </p>
        </div>
        <!-- نوضح ان الرساله اشعار بالنتيجه -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="font-size: 12px; color: #686b60; line-height: 2;">
            هذا إشعار بنتيجة المزاد<br>
            الدفع ونقل الملكية لا يتمان من خلال مزياد حاليًا
          </p>
        </div>
      </div>
    `,
    // نرفق صورة الشعار ونربطها بالتصميم
    attachments: [
      {
        // اسم ملف الشعار اللي نرفقه
        filename: "mezyad-logo.png",
        // بيانات صورة الشعار اللي قريناها
        content: logo,
        // نربط صورة الشعار بالاسم الموجود داخل التصميم
        cid: "mezyad-logo",
      },
    ],
  });
  // نتاكد ان خادم البريد قبل المستلم
  if (!result.accepted || result.accepted.length === 0) {
    // نوقف الداله اذا خادم البريد ما قبل المستلم
    throw new Error("Email was not accepted");
  }
}

// داله sendNoWinnerEmail ترسل لصاحب المزاد اذا انتهى المزاد بدون فائز
// نستخدمها عشان نبلغه بالنتيجه ونوضح له المزاد المقصود
export async function sendNoWinnerEmail(email, auction) {
  // نتاكد ان ايميل صاحب المزاد مكتوب بصيغة صحيحه
  if (
    // نرفض اذا ايميل صاحب المزاد مو نص
    typeof email !== "string" ||
    // نرفض اذا صيغة ايميل صاحب المزاد غير صحيحه
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    // نوقف دالة الارسال اذا ايميل صاحب المزاد غير صحيح
    throw new Error("Invalid email");
  }
  // نتاكد ان بيانات المزاد موجوده
  if (
    // نرفض اذا بيانات المزاد مو موجوده
    !auction ||
    // نرفض اذا رقم المزاد مو موجود
    !auction.id ||
    // نرفض اذا عنوان الاصل مو موجود او فاضي
    !auction.title
    // اذا تحقق اي شرط من شروط الرفض ندخل هنا
  ) {
    // نوقف دالة الارسال اذا بيانات المزاد ناقصه
    throw new Error("Invalid auction email data");
  }
  // نجهز عنوان الاصل للعرض داخل التصميم
  const title = escapeHtml(auction.title);
  // نجهز رقم المزاد للعرض داخل التصميم
  const auctionId = escapeHtml(auction.id);
  // نستخدم اداة ارسال الايميل الموجوده
  const mailer = getEmailSender();
  // نقرأ صورة شعار مزياد من المجلد الخاص بالايميلات
  const logo = await readFile(
    // نحدد مكان صورة الشعار حسب مكان هذا الملف
    new URL("../mezyad-logo-for-emails/mezyad-logo.png", import.meta.url)
  );
  // نرسل رسالة انتهاء المزاد بدون فائز ونحفظ رد خادم البريد
  const result = await mailer.sendMail({
    // ناخذ عنوان المرسل من اعدادات البريد
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    // نرسل الرساله الى ايميل صاحب المزاد
    to: email,
    // عنوان الرساله اللي يظهر في البريد
    subject: "انتهى مزادك بدون فائز",
    // نجهز نسخة نصية من الرساله
    text:
      // نبلغ صاحب المزاد بانتهاء المزاد بدون فائز
      "انتهى مزادك بدون فائز\n" +
      // نضيف عنوان الاصل وننزل سطر جديد
      "الأصل " + auction.title + "\n" +
      // نضيف رقم المزاد وننزل سطر جديد
      "رقم المزاد " + auction.id + "\n" +
      // نوضح ان المزاد انتهى بدون عرض فائز
      "انتهى وقت المزاد بدون عرض فائز\n" +
      // نوضح ان الرساله اشعار بنتيجة المزاد
      "هذا إشعار بنتيجة المزاد",
    // هنا يبدا كود HTML اللي نستخدمه لتصميم رسالة انتهاء المزاد بدون فائز
    html: `
      <div
        dir="rtl"
        lang="ar"
        style="font-family: Tahoma, Arial, sans-serif; color: #292d25; max-width: 560px; margin: auto; padding: 24px;"
      >
        <!-- نعرض شعار مزياد ونضيف خط فاصل تحته -->
        <div style="padding-bottom: 16px; border-bottom: 1px solid #deddd3;">
          <img
            src="cid:mezyad-logo"
            alt="مزياد"
            width="225"
            style="display: block; max-width: 100%; height: auto;"
          >
        </div>
        <!-- نوضح ان الرساله تخص نتيجة المزاد -->
        <p style="color: #a17b43; font-size: 12px; margin-top: 24px;">
          إشعار نتيجة المزاد
        </p>
        <!-- نبلغ صاحب المزاد بانتهاء المزاد بدون فائز -->
        <h2 style="margin: 24px 0;">انتهى مزادك بدون فائز</h2>
        <!-- نوضح ان وقت المزاد انتهى بدون عرض فائز -->
        <p style="line-height: 2;">
          انتهى وقت المزاد بدون عرض فائز
        </p>
        <!-- نعرض عنوان الاصل -->
        <p style="line-height: 2;">
          الأصل<br>
          <strong>${title}</strong>
        </p>
        <!-- نعرض رقم المزاد -->
        <p>رقم المزاد</p>
        <p dir="ltr" style="text-align: right; overflow-wrap: anywhere;">
          ${auctionId}
        </p>
        <!-- نوضح ان الرساله اشعار بالنتيجه -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #deddd3;">
          <p style="font-size: 12px; color: #686b60;">
            هذا إشعار بنتيجة المزاد
          </p>
        </div>
      </div>
    `,
    // نرفق صورة الشعار ونربطها بالتصميم
    attachments: [
      {
        // اسم ملف الشعار اللي نرفقه
        filename: "mezyad-logo.png",
        // بيانات صورة الشعار اللي قريناها
        content: logo,
        // نربط صورة الشعار بالاسم الموجود داخل التصميم
        cid: "mezyad-logo",
      },
    ],
  });
  // نتاكد ان خادم البريد قبل المستلم
  if (!result.accepted || result.accepted.length === 0) {
    // نوقف الداله اذا خادم البريد ما قبل المستلم
    throw new Error("Email was not accepted");
  }
}
