import React,{useEffect,useRef,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {Feedback,useData,Confirm} from './common.jsx';
import {AdminAccess,AdminPage,ItemStatus,PendingCards} from './AdminShell.jsx';
import {usePending,useCategories,dateLabel} from './adminData.js';
import {validReviewRecord,sameItemContent} from './listingContract.js';
import {labelFor} from './ListingForm.jsx';

const fieldLabels={name:'اسم المعروض',age:'العمر',location:'الموقع',area:'المساحة (م²)',make:'الشركة',model:'الطراز',year:'سنة الصنع',letters:'الحروف',number:'الرقم',brand:'العلامة'};
export function AdminReview({id}){return <AdminAccess>{id?<ReviewItem key={id} id={id}/>:<PendingQueue/>}</AdminAccess>;}
function PendingQueue(){
  const data=usePending(),catalog=useCategories();
  return <AdminPage title="الإعلانات قيد المراجعة" node="421:2"><p className="section-description">راجع كل إعلان قبل اتخاذ قرار الموافقة أو الرفض.</p><Feedback {...data}/><Feedback {...catalog}/>{data.data&&<PendingCards items={data.data} categories={catalog.data||[]}/>}<div className="workspace-actions"><a className="button secondary" href="#admin-dashboard">العودة إلى لوحة التحكم</a><button className="button secondary" disabled={data.loading} onClick={data.reload}>تحديث القائمة</button></div></AdminPage>;
}
function ReviewItem({id}){
  const {request,session}=useAuth(),catalog=useCategories();
  const data=useData('/api/v1/items/'+id,v=>validReviewRecord(v)&&v.id===id);
  const [current,setCurrent]=useState(null),[decision,setDecision]=useState(null),[reason,setReason]=useState(''),[validation,setValidation]=useState(''),[phase,setPhase]=useState('ready'),[notice,setNotice]=useState(''),[ownDecision,setOwnDecision]=useState(false),[denied,setDenied]=useState(false);
  const busy=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const item=current||data.data;
  async function readCurrent(){
    const value=await request('/api/v1/items/'+id);
    if(!validReviewRecord(value)||value.id!==id)throw new ApiError('INVALID_RESPONSE');
    return value;
  }
  // Read-only reconciliation: an uncertain POST is never retried automatically.
  async function reconcile(){
    if(alive.current)setPhase('verifying');
    try{
      const value=await readCurrent();if(!alive.current)return;
      setCurrent(value);setOwnDecision(false);setPhase('ready');
      setNotice(value.status==='PENDING_REVIEW'?'تحققنا من الخادم: الإعلان ما زال قيد المراجعة. راجع تفاصيله قبل تأكيد قرار جديد.':'تم التحقق من الحالة الحالية في الخادم. قد يكون القرار حُفظ سابقًا أو اتخذه مشرف آخر.');
    }catch(error){if(alive.current){setPhase('uncertain');if(error.status===403)setDenied(true);setNotice('تعذر تأكيد حالة الإعلان. لن يُرسل قرار آخر قبل التحقق من حالته. '+errorMessage(error));}}
  }
  async function verify(){if(busy.current)return;busy.current=true;try{await reconcile();}finally{busy.current=false;}}
  async function review(){
    if(busy.current||phase!=='ready'||denied||!item||item.status!=='PENDING_REVIEW'||!decision)return;
    if(decision==='REJECTED'&&!reason.trim()){setValidation('أدخل سببًا واضحًا لرفض الإعلان.');return;}
    busy.current=true;setPhase('sending');setValidation('');setNotice('');
    let submitted=false;
    try{
      // Recheck eligibility and content under the existing API before writing.
      const fresh=await readCurrent();if(!alive.current)return;
      if(fresh.status!=='PENDING_REVIEW'||!sameItemContent(item,fresh)){
        setCurrent(fresh);setOwnDecision(false);setNotice(fresh.status==='PENDING_REVIEW'?'تغيرت تفاصيل الإعلان. راجع المعلومات المحدثة قبل اتخاذ قرار.':'هذا الإعلان لم يعد قيد المراجعة. نعرض حالته الحالية من الخادم.');setPhase('ready');return;
      }
      submitted=true;
      const value=await request('/api/v1/admin/items/'+id+'/review',{method:'POST',body:{decision,...(decision==='REJECTED'?{reason:reason.trim()}:{})}});
      if(!validReviewRecord(value)||!sameItemContent(fresh,value)||value.status!==decision||value.reviewed_by!==session.user.id||(decision==='REJECTED'&&value.review_reason!==reason.trim()))throw new ApiError('INVALID_RESPONSE');
      if(alive.current){setCurrent(value);setOwnDecision(true);setPhase('ready');}
    }catch(error){
      if(!alive.current)return;
      if(error.status===403){setDenied(true);setNotice('لم يعد متاحًا اتخاذ قرار بهذه الجلسة. سجّل الدخول بحساب مشرف مخوّل.');setPhase('uncertain');}
      else if(submitted){setNotice('تعذر تأكيد حفظ القرار. نتحقق من حالة الإعلان قبل السماح بمحاولة جديدة.');await reconcile();}
      else{setPhase('uncertain');setNotice('تعذر التحقق من حالة الإعلان قبل الإرسال؛ لم نرسل قرارًا. '+errorMessage(error));}
    }finally{busy.current=false;if(alive.current)setDecision(null);}
  }
  const terminal=item&&item.status!=='PENDING_REVIEW';
  const locked=phase!=='ready'||denied;
  return <AdminPage title={terminal?'نتيجة مراجعة الإعلان':'مراجعة الإعلان'} node={terminal?'612:31':'421:52'}><Feedback {...data}/><Feedback {...catalog}/>
    {notice&&<div className="feedback admin-notice" role="alert"><p>{notice}</p>{phase==='uncertain'&&!denied&&<button className="button secondary" onClick={verify}>تحقق من حالة الإعلان</button>}</div>}
    {phase==='verifying'&&<p role="status">جارٍ التحقق من حالة الإعلان في الخادم…</p>}
    {item&&(terminal?<section className="admin-result-card"><ItemStatus value={item.status}/><h2>{item.title}</h2><p role="status">{ownDecision?(item.status==='APPROVED'?'تمت الموافقة على الإعلان بنجاح، ويمكن للبائع الآن إعداد المزاد.':'تم رفض الإعلان وإعادته إلى البائع للتعديل.'):'الحالة الحالية للإعلان: '+(item.status==='APPROVED'?'معتمد، ويمكن للبائع إعداد المزاد.':'مرفوض ويحتاج إلى تعديل.')}</p>{item.status==='REJECTED'&&<div className="admin-note"><h3>سبب الرفض</h3><p className="review-copy">{item.review_reason}</p></div>}<dl className="workspace-summary"><dt>معرّف المشرف</dt><dd><bdi className="admin-reference">{item.reviewed_by}</bdi></dd><dt>تاريخ المراجعة</dt><dd>{dateLabel(item.reviewed_at)}</dd></dl>{item.status==='APPROVED'&&<p className="field-hint">لم يُنشأ مزاد تلقائيًا. يحدد البائع نوع المزاد وإعداداته من حسابه.</p>}<a className="button primary" href="#admin">العودة إلى الإعلانات قيد المراجعة</a></section>:<>
      <p className="section-description">افحص معلومات السلعة ثم اتخذ قرارًا مستقلًا بشأن الإعلان.</p><div className="admin-review-grid"><section className="admin-item-copy"><p className="eyebrow">{labelFor(catalog.data?.find(c=>c.id===item.category_id)?.name)||'الفئة غير متاحة'}</p><h2>{item.title}</h2><ItemStatus value={item.status}/><p className="review-copy">{item.description}</p><dl className="workspace-summary">{Object.entries(item.category_fields).map(([key,value])=><React.Fragment key={key}><dt>{fieldLabels[key]||key}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></React.Fragment>)}<dt>معرّف البائع</dt><dd><bdi className="admin-reference">{item.seller_id}</bdi></dd><dt>تاريخ الإرسال</dt><dd>غير متاح</dd></dl></section><section className="admin-photo-panel"><div className="admin-image-unavailable">صور الإعلان غير متاحة</div><p className="field-hint">لا تتوفر الصور في بيانات الإعلان الحالية. لا يمكن فحصها من هذه الصفحة.</p></section></div>
      <section className="admin-decision"><h2>قرار المراجعة</h2><p>الموافقة تعتمد الإعلان فقط، ولا تنشئ المزاد أو تنشره تلقائيًا.</p><div className="workspace-actions"><button className="button primary" disabled={locked} onClick={()=>{setDecision('APPROVED');setValidation('');}}>الموافقة على الإعلان</button><button className="button secondary" disabled={locked} onClick={()=>{setDecision('REJECTED');setValidation('');}}>رفض الإعلان</button><a className="button secondary" href="#admin">العودة إلى القائمة</a></div></section>
    </>)}
    {decision&&<Confirm title={decision==='APPROVED'?'تأكيد الموافقة على الإعلان':'رفض الإعلان'} confirmLabel={decision==='APPROVED'?'تأكيد الموافقة':'تأكيد الرفض'} pending={phase==='sending'||phase==='verifying'} onConfirm={review} onCancel={()=>setDecision(null)}><p className="admin-dialog-item">{item?.title}</p>{decision==='APPROVED'?<><p>هل أنت متأكد من الموافقة على هذا الإعلان؟</p><p className="field-hint">بعد الموافقة يمكن للبائع إعداد المزاد؛ لا يُنشر مزاد تلقائيًا.</p></>:<div className="workspace-field"><label htmlFor="review-reason">سبب الرفض</label><textarea id="review-reason" rows={4} value={reason} disabled={phase!=='ready'} onChange={event=>{setReason(event.target.value);setValidation('');}} aria-required="true" aria-invalid={!!validation} aria-describedby={validation?'reason-help reason-error':'reason-help'}/><p className="field-hint" id="reason-help">سيظهر السبب للبائع ليتمكن من تعديل الإعلان وإعادة تقديمه.</p>{validation&&<p className="field-error" id="reason-error" role="alert">{validation}</p>}</div>}</Confirm>}
  </AdminPage>;
}
