import React, { useEffect, useLayoutEffect, useState } from 'react';
import { AccountPanel } from './auth/AccountPanel.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import { SiteHeader, SiteFooter } from './ui/SiteChrome.jsx';
import { AuctionDetails, AuctionList, categories } from './ui/Auctions.jsx';
import { BrowsePage } from './ui/BrowsePage.jsx';
import { AccountActivity } from './ui/AccountActivity.jsx';
import {ProfileSettings,NotificationsPage,RecoveryPage,RecoveryStatus} from './ui/AccountPages.jsx';
import {SupportPage,MissingPage} from './ui/SupportPages.jsx';
import './ui/shared.css';
import {Activity,ListingDetails} from './marketplace/Activity.jsx';
import {ListingForm} from './marketplace/ListingForm.jsx';
import {AdminDashboard,AdminAuctions} from './marketplace/AdminWorkspace.jsx';
import {AdminHeader} from './marketplace/AdminShell.jsx';
import './marketplace/admin.css';
import {AdminReview} from './marketplace/AdminReview.jsx';
import {AuctionCreate} from './marketplace/AuctionCreate.jsx';
import {PrivateAccess,Commitment,BidForm,BidReceipt,AuctionResult,Outbid} from './marketplace/Participation.jsx';
import {validReceipt} from './marketplace/bidderData.js';
import {uuid,Page} from './marketplace/common.jsx';
import './marketplace/workspace.css';

const serviceViews=['profile','notifications'];
const supportViews=['about','faq','how-to-bid','terms','privacy','contact'];
const protectedViews=['activity','listing','listing-edit','auction-new','admin','admin-dashboard','admin-auctions','private','commitment','bid','bid-success','outbid'];
function safeReturn(value){
 if([...serviceViews,'activity','listing/new','admin','admin-dashboard','admin-auctions','private'].includes(value))return value;
 const [view,id]=String(value||'').split('/');
 return protectedViews.includes(view)&&uuid(id)?view+'/'+id.toLowerCase():null;
}

function routeFromHash() {
  const [value, query = ''] = window.location.hash.slice(1).split('?');
  const returnTo=safeReturn(new URLSearchParams(query).get('return'));
  const requestedAuction = new URLSearchParams(query).get('auction');
  const authAuction = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestedAuction || '') ? requestedAuction.toLowerCase() : undefined;
  if (/^auction\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return { view: 'auction', id: value.slice(8).toLowerCase() };
  const [view, category] = value.split('/');
  if (protectedViews.includes(view)||view==='result') {
    if(view==='listing'&&category==='new')return {view:'listing-new'};
    if(['activity','admin','admin-dashboard','admin-auctions','private'].includes(view)&&!category)return {view};
    if(uuid(category))return {view,id:category.toLowerCase()};
  }
  if (view === 'auctions') return { view, category: categories.some(c => c.key === category) ? category : undefined };
  return { view: ['', 'home'].includes(value)?'home':[...serviceViews,...supportViews,'recovery','recovery-status','login','register','account'].includes(value)?value:'missing', authAuction,returnTo };
}
const go = value => { window.location.hash = value; };

export function App() {
  const { status,session } = useAuth();
  const [receipts,setReceipts]=useState({});
  useEffect(()=>setReceipts({}),[session?.user.id]);
  const [route, setRoute] = useState(routeFromHash);
  const receipt=receipts[route.id];
  function acceptBid(value){if(validReceipt(value,value?.auctionId,session?.user.id))setReceipts(previous=>({...previous,[value.auctionId]:value}));}
  useEffect(() => {
    const read = () => { setRoute(routeFromHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(() => {
    if (status === 'authenticated' && ['login', 'register'].includes(route.view)) {
      go(route.authAuction ? 'auction/' + route.authAuction : route.returnTo||(session?.user.role==='ADMIN'?'admin-dashboard':'account'));
    }
    if (status === 'guest' && route.view === 'account') go('login');
    if(status==='guest'&&serviceViews.includes(route.view))go('login?return='+route.view);
    if(status==='guest'&&(protectedViews.includes(route.view)||route.view==='listing-new'))go('login?return='+encodeURIComponent(route.view==='listing-new'?'listing/new':route.view+(route.id?'/'+route.id:'')));
  }, [status, route.view, route.authAuction,route.returnTo,route.id,session?.user.role]);
  const workspaceView=protectedViews.includes(route.view)||['listing-new','result'].includes(route.view);
  let workspace;
  if(workspaceView){
    if(route.view!=='result'&&status!=='authenticated')workspace=<AccountPanel/>;
    else if(['admin','admin-dashboard','admin-auctions'].includes(route.view)&&session.user.role!=='ADMIN')workspace=<Page title="لا تملك صلاحية الوصول"><p role="alert">هذه الصفحة مخصصة للمشرف.</p><a className="button secondary" href="#account">العودة إلى حسابي</a></Page>;
    else workspace=({activity:<Activity/>,listing:<ListingDetails id={route.id}/>, 'listing-new':<ListingForm/>, 'listing-edit':<ListingForm id={route.id}/>, 'auction-new':<AuctionCreate id={route.id}/>,admin:<AdminReview id={route.id}/>, 'admin-dashboard':<AdminDashboard/>, 'admin-auctions':<AdminAuctions id={route.id}/>,private:<PrivateAccess id={route.id}/>,commitment:<Commitment id={route.id}/>,bid:<BidForm id={route.id} onAccepted={acceptBid}/>, 'bid-success':<BidReceipt id={route.id} receipt={receipt}/>,outbid:<Outbid id={route.id} receipt={receipt}/>,result:<AuctionResult id={route.id} receipt={receipt}/>})[route.view];
  }
  if(workspaceView)workspace=<React.Fragment key={route.view+'/'+(route.id||'')}>{workspace}</React.Fragment>;
  useLayoutEffect(()=>{
    const main=document.querySelector('main');if(main){main.id='main-content';main.tabIndex=-1;main.focus({preventScroll:true});}
  },[route.view,route.id,route.category]);
  const accountView = ['login', 'register', 'account',...serviceViews,'recovery','recovery-status'].includes(route.view);
  return <>
    <a className="skip-navigation" href="#main-content" onClick={event=>{event.preventDefault();document.querySelector('main')?.focus();}}>تجاوز إلى المحتوى</a>
    {status==='authenticated'&&session.user.role==='ADMIN'&&['admin','admin-dashboard','admin-auctions'].includes(route.view)?<AdminHeader/>:<SiteHeader signedIn={status === 'authenticated'} accountView={accountView || workspaceView}/>}
    {workspaceView?workspace:route.view==='profile'?<ProfileSettings/>:route.view==='notifications'?<NotificationsPage/>:route.view==='recovery'?<RecoveryPage/>:route.view==='recovery-status'?<RecoveryStatus/>:supportViews.includes(route.view)?<SupportPage view={route.view}/>:route.view==='missing'?<MissingPage/>:accountView ? <AccountPanel initialMode={route.view === 'register' ? 'register' : 'login'}
      onModeChange={mode => go((mode === 'register' ? 'register' : 'login') + (route.authAuction ? '?auction=' + route.authAuction : route.returnTo?'?return='+encodeURIComponent(route.returnTo):''))}>
        {route.view === 'account' && <AccountActivity/>}
        <div className="workspace-actions account-shortcuts"><a className="button primary" href="#activity">مزاداتي ونشاطي</a><a className="button secondary" href="#listing/new">إنشاء إعلان</a><a className="button secondary" href="#private">الدخول إلى مزاد خاص</a>{session?.user.role==='ADMIN'&&<a className="button secondary" href="#admin-dashboard">لوحة تحكم المشرف</a>}</div>
      </AccountPanel>
      : route.view === 'auction' ? <AuctionDetails id={route.id} receipt={receipt} onParticipate={()=>go('commitment/'+route.id)} onRequireLogin={() => go('login?auction=' + route.id)}/>
        : route.view === 'auctions' ? <BrowsePage category={route.category}/> : <main id="main-content" tabIndex={-1}>
          <section className="home-hero">
            <img className="hero-photo" src="/images/home-interior.jpg" alt="مساحة داخلية سعودية بتفاصيل معمارية هادئة"/>
            <div className="hero-panel"><h1>مزادات مختارة<br/>لمعروضات عالية القيمة</h1>
              <p>استكشف مزادات الإبل والعقارات والسيارات النادرة واللوحات المميزة.</p>
              <a className="button primary" href="#auctions">استكشف المزادات</a></div>
          </section>
          <section className="auction-section content-shell"><h2>مزادات جارية</h2>
            <p className="section-description">استعرض المعروضات المتاحة الآن، ثم افتح المزاد الذي يهمك.</p><AuctionList home/></section>
          <section className="category-section"><div className="content-shell"><p className="eyebrow">تصفح حسب نوع المزادات</p>
            <h2>أقسام المزادات</h2><div className="category-grid">{categories.map((category, index) =>
              <a key={category.key} href={'#auctions/' + category.key}><span dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{category.label}</h3></a>)}</div>
          </div></section>
          <section className="journey-section content-shell"><h2>تصفح المزادات، وقدّم مزايدتك</h2>
            <div className="journey-grid">{['تصفح المزادات', 'أضف مزايدتك', 'تابع نتيجة المزاد'].map((label, index) =>
              <div key={label}><span dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{label}</h3></div>)}</div>
          </section>
        </main>}
    <SiteFooter/>
  </>;
}
