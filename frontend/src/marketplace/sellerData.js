import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {uuid,validAuction} from './common.jsx';

const states=['SCHEDULED','ACTIVE','CLOSED'];
const blank=userId=>({userId,data:[],loading:true,complete:false,failure:''});
export const validSellerAuction=value=>validAuction(value)&&uuid(value.item_id)&&uuid(value.seller_id)
  &&Number.isFinite(Number(value.current_price))&&states.includes(value.status)&&Array.isArray(value.images);
export const linkedAuction=(auctions,itemId,userId)=>auctions.find(a=>a.item_id===itemId&&a.seller_id===userId);
export const dateLabel=value=>Number.isFinite(Date.parse(value))
  ?new Date(value).toLocaleString('ar-SA-u-nu-latn',{calendar:'gregory',dateStyle:'medium',timeStyle:'short'}):'غير متاح';

// /me/auctions mixes ownership and participation. Read existing detail contracts
// before assigning an auction to a seller or linking it to a listing.
export function useSellerAuctions(enabled=true,poll=false){
  const {request,session,status}=useAuth(),userId=session?.user.id;
  const cache=useRef({userId,summaries:null,summaryAt:-Infinity,details:new Map()});
  const [state,setState]=useState(()=>blank(userId)),[revision,setRevision]=useState(0);
  const reload=useCallback(()=>{cache.current={userId,summaries:null,summaryAt:-Infinity,details:new Map()};setRevision(n=>n+1);},[userId]);
  useEffect(()=>{
    if(!enabled||status!=='authenticated')return;
    if(cache.current.userId!==userId)cache.current={userId,summaries:null,summaryAt:-Infinity,details:new Map()};
    const current=cache.current,controller=new AbortController();let busy=false,timer;
    setState(previous=>previous.userId===userId?{...previous,loading:true,failure:''}:blank(userId));
    async function load(){
      if(busy||document.hidden)return;busy=true;
      try{
        if(!current.summaries||Date.now()-current.summaryAt>=30000){
          const summaries=await request('/api/v1/me/auctions',{signal:controller.signal});
          if(!Array.isArray(summaries)||!summaries.every(a=>uuid(a.id)&&typeof a.title==='string'&&states.includes(a.status))
            ||new Set(summaries.map(a=>a.id)).size!==summaries.length)throw new ApiError('INVALID_RESPONSE');
          if(controller.signal.aborted)return;
          current.summaries=summaries;current.summaryAt=Date.now();
          const ids=new Set(summaries.map(a=>a.id));for(const id of current.details.keys())if(!ids.has(id))current.details.delete(id);
        }
        const needed=current.summaries.filter(a=>{
          const old=current.details.get(a.id);
          return !old||(old.data.seller_id===userId&&old.data.status!=='CLOSED'&&Date.now()-old.at>=5000)
            ||(current.summaryAt>old.at&&(old.data.status!==a.status||old.data.title!==a.title||a.end_time&&a.end_time!==old.data.end_time));
        });
        for(let i=0;i<needed.length;i+=4){
          const rows=await Promise.all(needed.slice(i,i+4).map(async summary=>{
            const data=await request('/api/v1/auctions/'+summary.id,{signal:controller.signal});
            if(!validSellerAuction(data)||data.id!==summary.id)throw new ApiError('INVALID_RESPONSE');
            return data;
          }));
          if(controller.signal.aborted)return;
          for(const data of rows)current.details.set(data.id,{data,at:Date.now()});
        }
        if(!controller.signal.aborted)setState({userId,data:current.summaries.map(a=>current.details.get(a.id).data),loading:false,complete:true,failure:''});
      }catch(error){if(!controller.signal.aborted)setState(previous=>({...previous,userId,loading:false,complete:false,failure:errorMessage(error)}));}
      finally{busy=false;}
    }
    async function refresh(){await load();if(poll&&!controller.signal.aborted)timer=setTimeout(()=>{void refresh();},5000);}
    void refresh();const resume=()=>{if(!document.hidden)void load();};document.addEventListener('visibilitychange',resume);
    return()=>{controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',resume);};
  },[request,status,userId,enabled,poll,revision]);
  return {...(state.userId===userId?state:blank(userId)),reload};
}
