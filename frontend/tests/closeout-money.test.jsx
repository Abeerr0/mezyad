import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuthProvider} from '../src/auth/AuthProvider.jsx';
import {saveSession} from '../src/auth/session.js';
import {AuctionDetails} from '../src/ui/Auctions.jsx';
import {BidForm} from '../src/marketplace/Participation.jsx';
import {cents,minimumBid,validBidderAuction,validHistory,validReceipt,personalResult} from '../src/marketplace/bidderData.js';

const id=n=>'60000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user={id:id(1),name:'اختبار مبالغ كبيرة',email:'high-value@example.invalid',role:'USER'};
const auction={id:id(2),item_id:id(3),seller_id:id(4),title:'عقار بقيمة عشرية موثوقة',description:'بيانات اصطناعية لاختبار الدقة',category_name:'Real Estate',visibility:'PUBLIC',images:['/images/hittin-villa.jpg'],status:'ACTIVE',current_price:'10000000.03',starting_price:'10000000.03',minimum_increment:'0.01',start_time:'2020-01-01T00:00:00Z',end_time:'2035-01-01T00:00:00Z',result:null};
const bid={id:id(5),amount:'10000000.03',created_at:'2026-10-20T12:00:00Z'};
const response=(data,status=200)=>({ok:status<400,status,json:async()=>status<400?{data}:{error:data}});

beforeEach(()=>{
  sessionStorage.clear();
  window.history.replaceState(null,'','/#home');
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});

test.each([
  ['0.01',1],['0.10',10],['1.2',120],['10000000.03',1000000003],
  [10000000.03,1000000003],['10000000.04',1000000004],
  ['14000000.03',1400000003],['999999999999.98',99999999999998],
  ['999999999999.99',99999999999999],['00010000000.03',1000000003],
])('exact decimal amount %s converts to integer cents without rounding',(value,expected)=>{
  expect(cents(value)).toBe(expected);
});

test.each(['1e3','1000.001','10000000.030','999999999999.999','1000000000000',
  1000000000000,'0','0.00',0,'-0.01',-1,'NaN',NaN,Infinity,' 1000','1000 ',
  '+1000','1,000.00','.01','1.',null,undefined,true,{},[],new Number(1000),
].map(value=>[value]))('invalid or out-of-range currency stays rejected: %s',value=>{
  expect(cents(value)).toBeNull();
});

test('high-value server data remains valid for details, history, receipt and personal results',()=>{
  expect(validBidderAuction(auction)).toBe(true);
  expect(validHistory([bid])).toBe(true);
  expect(validReceipt({auctionId:auction.id,userId:user.id,bidId:bid.id,amount:10000000.03},auction.id,user.id)).toBe(true);
  expect(personalResult({...auction,status:'CLOSED',result:{winner_bid_id:bid.id,winning_amount:bid.amount,isWinner:true,closed_at:bid.created_at},participation:{hasBid:true,bidCount:1,latestBidId:bid.id,highestBid:bid.amount}},user.id)).toEqual({isWinner:true,hasBid:true});
});

test('minimum bid keeps one-cent increments and rejects overflow at the database limit',()=>{
  expect(minimumBid(auction,[])).toBe(10000000.03);
  expect(minimumBid(auction,[bid])).toBe(10000000.04);
  expect(minimumBid({...auction,current_price:'10000000.04'},[{...bid,amount:'10000000.04'}])).toBe(10000000.05);
  expect(minimumBid({...auction,starting_price:'999999999999.99',current_price:'999999999999.99'},[{...bid,amount:'999999999999.99'}])).toBeNull();
});

test('a legitimate high-value public auction renders its exact price instead of an invalid-response error',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url,options)=>{
    expect(url).toMatch(new RegExp('/api/v1/auctions/'+auction.id+'$'));
    expect(options.method).toBe('GET');
    return response(auction);
  }));
  render(<AuthProvider><AuctionDetails id={auction.id} onRequireLogin={()=>{}}/></AuthProvider>);
  expect(await screen.findByRole('heading',{level:1,name:auction.title})).toBeVisible();
  expect(within(document.querySelector('.detail-price')).getByText('10,000,000.03')).toBeVisible();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('button',{name:'أضف مزايدتك',exact:true})).toBeEnabled();
});

test('high-value bid confirmation preserves exact amount and submits only after explicit confirmation',async()=>{
  saveSession({token:'a'.repeat(64),user});
  vi.stubGlobal('fetch',vi.fn(async(url,options)=>{
    if(url.endsWith('/me/items'))return response([]);
    if(url.endsWith('/auctions/'+auction.id))return response(auction);
    if(url.endsWith('/commitment'))return response({id:id(6),status:'SUCCESS'});
    if(url.endsWith('/bids')&&options.method==='GET')return response([]);
    if(url.endsWith('/bids')&&options.method==='POST'){
      const body=JSON.parse(options.body);
      return response({bidId:bid.id,amount:body.amount,currentPrice:body.amount},201);
    }
    throw Error('Unexpected test request '+url);
  }));
  const accepted=vi.fn(),actor=userEvent.setup();
  render(<AuthProvider><BidForm id={auction.id} onAccepted={accepted}/></AuthProvider>);
  const input=await screen.findByLabelText('مبلغ مزايدتك (ر.س)');
  await waitFor(()=>expect(input).toBeEnabled());
  await actor.type(input,'10000000.03');
  await actor.click(screen.getByRole('button',{name:'مراجعة المزايدة'}));
  expect(within(screen.getByRole('dialog')).getByText('10,000,000.03')).toBeVisible();
  const posts=()=>fetch.mock.calls.filter(([url,options])=>url.endsWith('/bids')&&options.method==='POST');
  expect(posts()).toHaveLength(0);
  await actor.click(within(screen.getByRole('dialog')).getByRole('button',{name:'تأكيد',exact:true}));
  await waitFor(()=>expect(accepted).toHaveBeenCalledWith({auctionId:auction.id,userId:user.id,bidId:bid.id,amount:10000000.03}));
  expect(posts()).toHaveLength(1);
  const body=JSON.parse(posts()[0][1].body);
  expect(body.amount).toBe(10000000.03);
  expect(body.requestId).toMatch(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
});
