import {test,expect} from '@playwright/test';
import {prepareListing,session,base} from './seller-support.js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const fixture=()=>readFile(process.env.E2E_FIXTURE_FILE||path.join(os.tmpdir(),'frontend-browser-fixtures.json'),'utf8').then(JSON.parse);
async function login(page,role){const f=await fixture();await page.goto('/#login');await page.getByLabel('البريد الإلكتروني').fill(role+'@example.invalid');await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await expect(page.getByRole('tab',{name:'مزايداتي',exact:true})).toBeVisible();return f;}

test('seller account separates owned auctions from listing review records using the real API',async({page})=>{
 await login(page,'seller');const panel=page.getByRole('tabpanel');await expect(panel.getByText('لا توجد مزايدات مرتبطة بحسابك حاليًا.')).toBeVisible();
 await page.getByRole('tab',{name:'مزاداتي',exact:true}).click();await expect(panel.getByRole('heading',{name:'QA public',exact:true})).toBeVisible();
 const auctions=panel.getByRole('link',{name:'عرض المزاد'});expect(await auctions.count()).toBeGreaterThan(0);for(const link of await auctions.all())expect(await link.getAttribute('href')).toMatch(/^#auction\//);expect(await panel.getByRole('link',{name:'عرض الإعلان'}).count()).toBe(0);
 await page.getByRole('tab',{name:'إعلاناتي'}).click();await expect(panel.getByRole('heading',{name:'إعلاناتي وحالات المراجعة'})).toBeVisible();await expect(panel.getByRole('link',{name:'عرض الإعلان'}).first()).toBeVisible();expect(await panel.getByRole('link',{name:'عرض المزاد'}).count()).toBe(0);for(const link of await panel.getByRole('link',{name:'عرض الإعلان'}).all())expect(await link.getAttribute('href')).toMatch(/^#listing\//);
});

test('bidder account does not present participated auctions as owned auctions or listings',async({page,request})=>{
 const f=await fixture(),auth=await session(request,'bidder'),detail=(await (await request.get(base+'/auctions/'+f.auctions.eligible)).json()).data;const accepted=await request.post(base+'/auctions/'+f.auctions.eligible+'/bids',{headers:{Authorization:'Bearer '+auth.token},data:{amount:Number(detail.current_price)+50,requestId:crypto.randomUUID()}});expect(accepted.status()).toBe(201);
 await login(page,'bidder');const panel=page.getByRole('tabpanel');await expect(panel.getByRole('heading',{name:'QA eligible',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'مزاداتي',exact:true}).click();await expect(panel.getByText('لم تنشئ مزادًا بعد.')).toBeVisible();expect(await panel.getByRole('link',{name:'عرض المزاد'}).count()).toBe(0);
 await page.getByRole('tab',{name:'إعلاناتي'}).click();await expect(panel.getByText('لم تضف إعلانًا بعد.')).toBeVisible();
});

test('profile tab stops account refresh requests in the real browser',async({page})=>{
 await login(page,'seller');await expect(page.getByRole('tabpanel').getByText('لا توجد مزايدات مرتبطة بحسابك حاليًا.')).toBeVisible();await page.clock.install();await page.getByRole('tab',{name:'البيانات الشخصية'}).click();await expect(page.getByText('seller@example.invalid',{exact:true})).toBeVisible();
 let requests=0;page.on('request',request=>{if(/\/api\/v1\/(me\/(items|auctions)|auctions\/)/.test(request.url()))requests++;});await page.clock.runFor(15000);expect(requests).toBe(0);
});

test('choosing PUBLIC or PRIVATE sends no create request and rejected listings stay blocked',async({page,request})=>{
 const {item}=await prepareListing(request,{title:'V2 choice isolation'});const f=await login(page,'seller');await page.goto('/#auction-new/'+item.id);await expect(page.getByRole('heading',{name:'اختر نوع المزاد'})).toBeVisible();let creates=0;page.on('request',r=>{if(['POST','PATCH'].includes(r.method())&&/\/api\/v1\/(auctions|items)(\/|$)/.test(r.url()))creates++;});
 await page.getByRole('button',{name:'إنشاء مزاد عام',exact:true}).click();await expect(page.getByRole('heading',{name:'إعداد مزاد عام'})).toBeVisible();await page.getByRole('button',{name:'العودة إلى اختيار النوع'}).click();await page.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}).click();await expect(page.getByRole('heading',{name:'إعداد مزاد خاص'})).toBeVisible();expect(creates).toBe(0);
 await page.goto('/#auction-new/'+f.items.rejected);await expect(page.getByRole('alert')).toContainText('إعلان معتمد تملكه');expect(await page.getByRole('button',{name:'إنشاء مزاد خاص',exact:true}).count()).toBe(0);expect(creates).toBe(0);
});
