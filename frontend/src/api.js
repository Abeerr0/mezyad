export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const messages = {
  DUPLICATE_EMAIL: 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول باستخدامه.',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  INVALID_INPUT: 'تحقق من البيانات المدخلة وحاول مجددًا.',
  UNAUTHORIZED: 'انتهت جلسة الدخول. سجّل الدخول مجددًا.',
  FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  NETWORK_ERROR: 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مجددًا.',
  TIMEOUT: 'استغرق الاتصال وقتًا أطول من المتوقع. حاول مجددًا.',
  INVALID_RESPONSE: 'تعذر قراءة استجابة الخادم. حاول مجددًا.',
  NOT_FOUND: 'المحتوى المطلوب غير متاح.',
  BANK_SANDBOX_UNAVAILABLE: 'تأكيد المشاركة غير متاح حاليًا. لم يتم اعتماد المشاركة أو إرسال مزايدة.',
  OWNER: 'لا يمكنك المشاركة في مزاد تملكه.',
  RATE_LIMITED: 'محاولات كثيرة. انتظر قليلًا قبل إعادة التحقق من رمز الوصول.',
  TOO_MANY_REQUESTS: 'محاولات كثيرة. انتظر قليلًا قبل إعادة المحاولة.',
  INVALID_CODE: 'رمز الوصول غير صحيح. تحقق منه وحاول مجددًا.',
  NO_ACCESS: 'يلزم قبول رمز الوصول قبل المشاركة في هذا المزاد.',
  COMMITMENT_REQUIRED: 'أكمل تأكيد المشاركة قبل إضافة مزايدتك.',
  BID_TOO_LOW: 'تغيّر السعر أو أن المبلغ أقل من الحد المطلوب. راجع السعر الحالي.',
  AUCTION_NOT_ACTIVE: 'المزاد غير متاح للمزايدة في الوقت الحالي.',
  DUPLICATE_REQUEST: 'سبق معالجة هذا الطلب. راجع سجل المزايدات قبل إرسال طلب جديد.',
  INVALID_STATE: 'تغيّرت حالة الإعلان. حدّث الصفحة وتحقق منها.',
  NOT_APPROVED: 'يمكن إنشاء المزاد لإعلان تملكه وتم اعتماده فقط.',
  DUPLICATE_AUCTION: 'هذا الإعلان مرتبط بمزاد بالفعل.',
  PAYLOAD_TOO_LARGE: 'حجم البيانات أكبر من المسموح. قلّل حجم الملفات وحاول مجددًا.',
  INVALID_ID: 'الرابط أو معرّف الطلب غير صحيح.',
  INVALID_IMAGE: 'اختر صورًا سليمة بصيغة JPG أو PNG أو WebP، حتى 6 صور و5 MiB للصورة.',
  LIMIT_FILE_SIZE: 'حجم الصورة يتجاوز 5 MiB.',
  LIMIT_FILE_COUNT: 'الحد الأقصى 6 صور.',
  INVALID_CATEGORY: 'اختر قسمًا متاحًا للمعروض.',
};

export const errorMessage = error => messages[error?.code]
  || (error?.status===429?'محاولات كثيرة. انتظر قليلًا قبل إعادة المحاولة.':'تعذر إتمام الطلب. حاول مجددًا.');

export const apiBase = () => (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function requestApi(path, { token, body, signal, method = 'GET', timeout = 10000, responseMeta = false } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  try {
    const base = apiBase();
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
      signal: controller.signal,
      cache: 'no-store',
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new ApiError('INVALID_RESPONSE', response.status); }
    if (!response.ok) throw new ApiError(payload?.error?.code || 'INTERNAL_ERROR', response.status);
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new ApiError('INVALID_RESPONSE', response.status);
    }
    return responseMeta ? {data:payload.data,meta:payload.meta} : payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('TIMEOUT');
    if (signal?.aborted) throw error;
    throw new ApiError('NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
