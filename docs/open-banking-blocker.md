# Open Banking blocker — mentor escalation

Status: BLOCKED. No verified provider access, supported operation or authorized
sandbox credentials have been supplied. SABB is the primary candidate and
Al Rajhi the fallback in Stage 2; this is not evidence of granted access.

Impact: the real commitment-to-bid journey cannot pass acceptance. The backend
returns BANK_SANDBOX_UNAVAILABLE and does not write SUCCESS from a browser claim.
Synthetic SUCCESS fixtures are confined to disposable test databases.

The mentor needs to confirm:

1. The approved sandbox provider, official documentation and how the team gets access.
2. The exact supported operation and how it satisfies the project's commitment rule.
3. Consent/callback requirements, token expiry and trusted verification procedure.
4. Which genuine success/rejection/timeout evidence is required for acceptance.

No application feature will invent proof-of-funds, a fund hold, a real transfer
or a successful provider response to work around this dependency.

## Escalation message prepared for the team to send

السلام عليكم، عندنا عائق في تكامل Open Banking بمشروع مزياد يمنع إغلاق متطلبات
Stage 4. التقارير ترشح SABB ثم الراجحي، لكن ما عندنا وصول sandbox رسمي أو
عملية API محددة ومعتمدة تربط نتيجتها بـ Bid Commitment.

نحتاج مساعدتكم بتحديد المزود ومسار الحصول على الوصول، وتأكيد العملية المطلوبة
وقاعدة اعتبار الالتزام ناجحًا، مع متطلبات consent/callback واختبارات القبول.
حاليًا السيرفر يرفض اعتماد المشاركة عند غياب التكامل؛ ما استخدمنا نجاحًا وهميًا.
هل ممكن توجيهنا للخطوة المطلوبة لحل العائق؟

Dispatch status: NOT SENT. No mentor identity/channel was supplied and no mail
or Slack account is connected. The draft has no assumed addressee or credentials.
