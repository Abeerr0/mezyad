// فحص متصفح إضافي على WASM؛ ما يثبت أقفال PostgreSQL ولا نجاح البنك.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
if(!process.env.PGLITE_INSTALL_DIR)throw new Error('Set PGLITE_INSTALL_DIR to a separate PGlite + pglite-socket installation');
const requireTool=createRequire(join(resolve(process.env.PGLITE_INSTALL_DIR),'package.json'));
const {PGlite}=requireTool('@electric-sql/pglite'),{pgcrypto}=requireTool('@electric-sql/pglite/contrib/pgcrypto'),{PGLiteSocketServer}=requireTool('@electric-sql/pglite-socket');
const port=Number(process.env.PGLITE_SOCKET_PORT||45432);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid PGLITE_SOCKET_PORT');
const db=await PGlite.create({extensions:{pgcrypto}});
const server=new PGLiteSocketServer({db,host:'127.0.0.1',port,maxConnections:20});
try{
  await server.start();console.log('Browser SQL engine: PGlite WASM. Native concurrency and banking are NOT verified.');
  const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/playwright/cli.js',import.meta.url)),'test',...process.argv.slice(2)],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit',
    env:{...process.env,E2E_SQL_ENGINE:'pglite',TEST_DATABASE_URL:`postgresql://postgres:postgres@127.0.0.1:${port}/mezyad_browser_test`},
  });
  const stop=()=>child.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
  process.exitCode=await new Promise((done,reject)=>{child.on('error',reject);child.on('exit',code=>done(code??1));});
}finally{await server.stop();await db.close();}
