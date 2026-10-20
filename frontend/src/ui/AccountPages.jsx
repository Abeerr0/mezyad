import React,{useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {Page,Field} from '../marketplace/common.jsx';
import './shared.css';

function AccountAccess({children}) {
  const {status,verifySession}=useAuth();
  return status==='authenticated'?children:<Page title="حسابي">{status==='unavailable'?<div className="feedback error" role="alert"><p>تعذر التحقق من الجلسة. لم نعرض معلومات حسابك.</p><button className="button secondary" onClick={verifySession}>إعادة التحقق من الجلسة</button></div>:<p role="status">{status==='checking'?'جارٍ التحقق من الجلسة…':'سجّل الدخول لعرض معلومات حسابك.'}</p>}<a className="button secondary" href="#login">تسجيل الدخول</a></Page>;
}
export function ProfileFields({embedded=false}) {
  const {session}=useAuth();
  if(!session)return null;
  return <div className={'account-profile service-profile'+(embedded?' is-embedded':'')}>{embedded&&<h2>البيانات الشخصية</h2>}<p className="section-description">معلومات حسابك المسجّلة. تعديل البيانات غير متاح حاليًا.</p>{embedded&&<p className="field-hint"><bdi dir="ltr">{session.user.email}</bdi></p>}
    <form className="profile-form" onSubmit={e=>e.preventDefault()} aria-describedby="profile-availability">
      <Field label="الاسم الكامل" id="profile-name"><input id="profile-name" value={session.user.name} readOnly autoComplete="name"/></Field>
      <Field label="البريد الإلكتروني" id="profile-email"><input id="profile-email" type="email" value={session.user.email} readOnly dir="ltr" autoComplete="email"/></Field>
      <Field label="رقم الجوال" id="profile-phone"><input id="profile-phone" type="tel" disabled placeholder="رقم الجوال غير متاح" aria-describedby="profile-availability"/></Field>
      <p className="field-hint" id="profile-availability" role="status">حفظ التغييرات ورقم الجوال غير مفعّلين. لم نغيّر معلومات حسابك.</p>
      <div className="workspace-actions"><button className="button primary" type="submit" disabled>حفظ التغييرات</button>{embedded?<a className="button secondary" href="#profile">فتح البيانات الشخصية</a>:<a className="button secondary" href="#account">العودة إلى حسابي</a>}</div>
    </form>
  </div>;
}
export function ProfileSettings(){return <AccountAccess><div className="account-services"><Page title="البيانات الشخصية" trail="حسابي / البيانات الشخصية" node="23:2"><ProfileFields/></Page></div></AccountAccess>;}
export function NotificationsPage(){return <AccountAccess><div className="account-services"><Page title="الإشعارات" trail="حسابي / الإشعارات" node="126:2"><p className="section-description">تابع تحديثات حسابك ومزاداتك من هنا عند إتاحة الخدمة.</p><section className="notifications-state"><h2>الإشعارات غير متاحة حاليًا</h2><p role="status">لا يمكن التحقق من الإشعارات الآن. يمكنك متابعة الأسعار وحالات المزادات من صفحاتها.</p><div className="workspace-actions"><a className="button primary" href="#auctions">تصفح المزادات</a><a className="button secondary" href="#account">العودة إلى حسابي</a></div></section></Page></div></AccountAccess>;}
export function RecoveryPage(){
  const [email,setEmail]=useState(''),[touched,setTouched]=useState(false);
  const invalid=touched&&email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return <div className="account-services"><Page title="استعادة كلمة المرور" trail="استعادة الحساب" node="23:33"><p className="section-description">أدخل بريدك الإلكتروني المرتبط بالحساب عند إتاحة خدمة الاستعادة.</p><form className="recovery-form" onSubmit={e=>e.preventDefault()} noValidate>
    <Field label="البريد الإلكتروني" id="recovery-email"><input id="recovery-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouched(true)} placeholder="أدخل بريدك الإلكتروني" autoComplete="email" aria-invalid={!!invalid} aria-describedby={invalid?'recovery-error recovery-status':'recovery-status'}/>{invalid&&<p className="field-error" id="recovery-error" role="alert">أدخل بريدًا إلكترونيًا صحيحًا.</p>}</Field>
    <p className="field-hint" id="recovery-status" role="status">استعادة كلمة المرور غير متاحة حاليًا. لم تُرسل أي تعليمات إلى بريدك.</p><div className="workspace-actions"><button className="button primary" type="submit" disabled>إرسال التعليمات</button><a className="button secondary" href="#login">العودة إلى تسجيل الدخول</a></div>
  </form></Page></div>;
}
export function RecoveryStatus(){return <div className="account-services"><Page title="لم يتم تأكيد إرسال التعليمات" node="23:57"><section className="recovery-result"><p>لا يتوفر تأكيد موثوق لإرسال تعليمات استعادة كلمة المرور. الخدمة غير متاحة حاليًا.</p><a className="button primary" href="#login">العودة إلى تسجيل الدخول</a></section></Page></div>;}
