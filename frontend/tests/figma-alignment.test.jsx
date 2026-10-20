import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../src/auth/AuthProvider.jsx';
import { saveSession } from '../src/auth/session.js';
import { BrowsePage } from '../src/ui/BrowsePage.jsx';
import { AuctionList } from '../src/ui/Auctions.jsx';
import { AccountActivity } from '../src/ui/AccountActivity.jsx';
import { AuctionCreate } from '../src/marketplace/AuctionCreate.jsx';

const owner = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const itemId = '30000000-0000-4000-8000-000000000001';
const user = { id: owner, name: 'Review user', email: 'review@example.invalid', role: 'USER' };
const listing = { id: itemId, seller_id: owner, category_id: itemId, title: 'إعلان معتمد', description: 'وصف الإعلان', status: 'APPROVED', category_fields: {} };
const auctions = Array.from({ length: 8 }, (_, index) => ({
  id: '20000000-0000-4000-8000-' + String(index + 1).padStart(12, '0'),
  title: 'مزاد ' + (index + 1), seller_id: other, images: ['/images/hittin-villa.jpg'], image_url: '/images/hittin-villa.jpg',
  current_price: '1000', status: 'ACTIVE', category_name: index === 7 ? 'Camels' : 'Real Estate',
}));
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => status < 400 ? { data } : { error: data } });
const mount = element => render(<AuthProvider>{element}</AuthProvider>);
let handler;
beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/#home');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  handler = async url => {
    if (url.endsWith('/me/items')) return response([]);
    if (url.endsWith('/me/auctions')) return response([]);
    if (url.endsWith('/auctions')) return response(auctions);
    if (url.endsWith('/items/' + itemId)) return response(listing);
    throw Error('Unexpected alignment test request: ' + url);
  };
  vi.stubGlobal('fetch', vi.fn((...args) => handler(...args)));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

for (const [key, title, node] of [['camels', 'الإبل', '20:197'], ['property', 'العقارات', '20:2'], ['cars', 'السيارات النادرة', '20:67'], ['plates', 'اللوحات المميزة', '20:132']]) {
  test(key + ' retains its original Figma hero and correct filter destination', async () => {
    const { container } = mount(<BrowsePage category={key}/>);
    expect(screen.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(container.querySelector('main')).toHaveAttribute('data-design-node', node);
    expect(container.querySelector('.category-hero-photo')).toHaveAttribute('src', '/images/category-' + key + '-hero.png');
    expect(container.querySelector('.category-filters [aria-current="page"]')).toHaveAttribute('href', '#auctions/' + key);
    await waitFor(() => expect(container.querySelector('.auction-grid')).toHaveAttribute('aria-busy', 'false'));
  });
}

test('pagination preserves each auction identity and returns to page one when category changes', async () => {
  const actor = userEvent.setup();
  const { rerender } = mount(<AuctionList/>);
  await screen.findByRole('heading', { name: 'مزاد 1', exact: true });
  expect(screen.queryByRole('heading', { name: 'مزاد 7', exact: true })).toBeNull();
  await actor.click(screen.getByRole('button', { name: 'الصفحة 2' }));
  expect(screen.getByRole('link', { name: 'عرض مزاد مزاد 7' })).toHaveAttribute('href', '#auction/' + auctions[6].id);
  expect(screen.queryByRole('heading', { name: 'مزاد 1', exact: true })).toBeNull();
  rerender(<AuthProvider><AuctionList category="property"/></AuthProvider>);
  expect(await screen.findByRole('heading', { name: 'مزاد 1', exact: true })).toBeVisible();
  expect(screen.getByRole('button', { name: 'الصفحة 1' })).toHaveAttribute('aria-current', 'page');
});

test('account separates owned auctions from bids using server ownership and supports RTL keyboard tabs', async () => {
  saveSession({ token: 'a'.repeat(64), user });
  handler = async url => {
    if (url.endsWith('/me/items')) return response([listing]);
    if (url.endsWith('/me/auctions')) return response(auctions.slice(0, 2));
    if (url.endsWith('/' + auctions[0].id)) return response(auctions[0]);
    if (url.endsWith('/' + auctions[1].id)) return response({ ...auctions[1], seller_id: owner });
    throw Error('Unexpected test request');
  };
  const actor = userEvent.setup(); mount(<AccountActivity/>);
  expect(await screen.findByRole('heading', { name: 'مزاد 1', exact: true })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'مزاد 2', exact: true })).toBeNull();
  expect(screen.getByRole('tab', { name: 'الصفقات' })).toBeDisabled();
  screen.getByRole('tab', { name: 'مزايداتي', exact: true }).focus();
  await actor.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'مزاداتي', exact: true })).toHaveFocus();
  expect(await screen.findByRole('heading', { name: 'مزاد 2', exact: true })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'مزاد 1', exact: true })).toBeNull();
  await actor.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'إعلاناتي' })).toHaveFocus();
  expect(await screen.findByRole('heading', { name: listing.title })).toBeVisible();
  await actor.keyboard('{End}');
  expect(screen.getByRole('tab', { name: 'البيانات الشخصية' })).toHaveFocus();
  expect(screen.getByText(user.email)).toBeVisible();
});

test('account fails safely rather than guessing ownership from malformed auction details', async () => {
  saveSession({ token: 'a'.repeat(64), user });
  handler = async url => url.endsWith('/me/items') ? response([]) : url.endsWith('/me/auctions') ? response([auctions[0]]) : response({ ...auctions[0], seller_id: undefined });
  mount(<AccountActivity/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('تعذر قراءة استجابة الخادم');
  expect(screen.queryByRole('heading', { name: 'مزاد 1', exact: true })).toBeNull();
  expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeVisible();
});

test('account empty state does not populate Figma example products as real API data', async () => {
  saveSession({ token: 'a'.repeat(64), user }); mount(<AccountActivity/>);
  expect(await screen.findByText('لا توجد مزايدات مرتبطة بحسابك حاليًا.')).toBeVisible();
  expect(screen.queryByText(/بورش/)).toBeNull();
});

test('auction type selection is available only after approval and preserves draft values on return', async () => {
  saveSession({ token: 'a'.repeat(64), user });
  const actor = userEvent.setup(); mount(<AuctionCreate id={itemId}/>);
  await actor.click(await screen.findByRole('button', { name: 'إنشاء مزاد عام', exact: true }));
  await actor.type(screen.getByLabelText('سعر البداية (ر.س)'), '1500');
  await actor.click(screen.getByRole('button', { name: 'العودة إلى اختيار النوع' }));
  expect(screen.queryByLabelText('سعر البداية (ر.س)')).toBeNull();
  await actor.click(screen.getByRole('button', { name: 'إنشاء مزاد خاص', exact: true }));
  expect(screen.getByLabelText('سعر البداية (ر.س)')).toHaveValue('1500');
  expect(screen.getByRole('heading', { name: 'إعداد مزاد خاص' })).toBeVisible();
  expect(fetch.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false);
});

test('an approved listing owned by another user never offers an auction type', async () => {
  saveSession({ token: 'a'.repeat(64), user });
  handler = async url => url.endsWith('/me/items') ? response([]) : response({ ...listing, seller_id: other });
  mount(<AuctionCreate id={itemId}/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('إعلان معتمد تملكه');
  expect(screen.queryByRole('button', { name: 'إنشاء مزاد عام' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'إنشاء مزاد خاص' })).toBeNull();
});

test('public auction submits the approved item and original API contract after explicit selection', async () => {
  saveSession({ token: 'a'.repeat(64), user });
  let submitted;
  handler = async (url, options) => {
    if (url.endsWith('/me/items')) return response([]);
    if (url.endsWith('/auctions') && options.method === 'POST') {
      submitted = JSON.parse(options.body);
      return response({ id: auctions[0].id, item_id: itemId, visibility: 'PUBLIC', status:'SCHEDULED', starting_price:submitted.startingPrice, current_price:submitted.startingPrice, minimum_increment:submitted.minimumIncrement, start_time:submitted.startTime, end_time:submitted.endTime }, 201);
    }
    return response(listing);
  };
  const actor = userEvent.setup(); mount(<AuctionCreate id={itemId}/>);
  await actor.click(await screen.findByRole('button', { name: 'إنشاء مزاد عام', exact: true }));
  await actor.type(screen.getByLabelText('سعر البداية (ر.س)'), '1500');
  await actor.type(screen.getByLabelText('الحد الأدنى لزيادة المزايدة (ر.س)'), '50');
  await actor.type(screen.getByLabelText('بداية المزاد'), '2030-01-01T10:00');
  await actor.type(screen.getByLabelText('نهاية المزاد'), '2030-01-02T10:00');
  await actor.click(screen.getByRole('button', { name: 'إنشاء مزاد عام', exact: true }));
  expect(await screen.findByText('تم إنشاء المزاد بحسب المواعيد التي حددتها.')).toBeVisible();
  expect(submitted).toMatchObject({ itemId, visibility: 'PUBLIC', startingPrice: 1500, minimumIncrement: 50 });
  expect(screen.queryByLabelText('رمز وصول المزاد الخاص')).toBeNull();
});
