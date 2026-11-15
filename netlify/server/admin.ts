export const adminPage = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Cili & Krim – Orders</title>
<style>
:root{--bg:#f5ead8;--card:#fff9ef;--ink:#6e1d0f;--accent:#9a2a18;--accent2:#e8b04a;--line:#ecd9b8}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--ink)}
header{background:var(--accent);color:var(--accent2);padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
header h1{margin:0;font-size:1.3rem;text-transform:uppercase;letter-spacing:.5px}
main{max-width:900px;margin:0 auto;padding:14px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.stat{background:var(--card);border-radius:12px;padding:10px 14px;flex:1;min-width:120px}
.stat b{display:block;font-size:1.4rem}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.bar button,select,a.btn{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:#fff;font:inherit;color:var(--ink);text-decoration:none;cursor:pointer}
.bar button.on{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.o{background:var(--card);border-radius:14px;padding:14px;margin-bottom:10px;border-left:6px solid var(--accent2)}
.o.cancelled{opacity:.55}.o.delivered{border-left-color:#5a8a3a}.o.paid{border-left-color:#3a6a9a}.o.confirmed{border-left-color:var(--accent)}
.top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}
.top b{font-size:1.1rem}.muted{color:#9a6a4a;font-size:.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:4px 14px;margin:8px 0}
.acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
a.wa{background:#25d366;color:#fff;border-color:#25d366}
.empty{text-align:center;padding:40px;color:#9a6a4a}
</style></head><body>
<header><h1>Cili & Krim · Orders</h1><button onclick="load()" style="padding:8px 12px;border-radius:10px;border:0;background:var(--accent2);color:var(--ink);font-weight:700">Refresh</button></header>
<main>
<div class="stats" id="stats"></div>
<div class="bar" id="filters"></div>
<div id="list"><div class="empty">Loading…</div></div>
</main>
<script>
const ST=['new','confirmed','paid','delivered','cancelled'];
let all=[],filter='active';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=d=>new Date(d+'T00:00:00').toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short'});
function wa(o){let p=o.phone.replace(/\\D/g,'');if(p.startsWith('0'))p='6'+p;
const items=[o.qtyAyam&&'Ayam x'+o.qtyAyam,o.qtyUdang&&'Udang x'+o.qtyUdang].filter(Boolean).join(', ');
const t='Hi '+o.name+', this is Cili & Krim. Thank you for your order '+o.orderNo+' ('+items+') for '+fmtDate(o.deliveryDate)+'. Total: RM'+o.total+'.';
return 'https://wa.me/'+p+'?text='+encodeURIComponent(t)}
async function load(){
const r=await fetch('/api/admin/orders');if(!r.ok){document.getElementById('list').innerHTML='<div class="empty">Could not load orders.</div>';return}
all=await r.json();render()}
function render(){
const act=all.filter(o=>o.status!=='cancelled'&&o.status!=='delivered');
const s=document.getElementById('stats');
s.innerHTML=[['New',all.filter(o=>o.status==='new').length],['Active orders',act.length],['Active bekas',act.reduce((a,o)=>a+o.qtyAyam+o.qtyUdang,0)],['Active value','RM'+act.reduce((a,o)=>a+o.total,0)]]
.map(([l,v])=>'<div class="stat"><span class="muted">'+l+'</span><b>'+v+'</b></div>').join('');
document.getElementById('filters').innerHTML=[['active','Active'],...ST.map(x=>[x,x[0].toUpperCase()+x.slice(1)]),['all','All']]
.map(([k,l])=>'<button class="'+(filter===k?'on':'')+'" onclick="filter=\\''+k+'\\';render()">'+l+'</button>').join('');
const list=filter==='all'?all:filter==='active'?act:all.filter(o=>o.status===filter);
document.getElementById('list').innerHTML=list.length?list.map(o=>{
const items=[o.qtyAyam&&'Ayam × '+o.qtyAyam,o.qtyUdang&&'Udang × '+o.qtyUdang].filter(Boolean).join(' · ');
return '<div class="o '+o.status+'"><div class="top"><b>'+o.orderNo+' · '+esc(o.name)+'</b><span class="muted">Placed '+new Date(o.createdAt).toLocaleString('en-MY',{dateStyle:'medium',timeStyle:'short'})+'</span></div>'+
'<div class="grid"><div><span class="muted">Items</span><br>'+items+'</div><div><span class="muted">Deliver on</span><br>'+fmtDate(o.deliveryDate)+'</div>'+
'<div><span class="muted">Area</span><br>'+esc(o.location)+'</div><div><span class="muted">Phone</span><br>'+esc(o.phone)+'</div>'+
'<div><span class="muted">Total</span><br><b>RM'+o.total+'</b> <span class="muted">(food RM'+o.subtotal+' + delivery '+(o.delivery?'RM'+o.delivery:'FOC')+')</span></div></div>'+
(o.note?'<p style="margin:6px 0"><span class="muted">Note:</span> '+esc(o.note)+'</p>':'')+
'<div class="acts"><select onchange="setStatus('+o.id+',this.value)">'+ST.map(x=>'<option value="'+x+'"'+(x===o.status?' selected':'')+'>'+x[0].toUpperCase()+x.slice(1)+'</option>').join('')+'</select>'+
'<a class="btn wa" target="_blank" rel="noopener" href="'+wa(o)+'">WhatsApp customer</a></div></div>'}).join(''):'<div class="empty">No orders here yet.</div>'}
async function setStatus(id,status){
const r=await fetch('/api/admin/orders/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
if(!r.ok){alert('Could not update status.');return load()}
all.find(o=>o.id===id).status=status;render()}
load();setInterval(load,60000);
</script></body></html>`;
