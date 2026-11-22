import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const open=d.sessions.filter(s=>!s.collected&&!s.pending&&!s.issues.length);
assert.equal(d.total,open.reduce((a,s)=>a+s.total,0));assert.equal(d.openCount,open.length);assert.equal(d.members.reduce((a,m)=>a+m.balance,0),0);
for(const s of d.sessions.filter(s=>!s.issues.length&&!s.pending)){assert.equal(Object.values(s.shares).reduce((a,v)=>a+v,0),s.total);assert(Object.values(s.shares).every(Number.isInteger));}
assert(d.sessions.every(s=>!s.collected));for(const m of d.members){assert(Number.isSafeInteger(m.balance));assert.equal(m.balance,m.share-m.advance);const related=open.filter(s=>s.participants.includes(m.name)||s.costs.some(c=>c.payer===m.name));assert.equal(m.share,related.reduce((a,s)=>a+(s.shares[m.name]||0),0));assert.equal(m.advance,related.reduce((a,s)=>a+s.costs.filter(c=>c.payer===m.name).reduce((v,c)=>v+c.amount,0),0));assert.deepEqual(m.sessions,related.map(s=>s.id));}
new vm.Script(fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'));console.log('Passed: reconciliation, guests, rounding, excluded inconsistent rows and JavaScript syntax.');
