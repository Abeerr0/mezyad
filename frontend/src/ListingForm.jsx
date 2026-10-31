import React, { useEffect, useState } from 'react';

const categoryText = {
  'Real Estate': ['العقارات', 'العقارات السكنية والأراضي'],
  Camels: ['الإبل', 'صور ومعلومات عن الإبل المعروضة'],
  'Vehicle Plates': ['اللوحات المميزة', 'لوحات السيارات المميزة'],
  'Rare Vehicles': ['السيارات النادرة', 'الموديلات المحدودة والنادرة']
};

export default function ListingForm({ api, token, item, onSaved, onCancel, onUnauthorized }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(item ? 1 : 0);
  const [categoryId, setCategoryId] = useState(item?.category_id ?? '');
  const [preview, setPreview] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const previews = images.map(image => ({
      name: image.name,
      url: URL.createObjectURL(image)
    }));
    setImagePreviews(previews);
    return () => previews.forEach(image => URL.revokeObjectURL(image.url));
  }, [images]);

  function imageError(files) {
    if ((!item && files.length < 1) || files.length > 6) {
      return 'اختر حتى 6 صور، وصورة واحدة على الأقل للإعلان الجديد';
    }
    const types = ['image/jpeg', 'image/png', 'image/webp'];
    if (files.some(image => !types.includes(image.type) || image.size > 5 * 1024 * 1024)) {
      return 'اختر صور JPG أو PNG أو WebP، بحجم أقصى 5 ميجابايت للصورة';
    }
    return '';
  }

  function chooseImages(event) {
    const chosen = Array.from(event.target.files);
    event.target.value = '';
    if (!chosen.length) return;
    const nextImages = [...images, ...chosen];
    const error = imageError(nextImages);
    setMessage(error);
    if (!error) setImages(nextImages);
  }

  function removeImage(index) {
    setImages(images.filter((image, imageIndex) => imageIndex !== index));
    setMessage('');
  }

  function next(event) {
    event.preventDefault();
    const form = event.currentTarget.form;
    const fields = form.querySelectorAll('[data-step="' + step + '"] input, [data-step="' + step + '"] textarea');
    if ([...fields].some(field => !field.reportValidity())) return;
    if (step === 2 && imageError(images)) {
      setMessage(imageError(images));
      return;
    }
    setMessage('');
    setPreview(Object.fromEntries(new FormData(form)));
    setStep(step + 1);
  }

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const response = await fetch(api + '/categories');
        const result = await response.json();
        if (!response.ok) throw new Error();
        if (!Array.isArray(result.data)) throw new Error();
        if (active) setCategories(result.data);
      } catch {
        if (active) setCategoryError('تعذّر تحميل الأقسام، حاول لاحقًا');
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
    let categoryFields = {};
    for (const line of data.get('specifications').split('\n')) {
      if (!line.trim()) continue;
      const separator = line.indexOf(':');
      const name = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (separator < 1 || !name || !value || Object.hasOwn(categoryFields, name)) {
        setMessage('اكتب كل مواصفة بسطر مثل اللون: بني، بدون تكرار اسم المواصفة');
        return;
      }
      Object.defineProperty(categoryFields, name, { value, enumerable: true });
    }
    if (item && data.get('specifications') === specifications) {
      categoryFields = item.categoryFields ?? item.category_fields ?? {};
    }
    if (!data.get('categoryId') || !title || !description) {
      setMessage('اختر القسم واكتب العنوان والوصف');
      return;
    }
    if (imageError(images)) {
      setMessage(imageError(images));
      return;
    }
    data.delete('images');
    images.forEach(image => data.append('images', image));
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
      if (response.status === 401) onUnauthorized();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'تعذّر إرسال الإعلان');
      if (!result.data?.id || result.data.status !== 'PENDING_REVIEW' ||
          (item && result.data.id !== item.id) ||
          (images.length > 0 && (!Array.isArray(result.data.images) || result.data.images.length !== images.length))) {
        throw new Error('تعذّر تأكيد حفظ الإعلان والصور؛ تحقق من إعلاناتك قبل إعادة الإرسال');
      }
      form.reset();
      setImages([]);
      if (!item) { setStep(0); setCategoryId(''); }
      setMessage('تم إرسال الإعلان، بانتظار مراجعة المشرف');
      onSaved?.(result.data);
    } catch (error) {
      setMessage(error instanceof TypeError ? 'تعذّر الاتصال بالخادم، حاول لاحقًا' : error.message);
    } finally {
      setBusy(false);
    }
  }

  const specifications = Object.entries(item?.categoryFields ?? item?.category_fields ?? {})
    .map(([name, value]) => name + ': ' + (typeof value === 'object' ? JSON.stringify(value) : value)).join('\n');
  const shownImages = images.length ? imagePreviews : (item?.images ?? []).map((image, index) => ({
    name: 'صورة الإعلان ' + (index + 1),
    url: new URL(typeof image === 'string' ? image : image.image_url, api).href
  }));
  const selectedCategory = categories.find(category => category.id === categoryId);
  const selectedCategoryName = categoryText[selectedCategory?.name]?.[0] || selectedCategory?.name || '';

  if (loading) return <p role="status">جاري تحميل أقسام الإعلان…</p>;
  if (categoryError) return <p role="alert">{categoryError}</p>;
  if (!categories.length) return <p>لا توجد أقسام للإعلان حاليًا.</p>;

  return (
    <section className={'panel listing-form listing-editor' + (step === 0 ? ' listing-category-step' : step >= 2 ? ' listing-visual-step' : '')}>
      {step === 0 && <p className="breadcrumb">حسابي / أنشئ مزادك</p>}
      {step >= 2 && <p className="breadcrumb">{step === 3 ? 'أنشئ مزادك / مراجعة' : 'أنشئ مزادك / الصور'}</p>}
      <h2>{['اختر فئة السلعة', item ? 'تعديل الإعلان المرفوض' : 'تفاصيل الإعلان', 'صور الإعلان', 'راجع إعلانك'][step]}</h2>
      {step === 0 && <p className="page-intro">ابدأ باختيار القسم المناسب قبل إضافة تفاصيل الإعلان.</p>}
      {step >= 2 && <p className="page-intro">{step === 2 ? 'أضف صورًا واضحة للمعروض نفسه ومن زوايا مختلفة.' : 'تأكد من العنوان والصورة والمعلومات قبل إرسال الإعلان للمراجعة.'}</p>}
      <form className={step === 3 ? 'listing-review-form' : step === 2 ? 'listing-photos-form' : ''} onSubmit={submitListing}>
        <fieldset disabled={busy}>
          <input type="hidden" name="categoryId" value={categoryId} />
          {step === 0 && <>
            <div className="category-options">{categories.filter(category => category.name !== 'Luxury Handbags').map(category => {
              const [name, description] = categoryText[category.name] || [category.name, ''];
              return <button type="button" key={category.id} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}><strong>{name}</strong>{description && <span>{description}</span>}</button>;
            })}</div>
            <div className="actions"><button className="primary" type="button" disabled={!categoryId} onClick={() => setStep(1)}>المتابعة إلى تفاصيل المعروض</button></div>
          </>}
          <div data-step="1" hidden={step !== 1}>
          <label>عنوان الإعلان<input name="title" required={step === 1} maxLength={240} defaultValue={item?.title ?? ''} /></label>
          <label>القسم<input value={selectedCategoryName} readOnly /></label>
          <label>وصف المعروض<textarea name="description" required={step === 1} maxLength={20000} rows={4} defaultValue={item?.description ?? ''} /></label>
          <label>مواصفات القسم — اختيارية<textarea name="specifications" rows={3} defaultValue={specifications} placeholder={'كل مواصفة بسطر، مثل:\nاللون: بني'} /></label>
          </div>
          <div className="photo-upload" data-step="2" hidden={step !== 2}>
            <div className="listing-photo-layout">
              <div className="listing-photo-picker">
                  <input
                    id="listing-images"
                    className="listing-file-input"
                    aria-label="اختيار الصور"
                    name="images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={chooseImages}
                  />
              </div>
              <div className="listing-photo-gallery">
                {Array.from({ length: Math.max(3, shownImages.length) }, (_, index) => (
                  <figure key={shownImages[index]?.url ?? index}>
                    <label className="listing-image-slot" htmlFor="listing-images">
                      {shownImages[index] ? <img src={shownImages[index].url} alt={shownImages[index].name} /> : index === 0 ? 'إضافة صورة رئيسية' : 'إضافة صورة أخرى'}
                    </label>
                    {images.length > 0 && shownImages[index] && <button className="listing-remove-image" type="button" onClick={() => removeImage(index)}>إزالة الصورة {index + 1}</button>}
                  </figure>
                ))}
              </div>
            </div>
            <p className="listing-photo-note">من صورة إلى 6، بصيغة JPG أو PNG أو WebP، حتى 5 ميجابايت للصورة.</p>
            {item && <p className="listing-photo-note">اترك الصور البديلة فارغة للاحتفاظ بالصور الحالية.</p>}
            {shownImages.length >= 3 && shownImages.length < 6 && <label className="listing-add-more" htmlFor="listing-images">إضافة صورة أخرى</label>}
          </div>
          {step === 3 && (
            <div className="listing-preview">
              <div className="listing-preview-details">
                <p className="breadcrumb">
                  {selectedCategoryName}
                </p>
                <h3>{preview.title}</h3>
                <p>{preview.description}</p>
                {preview.specifications && <p>{preview.specifications}</p>}
                <button className="primary" type="submit">
                  {busy ? 'جاري الإرسال…' : item ? 'إعادة الإرسال للمراجعة' : 'إرسال للمراجعة'}
                </button>
              </div>
              <div className="listing-preview-photos">
                <div className="listing-photo-gallery">
                  {shownImages.map(image => (
                    <figure key={image.url}>
                      <img src={image.url} alt={image.name} />
                    </figure>
                  ))}
                </div>
                <div className="listing-review-actions">
                  <button type="button" onClick={() => setStep(1)}>تعديل التفاصيل</button>
                  <button className="listing-back-photos" type="button" onClick={() => setStep(2)}>العودة إلى الصور</button>
                </div>
              </div>
            </div>
          )}
          {step > 0 && step < 3 && (
            <div className="actions">
              {(!item || step > 1) && (
                <button type="button" onClick={() => setStep(step - 1)}>{step === 2 ? 'العودة إلى التفاصيل' : 'العودة'}</button>
              )}
              <button className="primary" type="button" onClick={next}>
                {step === 1 ? 'متابعة إلى الصور' : 'مراجعة إعلانك'}
              </button>
            </div>
          )}
          {item && <button type="button" onClick={onCancel}>إلغاء التعديل</button>}
        </fieldset>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
