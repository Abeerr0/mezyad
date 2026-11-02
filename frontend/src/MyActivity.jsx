import React, { useEffect, useState } from 'react';

// التبويب جاي من الصفحه الام عشان يبقى نفسه اذا فتحنا مزاد ورجعنا
export default function MyActivity({ api, token, user, tab, onTabChange, onOpenAuction, onMyListings, onUnauthorized }) {
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const base = api.replace(/\/$/, '').replace(/\/api\/v1$/, '') + '/api/v1';
    async function get(path) {
      const response = await fetch(base + path, { headers: { Authorization: 'Bearer ' + token } });
      if (response.status === 401) onUnauthorized();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Request failed');
      return result.data;
    }
    async function load() {
      try {
        const [myItems, myAuctions] = await Promise.all([get('/me/items'), get('/me/auctions')]);
        if (!Array.isArray(myItems) || !Array.isArray(myAuctions)) throw new Error('Invalid activity response');
        const details = await Promise.all(myAuctions.map(async auction => {
          try {
            return { ...auction, ...await get('/auctions/' + auction.id) };
          } catch {
            return { ...auction, detailsError: true };
          }
        }));
        if (active) {
          setItems(myItems);
          setAuctions(details);
          setError(details.some(auction => auction.detailsError) ? 'تعذّر تحميل تفاصيل بعض المزادات ونتائجها.' : '');
        }
      } catch {
        if (active) setError('تعذّر تحميل نشاطك، تأكد من الاتصال وحاول مرة أخرى.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [api, token]);

  const ownItemIds = new Set(items.map(item => item.id));
  const myBids = auctions.filter(auction => auction.participation?.hasBid);
  const myAuctions = auctions.filter(auction => ownItemIds.has(auction.item_id));
  const results = auctions.filter(auction => auction.status === 'CLOSED' && (auction.participation?.hasBid || ownItemIds.has(auction.item_id)));
  const visible = tab === 'مزايداتي' ? myBids : tab === 'مزاداتي' ? myAuctions : results;

  function outcome(auction) {
    if (!auction.result?.winner_bid_id) return 'انتهى المزاد دون مزايدات.';
    if (auction.participation?.hasBid) return auction.result.isWinner ? 'فزت بهذا المزاد.' : 'لم تفز بهذا المزاد.';
    return 'انتهى المزاد بمزايدة فائزة.';
  }

  return <section className="my-activity" dir="rtl">
    <p className="breadcrumb">حسابي / نظرة عامة</p>
    <h1>{user?.name ? 'مرحبًا، ' + user.name : 'حسابي'}</h1>
    <p className="activity-intro">تابع مزايداتك ومزاداتك ونتائجها.</p>
    <div className="activity-tabs" role="tablist" aria-label="أقسام نشاطي">
      {['مزايداتي', 'مزاداتي', 'النتائج'].map(name => <button key={name} role="tab" aria-selected={tab === name} onClick={() => onTabChange(name)}>{name}</button>)}
    </div>
    {loading ? <p role="status">جاري تحميل نشاطك…</p> : <>
      {error && <p role="alert">{error}</p>}
      {!error.startsWith('تعذّر تحميل نشاطك') && <>
      <h2>{tab === 'مزايداتي' ? 'مزايداتي الحالية' : tab}</h2>
      {/* هنا نخلي نص الحاله الفارغه واضح حسب التبويب */}
      {visible.length === 0 ? <p>لا توجد {tab === 'النتائج' ? 'نتائج' : tab === 'مزايداتي' ? 'مزايدات' : tab} لعرضها حاليًا.</p> : visible.map(auction =>
        <article className="activity-card" key={auction.id}>
          {auction.images?.[0] && <img src={new URL(typeof auction.images[0] === 'string' ? auction.images[0] : auction.images[0].image_url, api).href} alt={auction.title} />}
          <div><h3>{auction.title}</h3>
            <p>الحالة: {{ SCHEDULED: 'قادم', ACTIVE: 'نشط', CLOSED: 'منتهي' }[auction.status] || auction.status}</p>
            {auction.detailsError ? <p>تعذّر تحميل نتيجة هذا المزاد.</p> : <>
              {auction.participation?.hasBid && <p>أعلى مزايدة لك: {Number(auction.participation.highestBid).toLocaleString('en-US')} ر.س</p>}
              {auction.status === 'CLOSED' && <p>{outcome(auction)}</p>}
            </>}
            <button onClick={() => onOpenAuction(auction.id)}>عرض المزاد</button>
          </div>
        </article>
      )}
      {auctions.filter(auction => auction.detailsError).map(auction => <p key={auction.id}>تعذّر تحميل تفاصيل «{auction.title}» ونتيجته. <button onClick={() => onOpenAuction(auction.id)}>عرض المزاد</button></p>)}
      <section className="activity-listings"><h2>إعلاناتي</h2>
        {items.length === 0 ? <p>ما عندك إعلانات حاليًا.</p> : items.map(item => <p key={item.id}>{item.title} — {{ PENDING_REVIEW: 'بانتظار المراجعة', APPROVED: 'معتمد', REJECTED: 'مرفوض' }[item.status] || item.status}</p>)}
        <button onClick={onMyListings}>عرض إعلاناتي</button>
      </section>
      </>}
    </>}
  </section>;
}
