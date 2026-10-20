import React from 'react';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider,useAuth} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AdminReview} from '../src/marketplace/AdminReview.jsx';

const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const admin={id:uid(1),name:'مشرف اختبار الخصوصية',email:'admin@example.invalid',role:'ADMIN'};
const item={id:uid(2),seller_id:uid(3),category_id:uid(4),title:'عنوان إعلان خاص بالمراجعة',description:'وصف لا يجوز إبقاؤه بعد رفض الوصول',category_fields:{location:'موقع البائع الخاص'},images:['/api/v1/images/private-review.png?expires=9999999999&signature=synthetic'],status:'PENDING_REVIEW',reviewed_by:null,reviewed_at:null,review_reason:null};
const answer=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});
let handler;
function Ready({children}){return useAuth().status==='checking'?null:children;}
const mount=()=>render(<AuthProvider><Ready><AdminReview id={item.id}/></Ready></AuthProvider>);
const posts=()=>fetch.mock.calls.filter(([url,o])=>url.endsWith('/review')&&o.method==='POST');
async function confirm(actor){
 await actor.click(await screen.findByRole('button',{name:'الموافقة على الإعلان',exact:true}));
 await actor.click(screen.getByRole('button',{name:'تأكيد الموافقة',exact:true}));
}
async function expectHidden(status){
 expect(await screen.findByRole('heading',{level:1,name:status===404?'الإعلان غير متاح':'لا تملك صلاحية مراجعة الإعلان'})).toBeVisible();
 for(const value of [item.title,item.description,item.category_fields.location,item.seller_id])expect(screen.queryByText(value,{exact:true})).toBeNull();
 expect(screen.queryByAltText(item.title)).toBeNull();
 expect(screen.queryByRole('region',{name:'صور المعروض'})).toBeNull();
 expect(screen.queryByRole('button',{name:'فتح معرض الصور'})).toBeNull();
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.queryByRole('button',{name:'تحقق من حالة الإعلان'})).toBeNull();
 expect(screen.getByRole('button',{name:'الموافقة على الإعلان',exact:true})).toBeDisabled();
 expect(screen.getByRole('button',{name:'رفض الإعلان',exact:true})).toBeDisabled();
 expect(screen.getByRole('link',{name:'العودة إلى القائمة',exact:true})).toHaveAttribute('href','#admin');
}
beforeEach(()=>{
 sessionStorage.clear();saveSession({token:'a'.repeat(64),user:admin});
 handler=async(url,o)=>url.endsWith('/me/items')?answer([]):url.endsWith('/categories')?answer([{id:item.category_id,name:'Real Estate'}]):url.endsWith('/items/'+item.id)?answer(item):url.endsWith('/review')?answer({code:'FORBIDDEN'},403):Promise.reject(new Error('Unexpected request'));
 vi.stubGlobal('fetch',vi.fn((...args)=>handler(...args)));
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();document.body.style.overflow='';});

test('decision 403 removes loaded title, seller details and signed photo without retrying the POST',async()=>{
 const actor=userEvent.setup();mount();expect(await screen.findByAltText(item.title)).toBeVisible();expect(screen.getByText(item.seller_id)).toBeVisible();
 await confirm(actor);await expectHidden(403);expect(posts()).toHaveLength(1);
 await actor.click(screen.getByRole('button',{name:'الموافقة على الإعلان',exact:true}));expect(posts()).toHaveLength(1);
 expect(sessionStorage.getItem('mezyad.account.session')).not.toBeNull();
});
for(const status of [403,404])test('preflight '+status+' hides previous content before any decision request',async()=>{
 const base=handler;let reads=0;handler=(url,o)=>url.endsWith('/items/'+item.id)&&++reads>1?answer({code:status===403?'FORBIDDEN':'NOT_FOUND'},status):base(url,o);
 const actor=userEvent.setup();mount();await screen.findByAltText(item.title);await confirm(actor);await expectHidden(status);expect(posts()).toHaveLength(0);
});
for(const status of [403,404])test('uncertain decision followed by reconciliation '+status+' clears all private content without a second POST',async()=>{
 const base=handler;let submitted=false;handler=(url,o)=>url.endsWith('/review')?(submitted=true,answer({code:'TIMEOUT'},504)):url.endsWith('/items/'+item.id)&&submitted?answer({code:status===403?'FORBIDDEN':'NOT_FOUND'},status):base(url,o);
 const actor=userEvent.setup();mount();await screen.findByAltText(item.title);await confirm(actor);await expectHidden(status);expect(posts()).toHaveLength(1);
 expect(fetch.mock.calls.filter(([url])=>url.endsWith('/items/'+item.id))).toHaveLength(3);
});
test('403 also clears a record retained by an earlier successful reconciliation',async()=>{
 const base=handler;let attempts=0;handler=(url,o)=>url.endsWith('/review')?answer({code:++attempts===1?'TIMEOUT':'FORBIDDEN'},attempts===1?504:403):base(url,o);
 const actor=userEvent.setup();mount();await confirm(actor);
 expect(await screen.findByRole('alert')).toHaveTextContent('ما زال قيد المراجعة');expect(screen.getByText(item.title)).toBeVisible();expect(posts()).toHaveLength(1);
 await confirm(actor);await expectHidden(403);expect(posts()).toHaveLength(2);
});
test('401 still expires the session rather than retaining an authenticated admin view',async()=>{
 const base=handler;handler=(url,o)=>url.endsWith('/review')?answer({code:'UNAUTHORIZED'},401):base(url,o);
 const actor=userEvent.setup();mount();await confirm(actor);await waitFor(()=>expect(sessionStorage.getItem('mezyad.account.session')).toBeNull());
 expect(screen.queryByText(item.title,{exact:true})).toBeNull();expect(screen.queryByAltText(item.title)).toBeNull();expect(screen.queryByRole('button',{name:'الموافقة على الإعلان',exact:true})).toBeNull();expect(posts()).toHaveLength(1);
});
