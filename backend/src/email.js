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
