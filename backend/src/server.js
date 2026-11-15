import "dotenv/config";
// نستخدم تطبيق الباكند وداله فحص رسائل نتيجة المزاد
import { app, processAuctionEmails } from "./app.js";

// داله checkAuctionEmails تشغل فحص نتائج المزادات وتستقبل اي خطا
// نستخدمها عشان نشغل الفحص بنفس الطريقه بدون تكرار الكود
function checkAuctionEmails() {
  // نشغل فحص المزادات ونستقبل الخطا اذا تعثر
  return processAuctionEmails().catch((error) => {
    // نطبع سبب تعثر الفحص في التيرمنال
    console.error("Auction email check failed", error.message);
  });
}

// نشغّل السيرفر على المنفذ الموجود في الإعدادات.
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log("Mezyad API listening on " + port);
  // نشغل الفحص اول مره بعد بدء السيرفر
  checkAuctionEmails();
  // نعيد الفحص كل ثلاثين ثانيه
  setInterval(checkAuctionEmails, 30000);
});