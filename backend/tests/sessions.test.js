// نجرّب الدخول وانتهاء الجلسة والخروج من الحساب.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {setupQa,databaseSkip,expectError} from './helpers/qa-fixtures.js';
let q;
before(async()=>{if(!databaseSkip)q=await setupQa('sessions');});
after(async()=>{if(q)await q.shutdown();});

test('DB-06: login stores only a session hash, expiry and logout revoke access',
  {skip:databaseSkip},async()=>{
    const email='session-check@example.invalid',password='Session-test-only';
    const registered=await q.api('/auth/register',{method:'POST',body:{name:'Session fixture',email,password}});
    assert.equal(registered.status,201);
    const login=await q.api('/auth/login',{method:'POST',body:{email,password}});
    assert.equal(login.status,200);
    const token=login.json.data.token,id=registered.json.data.id;
    const row=(await q.pool.query('SELECT * FROM user_sessions WHERE user_id=$1',[id])).rows[0];
    assert.ok(row);
    assert.notEqual(row.token_hash,token);
    assert.ok(row.expires_at>new Date());
    assert.equal((await q.api('/me/items',{token})).status,200);
    await q.pool.query("UPDATE user_sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE user_id=$1",[id]);
    expectError(await q.api('/me/items',{token}),401,'UNAUTHORIZED');
    const again=await q.api('/auth/login',{method:'POST',body:{email,password}});
    const nextToken=again.json.data.token;
    assert.equal((await q.api('/auth/logout',{method:'POST',token:nextToken})).status,200);
    expectError(await q.api('/me/items',{token:nextToken}),401,'UNAUTHORIZED');
});
