import React from 'react';
import {safeImage} from '../ui/Auctions.jsx';
import './seller.css';

export function SellerMedia({images=[],title,large=false}){
  const src=images.map(safeImage).find(Boolean);
  return src?<img className={'seller-media'+(large?' seller-media-large':'')} src={src} alt={title}/>
    :<div className={'seller-media seller-media-empty'+(large?' seller-media-large':'')}><span>لا تتوفر صورة للمعروض</span></div>;
}
export function ListingReason({reason}){
  return <aside className="seller-review-note" aria-label="ملاحظة المراجعة"><h3>ملاحظة المراجعة</h3>
    <p>{typeof reason==='string'&&reason.trim()?reason:'لم يُرفق سبب للرفض. راجع المشرف قبل إعادة تقديم الإعلان.'}</p></aside>;
}
