import {readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
export const base='http://127.0.0.1:44017/api/v1';
export const fixtures=()=>readFile(process.env.E2E_FIXTURE_FILE||path.join(os.tmpdir(),'frontend-browser-fixtures.json'),'utf8').then(JSON.parse);
const setupSessions=new Map();
export async function session(request,role){
 const f=await fixtures(),key=f.schema+':'+role;
 if(setupSessions.has(key))return setupSessions.get(key);
 const r=await request.post(base+'/auth/login',{data:{email:role+'@example.invalid',password:f.password}});
 if(r.status()!==200)throw Error('Synthetic test login failed: '+r.status());const value=(await r.json()).data;setupSessions.set(key,value);return value;
}

export async function prepareListing(request,{status='APPROVED',title='Seller batch '+Date.now(),reason='أضف صورة أوضح للمعروض'}={}){
 const f=await fixtures(),seller=await session(request,'seller');
 const response=await request.post(base+'/items',{headers:{Authorization:'Bearer '+seller.token},data:{categoryId:f.category,title,description:'Synthetic API fixture for seller UI; image upload is not simulated as complete.',categoryFields:{model:'Test'}}});
 if(response.status()!==201)throw Error('Synthetic listing setup failed');let item=(await response.json()).data;
 if(status!=='PENDING_REVIEW'){
  const admin=await session(request,'admin'),review=await request.post(base+'/admin/items/'+item.id+'/review',{headers:{Authorization:'Bearer '+admin.token},data:{decision:status,...(status==='REJECTED'?{reason}:{})}});
  if(review.status()!==200)throw Error('Synthetic listing review failed');item=(await review.json()).data;
 }
 return {item,seller};
}
export const auctionBody=itemId=>({itemId,visibility:'PUBLIC',startingPrice:1500,minimumIncrement:50,startTime:new Date(Date.now()+3600000).toISOString(),endTime:new Date(Date.now()+7200000).toISOString()});
export async function loginSeller(page){
 const f=await fixtures();await page.goto('/#login');await page.getByLabel('البريد الإلكتروني').fill('seller@example.invalid');await page.getByLabel('كلمة المرور',{exact:true}).fill(f.password);await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await page.getByRole('tab',{name:'مزايداتي',exact:true}).waitFor();
}
