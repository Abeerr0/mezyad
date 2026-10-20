import React,{useState} from 'react';
import {Page,Feedback,useData,validAuction} from './common.jsx';
import {amount,statusLabel} from '../ui/Auctions.jsx';

const count=n=>Number.isInteger(n)&&n>=0;
export function AdminDashboard(){
  const [status,setStatus]=useState(''),[visibility,setVisibility]=useState(''),[page,setPage]=useState(0);
  const dashboard=useData('/api/v1/admin/dashboard',v=>v&&count(v.listings?.pendingReview)&&count(v.listings?.approved)&&count(v.listings?.rejected)&&count(v.auctions?.scheduled)&&count(v.auctions?.active)&&count(v.auctions?.closed)&&count(v.bids?.count),5000);
  const params=new URLSearchParams({limit:'50',offset:String(page*50)});
  if(status)params.set('status',status);if(visibility)params.set('visibility',visibility);
  const auctions=useData('/api/v1/admin/auctions?'+params,v=>Array.isArray(v)&&v.every(a=>validAuction(a)&&['PUBLIC','PRIVATE'].includes(a.visibility)&&count(a.bid_count)&&count(a.bidder_count)),5000);
  const summary=dashboard.data;
  return <Page title="لوحة المشرف" trail="حسابي / لوحة المشرف">
    <a className="button primary" href="#admin">مراجعة الإعلانات</a><Feedback {...dashboard}/>
    {summary&&<dl className="workspace-summary"><dt>إعلانات قيد المراجعة</dt><dd>{summary.listings.pendingReview}</dd><dt>إعلانات معتمدة</dt><dd>{summary.listings.approved}</dd><dt>إعلانات مرفوضة</dt><dd>{summary.listings.rejected}</dd><dt>مزادات مجدولة</dt><dd>{summary.auctions.scheduled}</dd><dt>مزادات نشطة</dt><dd>{summary.auctions.active}</dd><dt>مزادات مغلقة</dt><dd>{summary.auctions.closed}</dd><dt>إجمالي المزايدات</dt><dd>{summary.bids.count}</dd></dl>}
    <h2>متابعة المزادات</h2><div className="form-columns workspace-panel">
      <div className="workspace-field"><label htmlFor="monitor-status">حالة المزاد</label><select id="monitor-status" value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}><option value="">كل الحالات</option><option value="SCHEDULED">مجدول</option><option value="ACTIVE">نشط</option><option value="CLOSED">مغلق</option></select></div>
      <div className="workspace-field"><label htmlFor="monitor-visibility">نوع المزاد</label><select id="monitor-visibility" value={visibility} onChange={e=>{setVisibility(e.target.value);setPage(0);}}><option value="">العام والخاص</option><option value="PUBLIC">عام</option><option value="PRIVATE">خاص</option></select></div>
    </div><Feedback {...auctions}/>{auctions.data?.length===0&&<p>لا توجد مزادات تطابق التصفية.</p>}
    {auctions.data?.map(a=><article className="activity-row" key={a.id}><div><h3>{a.title}</h3><p>{a.visibility==='PRIVATE'?'خاص':'عام'} — {statusLabel(a.status)}</p><p>المزايدات: {a.bid_count}، المشاركون: {a.bidder_count}</p>{a.status==='CLOSED'&&a.result&&<p>{a.result.winner_bid_id?'المزايدة الفائزة: '+amount(a.result.winning_amount)+' ر.س':'انتهى دون مزايدات'}</p>}</div><a className="button secondary" href={'#auction/'+a.id}>عرض المزاد</a></article>)}
    <div className="workspace-actions"><button className="button secondary" disabled={!page||auctions.loading} onClick={()=>setPage(p=>p-1)}>السابق</button><span>الصفحة {page+1}</span><button className="button secondary" disabled={auctions.loading||auctions.data?.length!==50} onClick={()=>setPage(p=>p+1)}>التالي</button></div>
  </Page>;
}
