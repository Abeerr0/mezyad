import {uuid,validAuction,useData} from './common.jsx';
import {validReviewRecord} from './listingContract.js';
export const validCategories=value=>Array.isArray(value)&&value.every(c=>uuid(c.id)&&typeof c.name==='string'&&!!c.name.trim())&&new Set(value.map(c=>c.id)).size===value.length;
export const validPending=value=>Array.isArray(value)&&value.every(item=>validReviewRecord(item)&&item.status==='PENDING_REVIEW')&&new Set(value.map(item=>item.id)).size===value.length;
export const validPublicAuctions=value=>Array.isArray(value)&&value.every(a=>validAuction(a)&&uuid(a.item_id)&&Number(a.starting_price)>0&&Number.isFinite(Date.parse(a.start_time))&&Number.isFinite(Date.parse(a.end_time)))&&new Set(value.map(a=>a.id)).size===value.length;
export const auctionLabels={SCHEDULED:'مزاد مجدول',ACTIVE:'مزاد جارٍ',CLOSED:'مزاد مغلق'};
export const dateLabel=value=>Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short',calendar:'gregory'}).format(new Date(value)):'غير متاح';
export function usePending(){return useData('/api/v1/items?status=PENDING_REVIEW',validPending);}
export function useCategories(){return useData('/api/v1/categories',validCategories);}
export function usePublicAuctions(poll=0){return useData('/api/v1/auctions',validPublicAuctions,poll);}
