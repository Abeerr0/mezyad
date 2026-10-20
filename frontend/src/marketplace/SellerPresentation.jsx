import React from 'react';
import {safeImage} from '../ui/media.js';
import {ServerImage} from '../ui/MediaGallery.jsx';
import './seller.css';

export function SellerMedia({images=[],title,large=false,onRefresh}){
  const src=images.map(safeImage).find(Boolean);
  return src?<ServerImage className={'seller-media'+(large?' seller-media-large':'')} src={src} alt={title} onRefresh={onRefresh}/>
    :<div className={'seller-media seller-media-empty'+(large?' seller-media-large':'')}><span>لا تتوفر صورة للمعروض</span></div>;
}
export function ListingReason({reason}){
  return <aside className="seller-review-note" aria-label="ملاحظة المراجعة"><h3>ملاحظة المراجعة</h3>
    <p>{typeof reason==='string'&&reason.trim()?reason:'لم يُرفق سبب للرفض. راجع المشرف قبل إعادة تقديم الإعلان.'}</p></aside>;
}

export function ListingAssistant({title,description,details,fields,photoCount}){
  const location=typeof details.location==='string'?details.location.trim():'';
  const extraLocation=location.split(/[،,]/).map(part=>part.trim()).filter(part=>part&&!title.includes(part));
  const suggested=[title.trim(),...extraLocation].filter(Boolean).join('، ').slice(0,240);
  const missing=[!title.trim()&&'عنوان الإعلان',!description.trim()&&'وصف المعروض',...fields.filter(([key])=>details[key]===undefined||details[key]===null||String(details[key]).trim()==='').map(([,label])=>label),!photoCount&&'صور واضحة للمعروض'].filter(Boolean);
  return <aside className="listing-assistant" aria-labelledby="listing-assistant-heading"><h2 id="listing-assistant-heading">مساعد الإعلان</h2><p>اقتراحات تساعدك أثناء كتابة الإعلان.</p><h3>عنوان مقترح</h3><p className="listing-title-suggestion">{suggested||'أدخل عنوان المعروض لعرض اقتراح من بياناتك.'}</p><h3>اكتمال المعلومات</h3><p>{missing.length?'راجع وأضف: '+missing.join('، ')+'.':'أدخلت بيانات المسودة وصورها. راجع دقتها قبل إرسالها للمراجعة.'}</p><p className="field-hint">هذه مراجعة للمسودة فقط، ولا تعني حفظ الإعلان أو اعتماد معلوماته.</p></aside>;
}
