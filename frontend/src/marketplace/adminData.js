import {validResult,cents} from './bidderData.js';
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

const count=v=>Number.isSafeInteger(v)&&v>=0;
export const validDashboard=v=>v&&['pendingReview','approved','rejected'].every(k=>count(v.listings?.[k]))&&['scheduled','active','closed'].every(k=>count(v.auctions?.[k]))&&count(v.bids?.count);
export const validMonitored=value=>validPublicAuctions(value)&&value.every(a=>['PUBLIC','PRIVATE'].includes(a.visibility)&&count(a.bid_count)&&count(a.bidder_count)&&(a.result===null||(validResult(a.result)&&(a.result.winner_bid_id===null||cents(a.result.winning_amount)!==null))));
export function useDashboard(){return useData('/api/v1/admin/dashboard',validDashboard,5000);}
export function useMonitored(status='ALL',visibility='ALL',offset=0,limit=6){
  const path='/api/v1/admin/auctions?limit='+limit+'&offset='+offset+(status==='ALL'?'':'&status='+status)+(visibility==='ALL'?'':'&visibility='+visibility);
  return useData(path,v=>v&&validMonitored(v.data)&&v.meta?.limit===limit&&v.meta?.offset===offset,5000,{responseMeta:true});
}
