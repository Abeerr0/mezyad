import React from 'react';

export function SiteHeader({ signedIn, accountView }) {
  return <header className={'site-header' + (accountView ? ' account-header' : '')}><div className="nav-shell">
    <a className="brand" href="#home" aria-label="مزياد، الرئيسية">
      <img src="/images/mezyad-logo.png" alt="مِزياد" width="178" height="62"/>
    </a>
    <nav aria-label="التنقل الرئيسي">
      <a href={signedIn ? '#account' : '#login'}>{signedIn ? 'حسابي' : 'تسجيل الدخول'}</a>
      <a href="#auctions">المزادات</a>
      {signedIn&&accountView&&<a href="#notifications">الإشعارات</a>}
    </nav>
  </div></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="content-shell">
    <div className="footer-top">
      <div className="footer-brand"><a href="#home" aria-label="مزياد، الرئيسية">
        <img src="/images/mezyad-logo.png" alt="مِزياد" width="205" height="72"/>
      </a><p>مزادات مختارة لمعروضات عالية القيمة</p></div>
      <div className="footer-links"><a className="footer-title" href="#about">عن مِــزيـــاد</a>
        <a href="#terms">الشروط والأحكام</a><a href="#privacy">سياسة الخصوصية</a><a href="#faq">الأسئلة الشائعة</a>
        <a href="#contact">تواصل معنا</a><a href="#how-to-bid">كيفية المزايدة</a>
      </div>
    </div>
    <div className="footer-bottom"><p>© 2026 مِــزيـــاد. جميع الحقوق محفوظة.</p><p>المملكة العربية السعودية</p></div>
  </div></footer>;
}
