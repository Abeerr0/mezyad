// نستخدم معرف عشوائي لكل جلسة ونحسب بصمة التوكن
import { createHash, randomUUID } from "node:crypto";
// نستخدم مكتبة التوكن عشان نصدره ونتحقق منه
import { errors, SignJWT, jwtVerify } from "jose";
//نستورد داله query من ملف db.js عشان نقدر نسوي استعلامات على قاعده البيانات
import { query } from "./db.js";
//  باستخدام SHA-256 دالة تحسب بصمة التوكن .
export function hashToken(token) {
// نجهز أداة حساب البصمة باستخدام SHA-256.
    const hash = createHash("sha256");
  // نمرر التوكن إلى أداة حساب البصمة بدون تغيير التوكن الأصلي. .
  hash.update(token);
  //   نحفظ البصمه الناتجه هنا كا نص داخل متغير.
  const tokenHash = hash.digest("hex");
  // نرجع البصمة إلى المكان الذي استدعى الدالة.
  return tokenHash;
}
// هنا نقرأ مفتاح التوقيع من إعدادات الباكند
function signingKey() {
  // نأخذ المفتاح من إعدادات التشغيل
  const secret = process.env.JWT_SECRET;
  // نوقف التوقيع إذا المفتاح ناقص أو قصير
  if (!secret || Buffer.byteLength(secret) < 32) {
    // نوضح أن الخطأ من إعدادات تشغيل الباكند
    throw new Error("Set JWT_SECRET to a secret at least 32 bytes long");
  }
  // نحول المفتاح إلى بيانات تستخدمها مكتبة التوقيع
  return new TextEncoder().encode(secret);
}

// هنا نصدر توكن الحساب بعد نجاح تسجيل الدخول
export function newToken(user) {
  // نحفظ في التوكن هل الحساب أدمن
  return new SignJWT({ is_admin: user.role === "ADMIN" })
    // نحدد طريقة توقيع التوكن
    .setProtectedHeader({ alg: "HS256" })
    // نحفظ معرف الحساب
    .setSubject(user.id)
    // نعطي كل جلسة معرف مختلف
    .setJti(randomUUID())
    // نخلي مدة التوكن نفس مدة الجلسة
    .setExpirationTime("7d")
    // نوقع التوكن بمفتاح الباكند
    .sign(signingKey());
}

// هنا نتحقق من التوكن والجلسة قبل إرجاع بيانات الحساب
export async function sessionUser(token) {
  // نجهز مفتاح التوقيع قبل ما نتحقق من التوكن
  const key = signingKey();
  // نحفظ معرف الحساب بعد ما نتأكد من التوقيع
  let userId;
  try {
    // نتحقق من التوقيع ووقت انتهاء التوكن
    const { payload } = await jwtVerify(token, key, {
      // نقبل طريقة التوقيع اللي استخدمناها عند تسجيل الدخول
      algorithms: ["HS256"],
      // نطلب وجود معرف الحساب ووقت الانتهاء
      requiredClaims: ["sub", "exp"],
    });
    // نأخذ معرف الحساب اللي داخل التوكن الموقع
    userId = payload.sub;
  } catch (error) {
    // نرجع بدون حساب إذا التوكن غير صالح
    if (error instanceof errors.JOSEError) return null;
    // نمرر أي خطأ ثاني لمعالج أخطاء الباكند
    throw error;
  }

  // نبحث عن جلسة تطابق بصمة التوكن ولم ينتهِ وقتها.
  // نربط الجلسة بالمستخدم للحصول على بياناته ودوره.
  const result = await query(
    `
    -- نختار معرف المستخدم واسمه وإيميله ودوره من جدول المستخدمين.هذا الجزء بلغة sql
      SELECT u.id, u.name, u.email, u.role
      -- نحدد جدول الجلسات كمصدر للبحث، ونسميه اختصارًا s.
      FROM user_sessions s
      -- نربط جدول الجلسات بجدول المستخدمين باستخدام معرف المستخدم.
      JOIN users u ON u.id = s.user_id
   -- نبحث عن جلسة تطابق بصمة التوكن ويكون وقت انتهائها بعد الوقت الحالي ١ يعني لازم تساوي القيمه الاولى اللي نرسلها مع الاستعلام وهي بقمه التوكن القادم في الطلب.
      WHERE s.token_hash = $1 AND s.expires_at > now()
        AND u.id::text = $2
    `,
    // نمرر بصمة التوكن بدلًا من $1 في الاستعلام .
    [hashToken(token), userId],
  );
  // نرجع بيانات الحساب إذا الجلسة لسا صالحة
  return result.rows[0] ?? null;
}
// دالة للتحقق من جلسة المستخدم قبل السماح بإكمال الطلب.
export async function auth(req, res, next) {
  // نستخدم نتيجة التحقق إذا فحصنا الجلسة في نفس الطلب
  if (req.user && req.token) return next();
  //نفذ خطوات التحقق واذا حدث خطا اثنا التنفيذ نروح لcatch
    try {
    // نقرأ Authorization، وإذا لم يوجد نستخدم نصًا فارغًا.
    const authorizationHeader = req.headers.authorization || "";
    // نتحقق أن القيمة تحتوي على Bearer ثم مسافة ثم توكن بلا مسافات.
    const tokenMatch = authorizationHeader.match(/^Bearer (\S+)$/);
    // نرفض الطلب إذا مافي توكن بالصيغة المطلوبة.
    if (!tokenMatch) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in required",
        },
      });
    }
    // نأخذ التوكن من نتيجة المطابقة.
    const token = tokenMatch[1];
    // نتحقق من التوكن ونجيب بيانات الحساب من الجلسة
    const user = await sessionUser(token);
    // نرفض الطلب إذا ما رجع لنا حساب بجلسة صالحة
    if (!user) {
        // نرسل خطأ 401 مع رسالة انتهاء الجلسة.
      return res.status(401).json({
        error: {
             // لا توجد جلسة تسجيل دخول صالحة.
          code: "UNAUTHORIZED",
          // رساله الخطا لانومافي جلسه صالحه لأي سبب انتهاء الجلسه او حذف الجلسه بعد الخروج او ارسال توكن غير صحيح
          message: "Session expired",
        },
      });
    }
    // نضع بيانات المستخدم داخل الطلب ليستفيد منها الكود التالي.
    req.user = user;
    // نضع التوكن داخل الطلب لاستخدامه عند الحاجة، مثل تسجيل الخروج.
    req.token = token;
    // نسمح للطلب بالانتقال إلى الدالة التالية.
    next();
    // يستقبل الخطا اذا حصل اثناء تنفيذ التعليمات داخل تراي
  } catch (error) {
    //ننتقل الى معالجه الخطا .
    next(error);
  }
}
// داله صلاحيه الادمن  فيها الطلب وبيانات المستخدم من auth وممكن نرسل منها رد الرفض عند الحاجه ونكست تكمل اذا المستخدم فعلا ادمن
export function admin(req, res, next) {
  // يتحقق اذا يسمح له اذا كان ادمن يسمح اذا سوزر يرسل الرفض هذا شرط الرفض هنا لازم ادمن بس .
  if (!req.user || req.user.role !== "ADMIN") {
   //اذا تحقق الرفض نرسل رساله الخطا 403
    return res.status(403).json({
      // هنا الخطا ورساله الخطا انو ممنوع فقط مسموح للادمن
        error: {
        code: "FORBIDDEN",
        message: "Admin only",
      },
    });
  }
  // المستخدم عنده صلاحيه يرجع الى نكست وهي تمرر الطلب تسمح له يكمل
  // المستخدم أدمن نسمح للطلب بالاستمرار.
  return next();
}
// 401: ما عند المستخدم جلسة تسجيل دخول صالحة.
//403: جلسته صالحة، لكن دوره لا يسمح باستخدام مسار الأدمن.
// هذا المسار للأدمن بس.
