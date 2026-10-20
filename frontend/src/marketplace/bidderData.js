import {useCallback,useEffect,useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {ApiError,errorMessage} from '../api.js';
import {uuid,money,validAuction} from './common.jsx';

export const formatAmount=value=>Number.isFinite(Number(value))?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(value)):'—';
export function cents(value){
  if(!money(value))return null;
  const number=Number(value),rounded=Math.round(number*100);
  return Number.isSafeInteger(rounded)&&Math.abs(number*100-rounded)<1e-7?rounded:null;
}
export const validBidderAuction=value=>validAuction(value)&&uuid(value.seller_id)&&Array.isArray(value.images)
  &&['PUBLIC','PRIVATE'].includes(value.visibility)&&[value.starting_price,value.current_price,value.minimum_increment].every(v=>cents(v)!==null)
  &&Number.isFinite(Date.parse(value.start_time))&&Number.isFinite(Date.parse(value.end_time))&&Date.parse(value.end_time)>Date.parse(value.start_time);
export const validHistory=value=>Array.isArray(value)&&value.every(b=>uuid(b.id)&&cents(b.amount)!==null&&Number.isFinite(Date.parse(b.created_at)))&&new Set(value.map(b=>b.id)).size===value.length;
export const validCommitment=value=>uuid(value?.id)&&['SUCCESS','PENDING','FAILED'].includes(value.status);
export const validResult=value=>value&&typeof value==='object'&&(value.winner_bid_id===null||uuid(value.winner_bid_id))&&Number.isFinite(Date.parse(value.closed_at));
export const validParticipation=p=>p&&typeof p.hasBid==='boolean'&&Number.isSafeInteger(p.bidCount)&&p.bidCount>=0
  &&p.hasBid===(p.bidCount>0)&&(p.hasBid?uuid(p.latestBidId)&&cents(p.highestBid)!==null:p.latestBidId===null&&p.highestBid===null);
export function personalResult(auction,userId){
  if(!uuid(userId)||!validResult(auction?.result)||!validParticipation(auction.participation)||typeof auction.result.isWinner!=='boolean')return null;
  if(auction.result.isWinner&&(!auction.participation.hasBid||!uuid(auction.result.winner_bid_id)||cents(auction.result.winning_amount)===null))return null;
  return {isWinner:auction.result.isWinner,hasBid:auction.participation.hasBid};
}
export const validReceipt=(receipt,auctionId,userId)=>uuid(userId)&&receipt?.auctionId===auctionId&&receipt.userId===userId&&uuid(receipt.bidId)&&cents(receipt.amount)!==null;
export function minimumBid(auction,history){
  if(!auction||!Array.isArray(history))return null;
  const current=cents(auction.current_price),start=cents(auction.starting_price),increment=cents(auction.minimum_increment);
  if([current,start,increment].includes(null))return null;
  const base=Math.max(current,...history.map(b=>cents(b.amount)||0));
  const value=history.length||current>start?base+increment:start;
  return cents(value/100)===null?null:value/100;
}
export function auctionWindow(auction,now=Date.now()){
  if(!auction)return 'unknown';
  if(auction.status==='CLOSED'||Date.parse(auction.end_time)<=now)return 'closed';
  return Date.parse(auction.start_time)>now?'scheduled':'open';
}
export function useNow(){const [now,setNow]=useState(Date.now);useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);return now;}
export function higherAcceptedBid(receipt,auction,userId,history){
  if(uuid(userId)&&validParticipation(auction.participation))return auction.participation.hasBid&&cents(auction.current_price)>cents(auction.participation.highestBid);
  return validReceipt(receipt,auction.id,userId)&&Array.isArray(history)&&history.some(b=>b.id!==receipt.bidId&&cents(b.amount)>cents(receipt.amount));
}
// This is an unresolved client request, never a bank status or proof of bid ownership.
const intentKey=(userId,auctionId)=>'mezyad.bid.intent:'+userId+':'+auctionId;
export function readIntent(userId,auctionId){
  try{const raw=sessionStorage.getItem(intentKey(userId,auctionId));if(!raw)return null;const value=JSON.parse(raw);
    return value&&value.userId===userId&&value.auctionId===auctionId&&uuid(value.requestId)&&cents(value.amount)!==null&&['uncertain','duplicate'].includes(value.state)?value:{invalid:true};
  }catch{return {invalid:true};}
}
export function saveIntent(value){
  try{const key=intentKey(value.userId,value.auctionId);sessionStorage.setItem(key,JSON.stringify(value));return sessionStorage.getItem(key)===JSON.stringify(value);}catch{return false;}
}
export function clearIntent(userId,auctionId){try{sessionStorage.removeItem(intentKey(userId,auctionId));}catch{/* The accepted in-memory receipt remains distinct from unresolved storage. */}}

export function useBidderAuction(id){
  const {request,session}=useAuth(),key=id+':'+(session?.user.id||'guest')+':'+(session?.token||'');
  const [state,setState]=useState({key:'',data:null,failure:'',loading:true}),[revision,setRevision]=useState(0);
  const reload=useCallback(()=>setRevision(n=>n+1),[]);
  useEffect(()=>{
    const controller=new AbortController();let busy=false;
    setState(previous=>previous.key===key?{...previous,loading:true,failure:''}:{key,data:null,failure:'',loading:true});
    async function load(){
      if(busy)return;busy=true;
      try{const value=await request('/api/v1/auctions/'+id,{signal:controller.signal});if(!validBidderAuction(value)||value.id!==id)throw new ApiError('INVALID_RESPONSE');if(!controller.signal.aborted)setState({key,data:value,failure:'',loading:false});}
      catch(error){if(!controller.signal.aborted)setState({key,data:null,failure:errorMessage(error),loading:false});}
      finally{busy=false;}
    }
    load();const timer=setInterval(load,5000);return()=>{controller.abort();clearInterval(timer);};
  },[id,request,key,revision]);
  return {...(state.key===key?state:{data:null,failure:'',loading:true}),reload};
}
