import {uuid,validListing} from './common.jsx';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function sameFields(a,b){
  if(a===b)return true;
  if(!object(a)||!object(b))return false;
  const keys=Object.keys(a).sort(),other=Object.keys(b).sort();
  return keys.length===other.length&&keys.every((key,i)=>key===other[i]&&(object(a[key])?sameFields(a[key],b[key]):JSON.stringify(a[key])===JSON.stringify(b[key])));
}
export const validItemRecord=value=>validListing(value)&&uuid(value.seller_id)&&uuid(value.category_id)&&object(value.category_fields);
export const sameItemContent=(a,b)=>validItemRecord(a)&&validItemRecord(b)&&a.id===b.id&&a.seller_id===b.seller_id&&a.category_id===b.category_id&&a.title===b.title&&a.description===b.description&&sameFields(a.category_fields,b.category_fields);
export const validReviewRecord=value=>validItemRecord(value)&&(value.status==='PENDING_REVIEW'||(uuid(value.reviewed_by)&&Number.isFinite(Date.parse(value.reviewed_at))&&(value.status!=='REJECTED'||typeof value.review_reason==='string'&&!!value.review_reason.trim())));
