(function(root){
 'use strict';
 const normalize=value=>String(value).trim().normalize('NFC').toLowerCase().replace(/\s+/g,' ');
 function split(amount,names){
  if(!Number.isSafeInteger(amount)||amount<=0||amount>1000000000)throw new Error('Nhập số tiền nguyên đồng, từ 1đ đến 1 tỷ đồng.');
  if(!Array.isArray(names)||!names.length)throw new Error('Chọn ít nhất một người chịu tiền.');
  const seen=new Set();const clean=names.map(name=>{const n=String(name).trim();if(!n||n.length>80)throw new Error('Tên người tham gia cần từ 1 đến 80 ký tự.');const key=normalize(n);if(seen.has(key))throw new Error('Danh sách có tên trùng nhau.');seen.add(key);return n;});
  return clean.map((name,i)=>({name,amount:Math.floor(amount/clean.length)+(i<amount%clean.length?1:0)}));
 }
 function fileError(file){if(!file||!file.size)return '';if(file.size>5*1024*1024)return 'Hóa đơn tối đa 5 MB.';if(!/\.(jpe?g|png|webp|pdf)$/i.test(file.name))return 'Chọn ảnh JPG, PNG, WebP hoặc file PDF.';return '';}
 root.AE48RequestCore={normalize,split,fileError};
})(typeof window!=='undefined'?window:globalThis);
