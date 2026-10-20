import test from 'node:test';
import assert from 'node:assert/strict';
import {parseListingFields} from '../src/listings.js';

const base={categoryId:'11111111-1111-1111-1111-111111111111',title:' إعلان ',description:' وصف '};
test('categoryFields accepts the canonical JSON object and multipart JSON string',()=>{
  const fields={location:'الرياض',area:250,features:['حوش']};
  for(const value of [fields,JSON.stringify(fields)])assert.deepEqual(parseListingFields({...base,categoryFields:value}).categoryFields,fields);
});
test('legacy category_fields remains compatible and conflicting aliases are rejected',()=>{
  assert.deepEqual(parseListingFields({...base,category_fields:'{"year":2020}'}).categoryFields,{year:2020});
  assert.deepEqual(parseListingFields({...base,categoryFields:{a:1,b:2},category_fields:'{"b":2,"a":1}'}).categoryFields,{a:1,b:2});
  assert.equal(parseListingFields({...base,categoryFields:{year:2020},category_fields:'{"year":2021}'}),null);
});
test('invalid category fields cannot silently become an empty object',()=>{
  for(const categoryFields of [null,[],42,'broken','null','[]','true'])assert.equal(parseListingFields({...base,categoryFields}),null);
  assert.equal(parseListingFields({...base,categoryId:undefined},true).categoryFields,undefined);
});
