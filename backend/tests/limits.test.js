import test from 'node:test';
import assert from 'node:assert/strict';
import {attemptLimit} from '../src/limits.js';

test('attempt limit stops repeated requests, separates users and expires',()=>{
  const original=Date.now;let now=1000;
  Date.now=()=>now;
  try{
    const limit=attemptLimit({max:2,windowMs:1000});
    let accepted=0,status,retry,payload;
    const res={set(_name,value){retry=value;return this},status(value){status=value;return this},json(value){payload=value;return this}};
    const request=id=>limit({user:{id}},res,()=>accepted++);
    request('a');request('a');request('a');
    assert.equal(accepted,2);assert.equal(status,429);assert.equal(retry,'1');assert.equal(payload.error.code,'TOO_MANY_REQUESTS');
    request('b');assert.equal(accepted,3);
    now=2001;request('a');assert.equal(accepted,4);
  }finally{Date.now=original;}
});
