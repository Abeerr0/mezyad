import React,{useState} from 'react';
import {test,expect,afterEach} from 'vitest';
import {render,screen,act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Page,Confirm} from '../src/marketplace/common.jsx';

afterEach(()=>{document.body.style.overflow='';});
test('a Page mounted after an async loading main receives keyboard focus',async()=>{
 let complete;
 function AsyncPage(){const [ready,setReady]=useState(false);complete=()=>setReady(true);return ready?<Page title="البيانات المحملة"><button>الإجراء التالي</button></Page>:<main tabIndex={-1} ref={node=>node?.focus()}><p role="status">جارٍ التحميل</p></main>;}
 render(<AsyncPage/>);expect(screen.getByRole('main')).toHaveFocus();
 await act(async()=>complete());expect(screen.getByRole('heading',{name:'البيانات المحملة'})).toBeVisible();expect(screen.getByRole('main')).toHaveFocus();
 await userEvent.setup().tab();expect(screen.getByRole('button',{name:'الإجراء التالي'})).toHaveFocus();
});
test('Page polling rerenders preserve focus on the current control',()=>{
 const view=render(<Page title="المزاد"><button>متابعة المزايدة</button><p>السعر 100</p></Page>);const control=screen.getByRole('button',{name:'متابعة المزايدة'});control.focus();
 view.rerender(<Page title="المزاد"><button>متابعة المزايدة</button><p>السعر 120</p></Page>);
 expect(control).toHaveFocus();expect(screen.getByText('السعر 120')).toBeVisible();
});
test('a Page mounted while a confirmation is open cannot steal modal focus',async()=>{
 let mountPage;
 function Harness(){const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false);mountPage=()=>setLoaded(true);return <div id="root"><button onClick={()=>setOpen(true)}>فتح النافذة</button>{loaded&&<Page title="بيانات وصلت أثناء التأكيد"><button>خلف النافذة</button></Page>}{open&&<Confirm title="التأكيد الحالي" onConfirm={()=>{}} onCancel={()=>setOpen(false)}><label htmlFor="focus-reason">ملاحظة</label><input id="focus-reason"/></Confirm>}</div>;}
 const actor=userEvent.setup();render(<Harness/>);await actor.click(screen.getByRole('button',{name:'فتح النافذة'}));const input=screen.getByLabelText('ملاحظة');input.focus();
 await act(async()=>mountPage());expect(input).toHaveFocus();expect(document.getElementById('root')).toHaveAttribute('inert');
 await actor.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('button',{name:'فتح النافذة'})).toHaveFocus();
});
test('Page mounting also preserves a separate existing modal focus without relying on root inert',()=>{
 const dialog=document.createElement('section');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');const control=document.createElement('button');control.textContent='داخل النافذة';dialog.append(control);document.body.append(dialog);control.focus();
 try{render(<Page title="صفحة جديدة"><button>إجراء الصفحة</button></Page>);expect(control).toHaveFocus();}finally{dialog.remove();}
});

for(const outcome of ['removed','disabled'])test('confirmation closes onto the live main when its trigger is '+outcome,async()=>{
 function Harness(){const [open,setOpen]=useState(false),[done,setDone]=useState(false);return <div id="root"><Page title="نتيجة القرار">{!(done&&outcome==='removed')&&<button disabled={done&&outcome==='disabled'} onClick={()=>setOpen(true)}>اتخاذ القرار</button>}{done&&<p>تم حفظ القرار من الخادم</p>}</Page>{open&&<Confirm title="تأكيد القرار" onConfirm={()=>{setDone(true);setOpen(false);}} onCancel={()=>setOpen(false)}/>}</div>;}
 const actor=userEvent.setup();render(<Harness/>);await actor.click(screen.getByRole('button',{name:'اتخاذ القرار'}));expect(screen.getByRole('dialog')).toHaveFocus();await actor.click(screen.getByRole('button',{name:'تأكيد',exact:true}));
 expect(screen.getByText('تم حفظ القرار من الخادم')).toBeVisible();expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('main')).toHaveFocus();expect(document.getElementById('root')).not.toHaveAttribute('inert');
 if(outcome==='disabled')expect(screen.getByRole('button',{name:'اتخاذ القرار'})).toBeDisabled();else expect(screen.queryByRole('button',{name:'اتخاذ القرار'})).toBeNull();
});
test('confirmation cleanup leaves another active modal focused and its background inert',async()=>{
 let dismiss;
 function Harness(){const [open,setOpen]=useState(false);dismiss=()=>setOpen(false);return <div id="root"><Page title="الخلفية"><button onClick={()=>setOpen(true)}>افتح التأكيد</button></Page>{open&&<Confirm title="التأكيد الأول" onConfirm={()=>{}} onCancel={()=>setOpen(false)}/>}</div>;}
 const actor=userEvent.setup();render(<Harness/>);await actor.click(screen.getByRole('button',{name:'افتح التأكيد'}));
 const dialog=document.createElement('section');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');const input=document.createElement('input');dialog.append(input);document.body.append(dialog);input.focus();
 try{await act(async()=>dismiss());expect(input).toHaveFocus();expect(document.getElementById('root')).toHaveAttribute('inert');expect(document.body.style.overflow).toBe('hidden');}finally{dialog.remove();}
});
test('confirmation cleanup never focuses a main that belongs to an inert background',async()=>{
 let finish;
 function Harness(){const [open,setOpen]=useState(false),[done,setDone]=useState(false);finish=()=>{setDone(true);setOpen(false);};return <div id="root" inert=""><Page title="خلفية معزولة">{!done&&<button onClick={()=>setOpen(true)}>افتح</button>}</Page>{open&&<Confirm title="التأكيد" onConfirm={finish} onCancel={()=>setOpen(false)}/>}</div>;}
 render(<Harness/>);screen.getByRole('button',{name:'افتح'}).click();await act(async()=>{});const main=screen.getByRole('main');
 await act(async()=>finish());expect(main).not.toHaveFocus();expect(document.getElementById('root')).toHaveAttribute('inert');
});
test('Page focuses a wizard step change but preserves focus for updates within the same step',()=>{
 const view=render(<Page focusKey={0} title="تفاصيل الإعلان"><button>متابعة</button></Page>);screen.getByRole('button',{name:'متابعة'}).focus();
 view.rerender(<Page focusKey={1} title="صور الإعلان"><button>اختيار الصور</button><p>صورة واحدة</p></Page>);expect(screen.getByRole('main')).toHaveFocus();const control=screen.getByRole('button',{name:'اختيار الصور'});control.focus();
 view.rerender(<Page focusKey={1} title="صور الإعلان"><button>اختيار الصور</button><p>صورتان</p></Page>);expect(control).toHaveFocus();
});
