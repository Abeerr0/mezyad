import { useEffect, useState } from 'react';

export default function ListingForm({ api, token, item, onSaved, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const response = await fetch(api + '/categories');
        const result = await response.json();
        if (!response.ok) throw new Error();
        if (active) setCategories(result.data);
      } catch {
        if (active) setCategoryError('تعذّر تحميل الأقسام، حاولي لاحقًا');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCategories();
    return () => { active = false; };
  }, [api]);

  async function submitListing(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = data.get('title').trim();
    const description = data.get('description').trim();
    const images = Array.from(form.elements.images.files);
    let categoryFields = {};
    for (const line of data.get('specifications').split('\n')) {
      if (!line.trim()) continue;
      const separator = line.indexOf(':');
      const name = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (separator < 1 || !name || !value || Object.hasOwn(categoryFields, name)) {
        setMessage('اكتبي كل مواصفة بسطر مثل اللون: بني، بدون تكرار اسم المواصفة');
        return;
      }
      Object.defineProperty(categoryFields, name, { value, enumerable: true });
    }
    if (item && data.get('specifications') === specifications) {
      categoryFields = item.categoryFields ?? item.category_fields ?? {};
    }
    if (!data.get('categoryId') || !title || !description) {
      setMessage('اختاري القسم واكتبي العنوان والوصف');
      return;
    }
    if ((!item && images.length < 1) || images.length > 6) {
      setMessage('اختاري حتى 6 صور، وصورة واحدة على الأقل للإعلان الجديد');
      return;
    }
    const types = ['image/jpeg', 'image/png', 'image/webp'];
    if (images.some(image => !types.includes(image.type) || image.size > 5 * 1024 * 1024)) {
      setMessage('اختاري صور JPG أو PNG أو WebP، بحجم أقصى 5 ميجابايت للصورة');
      return;
    }
    data.set('title', title);
    data.set('description', description);
    data.set('categoryFields', JSON.stringify(categoryFields));
    data.delete('specifications');
    setBusy(true);
    setMessage('جاري إرسال الإعلان…');
    try {
      const response = await fetch(api + '/items' + (item ? '/' + item.id : ''), {
        method: item ? 'PATCH' : 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: data
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'تعذّر إرسال الإعلان');
      if (!result.data?.id || result.data.status !== 'PENDING_REVIEW' ||
          (item && result.data.id !== item.id) ||
          (images.length > 0 && (!Array.isArray(result.data.images) || result.data.images.length !== images.length))) {
        throw new Error('تعذّر تأكيد حفظ الإعلان والصور؛ تحققي من إعلاناتك قبل إعادة الإرسال');
      }
      form.reset();
      setMessage('تم إرسال الإعلان، بانتظار مراجعة المشرف');
      onSaved?.(result.data);
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاولي لاحقًا' : error.message);
    } finally {
      setBusy(false);
    }
  }

  const specifications = Object.entries(item?.categoryFields ?? item?.category_fields ?? {})
    .map(([name, value]) => name + ': ' + (typeof value === 'object' ? JSON.stringify(value) : value)).join('\n');

  if (loading) return <p role="status">جاري تحميل أقسام الإعلان…</p>;
  if (categoryError) return <p role="alert">{categoryError}</p>;
  if (!categories.length) return <p>لا توجد أقسام للإعلان حاليًا.</p>;

  return (
    <section className="panel listing-form">
      <h2>{item ? 'تعديل الإعلان المرفوض' : 'إعلان جديد'}</h2>
      <form onSubmit={submitListing}>
        <fieldset disabled={busy}>
          <label>القسم<select name="categoryId" required defaultValue={item?.category_id ?? ''}>
            <option value="" disabled>اختاري القسم</option>
            {categories.filter(category => !item || category.id === item.category_id).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select></label>
          <label>عنوان الإعلان<input name="title" required maxLength={240} defaultValue={item?.title ?? ''} /></label>
          <label>الوصف<textarea name="description" required maxLength={20000} rows={4} defaultValue={item?.description ?? ''} /></label>
          <label>مواصفات القسم — اختيارية<textarea name="specifications" rows={3} defaultValue={specifications} placeholder={'كل مواصفة بسطر، مثل:\nاللون: بني'} /></label>
          <label>{item ? 'صور بديلة — اتركيها فارغة للاحتفاظ بالصور الحالية' : 'الصور — من صورة إلى 6'}<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required={!item} /></label>
          <button type="submit">{busy ? 'جاري الإرسال…' : item ? 'إعادة الإرسال للمراجعة' : 'إرسال الإعلان'}</button>
          {item && <button type="button" onClick={onCancel}>إلغاء التعديل</button>}
        </fieldset>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
