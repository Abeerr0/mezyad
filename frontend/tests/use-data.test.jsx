import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,waitFor,fireEvent} from '@testing-library/react';
import {useData} from '../src/marketplace/common.jsx';
const auth=vi.hoisted(()=>({session:{token:'first-session'},request:vi.fn()}));
vi.mock('../src/auth/AuthProvider.jsx',()=>({useAuth:()=>auth}));
function Probe(){
 const state=useData('/api/v1/admin/auctions',value=>Array.isArray(value.data),0,{responseMeta:true});
 return <><p>{state.data?.data[0]||'لا بيانات'}</p><button onClick={state.reload}>تحديث</button></>;
}
afterEach(()=>{auth.request.mockReset();auth.session={token:'first-session'};});
test('a changed session clears the previous account and refetches with the same request function',async()=>{
 let resolveNext;
 auth.request.mockResolvedValueOnce({data:['الحساب الأول'],meta:{offset:0}}).mockImplementationOnce(()=>new Promise(resolve=>{resolveNext=resolve;}));
 const view=render(<Probe/>);await screen.findByText('الحساب الأول');
 auth.session={token:'second-session'};view.rerender(<Probe/>);
 await waitFor(()=>expect(auth.request).toHaveBeenCalledTimes(2));expect(screen.queryByText('الحساب الأول')).toBeNull();
 resolveNext({data:['الحساب الثاني'],meta:{offset:0}});await screen.findByText('الحساب الثاني');
 expect(auth.request.mock.calls[0][1].signal.aborted).toBe(true);
 expect(auth.request.mock.calls[1][1].responseMeta).toBe(true);
});
test('an explicit refresh keeps the current view while preserving response metadata options',async()=>{
 let resolveNext;
 auth.request.mockResolvedValueOnce({data:['البيانات المحفوظة'],meta:{offset:6}}).mockImplementationOnce(()=>new Promise(resolve=>{resolveNext=resolve;}));
 render(<Probe/>);await screen.findByText('البيانات المحفوظة');fireEvent.click(screen.getByRole('button',{name:'تحديث'}));
 await waitFor(()=>expect(auth.request).toHaveBeenCalledTimes(2));expect(screen.getByText('البيانات المحفوظة')).toBeVisible();
 expect(auth.request.mock.calls[1][1].responseMeta).toBe(true);
 resolveNext({data:['البيانات المحدثة'],meta:{offset:6}});await screen.findByText('البيانات المحدثة');
});
