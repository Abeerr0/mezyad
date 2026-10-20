import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { ApiError, errorMessage } from '../api.js';
import { amount, safeImage, statusLabel } from './Auctions.jsx';
import {personalResult,higherAcceptedBid} from '../marketplace/bidderData.js';
import {ProfileFields} from './AccountPages.jsx';
import {ServerImage} from './MediaGallery.jsx';
import { listingStatus, uuid, validListing } from '../marketplace/common.jsx';

const PAGE_SIZE = 6;
const SUMMARY_TTL = 30000;
const DETAIL_TTL = 5000;
const tabs = [['bids', 'مزايداتي'], ['auctions', 'مزاداتي'], ['listings', 'إعلاناتي'], ['deals', 'الصفقات'], ['profile', 'البيانات الشخصية']];
const freshCache = userId => ({ userId, summaries: null, summaryAt: -Infinity, items: null, itemsAt: -Infinity, details: new Map() });
const validSummary = entry => uuid(entry?.id) && typeof entry.title === 'string'
  && ['ACTIVE', 'SCHEDULED', 'CLOSED'].includes(entry.status);
const validDetail = (detail, id) => detail?.id === id && uuid(detail.seller_id)
  && typeof detail.title === 'string' && !!detail.title.trim() && Array.isArray(detail.images)
  && Number.isFinite(Number(detail.current_price)) && Number(detail.current_price) > 0
  && ['ACTIVE', 'SCHEDULED', 'CLOSED'].includes(detail.status);

export function AccountActivity() {
  const { request, session, status } = useAuth();
  const userId = session?.user.id,identity=userId+':'+(session?.token||'');
  const cache = useRef(freshCache(identity));
  const [tab, setTab] = useState('bids');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState({ key: '', rows: null, total: 0, failure: '', loading: true });
  const viewKey = identity + ':' + tab + ':' + page;

  function selectTab(next) { setTab(next); setPage(1); }
  function moveTab(event) {
    const keys = tabs.filter(([key]) => key !== 'deals').map(([key]) => key);
    const index = keys.indexOf(tab);
    const next = event.key === 'ArrowLeft' ? keys[(index + 1) % keys.length]
      : event.key === 'ArrowRight' ? keys[(index + keys.length - 1) % keys.length]
        : event.key === 'Home' ? keys[0] : event.key === 'End' ? keys.at(-1) : null;
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    document.getElementById('account-tab-' + next)?.focus();
  }
  function reload() {
    cache.current.summaryAt = -Infinity;
    cache.current.itemsAt = -Infinity;
    for (const row of view.rows || []) {
      const entry = cache.current.details.get(row.id);
      if (entry) entry.fetchedAt = -Infinity;
    }
    setRevision(value => value + 1);
  }

  useEffect(() => {
    if (status !== 'authenticated' || tab === 'profile' || tab === 'deals') return;
    if (cache.current.userId !== identity) cache.current = freshCache(identity);
    const current = cache.current;
    const controller = new AbortController();
    let busy = false;
    setView(previous => previous.key === viewKey ? { ...previous, loading: true, failure: '' }
      : { key: viewKey, rows: null, total: 0, failure: '', loading: true });

    async function detailsFor(ids) {
      for (let index = 0; index < ids.length; index += 4) {
        if (controller.signal.aborted) return;
        const values = await Promise.all(ids.slice(index, index + 4).map(async id => {
          const detail = await request('/api/v1/auctions/' + id, { signal: controller.signal });
          if (!validDetail(detail, id)) throw new ApiError('INVALID_RESPONSE');
          return detail;
        }));
        if (controller.signal.aborted) return;
        for (const data of values) current.details.set(data.id, { data, fetchedAt: Date.now() });
      }
    }
    async function load(initial = false) {
      if (busy || (!initial && document.hidden)) return;
      busy = true;
      try {
        let rows;
        if (tab === 'listings') {
          if (!current.items || Date.now() - current.itemsAt >= SUMMARY_TTL) {
            const items = await request('/api/v1/me/items', { signal: controller.signal });
            if (!Array.isArray(items) || !items.every(item => validListing(item) && item.seller_id === userId)) {
              throw new ApiError('INVALID_RESPONSE');
            }
            if (controller.signal.aborted) return;
            current.items = items;
            current.itemsAt = Date.now();
          }
          rows = current.items;
        } else {
          if (!current.summaries || Date.now() - current.summaryAt >= SUMMARY_TTL) {
            const summaries = await request('/api/v1/me/auctions', { signal: controller.signal });
            if (!Array.isArray(summaries) || !summaries.every(validSummary)
              || new Set(summaries.map(item => item.id)).size !== summaries.length) throw new ApiError('INVALID_RESPONSE');
            if (controller.signal.aborted) return;
            current.summaries = summaries;
            current.summaryAt = Date.now();
            const ids = new Set(summaries.map(item => item.id));
            for (const id of current.details.keys()) if (!ids.has(id)) current.details.delete(id);
          }
          // This endpoint mixes owned and participated auctions and omits seller_id.
          // Classify each new ID once from its existing detail endpoint; never infer
          // ownership from titles, public-list membership, or listing status.
          await detailsFor(current.summaries.filter(item => !current.details.has(item.id)).map(item => item.id));
          if (controller.signal.aborted) return;
          const selected = current.summaries.filter(item => {
            const owned = current.details.get(item.id).data.seller_id === userId;
            return tab === 'auctions' ? owned : !owned;
          });
          const currentPage = Math.min(page, Math.max(1, Math.ceil(selected.length / PAGE_SIZE)));
          const visible = selected.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          const stale = visible.filter(summary => {
            const entry = current.details.get(summary.id);
            return entry.fetchedAt === -Infinity
              || ((entry.data.status !== 'CLOSED'||entry.data.visibility==='PRIVATE') && Date.now() - entry.fetchedAt >= (entry.data.status==='CLOSED'?SUMMARY_TTL:DETAIL_TTL))
              || (current.summaryAt > entry.fetchedAt && (entry.data.status !== summary.status
                || entry.data.title !== summary.title || (summary.end_time && entry.data.end_time !== summary.end_time)));
          });
          await detailsFor(stale.map(item => item.id));
          if (controller.signal.aborted) return;
          rows = selected.map(item => current.details.get(item.id).data);
        }
        if (controller.signal.aborted) return;
        const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
        if (currentPage !== page) setPage(currentPage);
        setView({ key: identity + ':' + tab + ':' + currentPage, rows: rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), total: rows.length, failure: '', loading: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          const revoked=[401,403,404].includes(error.status);
          if(revoked){current.summaries=null;current.summaryAt=-Infinity;current.items=null;current.itemsAt=-Infinity;current.details.clear();}
          setView(previous => ({ ...previous,...(revoked?{rows:null,total:0}:{}), failure: errorMessage(error), loading: false }));
        }
      } finally { busy = false; }
    }
    let timer;
    // Schedule after completion, so network time does not push fresh-cache
    // checks just below the TTL and accidentally skip every other refresh.
    async function poll(initial = false) {
      await load(initial);
      if (!controller.signal.aborted) timer = setTimeout(() => { void poll(); }, tab === 'listings' ? SUMMARY_TTL : DETAIL_TTL);
    }
    void poll(true);
    const resume = () => { void load(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [request, status, userId, identity, tab, page, viewKey, revision]);

  const current = view.key === viewKey ? view : { rows: null, total: 0, failure: '', loading: true };
  const pageCount = Math.max(1, Math.ceil(current.total / PAGE_SIZE));
  const heading = tab === 'bids' ? 'مزايداتي الحالية' : tab === 'auctions' ? 'مزاداتي' : 'إعلاناتي وحالات المراجعة';
  return <section className="account-activity" aria-label="نشاط الحساب">
    <div className="account-tabs" role="tablist" aria-label="أقسام حسابي">
      {tabs.map(([key, label]) => <button key={key} className={'button ' + (tab === key ? 'primary' : 'secondary')}
        id={'account-tab-' + key} type="button" role="tab" aria-selected={tab === key}
        aria-controls="account-activity-panel" disabled={key === 'deals'} tabIndex={tab === key ? 0 : -1}
        onKeyDown={moveTab} title={key === 'deals' ? 'الصفقات غير متاحة حاليًا.' : undefined}
        onClick={() => selectTab(key)}>{label}</button>)}
    </div>
    <section id="account-activity-panel" role="tabpanel" aria-labelledby={'account-tab-' + tab} aria-busy={tab !== 'profile' && current.loading}>
      {tab === 'profile' ? <ProfileFields embedded/> : <>
        <div className="account-section-heading"><h2>{heading}</h2><button className="text-action" type="button" onClick={reload} disabled={current.loading}>تحديث البيانات</button></div>
        {!current.rows && current.loading && <p role="status">جارٍ تحميل نشاط الحساب…</p>}
        {current.failure && <div className="feedback error" role="alert"><p>{current.failure}</p>
          {current.rows && <p>تعذر تحديث البيانات. قد لا يعكس العرض آخر تغييرات المزاد.</p>}
          <button className="button secondary" type="button" onClick={reload}>إعادة المحاولة</button></div>}
        {current.rows && (tab === 'listings' ? (current.rows.length ? current.rows.map(item =>
          <article className="activity-row" key={item.id}><div><h3>{item.title}</h3><p className="status-pill">{listingStatus(item.status)}</p>
            {item.review_reason && <p>سبب الرفض: {item.review_reason}</p>}</div><a className="button secondary" href={'#listing/' + item.id}>عرض الإعلان</a></article>)
          : <p className="empty-state">لم تضف إعلانًا بعد.</p>) : (current.rows.length ? current.rows.map(auction => {
          const image = safeImage(auction.images[0]),outcome=personalResult(auction,userId);
          const position=tab==='bids'&&auction.status==='ACTIVE'&&higherAcceptedBid(null,auction,userId,[]);
          return <article className="account-auction-row" key={auction.id}>
            <div><h3>{auction.title}</h3><p className="eyebrow">مزاد {statusLabel(auction.status)}</p>
              <p>{auction.status==='SCHEDULED'&&Number(auction.starting_price)>0?'السعر الابتدائي':'السعر الحالي'}: <bdi dir="ltr">{amount(auction.status==='SCHEDULED'&&Number(auction.starting_price)>0?auction.starting_price:auction.current_price)}</bdi> ر.س</p>
              {position&&<p className="status-pill">تم تجاوز مزايدتك</p>}{auction.status==='CLOSED'&&outcome?.hasBid&&<p className="status-pill">{outcome.isWinner?'فزت بالمزاد':'لم تفز بالمزاد'}</p>}
              <a className="button primary" href={'#auction/' + auction.id}>عرض المزاد</a>{auction.status==='CLOSED'&&<a className="button secondary" href={'#result/'+auction.id}>عرض نتيجة المزاد</a>}</div>
            <ServerImage src={image} alt={auction.title} onRefresh={reload}/>
          </article>;
        }) : <p className="empty-state">{tab === 'bids' ? 'لا توجد مزايدات مرتبطة بحسابك حاليًا.' : 'لم تنشئ مزادًا بعد.'}</p>))}
        {pageCount > 1 && <nav className="account-pagination" aria-label="صفحات نشاط الحساب">
          <button className="button secondary" type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>السابق</button>
          <span>صفحة {page} من {pageCount}</span>
          <button className="button secondary" type="button" disabled={page >= pageCount} onClick={() => setPage(value => value + 1)}>التالي</button>
        </nav>}
      </>}
    </section>
  </section>;
}
