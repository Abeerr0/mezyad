import {createHash,randomBytes} from 'node:crypto';
import {query} from './db.js';
// نحسب بصمة الرمز عشان نطابقها مع الجلسة المحفوظة.
export const hashToken=t=>createHash('sha256').update(t).digest('hex');
export const newToken=()=>randomBytes(32).toString('hex');
export async function auth(req,res,next){
 try{
  const token=req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if(!token)return res.status(401).json({error:{code:'UNAUTHORIZED',message:'Sign in required'}});
  // هنا نتأكد إن الجلسة موجودة ولسه ما انتهت.
  const {rows}=await query(`SELECT u.id,u.name,u.email,u.role FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[hashToken(token)]);
  if(!rows.length)return res.status(401).json({error:{code:'UNAUTHORIZED',message:'Session expired'}});
  req.user=rows[0];req.token=token;next();
 }catch(e){next(e)}
}
// هذا المسار للأدمن بس.
export const admin=(req,res,next)=>req.user?.role==='ADMIN'?next():res.status(403).json({error:{code:'FORBIDDEN',message:'Admin only'}});
