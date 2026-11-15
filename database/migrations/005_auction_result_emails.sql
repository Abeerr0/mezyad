-- هنا نضيف بيانات متابعة ارسال ايميلات نتيجة المزاد
ALTER TABLE auction_results
-- نحفظ وقت قبول خادم البريد لرسالة الفائز
ADD COLUMN IF NOT EXISTS winner_email_sent_at timestamptz,
-- نحفظ وقت قبول خادم البريد لرسالة صاحب المزاد
ADD COLUMN IF NOT EXISTS seller_email_sent_at timestamptz;