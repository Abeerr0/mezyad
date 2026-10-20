import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import express from 'express';

let uploads,server,base,png;
before(async()=>{
  process.env.UPLOAD_DIR=await mkdtemp(join(tmpdir(),'mezyad-upload-unit-'));
  uploads=await import('../src/uploads.js');
  png=await sharp({create:{width:5,height:5,channels:3,background:'#eed5ad'}}).png().toBuffer();
  const app=express();app.get('/api/v1/images/:filename',uploads.serveImage);
  app.post('/upload-check',uploads.uploadImages,(req,res)=>res.json({count:req.files.length}));
  app.use((error,_req,res,_next)=>res.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({code:error.code||error.apiCode}));
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{
  await new Promise(resolve=>server.close(resolve));
  await rm(process.env.UPLOAD_DIR,{recursive:true,force:true});
});
const file=buffer=>({buffer,mimetype:'image/png'});

test('actual decoded photo is resized to JPEG and can be removed',async()=>{
  const paths=await uploads.saveImages([file(png)]);
  assert.equal(paths.length,1);
  const bytes=await readFile(join(process.env.UPLOAD_DIR,paths[0].split('/').at(-1)));
  const metadata=await sharp(bytes).metadata();
  assert.equal(metadata.format,'jpeg');assert.equal(metadata.width,5);assert.equal(metadata.exif,undefined);
  await uploads.removeImages(paths);assert.deepEqual(await readdir(process.env.UPLOAD_DIR),[]);
});

test('spoofed and corrupt images are rejected and partial files are cleaned up',async()=>{
  for(const files of [[file(Buffer.from('not an image'))],[file(png),file(Buffer.from('broken'))],[{buffer:png,mimetype:'image/jpeg'}]]) {
    await assert.rejects(uploads.saveImages(files),error=>error.apiCode==='INVALID_IMAGE');
    assert.deepEqual(await readdir(process.env.UPLOAD_DIR),[]);
  }
});

test('image links are signed; unsigned, altered and expired requests are denied',async()=>{
  const paths=await uploads.saveImages([file(png)]);
  const link=uploads.imageLink(paths[0]);
  assert.match(link,/signature=[a-f0-9]{64}/);
  const response=await fetch(base+link);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
  for(const invalid of [link.split('?')[0],link.replace(/signature=./,'signature=z'),link.replace(/expires=\d+/, 'expires=1000000000'),link.replace('.jpg','.png')])assert.equal((await fetch(base+invalid)).status,404);
  await uploads.removeImages(paths);
  assert.equal((await fetch(base+link)).status,404);
  assert.equal(uploads.imageLink('/images/design.jpg'),'/images/design.jpg');
});


test('multipart parser enforces file count, MIME, extension and 5 MiB limit before storage',async()=>{
  const send=async({count=1,bytes=png,type='image/png',name='photo.png'}={})=>{
    const body=new FormData();
    for(let i=0;i<count;i++)body.append('images',new Blob([bytes],{type}),name);
    return fetch(base+'/upload-check',{method:'POST',body});
  };
  const valid=await send({count:6});assert.equal(valid.status,200);assert.equal((await valid.json()).count,6);
  for(const options of [{count:7},{name:'script.html'},{type:'image/svg+xml',name:'photo.svg'}])assert.equal((await send(options)).status,400);
  assert.equal((await send({bytes:Buffer.alloc(5*1024*1024+1)})).status,413);
  assert.deepEqual(await readdir(process.env.UPLOAD_DIR),[]);
});
