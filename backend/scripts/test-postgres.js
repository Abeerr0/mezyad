// هذا الفحص ما يتخطى الداتا بصمت؛ لازم قاعدة اختبار مستقلة.
import {spawnSync} from 'node:child_process';
import pg from 'pg';
const value=process.env.TEST_DATABASE_URL;
if(!value)throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database ending in _test');
const url=new URL(value);
if(!['postgres:','postgresql:'].includes(url.protocol)||!decodeURIComponent(url.pathname).endsWith('_test'))throw new Error('Use only a disposable PostgreSQL database ending in _test');
const client=new pg.Client({connectionString:value});
try{
  await client.connect();
  const version=(await client.query('SELECT version() AS version')).rows[0].version;
  if(/pglite|wasm/i.test(version))throw new Error('Native PostgreSQL required; use the separate WASM smoke command for PGlite');
  console.log('Test database engine:',version);
}finally{await client.end();}
const result=spawnSync(process.execPath,['--test','tests/*.test.js','tests/acceptance/*.test.js'],{stdio:'inherit'});
process.exit(result.status??1);
