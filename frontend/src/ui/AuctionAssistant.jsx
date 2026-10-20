import React, {useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError} from '../api.js';
import {Page,Feedback,useData,validAuction} from '../marketplace/common.jsx';
import {cents,useBidderAuction,validHistory} from '../marketplace/bidderData.js';
import {Countdown,amount,categories,statusLabel} from './Auctions.jsx';
import './assistant.css';

export const validPublicCatalog=value=>Array.isArray(value)&&value.every(a=>validAuction(a)
  &&cents(a.current_price)!==null&&typeof a.category_name==='string'
  &&(a.visibility===undefined||a.visibility==='PUBLIC'))
  &&new Set(value.map(a=>a.id)).size===value.length;
const price=value=>value===''?null:/^\d+(?:\.\d{1,2})?$/.test(value)&&Number.isFinite(Number(value))?Number(value):NaN;
export function filterPublicAuctions(rows,category,minimum,maximum){
  const min=price(minimum),max=price(maximum);
  if(Number.isNaN(min)||Number.isNaN(max)||(min!==null&&max!==null&&min>max))return null;
  return rows.filter(a=>(!category||a.category_name===category)
    &&(min===null||Number(a.current_price)>=min)&&(max===null||Number(a.current_price)<=max));
}

export function AuctionAssistant({id}){
  const catalog=useData('/api/v1/auctions',validPublicCatalog,5000);
  const [selected,setSelected]=useState(id||''),[category,setCategory]=useState(''),[minimum,setMinimum]=useState(''),[maximum,setMaximum]=useState('');
  const rows=filterPublicAuctions(catalog.data||[],category,minimum,maximum);
  const names=[...new Set((catalog.data||[]).map(a=>a.category_name))];
  const available=rows?.some(a=>a.id===selected);
  return <Page title="مساعد المزاد" trail="المزادات / مساعد المزاد" node="425:105">
    <p className="section-description">معلومات مختصرة من المزادات العامة وسجل المزايدات.</p>
    <Feedback {...catalog}/>
    <div className="assistant-grid">
      <section className="assistant-card assistant-search" aria-labelledby="assistant-search-heading">
        <h2 id="assistant-search-heading">البحث في المزادات العامة</h2><p className="assistant-value">الفئة • نطاق السعر</p>
        <p>تظهر المزادات العامة فقط؛ لا يشمل البحث المزادات الخاصة. التصفية حسب السعر الحالي من الخادم.</p>
        <div className="assistant-fields"><div><label htmlFor="assistant-category">الفئة</label><select id="assistant-category" value={category} onChange={e=>{setCategory(e.target.value);setSelected('');}}><option value="">جميع الفئات المتاحة</option>{names.map(name=><option key={name} value={name}>{categories.find(c=>c.name===name)?.label||name}</option>)}</select></div>
          <div><label htmlFor="assistant-minimum">السعر من (ر.س)</label><input id="assistant-minimum" inputMode="decimal" value={minimum} onChange={e=>{setMinimum(e.target.value);setSelected('');}} aria-invalid={rows===null}/></div>
          <div><label htmlFor="assistant-maximum">السعر إلى (ر.س)</label><input id="assistant-maximum" inputMode="decimal" value={maximum} onChange={e=>{setMaximum(e.target.value);setSelected('');}} aria-invalid={rows===null}/></div>
        </div>
        {rows===null&&<p className="field-error" role="alert">أدخل نطاق سعر صحيحًا، بحيث لا يتجاوز الحد الأدنى الحد الأعلى.</p>}
        <label htmlFor="assistant-auction">اختر المزاد العام</label><select id="assistant-auction" value={available?selected:''} disabled={!rows?.length||!!catalog.failure} onChange={e=>setSelected(e.target.value)}><option value="">اختر مزادًا لعرض ملخصه</option>{rows?.map(a=><option value={a.id} key={a.id}>{a.title}</option>)}</select>
        {catalog.data&&!catalog.failure&&rows?.length===0&&<p className="empty-state">لا توجد مزادات عامة تطابق هذه الخيارات.</p>}
        {selected&&catalog.data&&!available&&!catalog.failure&&<p className="feedback error" role="alert">المزاد المطلوب غير متاح في القائمة العامة. اختر مزادًا متاحًا.</p>}
        <p className="field-hint">تصفية الموقع غير متاحة في بيانات المزادات الحالية.</p>
      </section>
      {available&&!catalog.failure?<PublicInsights key={selected} id={selected}/>:<>
        <AssistantPlaceholder title="ملخص النشاط"/><AssistantPlaceholder title="اتجاه النشاط"/><AssistantPlaceholder title="ملخص المزاد"/>
      </>}
    </div>
    <div className="workspace-actions assistant-actions"><a className="button secondary" href="#auctions">العودة إلى المزادات</a><a className="button secondary" href="#account">العودة إلى حسابي</a></div>
  </Page>;
}
function AssistantPlaceholder({title}){return <section className="assistant-card"><h2>{title}</h2><p>اختر مزادًا عامًا لعرض المعلومات المتاحة.</p></section>;}
function PublicInsights({id}){
  const detail=useBidderAuction(id);
  if(detail.failure)return <section className="assistant-card"><h2>ملخص المزاد</h2><Feedback {...detail}/></section>;
  if(!detail.data)return <section className="assistant-card"><h2>ملخص المزاد</h2><p role="status">جارٍ تحميل بيانات المزاد…</p></section>;
  if(detail.data.visibility!=='PUBLIC')return <section className="assistant-card"><h2>ملخص المزاد</h2><p role="alert">المزاد غير متاح للعرض العام.</p></section>;
  return <PublicHistory auction={detail.data}/>;
}
function PublicHistory({auction}){
  const {status}=useAuth();
  // This component is reached only after the detail response proves PUBLIC.
  const history=useData('/api/v1/auctions/'+auction.id+'/bids',value=>{if(status!=='authenticated')throw new ApiError('UNAUTHORIZED');return validHistory(value);},5000);
  const latest=history.data?.reduce((last,bid)=>!last||Date.parse(bid.created_at)>Date.parse(last.created_at)?bid:last,null);
  return <>
    <section className="assistant-card"><h2>ملخص النشاط</h2><Feedback {...history}/>{history.data&&!history.failure&&<><p className="assistant-value"><bdi>{history.data.length}</bdi> مزايدة معروضة</p><p>يعرض السجل آخر 100 مزايدة كحد أقصى. عدد المزايدين المختلفين غير متاح.</p></>}</section>
    <section className="assistant-card"><h2>اتجاه النشاط</h2>{history.failure?<p>تعذر التحقق من آخر حركة.</p>:history.loading&&!history.data?<p role="status">جارٍ تحميل سجل المزايدات…</p>:latest?<><p className="assistant-value">آخر مزايدة مسجلة</p><p><time dateTime={latest.created_at}>{new Date(latest.created_at).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory'})}</time></p><p><bdi dir="ltr">{amount(latest.amount)}</bdi> ر.س</p></>:<p>لم تُسجّل مزايدات في هذا المزاد بعد.</p>}<p className="field-hint">عرض وصفي للسجل المتاح، دون توقع لسعر أو نتيجة.</p></section>
    <section className="assistant-card"><h2>ملخص المزاد</h2><h3>{auction.title}</h3><p className="assistant-value"><bdi dir="ltr">{amount(auction.current_price)}</bdi> ر.س</p><p>مزاد {statusLabel(auction.status)}</p><Countdown endTime={auction.end_time} startTime={auction.start_time} status={auction.status}/><p>{auction.status==='SCHEDULED'?'الوقت حتى بداية المزاد.':'الوقت حتى نهاية المزاد.'}</p><a className="button secondary" href={'#auction/'+auction.id}>عرض تفاصيل المزاد</a></section>
  </>;
}
