import React, {useEffect,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {categories} from '../ui/Auctions.jsx';
import {MediaGallery} from '../ui/MediaGallery.jsx';
import {listingImages,imageIdentity} from '../ui/media.js';
import {Page,Field,Feedback,useData,uuid,navigate} from './common.jsx';
import {validItemRecord,sameFields,sameItemContent} from './listingContract.js';
import {ListingReason,ListingAssistant} from './SellerPresentation.jsx';

const optionalFields={
  'Camels':[['name','اسم المعروض'],['age','العمر'],['location','الموقع']],
  'Real Estate':[['location','الموقع'],['area','المساحة (م²)']],
  'Rare Vehicles':[['make','الشركة'],['model','الطراز'],['year','سنة الصنع']],
  'Vehicle Plates':[['letters','الحروف'],['number','الرقم']],
  'Luxury Handbags':[['brand','العلامة'],['model','الإصدار']],
};
export const labelFor=name=>categories.find(c=>c.name===name)?.label || (name==='Luxury Handbags'?'الحقائب الفاخرة':name);
const categoryInfo={
  'Real Estate':{order:0,description:'العقارات السكنية والأراضي'},
  'Camels':{order:1,description:'صور ومعلومات عن الإبل المعروضة'},
  'Vehicle Plates':{order:2,description:'لوحات السيارات المميزة'},
  'Rare Vehicles':{order:3,description:'الموديلات المحدودة والنادرة'},
};
function CategoryChoice({catalog,selected,onSelect,onContinue}){
  const ordered=[...catalog].sort((a,b)=>(categoryInfo[a.name]?.order??99)-(categoryInfo[b.name]?.order??99));
  return <section className="listing-category-step"><fieldset className="seller-category-cards"><legend className="visually-hidden">فئة السلعة</legend>
    {ordered.map(c=><label className={'seller-category-card'+(selected===c.id?' is-selected':'')} key={c.id}>
      <input type="radio" name="seller-category" value={c.id} checked={selected===c.id} onChange={()=>onSelect(c.id)}/>
      <span className="seller-category-title">{labelFor(c.name)}</span><span className="seller-category-description">{categoryInfo[c.name]?.description||'أضف تفاصيل المعروض في هذا القسم.'}</span>
    </label>)}
  </fieldset>{!catalog.length&&<p className="empty-state">لا توجد أقسام متاحة حاليًا. أعد المحاولة لاحقًا.</p>}
    <div className="workspace-actions seller-category-actions"><button className="button primary" type="button" disabled={!selected||!catalog.some(c=>c.id===selected)} onClick={onContinue}>المتابعة إلى تفاصيل المعروض</button><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
  </section>;
}
export function ListingForm({id}){
  const {request,session}=useAuth();
  const catalog=useData('/api/v1/categories',v=>Array.isArray(v)&&v.every(c=>uuid(c.id)&&typeof c.name==='string'&&c.name.trim())&&new Set(v.map(c=>c.id)).size===v.length);
  const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[category,setCategory]=useState(''),[details,setDetails]=useState({});
  const [savedPhotos,setSavedPhotos]=useState([]),[photoMode,setPhotoMode]=useState('keep'),[step,setStep]=useState(id?0:-1),[photos,setPhotos]=useState([]),[previews,setPreviews]=useState([]),[failure,setFailure]=useState(''),[loading,setLoading]=useState(!!id),[pending,setPending]=useState(false),[loaded,setLoaded]=useState(!id),[reviewReason,setReviewReason]=useState(''),[submitted,setSubmitted]=useState(false),[stateConflict,setStateConflict]=useState(false);
  useEffect(()=>{
    if(!id)return;const controller=new AbortController();setLoading(true);setLoaded(false);setFailure('');setStateConflict(false);
    request('/api/v1/items/'+id,{signal:controller.signal}).then(value=>{
      if(!validItemRecord(value)||value.id!==id)throw new ApiError('INVALID_RESPONSE');
      if(value.seller_id!==session.user.id||value.status!=='REJECTED')throw new ApiError('FORBIDDEN',403);
      if(!controller.signal.aborted){setTitle(value.title);setDescription(value.description);setCategory(value.category_id);setDetails(value.category_fields||{});setReviewReason(value.review_reason||'');setSavedPhotos(listingImages(value)||[]);setLoaded(true);}
    }).catch(error=>{if(!controller.signal.aborted)setFailure(errorMessage(error));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[id,request,session.user.id]);
  useEffect(()=>{const urls=photos.map(file=>({file,url:URL.createObjectURL(file)}));setPreviews(urls);return()=>urls.forEach(({url})=>URL.revokeObjectURL(url));},[photos]);
  const selected=catalog.data?.find(c=>c.id===category);
  const missingCategory=!!id&&loaded&&!!catalog.data&&!selected;
  function next(event){event.preventDefault();setFailure('');
    if(!catalog.data?.some(c=>c.id===category)||!title.trim()||title.trim().length>240||!description.trim()){setFailure('اختر القسم وأدخل عنوانًا من 1 إلى 240 حرفًا ووصفًا للمعروض.');return;}
    setStep(1);
  }
  function choose(event){
    const files=[...event.target.files];const mime=['image/jpeg','image/png','image/webp'];
    if(files.some(file=>file.size===0||!mime.includes(file.type)||! /\.(jpe?g|png|webp)$/i.test(file.name))){setFailure('اختر صورًا غير فارغة بصيغة JPG أو PNG أو WebP.');event.target.value='';return;}
    if(files.some(file=>file.size>5*1024*1024)){setFailure('حجم الصورة يجب ألا يتجاوز 5 MiB.');event.target.value='';return;}
    if(photos.length+files.length>6){setFailure('الحد الأقصى 6 صور. احذف صورة من المسودة قبل الإضافة.');event.target.value='';return;}
    setFailure('');if(files.length)setPhotoMode('replace');setPhotos(previous=>[...previous,...files]);event.target.value='';
  }
  async function refreshSavedPhotos(){
    try{const value=await request('/api/v1/items/'+id);if(!validItemRecord(value)||value.id!==id||value.seller_id!==session.user.id)throw new ApiError('INVALID_RESPONSE');if(value.status!=='REJECTED'){setStateConflict(true);setLoaded(false);throw new ApiError('INVALID_STATE',409);}setSavedPhotos(listingImages(value)||[]);}
    catch(error){setFailure(errorMessage(error));}
  }
  async function submit(){
    if(pending||!loaded)return;
    const selectedPhotos=id&&photoMode==='keep'?[]:photos;
    if(!selectedPhotos.length&&!(id&&photoMode==='keep'&&savedPhotos.length)){setFailure('اختر صورة واحدة على الأقل قبل الإرسال.');return;}
    setPending(true);setFailure('');setSubmitted(true);
    const form=new FormData();form.set('categoryId',category);form.set('title',title.trim());form.set('description',description.trim());form.set('category_fields',JSON.stringify(details));selectedPhotos.forEach(photo=>form.append('images',photo,photo.name));
    try{
      const value=await request(id?'/api/v1/items/'+id:'/api/v1/items',{method:id?'PATCH':'POST',body:form});
      if(!validItemRecord(value)||value.status!=='PENDING_REVIEW'||value.seller_id!==session.user.id||(id&&value.id!==id)||value.category_id!==category||value.title!==title.trim()||value.description!==description.trim()||!sameFields(value.category_fields,details))throw new ApiError('INVALID_RESPONSE');
      const saved=await request('/api/v1/items/'+value.id);
      const expectedImages=selectedPhotos.length||savedPhotos.length;
      const returnedImages=listingImages(value),persistedImages=listingImages(saved);
      if(!sameItemContent(value,saved)||saved.status!=='PENDING_REVIEW'||returnedImages?.length!==expectedImages||persistedImages?.length!==expectedImages||returnedImages.map(imageIdentity).sort().join()!==persistedImages.map(imageIdentity).sort().join()||(id&&photoMode==='keep'&&savedPhotos.map(imageIdentity).sort().join()!==persistedImages.map(imageIdentity).sort().join()))throw new ApiError('INVALID_RESPONSE');
      navigate('listing/'+value.id);
    }catch(error){setFailure(errorMessage(error));if(error.code==='INVALID_STATE'&&error.status===409){setStateConflict(true);setLoaded(false);}}finally{setPending(false);}
  }
  return <Page title={id?'تعديل الإعلان':step===-1?'اختر فئة السلعة':'إنشاء إعلان'} trail={step===-1?'حسابي / أنشئ مزادك':'مزاداتي / تفاصيل المعروض'} node={step===-1?'9:30':id?['430:151','430:219','430:270'][step]:['9:65','9:103','9:131'][step]}>
    <p className="section-description">{step===-1?'ابدأ باختيار القسم المناسب قبل إضافة تفاصيل الإعلان.':id?'راجع ملاحظة المشرف وحدّث بيانات الإعلان وصوره قبل إرساله مجددًا.':'أضف وصفًا واضحًا ومعلومات يمكنك تأكيدها.'}</p>
    <Feedback loading={loading||catalog.loading} failure={catalog.failure} reload={catalog.reload}/>
    {missingCategory&&<div className="feedback error" role="alert"><p>قسم الإعلان غير متاح ضمن الأقسام الحالية. لا يمكن تعديل الإعلان قبل التحقق من قسمه.</p><a className="button secondary" href={'#listing/'+id}>العودة إلى الإعلان</a></div>}
    {step!==-1&&<ol className="workspace-steps" aria-label="خطوات الإعلان">{['تفاصيل المعروض','الصور','مراجعة الإعلان'].map((label,i)=><li key={label} aria-current={step===i?'step':undefined}><span dir="ltr">{i+1}</span> {label}</li>)}</ol>}
    {failure&&<div className="feedback error" role="alert"><p>{failure}</p>{submitted&&<p>لم يصل تأكيد حفظ الإعلان وصوره. تبقى تعديلاتك هنا حتى تتمكن من المحاولة مجددًا.</p>}{stateConflict&&<a className="button secondary" href={'#listing/'+id}>عرض حالة الإعلان</a>}</div>}
    {id&&!loading&&loaded&&<ListingReason reason={reviewReason}/>}
    {!loading&&loaded&&!missingCategory&&catalog.data&&(step===-1?<CategoryChoice catalog={catalog.data} selected={category} onSelect={value=>{if(value!==category)setDetails({});setCategory(value);}} onContinue={()=>setStep(0)}/>:<div className={step===0?"listing-edit-layout":undefined}><section className="workspace-panel form-panel">
      {step===0?<form onSubmit={next} noValidate>
        <Field label="عنوان الإعلان" id="listing-title"><input id="listing-title" value={title} maxLength={240} onChange={e=>setTitle(e.target.value)} required/></Field>
        {!id&&<button type="button" className="text-action" onClick={()=>setStep(-1)}>تغيير القسم</button>}
        <Field label="القسم" id="listing-category"><select id="listing-category" value={category} disabled={!!id} onChange={e=>{setCategory(e.target.value);setDetails({});}} required><option value="">اختر نوع المعروض</option>{catalog.data.map(c=><option key={c.id} value={c.id}>{labelFor(c.name)}</option>)}</select></Field>
        {(optionalFields[selected?.name]||[]).map(([key,label])=><Field key={key} label={label} id={'detail-'+key}><input id={'detail-'+key} value={details[key]??''} onChange={e=>setDetails({...details,[key]:e.target.value})}/></Field>)}
        <Field label="وصف المعروض" id="listing-description"><textarea id="listing-description" rows={5} value={description} onChange={e=>setDescription(e.target.value)} required/></Field>
        <button type="button" className="text-action" onClick={()=>setDescription([title,...Object.values(details)].filter(Boolean).join(' — '))}>اقتراح وصف من بياناتي</button>
        <p className="field-hint">راجع الوصف المقترح وتأكد من صحة البيانات قبل الإرسال.</p>
        <div className="workspace-actions"><button className="button primary" type="submit">متابعة إلى الصور</button><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
      </form>:step===1?<>
        <h2>صور المعروض</h2><p className="section-description">اختر صورًا لنفس المعروض الذي تصفه في الإعلان.</p>{id&&<><p className="field-hint">يمكن الإبقاء على الصور المحفوظة أو استبدال المجموعة كاملة. حذف صورة محفوظة منفردة غير متاح.</p>{savedPhotos.length>0&&<MediaGallery images={savedPhotos} title={title} variant="review" onRefresh={refreshSavedPhotos}/>}<fieldset className="saved-photo-mode"><legend>الصور عند إعادة التقديم</legend><label><input type="radio" name="photo-mode" checked={photoMode==='keep'} onChange={()=>setPhotoMode('keep')}/>الإبقاء على الصور المحفوظة</label><label><input type="radio" name="photo-mode" checked={photoMode==='replace'} onChange={()=>setPhotoMode('replace')}/>استبدال مجموعة الصور</label></fieldset>{!savedPhotos.length&&<p>لا توجد صور محفوظة؛ أضف صورًا جديدة.</p>}</>}
        <Field label="إضافة صور" id="listing-images"><input id="listing-images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={choose}/></Field>
        <p className="field-hint">يمكنك إضافة الصور على دفعات أو حذف صورة من المسودة. المعاينة لا تعني أن الصور حُفظت في الخادم.</p>
        <div className="upload-previews">{previews.map(({file,url},i)=><figure key={url}><img src={url} alt={'صورة مختارة '+(i+1)}/><figcaption>{file.name}</figcaption><button className="text-action" type="button" aria-label={'حذف الصورة '+(i+1)} onClick={()=>setPhotos(previous=>previous.filter(selected=>selected!==file))}>حذف الصورة</button></figure>)}</div>
        <div className="workspace-actions"><button className="button primary" disabled={!(id&&photoMode==='keep'?savedPhotos.length:photos.length)} onClick={()=>setStep(2)}>مراجعة الإعلان</button><button className="button secondary" onClick={()=>setStep(0)}>العودة إلى التفاصيل</button></div>
      </>:<>
        <h2>{title}</h2><p className="section-description">{labelFor(selected?.name)}</p><p className="review-copy">{description}</p>
        <dl className="workspace-summary">{Object.entries(details).map(([key,value])=><React.Fragment key={key}><dt>{optionalFields[selected?.name]?.find(f=>f[0]===key)?.[1]||key}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></React.Fragment>)}</dl>
        {id&&photoMode==='keep'&&savedPhotos.length>0&&<MediaGallery images={savedPhotos} title={title} variant="review" onRefresh={refreshSavedPhotos}/>}
        <div className="upload-previews">{(id&&photoMode==='keep'?[]:previews).map(({file,url},i)=><img key={url} src={url} alt={'صورة مختارة '+(i+1)}/>)}</div>
        <p className="section-description">تُراجع معلومات الإعلان قبل إتاحته لإنشاء مزاد.</p>
        <div className="workspace-actions"><button className="button primary" disabled={pending} onClick={submit}>{pending?'جارٍ إرسال الإعلان…':'إرسال للمراجعة'}</button><button className="button secondary" disabled={pending} onClick={()=>setStep(1)}>العودة إلى الصور</button><button className="button secondary" disabled={pending} onClick={()=>setStep(0)}>تعديل التفاصيل</button></div>
      </>}
    </section>{step===0&&<ListingAssistant title={title} description={description} details={details} fields={optionalFields[selected?.name]||[]} photoCount={id&&photoMode==='keep'?savedPhotos.length:photos.length}/>}</div>)}
  </Page>;
}
