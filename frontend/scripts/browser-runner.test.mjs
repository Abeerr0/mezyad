import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {aggregateRuns,validateTestDatabase} from './run-browser-tests.mjs';
const report=extra=>({suites:[],errors:[],stats:{expected:1,unexpected:0,skipped:0,flaky:0,duration:1,...extra}});

test('a later successful spec cannot hide an earlier process failure',()=>{
 const result=aggregateRuns([{file:'first.spec.js',exitCode:1,report:report()},{file:'last.spec.js',exitCode:0,report:report()}]);
 assert.equal(result.success,false);assert.equal(result.stats.expected,2);assert.match(result.errors[0].message,/first.spec.js/);
});
test('missing or empty reports fail instead of accepting old output',()=>{
 assert.equal(aggregateRuns([{file:'missing.spec.js',exitCode:0,report:null}]).success,false);
 assert.equal(aggregateRuns([{file:'empty.spec.js',exitCode:0,report:report({expected:0})}]).success,false);
 assert.equal(aggregateRuns([]).success,false);
});
test('failed, skipped, flaky and report-level errors all fail the suite',()=>{
 for(const stats of [{unexpected:1},{skipped:1},{flaky:1}])assert.equal(aggregateRuns([{file:'a.spec.js',exitCode:0,report:report(stats)}]).success,false);
 assert.equal(aggregateRuns([{file:'a.spec.js',exitCode:0,report:{...report(),errors:[{message:'Setup failed'}]}}]).success,false);
});
test('every successful report is aggregated with the exact test totals',()=>{
 const result=aggregateRuns([{file:'one.spec.js',exitCode:0,report:report({expected:12})},{file:'two.spec.js',exitCode:0,report:report({expected:13})}]);
 assert.equal(result.success,true);assert.equal(result.stats.expected,25);assert.equal(result.stats.duration,2);
});
test('database validation never falls back to DATABASE_URL or accepts a non-test database',()=>{
 for(const input of [undefined,'postgres://local/production','https://local/qa_test','postgres://local/qa_test/extra'])assert.throws(()=>validateTestDatabase(input));
 assert.equal(validateTestDatabase('postgresql://localhost/mezyad_browser_test').pathname,'/mezyad_browser_test');
});
test('the real CLI exits nonzero and writes a failure summary without a test database',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'mezyad-runner-check-'));
 try{
  const summary=path.join(directory,'summary.json');
  const env={...process.env,TEST_DATABASE_URL:'',E2E_RESULTS_DIR:directory,E2E_JSON_FILE:summary};
  const child=spawnSync(process.execPath,[fileURLToPath(new URL('./run-browser-tests.mjs',import.meta.url))],{env,encoding:'utf8'});
  assert.equal(child.status,1);const data=JSON.parse(await readFile(summary));assert.equal(data.success,false);assert.equal(data.stats.expected,0);assert.match(data.errors.at(-1).message,/TEST_DATABASE_URL/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
