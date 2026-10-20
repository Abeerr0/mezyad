import React from 'react';
import { AuctionList, categories } from './Auctions.jsx';

export const categoryDesigns = {
  camels: {
    node: '20:197', title: 'الإبل',
    description: 'استعرض مزادات الإبل الجارية والقادمة.',
    image: '/images/category-camels-hero.png',
  },
  property: {
    node: '20:2', title: 'العقارات',
    description: 'العقارات المعروضة في مزادات مِزياد.',
    image: '/images/category-property-hero.png',
  },
  cars: {
    node: '20:67', title: 'السيارات النادرة',
    description: 'سيارات محدودة ونادرة معروضة للمزايدة.',
    image: '/images/category-cars-hero.png',
  },
  plates: {
    node: '20:132', title: 'اللوحات المميزة',
    description: 'لوحات سيارات معروضة للمزايدة.',
    image: '/images/category-plates-hero.png',
  },
};

export function BrowsePage({ category }) {
  const design = categoryDesigns[category];
  return <main className={design ? 'category-page' : 'browse-page content-shell'}
    data-design-node={design?.node || '2:78'}>
    {design ? <section className={'category-hero category-hero--' + category} aria-labelledby="browse-heading">
      <img className="category-hero-photo" src={design.image} alt="" width="1440" height="310"/>
      <div className="category-title-panel">
        <h1 id="browse-heading">{design.title}</h1>
        <p>{design.description}</p>
      </div>
    </section> : <header className="browse-heading">
      <p className="eyebrow">المزادات / جميع الأقسام</p>
      <h1 id="browse-heading">المزادات</h1>
      <p className="section-description">تصفح المزادات</p>
    </header>}
    <div className={design ? 'category-body content-shell' : undefined}>
      <nav className="category-filters" aria-label="تصفية المزادات">
        <a className={'button all-filter' + (!design ? ' is-selected' : '')} href="#auctions"
          aria-current={!design ? 'page' : undefined}>الكل</a>
        {categories.map(item => <a key={item.key} href={'#auctions/' + item.key}
          className={'button' + (category === item.key ? ' is-selected' : '')}
          aria-current={category === item.key ? 'page' : undefined}>
          {{ cars: 'السيارات', plates: 'اللوحات' }[item.key] || item.label}
        </a>)}
      </nav>
      <AuctionList category={category}/>
      <section className="browse-editorial">
        <p className="eyebrow">أقسام مِزياد</p>
        <h2>{category === 'camels' ? 'استكشف بقية المزادات' : 'اعثر على ما تبحث عنه'}</h2>
        <p>{category === 'camels'
          ? 'انتقل إلى العقارات والسيارات النادرة واللوحات المميزة من صفحة المزادات.'
          : 'يمكنك الانتقال بين الأقسام ومتابعة المزادات بحسب اهتماماتك.'}</p>
        <a className="button secondary" href="#home">العودة إلى الرئيسية</a>
      </section>
      <section className="before-bidding">
        <h2>{design ? 'قبل أن تزايد' : 'راجع قبل المزايدة'}</h2>
        <p>{design ? 'راجع صور المعروض والتفاصيل المتاحة، ثم حدّد قيمة عرضك.'
          : 'راجع صور المعروض، وحدد قيمة مزايدتك بما يناسبك.'}</p>
      </section>
    </div>
  </main>;
}
