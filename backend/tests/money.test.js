import test from 'node:test';
import assert from 'node:assert/strict';
import {validMoney, toCents} from '../src/money.js';

test('money validation', () => {
 assert.equal(validMoney(10.25), true);
 assert.equal(validMoney(10.001), false);
 assert.equal(validMoney(0), false);
 assert.equal(validMoney('10.25'), false);
 assert.equal(toCents('0.29'), 29);
 assert.equal(toCents('0.10') + toCents('0.20'), 30);
});

test('large auction amounts retain exact cents across the numeric(14,2) range', () => {
 for (const [amount,cents] of [[655734950989.55,65573495098955],[602329263573.3,60232926357330],[141924334552.83,14192433455283],[999999999999.99,99999999999999]]) {
  assert.equal(validMoney(amount),true);
  assert.equal(toCents(amount),cents);
  assert.equal(toCents(String(amount)),cents);
 }
 for(const amount of [NaN,Infinity,-1,0,1000000000000,1.001]) assert.equal(validMoney(amount),false);
 for(const value of ['12.001','bad',{},null,'1000000000000.00'])assert.throws(()=>toCents(value));
});
