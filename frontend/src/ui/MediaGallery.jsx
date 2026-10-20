import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {safeImage} from './media.js';
import './shared.css';

export function ServerImage({src,alt,className='',empty='لا تتوفر صورة'}) {
  const source=safeImage(src),[failed,setFailed]=useState(null);
  if(!source||failed===source)return <div className={className+' image-placeholder'} role="img" aria-label={empty}>{empty}</div>;
  return <img className={className} src={source} alt={alt} onError={()=>setFailed(source)}/>;
}

function GalleryDialog({images,index,setIndex,title,onClose,returnLabel}) {
  const ref=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement,root=document.getElementById('root'),inert=root?.hasAttribute('inert'),overflow=document.body.style.overflow;
    root?.setAttribute('inert','');document.body.style.overflow='hidden';ref.current?.querySelector('button')?.focus();
    return()=>{if(!inert)root?.removeAttribute('inert');document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
  },[]);
  function keys(event){
    event.stopPropagation();
    if(event.key==='Escape'){event.preventDefault();onClose();}
    else if(images.length>1&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();setIndex(event.key==='Home'?0:event.key==='End'?images.length-1:(index+(event.key==='ArrowLeft'?1:-1)+images.length)%images.length);
    }else if(event.key==='Tab'){
      const buttons=[...ref.current.querySelectorAll('button:not(:disabled),a[href]')],first=buttons[0],last=buttons.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
  return createPortal(<div className="media-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><section className="media-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby="gallery-heading" onKeyDown={keys} data-design-node="612:34">
    <h2 id="gallery-heading">{title}</h2><button className="media-close text-action" type="button" onClick={onClose} aria-label="إغلاق معرض الصور">إغلاق</button>
    <ServerImage className="media-full-image" src={images[index]} alt={title}/><p className="media-position" role="status">الصورة <bdi>{index+1}</bdi> من <bdi>{images.length}</bdi></p>
    {images.length>1&&<div className="media-navigation"><button type="button" className="button secondary" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>الصورة السابقة</button><button type="button" className="button secondary" disabled={index===images.length-1} onClick={()=>setIndex(i=>i+1)}>الصورة التالية</button></div>}
    <button type="button" className="button secondary media-return" onClick={onClose}>{returnLabel}</button>
  </section></div>,document.body);
}

export function MediaGallery({images=[],title,variant='auction',returnLabel='العودة إلى تفاصيل المزاد'}) {
  const sources=[...new Set((Array.isArray(images)?images:[]).map(safeImage).filter(Boolean))];
  const [selected,setSelected]=useState(0),[open,setOpen]=useState(false),index=Math.min(selected,Math.max(0,sources.length-1));
  const signature=sources.join('\n');
  useEffect(()=>{setSelected(0);setOpen(false);},[signature,title]);
  function choose(event){
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!sources.length)return;
    event.preventDefault();setSelected(event.key==='Home'?0:event.key==='End'?sources.length-1:(index+(event.key==='ArrowLeft'?1:-1)+sources.length)%sources.length);
  }
  return <section className={'detail-gallery media-gallery media-gallery--'+variant} aria-label="صور المعروض" onKeyDown={choose}>
    <ServerImage className="gallery-main" src={sources[index]} alt={title}/>
    {sources.length>0&&<button type="button" className="text-action gallery-open" onClick={()=>setOpen(true)}>فتح معرض الصور</button>}
    {sources.length>1&&<><div className="gallery-thumbs">{sources.slice(1).map((source,i)=><button type="button" key={source} aria-label={'عرض الصورة '+(i+2)} aria-pressed={index===i+1} onClick={()=>setSelected(i+1)}><ServerImage src={source} alt={title+' — الصورة '+(i+2)}/></button>)}</div>
      <p className="field-hint" aria-live="polite">الصورة {index+1} من {sources.length}</p>{index>0&&<button className="text-action gallery-return" type="button" onClick={()=>setSelected(0)}>الصورة الرئيسية</button>}</>}
    {open&&sources.length>0&&<GalleryDialog images={sources} index={index} setIndex={setSelected} title={title} returnLabel={returnLabel} onClose={()=>setOpen(false)}/>}
  </section>;
}
