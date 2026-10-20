import React,{useLayoutEffect,useRef} from 'react';
import {formatAmount,validReceipt,higherAcceptedBid,auctionWindow} from './bidderData.js';

export function BidderOutcome({node,title,itemTitle,children,actions,kind='neutral'}){
  const ref=useRef(null);
  useLayoutEffect(()=>{
    const modal=()=>document.querySelector('[role="dialog"][aria-modal="true"]');
    if(modal())return;
    const focus=()=>{if(ref.current&&!ref.current.closest('[inert]')&&!modal())ref.current.focus({preventScroll:true});};
    // A closing confirmation can remove its inert background after this commit.
    if(ref.current?.closest('[inert]')){const frame=requestAnimationFrame(focus);return()=>cancelAnimationFrame(frame);}
    focus();
  },[]);
  return <main id="main-content" tabIndex={-1} ref={ref} className="content-shell workspace-page" data-design-node={node}><section className={'outcome-panel bidder-outcome bidder-'+kind}><h1>{title}</h1><h2 className="eyebrow">{itemTitle}</h2>{children}<div className="workspace-actions">{actions}</div></section></main>;
}
export function BidPosition({receipt,auction,userId,history,standalone=false}){
  const windowState=auctionWindow(auction);
  if(windowState!=='open'){
    if(!standalone)return null;
    const closed=auction.status==='CLOSED',expired=windowState==='closed';
    return <BidderOutcome node="7:211" title={closed?'انتهى المزاد':expired?'انتهى وقت المزايدة':'لم يبدأ المزاد بعد'} itemTitle={auction.title} actions={<>{closed&&<a className="button primary" href={'#result/'+auction.id}>عرض نتيجة المزاد</a>}<a className="button secondary" href={'#auction/'+auction.id}>عرض تفاصيل المزاد</a></>}><p>{closed?'أغلق الخادم المزاد. يمكنك مراجعة النتيجة النهائية.':expired?'انتهى موعد المزاد. ننتظر تأكيد الإغلاق والنتيجة من الخادم.':'تبدأ المزايدة بعد حلول الموعد وتأكيد أهلية المشاركة.'}</p></BidderOutcome>;
  }
  if(!higherAcceptedBid(receipt,auction,userId,history))return null;
  const copy=<><p>توجد مزايدة مقبولة أعلى من مزايدتك المحفوظة. راجع السعر الحالي قبل إضافة مزايدة جديدة.</p><p className="field-hint">لا يحدد السجل المتاح هوية صاحب المزايدة الأعلى.</p></>;
  if(standalone)return <BidderOutcome node="7:211" title="تم تجاوز مزايدتك" itemTitle={auction.title} actions={<><a className="button primary" href={'#bid/'+auction.id}>مراجعة السعر وإضافة مزايدة</a><a className="button secondary" href={'#auction/'+auction.id}>العودة إلى المزاد</a></>}>{copy}</BidderOutcome>;
  return <aside className="bidder-position" role="status" data-design-node="7:211"><h2>تم تجاوز مزايدتك</h2>{copy}<a className="button secondary" href={'#outbid/'+auction.id}>عرض حالة المزايدة</a></aside>;
}
export function ReceiptCopy({receipt,id,userId}){
  return validReceipt(receipt,id,userId)?<p role="status">تم قبول مزايدتك بقيمة <bdi dir="ltr">{formatAmount(receipt.amount)}</bdi> ر.س. تابع المزاد لمعرفة النتيجة.</p>:<p>لا يتوفر تأكيد قبول شخصي لهذه المزايدة في الجلسة الحالية. راجع سجل المزاد دون افتراض نجاح طلب سابق.</p>;
}
