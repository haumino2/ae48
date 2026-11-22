import fs from 'node:fs';
if(!fs.existsSync(new URL('./source-snapshot.json',import.meta.url))){
 if(!fs.existsSync(new URL('../dist/data.json',import.meta.url))||!fs.existsSync(new URL('../dist/data.js',import.meta.url)))throw new Error('Missing both private Excel snapshot and prepared static data.');
 console.log('Using committed static data. Private Excel source is not stored in Git.');process.exit(0);
}
const source=JSON.parse(fs.readFileSync(new URL('./source-snapshot.json',import.meta.url),'utf8'));
function csv(text){const rows=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){v+='"';i++;}else q=!q;}else if(c===','&&!q){row.push(v);v='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(Boolean))rows.push(row);row=[];v='';}else v+=c;}if(v||row.length){row.push(v);rows.push(row);}return rows;}
const sessions=[],names=[];
for(const section of source.content.split('\f')){
 const rows=csv(section);const header=rows.find(r=>r[1]==='Buổi ID');if(!header)continue;
 const sport=header.includes('Tiền sân');const start=header.indexOf('Ngày')+1;const end=header.indexOf(sport?'Tiền sân':'Tổng hóa đơn');const people=header.slice(start,end);people.forEach(n=>{if(!names.includes(n))names.push(n);});
 const ix=h=>header.indexOf(h);
 for(const r of rows.filter(r=>/^(S\d+|N\d+)$/.test(r[1]||''))){
  const status=(r[ix('Collect status')]||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('đ','d').replace(/\s+/g,' ');
  if(/^(da collect|da can(?: bang)?|da tat toan|da clear|clear)$/.test(status))continue;
  const participants=people.filter((n,i)=>r[start+i]==='Có');const total=Number(r[ix(sport?'Tổng chi':'Tổng hóa đơn')])||0;
  const costs=sport?[['Tiền sân','Người ứng sân'],['Ống cầu','Người ứng cầu'],['Nước','Người ứng nước']].map(([label,payer])=>({label,amount:Number(r[ix(label)])||0,payer:r[ix(payer)]||null})).filter(c=>c.amount):[{label:'Hóa đơn',amount:total,payer:r[ix('Người ứng')]||null}].filter(c=>c.amount);
  if(!r[2]&&!total&&!participants.length)continue;
  const issues=[];if(costs.reduce((s,c)=>s+c.amount,0)!==total)issues.push('Tổng khoản chi không khớp tổng buổi.');if(participants.length!==(Number(r[ix('Số người')])||0))issues.push('Danh sách tham gia không khớp số người trong Excel.');if(total>0&&Number(r[ix('Phần/người')])>0&&Math.abs(Number(r[ix('Phần/người')])*(Number(r[ix('Số người')])||0)-total)>1)issues.push('Phần mỗi người không khớp tổng tiền.');if(costs.some(c=>!c.payer))issues.push('Thiếu người ứng tiền.');
  const date=r[ix('Ngày')]?.slice(0,10)||null;const collected=r[ix('Collect status')]==='Đã collect';const pending=total===0;
  const shares=Object.fromEntries(participants.map((n,i)=>[n,participants.length?Math.floor(total/participants.length)+(i<total%participants.length?1:0):0]));
  sessions.push({id:r[1],title:r[2],date,category:sport?'sport':'food',participants,total,costs,shares,issues,collected,pending,note:r[ix('Collect status')+1]||''});
 }
}
const valid=sessions.filter(s=>!s.collected&&!s.pending&&!s.issues.length);
const balances=names.map((name,id)=>{const own=valid.filter(s=>s.participants.includes(name)||s.costs.some(c=>c.payer===name));const share=own.reduce((t,s)=>t+(s.shares[name]||0),0);const advance=own.reduce((t,s)=>t+s.costs.filter(c=>c.payer===name).reduce((a,c)=>a+c.amount,0),0);return{id:'m'+id,name,guest:name.startsWith('Bạn thiên'),share,advance,balance:share-advance,sessions:own.map(s=>s.id)};});
const paymentsPath=new URL('./confirmed-payments.json',import.meta.url);
const payments=fs.existsSync(paymentsPath)?JSON.parse(fs.readFileSync(paymentsPath,'utf8')):[];
const receiptIds=new Set();for(const p of payments){if(receiptIds.has(p.id))throw new Error('Duplicate receipt ID: '+p.id);receiptIds.add(p.id);if(!Number.isSafeInteger(p.amount)||p.amount<=0||!balances.some(m=>m.name===p.memberName))throw new Error('Invalid receipt: '+p.id);}
for(const m of balances){m.paid=payments.filter(p=>p.memberName===m.name).reduce((a,p)=>a+p.amount,0);m.balance-=m.paid;}
const adjustmentsPath=new URL('./debt-adjustments.json',import.meta.url);
const adjustments=fs.existsSync(adjustmentsPath)?JSON.parse(fs.readFileSync(adjustmentsPath,'utf8')):[];
const adjustmentIds=new Set();for(const a of adjustments){const m=balances.find(m=>m.name===a.memberName);if(adjustmentIds.has(a.id)||!m||!Number.isSafeInteger(a.amount)||a.amount<=0||a.amount>m.balance||a.type!=='WAIVER')throw new Error('Invalid debt adjustment: '+a.id);adjustmentIds.add(a.id);m.waived=(m.waived||0)+a.amount;m.balance-=a.amount;}
const data={version:1,group:'AE48',updatedAt:source.modified_time,sourceTitle:source.title,sourceUrl:source.url,timezone:'Asia/Ho_Chi_Minh',currency:'VND',sessions,members:balances,issues:[{id:'summary',title:'Bảng tổng hợp thiếu hai khách ở S18',description:'Bản này tính lại từ chi tiết buổi và giữ cả hai khách, tổng cộng 180.000đ. Chưa phải sao kê đã được admin xác nhận.'},...sessions.filter(s=>s.issues.length).map(s=>({id:s.id,title:s.id+' · '+s.title,description:s.issues.join(' ')})),{id:'N10',title:'N10 chưa có số tiền hóa đơn',description:'Đang chờ dữ liệu, không tính là buổi miễn phí và không cộng vào công nợ.'}],total:valid.reduce((a,s)=>a+s.total,0),openCount:valid.length};
data.payments=payments;data.received=payments.reduce((a,p)=>a+p.amount,0);data.sourceUpdatedAt=source.modified_time;
data.adjustments=adjustments;data.waived=adjustments.reduce((a,p)=>a+p.amount,0);
data.updatedAt=[source.modified_time,...payments.map(p=>p.recordedAt),...adjustments.map(a=>a.recordedAt)].sort().at(-1);
fs.writeFileSync(new URL('../dist/data.json',import.meta.url),JSON.stringify(data,null,2));fs.writeFileSync(new URL('../dist/data.js',import.meta.url),'window.AE48_DATA = '+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');console.log(`Imported ${sessions.length} sessions, ${balances.length} people, ${valid.length} open sessions; ${data.total} VND; ${data.received} VND received.`);
