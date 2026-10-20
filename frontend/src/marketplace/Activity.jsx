import React,{useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {Page,Feedback,useData,validListing,listingStatus} from './common.jsx';
import {amount,statusLabel} from '../ui/Auctions.jsx';
import {useSellerAuctions,linkedAuction,dateLabel} from './sellerData.js';
import {SellerMedia,ListingReason} from './SellerPresentation.jsx';

export function Activity(){
  const {session}=useAuth(),userId=session.user.id;
  const listings=useData('/api/v1/me/items',v=>Array.isArray(v)&&v.every(item=>validListing(item)&&item.seller_id===userId),30000);
  const auctions=useSellerAuctions(true,true);
  const [filter,setFilter]=useState('ALL');
  const owned=auctions.data.filter(a=>a.seller_id===userId),participated=auctions.data.filter(a=>a.seller_id!==userId);
  const shown=listings.data?.filter(item=>filter==='ALL'||item.status===filter);
  return <Page title="مزاداتي" trail="حسابي / مزاداتي" node="9:3">
    <div className="seller-dashboard">
      <p className="section-description">أضف معروضًا جديدًا وتابع حالة الإعلانات والمزادات.</p>
      <div className="workspace-actions seller-dashboard-actions"><a className="button primary" href="#listing/new">أنشئ مزادًا جديدًا</a><a className="button secondary" href="#private">الدخول إلى مزاد خاص</a>{session.user.role==='ADMIN'&&<a className="button secondary" href="#admin">مراجعة الإعلانات</a>}</div>
      <section className="seller-listings" aria-labelledby="seller-listings-title"><h2 id="seller-listings-title">إعلاناتي</h2>
        <p className="section-description">تُراجع الإعلانات أولًا. اعتماد الإعلان يتيح إعداد المزاد ولا ينشئه تلقائيًا.</p>
        <Feedback {...listings}/>
        {listings.data&&<><div className="seller-status-filters" aria-label="تصفية حالات الإعلانات">{[['ALL','الكل'],['PENDING_REVIEW','قيد المراجعة'],['APPROVED','معتمدة'],['REJECTED','تحتاج تعديلًا']].map(([value,label])=><button key={value} type="button" className="button secondary" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label} <bdi dir="ltr">({value==='ALL'?listings.data.length:listings.data.filter(item=>item.status===value).length})</bdi></button>)}</div>
          {!listings.data.length?<p className="empty-state">لم تضف إعلانًا بعد.</p>:!shown.length?<p className="empty-state">لا توجد إعلانات بهذه الحالة.</p>:shown.map(item=>{
            const auction=linkedAuction(owned,item.id,userId);
            return <article className="seller-record seller-listing-record" key={item.id}><div className="seller-record-copy"><h3>{item.title}</h3><p className="status-pill">حالة الإعلان: {listingStatus(item.status)}</p>
              {item.status==='PENDING_REVIEW'&&<p>بانتظار قرار المشرف. لا يمكن إنشاء المزاد قبل الاعتماد.</p>}
              {item.status==='APPROVED'&&<p>{auction?'أُنشئ مزاد لهذا الإعلان. تابع حالته ضمن مزاداتي.':'تم اعتماد الإعلان. تحقق من حالته للمتابعة إلى إعداد المزاد.'}</p>}
              {item.status==='REJECTED'&&<ListingReason reason={item.review_reason}/>}
              <a className="button secondary" href={'#listing/'+item.id}>عرض الإعلان</a></div><SellerMedia images={auction?.images} title={item.title}/></article>;
          })}</>}
      </section>
      <section className="seller-auctions" aria-labelledby="seller-auctions-title"><h2 id="seller-auctions-title">المزادات التي أنشأتها</h2><Feedback {...auctions}/>
        {auctions.failure&&auctions.data.length>0&&<p className="field-hint">قد لا تعكس البيانات المعروضة آخر تحديث. أعد المحاولة للتحقق.</p>}
        {auctions.complete&&!owned.length&&<p className="empty-state">لم تنشئ مزادًا بعد.</p>}
        {owned.map(a=><article className="seller-record" key={a.id}><div className="seller-record-copy"><h3>{a.title}</h3><p className="status-pill">حالة المزاد: {statusLabel(a.status)}{a.visibility==='PRIVATE'?' • خاص':a.visibility==='PUBLIC'?' • عام':''}</p>
          <p>{a.status==='SCHEDULED'&&Number(a.starting_price)>0?'سعر البداية':'السعر الحالي'}: <bdi dir="ltr">{amount(a.status==='SCHEDULED'&&Number(a.starting_price)>0?a.starting_price:a.current_price)}</bdi> ر.س</p>
          <p className="field-hint">{a.status==='SCHEDULED'?'البداية: '+dateLabel(a.start_time):'النهاية: '+dateLabel(a.end_time)}</p>
          <a className="button secondary" href={'#auction/'+a.id}>عرض المزاد</a></div><SellerMedia images={a.images} title={a.title}/></article>)}
      </section>
      {participated.length>0&&<section className="seller-participations" aria-labelledby="seller-participations-title"><h2 id="seller-participations-title">مشاركاتي في مزادات الآخرين</h2><p className="section-description">هذه مشاركات بالمزايدة وليست مزادات تملكها.</p>{participated.map(a=><article className="activity-row" key={a.id}><div><h3>{a.title}</h3><p className="status-pill">{statusLabel(a.status)}</p></div><a className="button secondary" href={'#auction/'+a.id}>عرض المزاد</a></article>)}</section>}
    </div>
  </Page>;
}
export function ListingDetails({id,admin=false}){
  const {session}=useAuth(),userId=session.user.id;
  const item=useData('/api/v1/items/'+id,v=>validListing(v)&&v.id===id);
  const owned=item.data?.seller_id===userId,approved=owned&&item.data?.status==='APPROVED';
  const auctions=useSellerAuctions(approved),existing=linkedAuction(auctions.data,id,userId);
  if(item.data&&!owned&&!admin)return <Page title="الإعلان غير متاح"><p role="alert">لا تملك صلاحية عرض هذا الإعلان.</p></Page>;
  const rejected=item.data?.status==='REJECTED',pending=item.data?.status==='PENDING_REVIEW';
  const node=rejected?(item.data.category_fields?.letters?'430:103':'421:151'):pending?'9:159':'421:103';
  return <Page title={rejected?'لم يُعتمد الإعلان':pending?'الإعلان قيد المراجعة':'إعلان معتمد'} trail="مزاداتي / حالة الإعلان" node={node}>
    <Feedback {...item}/>
    {item.data&&<><p className="section-description">{rejected?'راجع ملاحظة المراجعة وحدّث الإعلان قبل إرساله مجددًا.':pending?'تم إرسال الإعلان للمشرف. انتظر قرار المراجعة قبل إعداد المزاد.':'يمكنك إعداد المزاد بعد اعتماد الإعلان.'}</p>
      <section className="seller-outcome" aria-label="حالة الإعلان"><div className="seller-outcome-copy"><h2>{item.data.title}</h2><p className="status-pill">حالة الإعلان: {listingStatus(item.data.status)}</p>
        <p className="review-copy">{item.data.description}</p>
        {rejected&&<><ListingReason reason={item.data.review_reason}/><p className="section-description">يمكنك مراجعة البيانات واختيار صور أوضح، ثم إرسال الإعلان للمراجعة مجددًا.</p></>}
        {approved&&<><Feedback {...auctions}/>{existing?<p className="seller-existing-notice" role="status">أُنشئ مزاد لهذا الإعلان بالفعل. حالته: {statusLabel(existing.status)}.</p>:auctions.failure&&<p className="field-hint">تعذر التحقق من وجود مزاد سابق. سيتحقق الخادم عند إرسال الإعدادات.</p>}</>}
        <div className="workspace-actions seller-outcome-actions">{approved&&(existing?<a className="button primary" href={'#auction/'+existing.id}>عرض المزاد</a>:!auctions.loading&&<a className="button primary" href={'#auction-new/'+id}>إعداد المزاد</a>)}{rejected&&owned&&<a className="button primary" href={'#listing-edit/'+id}>تعديل وإعادة إرسال</a>}<a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
      </div><SellerMedia images={existing?.images} title={item.data.title} large/>
      </section>
    </>}
  </Page>;
}
