import test from 'node:test';
import assert from 'node:assert/strict';
import {startCommitment} from '../src/bank.js';

test('unconfigured bank never trusts browser SUCCESS or invents provider operations',()=>{
  assert.throws(()=>startCommitment({status:'SUCCESS',reference:'browser-value'}),error=>error.status===503&&error.apiCode==='BANK_SANDBOX_UNAVAILABLE');
});
