import React,{useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {errorMessage} from '../api.js';
import {Page,listingStatus} from './common.jsx';
import {labelFor} from './ListingForm.jsx';

export function AdminAccess({children}){
  const {status,session}=useAuth();
  if(status!=='authenticated'||session?.user.role!=='ADMIN')return <Page title="لا تملك صلاحية الوصول"><p role="alert">هذه الصفحة مخصصة للمشرف.</p><a className="button secondary" href="#account">العودة إلى حسابي</a></Page>;
  return children;
}
export function AdminHeader(){
  const {session,signOut}=useAuth(),[pending,setPending]=useState(false),[failure,setFailure]=useState('');
  async function leave(){if(pending)return;setPending(true);setFailure('');try{await signOut();}catch(error){setFailure(errorMessage(error));}finally{setPending(false);}}
  return <header className="site-header admin-header"><div className="nav-shell"><div className="admin-brand-group"><a className="brand" href="#admin-dashboard" aria-label="مزياد، لوحة المشرف"><img src="/images/mezyad-logo.png" alt="مِزياد" width="178" height="62"/></a><a className="admin-identity" href="#account" aria-label="حسابي"><strong>{session.user.name}</strong><span>مشرف المنصة</span></a></div><button className="button secondary" disabled={pending} onClick={leave}>{pending?'جارٍ تسجيل الخروج…':'تسجيل الخروج'}</button></div>{failure&&<p className="content-shell feedback error" role="alert">{failure}</p>}</header>;
}
export function AdminPage({title,active='review',node,children}){
  return <div className="admin-workspace"><nav className="admin-nav content-shell" aria-label="تنقل المشرف">{[['dashboard','admin-dashboard','لوحة التحكم'],['review','admin','الإعلانات قيد المراجعة'],['auctions','admin-auctions','متابعة المزادات']].map(([key,href,label])=><a href={'#'+href} aria-current={key===active?'page':undefined} key={key}>{label}</a>)}</nav><Page title={title} trail="حساب المشرف" node={node}>{children}</Page></div>;
}
export function ItemStatus({value}){return <span className={'admin-status status-'+value}>{listingStatus(value)}</span>;}
export function PendingCards({items,categories=[]}){
  if(!items.length)return <section className="admin-empty"><h2>لا توجد إعلانات بانتظار المراجعة.</h2><p>ستظهر الإعلانات الجديدة هنا عند إرسالها للمراجعة.</p></section>;
  return <div className="admin-list">{items.map(item=><article className="admin-listing-row" key={item.id}><div className="admin-image-unavailable" aria-label="صورة الإعلان غير متاحة">لا تتوفر صورة للإعلان</div><div className="admin-row-copy"><div className="admin-title-line"><h3>{item.title}</h3><ItemStatus value={item.status}/></div><p>الفئة: {labelFor(categories.find(c=>c.id===item.category_id)?.name)||'غير متاحة'}</p><p className="field-hint">تاريخ الإرسال غير متاح</p></div><a className="button secondary" href={'#admin/'+item.id}>مراجعة الإعلان</a></article>)}</div>;
}
