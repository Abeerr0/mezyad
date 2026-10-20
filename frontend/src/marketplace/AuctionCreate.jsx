import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {amount,statusLabel} from '../ui/Auctions.jsx';
import {Page,Field,Feedback,useData,validListing,uuid,money} from './common.jsx';
import {useSellerAuctions,linkedAuction,validSellerAuction,dateLabel} from './sellerData.js';
import {SellerMedia} from './SellerPresentation.jsx';

function validCreated(value,body){
  return uuid(value?.id)&&value.item_id===body.itemId&&value.visibility===body.visibility
    &&['SCHEDULED','ACTIVE','CLOSED'].includes(value.status)
    &&money(value.starting_price)&&Number(value.starting_price)===body.startingPrice
    &&money(value.minimum_increment)&&Number(value.minimum_increment)===body.minimumIncrement
    &&money(value.current_price)&&Number(value.current_price)===body.startingPrice
    &&Number.isFinite(Date.parse(value.start_time))&&Date.parse(value.start_time)===Date.parse(body.startTime)
    &&Number.isFinite(Date.parse(value.end_time))&&Date.parse(value.end_time)===Date.parse(body.endTime)
    &&(body.visibility!=='PRIVATE'||typeof value.accessCode==='string'&&!!value.accessCode.trim());
}
export function AuctionCreate({id}){
  const {request,session}=useAuth();const item=useData('/api/v1/items/'+id,v=>validListing(v)&&v.id===id);
  const allowed=item.data?.status==='APPROVED'&&item.data.seller_id===session.user.id;
  const auctions=useSellerAuctions(allowed),existing=linkedAuction(auctions.data,id,session.user.id);
  const [choosing,setChoosing]=useState(true);
  const [form,setForm]=useState({visibility:'PUBLIC',startingPrice:'',minimumIncrement:'',startTime:'',endTime:''}),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[created,setCreated]=useState(null),[copyFeedback,setCopyFeedback]=useState(''),[duplicate,setDuplicate]=useState(false),[images,setImages]=useState([]),[imageNotice,setImageNotice]=useState('');
  const [imagesLoading,setImagesLoading]=useState(false),imageRequest=useRef(null),mediaIdentity=useRef(null);
  const identity=created?[session.token,session.user.id,id,created.id,created.visibility].join(':'):null;
  mediaIdentity.current=identity;
  const update=e=>setForm({...form,[e.target.name]:e.target.value});
  const refreshCreatedImages=useCallback(async()=>{
    if(!created||mediaIdentity.current!==identity)return;
    imageRequest.current?.abort();const controller=new AbortController();imageRequest.current=controller;setImagesLoading(true);setImageNotice('');
    const current=()=>!controller.signal.aborted&&imageRequest.current===controller&&mediaIdentity.current===identity;
    try{
      const detail=await request('/api/v1/auctions/'+created.id,{signal:controller.signal});
      if(!current())return;
      if(!validSellerAuction(detail)||detail.id!==created.id||detail.item_id!==id||detail.seller_id!==session.user.id||detail.visibility!==created.visibility)throw new ApiError('INVALID_RESPONSE');
      setImages(detail.images);
    }catch{if(current()){setImages([]);setImageNotice('تم إنشاء المزاد، وتعذر تحميل صورته الآن. يمكنك فتح تفاصيله للتحقق.');}}
    finally{if(current())setImagesLoading(false);}
  },[created,id,identity,request,session.user.id]);
  useEffect(()=>{
    setImages([]);setImageNotice('');setImagesLoading(false);
    if(created)void refreshCreatedImages();
    return()=>{imageRequest.current?.abort();imageRequest.current=null;};
  },[refreshCreatedImages]);
  async function submit(e){
    e.preventDefault();if(pending||!allowed||existing||duplicate)return;setFailure('');
    if(!money(form.startingPrice)||!money(form.minimumIncrement)||!Number.isFinite(Date.parse(form.startTime))||!Number.isFinite(Date.parse(form.endTime))||Date.parse(form.endTime)<=Date.parse(form.startTime)){setFailure('أدخل سعرًا وزيادة موجبين، وحدد نهاية للمزاد بعد وقت البداية.');return;}
    setPending(true);
    const body={...form,itemId:id,startingPrice:Number(form.startingPrice),minimumIncrement:Number(form.minimumIncrement),startTime:new Date(form.startTime).toISOString(),endTime:new Date(form.endTime).toISOString()};
    try{
      const value=await request('/api/v1/auctions',{method:'POST',body});
      if(!validCreated(value,body))throw new ApiError('INVALID_RESPONSE');
      setCreated(value);
    }catch(error){
      setFailure(errorMessage(error));
      if(error.code==='DUPLICATE_AUCTION'&&error.status===409){setDuplicate(true);auctions.reload();}
      if(error.code==='NOT_APPROVED'||error.code==='FORBIDDEN')item.reload();
    }finally{setPending(false);}
  }
  function choose(visibility){setForm(value=>({...value,visibility}));setFailure('');setChoosing(false);}
  async function copy(value,label){
    try{await navigator.clipboard.writeText(value);setCopyFeedback('تم نسخ '+label+'.');}
    catch{setCopyFeedback('تعذر النسخ. يمكنك تحديد '+label+' ونسخه يدويًا.');}
  }
  const privateAuction=created?created.visibility==='PRIVATE':form.visibility==='PRIVATE';
  const scheduled=created?.status==='SCHEDULED';
  const ready=allowed&&!auctions.loading&&!existing&&!duplicate;
  const title=created?(scheduled?(privateAuction?'تم جدولة المزاد الخاص':'تم جدولة المزاد'):created.status==='CLOSED'?'تم إنشاء المزاد وحالته منتهية':'تم إنشاء المزاد'):existing||duplicate?'هذا الإعلان مرتبط بمزاد':choosing?'اختر نوع المزاد':privateAuction?'إعداد مزاد خاص':'إعداد مزاد عام';
  const node=created?(privateAuction?'422:128':'421:260'):choosing?'662:90':privateAuction?'422:64':'421:199';
  const invite=created?new URL('#private/'+created.id,window.location.href).href:'';
  return <Page title={title} trail={created?'مزاداتي / حالة المزاد':'مزاداتي / إعلان معتمد / نوع المزاد'} node={node} focusKey={title}>
    <Feedback {...item}/>{failure&&<p className="feedback error" role="alert">{failure}</p>}
    {item.data&&!allowed&&<p role="alert">يمكن إعداد مزاد لإعلان معتمد تملكه فقط.</p>}
    {allowed&&!created&&<><Feedback {...auctions}/>{auctions.failure&&<p className="field-hint">تعذر التحقق من مزاداتك الحالية. سيمنع الخادم إنشاء مزاد ثانٍ لنفس الإعلان.</p>}</>}
    {allowed&&!created&&(existing||duplicate)&&<section className="seller-existing-auction" aria-label="المزاد الموجود"><h2>{item.data.title}</h2>
      <p>{existing?'أُنشئ مزاد لهذا الإعلان بالفعل.':'أفاد الخادم بأن هذا الإعلان مرتبط بمزاد بالفعل. لم يتم إنشاء مزاد آخر.'}</p>
      {existing?<><p className="status-pill">حالة المزاد: {statusLabel(existing.status)}</p><a className="button primary" href={'#auction/'+existing.id}>عرض المزاد</a></>:!auctions.loading&&<p>لم نتمكن من تحديد رابط المزاد من البيانات الحالية. افتح مزاداتي أو أعد التحقق؛ لن نفترض رابطًا غير موثوق.</p>}
      <div className="workspace-actions"><a className="button secondary" href="#activity">العودة إلى مزاداتي</a><button className="button secondary" type="button" disabled={auctions.loading} onClick={auctions.reload}>إعادة التحقق من المزاد</button></div>
    </section>}
    {ready&&choosing&&!created&&<section className="auction-type-choice" aria-label="اختيار نوع المزاد">
      <p className="section-description">تم اعتماد إعلانك. اختر نوع المزاد المناسب لسلعتك للمتابعة إلى الإعدادات.</p>
      <h2 className="approved-item-title">{item.data.title}</h2>
      <div className="auction-type-cards">{[['PUBLIC','عام','يظهر في قائمة المزادات العامة، ويمكن للمستخدمين الاطلاع عليه والمشاركة وفق شروط المزاد.','public'],['PRIVATE','خاص','لا يظهر في المزادات العامة. يتطلب الدخول إليه رمز وصول تشاركه مع المدعوين.','private']].map(([value,label,description,icon])=><article className="auction-type-card" key={value}>
        <img src={'/images/auction-'+icon+'-icon.svg'} alt="" width="56" height="56"/><h3>مزاد {label}</h3><p>{description}</p>
        <button className="button primary" type="button" onClick={()=>choose(value)}>إنشاء مزاد {label}</button>
      </article>)}</div>
      <a className="button secondary" href="#activity">العودة إلى مزاداتي</a>
    </section>}
    {created&&allowed?<><p className="section-description">{privateAuction?'يمكن للمشاركين الدخول باستخدام الرابط ورمز الوصول.':scheduled?'سيبدأ المزاد في الموعد الذي حددته.':'تابع الحالة الحالية من تفاصيل المزاد.'}</p>
      <section className="seller-outcome seller-creation-success" aria-label="نتيجة إنشاء المزاد"><div className="seller-outcome-copy"><h2>{item.data.title}</h2>
        <p className="status-pill">الحالة: {privateAuction?'خاص • ':''}{statusLabel(created.status)==='قريبًا'?'مجدول':statusLabel(created.status)}</p>
        <p role="status">تم إنشاء المزاد بحسب المواعيد التي حددتها.</p>
        <dl className="seller-schedule"><dt>سعر البداية</dt><dd><bdi dir="ltr">{amount(created.starting_price)}</bdi> ر.س</dd><dt>الحد الأدنى للزيادة</dt><dd><bdi dir="ltr">{amount(created.minimum_increment)}</bdi> ر.س</dd><dt>البداية</dt><dd>{dateLabel(created.start_time)}</dd><dt>النهاية</dt><dd>{dateLabel(created.end_time)}</dd></dl>
        {privateAuction?<><p className="section-description">لا يظهر هذا المزاد للعامة. احتفظ برمز الوصول قبل مغادرة الصفحة؛ لا يمكن إعادة عرضه.</p><div className="seller-access-code"><Field label="رمز وصول المزاد الخاص" id="private-created-code"><input id="private-created-code" value={created.accessCode} readOnly dir="ltr"/></Field><button className="button primary" type="button" onClick={()=>copy(created.accessCode,'الرمز')}>نسخ رمز الوصول</button></div>
          <Field label="رابط المزاد الخاص" id="private-created-link"><input id="private-created-link" value={invite} readOnly dir="ltr"/></Field><button className="button primary seller-copy-link" type="button" onClick={()=>copy(invite,'رابط المزاد الخاص')}>نسخ رابط المزاد الخاص</button><p className="field-hint" aria-live="polite">{copyFeedback}</p></>:<p className="section-description">تابع حالته من مزاداتي. يبدأ قبول المزايدات عند بدء المزاد.</p>}
        {imageNotice&&<div className="field-hint"><p>{imageNotice}</p><button className="text-action" type="button" disabled={imagesLoading} onClick={refreshCreatedImages}>إعادة تحميل صور المزاد</button></div>}
        <div className="workspace-actions seller-outcome-actions"><a className="button primary" href={'#auction/'+created.id}>عرض المزاد</a><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
      </div><SellerMedia images={images} title={item.data.title} large onRefresh={refreshCreatedImages}/></section>
    </>:ready&&!choosing&&<form className="workspace-panel form-panel" onSubmit={submit} noValidate><h2>{item.data.title}</h2><p className="section-description">حدّد طريقة الوصول وسعر البداية ومواعيد المزاد.</p>
      <p className="status-pill">نوع المزاد: {form.visibility==='PRIVATE'?'خاص':'عام'}</p>
      <Field label="سعر البداية (ر.س)" id="auction-starting"><input id="auction-starting" name="startingPrice" inputMode="decimal" dir="ltr" value={form.startingPrice} onChange={update} disabled={pending} required/></Field>
      <Field label="الحد الأدنى لزيادة المزايدة (ر.س)" id="auction-increment"><input id="auction-increment" name="minimumIncrement" inputMode="decimal" dir="ltr" value={form.minimumIncrement} onChange={update} disabled={pending} required/></Field>
      <div className="form-columns"><Field label="بداية المزاد" id="auction-start"><input id="auction-start" name="startTime" type="datetime-local" lang="en" dir="ltr" value={form.startTime} onChange={update} disabled={pending} required/></Field><Field label="نهاية المزاد" id="auction-end"><input id="auction-end" name="endTime" type="datetime-local" lang="en" dir="ltr" value={form.endTime} onChange={update} disabled={pending} required/></Field></div>
      <p className="field-hint">المزاد الخاص لا يظهر للعامة ويتطلب رمز وصول. الأوقات وفق المنطقة الزمنية لجهازك.</p>
      <div className="workspace-actions"><button className="button primary" disabled={pending}>{pending?'جارٍ إنشاء المزاد…':form.visibility==='PRIVATE'?'إنشاء مزاد خاص':'إنشاء مزاد عام'}</button><button className="button secondary" type="button" disabled={pending} onClick={()=>setChoosing(true)}>العودة إلى اختيار النوع</button><a className="button secondary" href="#activity">العودة إلى مزاداتي</a></div>
    </form>}
  </Page>;
}
