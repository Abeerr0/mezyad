import React from 'react';
export const specificationLabels={name:'اسم المعروض',age:'العمر',location:'الموقع',area:'المساحة (م²)',make:'الشركة',model:'الطراز',year:'سنة الصنع',letters:'حروف اللوحة',number:'رقم اللوحة',brand:'العلامة',condition:'الحالة',color:'اللون',breed:'السلالة',mileage:'المسافة المقطوعة'};
export function ItemSpecifications({fields}){
  if(!fields||typeof fields!=='object'||Array.isArray(fields))return null;
  const entries=Object.entries(fields).filter(([,value])=>value!==null&&value!==undefined&&value!=='');
  if(!entries.length)return null;
  return <section className="item-specifications"><h2>مواصفات المعروض</h2><dl className="workspace-summary">{entries.map(([key,value])=><React.Fragment key={key}><dt>{specificationLabels[key]||key}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></React.Fragment>)}</dl></section>;
}
