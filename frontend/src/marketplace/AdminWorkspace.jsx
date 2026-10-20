import React,{useState} from 'react';
import {safeImage} from '../ui/Auctions.jsx';
import {AdminAccess,AdminPage,PendingCards} from './AdminShell.jsx';
import {Feedback,useData,validAuction,uuid} from './common.jsx';
import {usePending,useCategories,usePublicAuctions,auctionLabels,dateLabel} from './adminData.js';

export function AdminDashboard(){return <AdminAccess><Dashboard/></AdminAccess>;}
function Dashboard(){
  const pending=usePending(),catalog=useCategories(),auctions=usePublicAuctions();
  return <AdminPage title="لوحة تحكم المشرف" active="dashboard" node="612:28"><p className="section-description">راجع الإعلانات قبل إعداد المزادات، وتابع حالات المزادات ونتائجها.</p><div className="admin-stats" aria-label="ملخص لوحة المشرف">{[
    ['الإعلانات بانتظار المراجعة',pending.data?.length,pending.loading],['الإعلانات المعتمدة',null,false],['الإعلانات المرفوضة',null,false],['المزادات العامة الجارية',auctions.data?.filter(a=>a.status==='ACTIVE').length,auctions.loading]
  ].map(([label,value,loading])=><section className="admin-stat" key={label}><h2>{label}</h2><strong>{loading?'…':value??'غير متاح'}</strong>{value==null&&!loading&&<p>لا يتوفر إجمالي موثوق حاليًا.</p>}</section>)}</div><section className="admin-pending-section"><div className="admin-section-heading"><h2>الإعلانات بانتظار المراجعة</h2><a href="#admin" className="text-action">عرض جميع الإعلانات</a></div><Feedback {...pending}/><Feedback {...catalog}/>{pending.data&&<PendingCards items={pending.data} categories={catalog.data||[]}/>}</section><Feedback {...auctions}/><p className="admin-note">الموافقة تعتمد الإعلان فقط؛ بعدها يختار البائع نوع المزاد ويُدخل إعداداته بنفسه.</p></AdminPage>;
}
export function AdminAuctions({id}){return <AdminAccess>{id?<AuctionStatus key={id} id={id}/>:<Monitoring/>}</AdminAccess>;}
function Monitoring(){
  const auctions=usePublicAuctions(5000),[filter,setFilter]=useState('ALL');
  const visible=auctions.data?.filter(a=>filter==='ALL'||a.status===filter);
  return <AdminPage title="متابعة حالات المزادات" active="auctions" node="425:9"><p className="section-description">تابع المزادات المجدولة والجارية والمغلقة ونتائجها.</p><p className="admin-note">تعرض هذه القائمة المزادات العامة فقط. متابعة جميع المزادات الخاصة غير متاحة في الخدمة الحالية.</p><div className="admin-filters" aria-label="تصفية حالات المزادات">{[['ALL','الكل'],...Object.entries(auctionLabels)].map(([value,label])=><button className="button secondary" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div><Feedback {...auctions}/>{visible?.length===0&&<p className="empty-state">لا توجد مزادات ضمن هذه الحالة.</p>}<div className="admin-list">{visible?.map(a=><article className="admin-listing-row" key={a.id}>{safeImage(a.image_url)?<img className="admin-auction-image" src={safeImage(a.image_url)} alt={a.title}/>:<div className="admin-image-unavailable">لا تتوفر صورة للمعروض</div>}<div className="admin-row-copy"><div className="admin-title-line"><h2>{a.title}</h2><span className="admin-status">{auctionLabels[a.status]}</span></div><p>مزاد عام</p><p>{a.status==='SCHEDULED'?'السعر الابتدائي':'السعر الحالي'}: {Number(a.status==='SCHEDULED'?a.starting_price:a.current_price).toLocaleString('en-US')} ر.س</p></div><a className="button secondary" href={'#admin-auctions/'+a.id}>عرض الحالة والنتيجة</a></article>)}</div><div className="workspace-actions"><a className="button secondary" href="#admin-dashboard">العودة إلى لوحة التحكم</a></div></AdminPage>;
}
function AuctionStatus({id}){
  const list=usePublicAuctions(5000);
  const known=list.data?.find(a=>a.id===id);
  return <AdminPage title="حالة المزاد ونتيجته" active="auctions" node="612:32"><Feedback {...list}/>{list.data&&!known&&<p className="feedback error" role="alert">هذا المزاد غير موجود ضمن المزادات العامة المتاحة للمراقبة.</p>}{known&&<StatusDetails id={id} known={known}/>}<div className="workspace-actions"><a className="button secondary" href="#admin-auctions">العودة إلى متابعة المزادات</a><a className="button secondary" href="#admin-dashboard">العودة إلى لوحة التحكم</a></div></AdminPage>;
}
function StatusDetails({id,known}){
  const detail=useData('/api/v1/auctions/'+id,v=>validAuction(v)&&v.id===id&&v.item_id===known.item_id&&v.visibility==='PUBLIC'&&Number(v.starting_price)>0&&(v.result===null||v.result&&Number.isFinite(Date.parse(v.result.closed_at))&&(v.result.winner_bid_id===null||uuid(v.result.winner_bid_id))),5000);
  const a=detail.data;
  return <><Feedback {...detail}/>{a&&<section className="admin-result-card"><span className="admin-status">{auctionLabels[a.status]}</span><h2>{a.title}</h2><p>مزاد عام</p><dl className="workspace-summary"><dt>السعر الابتدائي</dt><dd>{Number(a.starting_price).toLocaleString('en-US')} ر.س</dd><dt>السعر الحالي</dt><dd>{Number(a.current_price).toLocaleString('en-US')} ر.س</dd><dt>وقت البداية</dt><dd>{dateLabel(a.start_time)}</dd><dt>وقت النهاية</dt><dd>{dateLabel(a.end_time)}</dd></dl>{a.status==='CLOSED'?(a.result?<div className="admin-note"><h3>{a.result.winner_bid_id?'أُغلق المزاد مع مزايدة فائزة':'انتهى المزاد دون مزايدات'}</h3>{a.result.winner_bid_id&&<p>معرّف المزايدة الفائزة: <bdi className="admin-reference">{a.result.winner_bid_id}</bdi></p>}<p>وقت الإغلاق: {dateLabel(a.result.closed_at)}</p></div>:<p>نتيجة الإغلاق غير متاحة بعد.</p>):<p>تظهر النتيجة بعد إغلاق المزاد؛ لا توجد نتيجة نهائية الآن.</p>}</section>}</>;
}
