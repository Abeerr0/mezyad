import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';

export function validateTestDatabase(value){
  let url;
  try{url=new URL(value);}catch{throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database ending in _test.');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!/^\/[A-Za-z0-9_]+_test$/.test(url.pathname)){
    throw new Error('Only an explicitly configured PostgreSQL *_test database is allowed.');
  }
  return url;
}

export function aggregateRuns(runs){
  const stats={expected:0,unexpected:0,skipped:0,flaky:0,duration:0},errors=[],suites=[];
  for(const run of runs){
    const report=run.report;
    if(run.exitCode!==0)errors.push({message:`${run.file}: Playwright did not exit successfully.`});
    if(run.error)errors.push({message:`${run.file}: ${run.error}`});
    const valid=report&&Array.isArray(report.suites)&&Array.isArray(report.errors)
      &&['expected','unexpected','skipped','flaky'].every(k=>Number.isSafeInteger(report.stats?.[k])&&report.stats[k]>=0)
      &&Number.isFinite(report.stats?.duration)&&report.stats.duration>=0;
    if(!valid){errors.push({message:`${run.file}: current-run JSON report is missing or invalid.`});continue;}
    for(const key of Object.keys(stats))stats[key]+=report.stats[key];
    suites.push(...report.suites);errors.push(...report.errors);
    if(report.stats.expected+report.stats.unexpected+report.stats.skipped+report.stats.flaky===0){
      errors.push({message:`${run.file}: no tests were collected.`});
    }
  }
  if(!runs.length)errors.push({message:'No Playwright spec files were found.'});
  const success=!!runs.length&&!errors.length&&!stats.unexpected&&!stats.skipped&&!stats.flaky;
  return {success,stats,errors,suites};
}

function execute(command,args,options,onChild){
  return new Promise(resolve=>{
    const child=spawn(command,args,{...options,stdio:'inherit'});onChild(child);
    child.once('error',()=>resolve(1));
    child.once('close',(code,signal)=>resolve(signal?1:code??1));
  });
}

export async function runBrowserTests(){
  const frontend=fileURLToPath(new URL('../',import.meta.url));
  const base=path.resolve(process.env.E2E_RESULTS_DIR||path.join(os.tmpdir(),'mezyad-browser-results'));
  await mkdir(base,{recursive:true});
  const runDirectory=await mkdtemp(path.join(base,'run-'));
  const summaryPath=path.resolve(process.env.E2E_JSON_FILE||path.join(runDirectory,'results.json'));
  async function publish(summary){
    await mkdir(path.dirname(summaryPath),{recursive:true});
    const temporary=summaryPath+'.'+process.pid+'.tmp';
    await writeFile(temporary,JSON.stringify(summary,null,2)+'\n');await rename(temporary,summaryPath);
  }
  await publish({...aggregateRuns([]),status:'running',success:false,runDirectory,runs:[]});
  const runs=[],seenSchemas=new Set();let child=null,interrupted=false,summary;
  const interrupt=()=>{interrupted=true;child?.kill('SIGTERM');};
  process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
  try{
    validateTestDatabase(process.env.TEST_DATABASE_URL);
    if(process.argv.length>2)throw new Error('This command runs every spec. Use Playwright directly for a diagnostic subset.');
    const backendRequire=createRequire(new URL('../../backend/package.json',import.meta.url));
    const {Pool}=backendRequire('pg');
    const connection=new Pool({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:5000});
    try{await connection.query('SELECT 1');}finally{await connection.end();}
    const cli=fileURLToPath(new URL('../node_modules/@playwright/test/cli.js',import.meta.url));
    const specs=(await readdir(path.join(frontend,'e2e'))).filter(n=>n.endsWith('.spec.js')).sort();
    for(const file of specs){
      if(interrupted){runs.push({file,exitCode:1,error:'Run interrupted.',report:null});continue;}
      const directory=path.join(runDirectory,file.replace(/\.spec\.js$/,''));
      await mkdir(directory);
      const reportPath=path.join(directory,'report.json'),fixture=path.join(directory,'fixtures.json'),schemaFile=path.join(directory,'schema.json');
      const env={...process.env,E2E_JSON_FILE:reportPath,E2E_OUTPUT_DIR:path.join(directory,'artifacts'),E2E_FIXTURE_FILE:fixture,E2E_SCHEMA_FILE:schemaFile};
      delete env.DATABASE_URL; // e2e-server derives this only from TEST_DATABASE_URL.
      console.log(`\n[Playwright] ${file} — fresh Backend process and schema`);
      const exitCode=await execute(process.execPath,[cli,'test','e2e/'+file,'--workers=1','--retries=0','--forbid-only'],{cwd:frontend,env},value=>{child=value;});
      child=null;
      const run={file,exitCode,report:null,reportPath:path.relative(runDirectory,reportPath)};
      try{run.report=JSON.parse(await readFile(reportPath,'utf8'));}catch{/* No previous report is ever reused. */}
      // Playwright stops its own webServer. Verify cleanup, including failed startup.
      let marker;
      try{marker=JSON.parse(await readFile(schemaFile,'utf8'));}catch{/* No schema was created, or its marker is invalid. */}
      if(marker&&/^frontend_browser_[a-f0-9]{12}$/.test(marker.schema)){
        run.schema=marker.schema;
        if(seenSchemas.has(marker.schema))run.error='A schema was unexpectedly reused.';
        seenSchemas.add(marker.schema);
        const control=new Pool({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:5000});
        try{
          await control.query(`DROP SCHEMA IF EXISTS "${marker.schema}" CASCADE`);
          const result=await control.query('SELECT 1 FROM pg_namespace WHERE nspname=$1',[marker.schema]);
          if(result.rowCount)throw new Error('Schema remains after cleanup.');
          run.schemaRemoved=true;
        }catch{run.error='Could not verify cleanup of the owned test schema.';}
        finally{await control.end();}
      }else{
        run.error='Fresh test schema marker is missing or invalid.';
      }
      await rm(fixture,{force:true}); // Synthetic sessions remain temporary, not report content.
      runs.push(run);
    }
    summary={...aggregateRuns(runs),mode:'Fresh Backend process and PostgreSQL schema per spec; Backend limits unchanged',runDirectory,
      runs:runs.map(({report,...run})=>run)};
  }catch(error){
    summary={...aggregateRuns(runs),success:false,runDirectory,runs:runs.map(({report,...run})=>run)};
    summary.errors.push({message:error.code==='MODULE_NOT_FOUND'?'Install the adjacent Backend dependencies before browser tests.':error.message});
  }finally{
    process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);
  }
  await publish({...summary,status:'finished'});
  console.log('\nPlaywright summary:',JSON.stringify({...summary.stats,success:summary.success}));
  console.log('Current-run results:',summaryPath);
  return summary.success?0:1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  process.exitCode=await runBrowserTests();
}
