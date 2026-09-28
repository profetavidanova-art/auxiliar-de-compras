const KEY='auxiliarComprasV1';
const defaultState={products:[],prices:[],purchases:[]};
let state=load();

function load(){try{return JSON.parse(localStorage.getItem(KEY))||defaultState}catch(e){return defaultState}}
function save(){localStorage.setItem(KEY,JSON.stringify(state)); renderAll()}
function money(v){return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
 btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active');
 renderAll();
}));

document.getElementById('productForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=document.getElementById('productName').value.trim();
 const qty=Math.max(1,Number(document.getElementById('productQty').value)||1);
 if(name){state.products.push({id:crypto.randomUUID(),name,qty});save();e.target.reset();document.getElementById('productQty').value=1}
});
document.getElementById('priceForm').addEventListener('submit',e=>{
 e.preventDefault();
 const product=document.getElementById('priceProduct').value.trim();
 const store=document.getElementById('storeName').value.trim();
 const value=Number(document.getElementById('priceValue').value);
 if(product&&store&&Number.isFinite(value)&&value>=0){state.prices.push({id:crypto.randomUUID(),product,store,value,date:new Date().toISOString()});save();e.target.reset()}
});
document.getElementById('clearList').addEventListener('click',()=>{state.products=[];save()});
document.getElementById('finishPurchase').addEventListener('click',()=>{
 const rows=getBest();
 if(!rows.length){alert('Adicione produtos à lista e cadastre preços primeiro.');return}
 const total=rows.reduce((s,r)=>s+r.total,0);
 state.purchases.unshift({date:new Date().toISOString(),total,items:rows.length});
 state.products=[]; save(); alert('Compra registrada com sucesso.'); 
});

function getBest(){
 return state.products.map(p=>{
   const matches=state.prices.filter(x=>x.product.toLowerCase()===p.name.toLowerCase());
   if(!matches.length)return {...p,best:null,total:0};
   const best=matches.reduce((a,b)=>a.value<=b.value?a:b);
   return {...p,best,total:best.value*p.qty};
 });
}
function renderList(){
 const el=document.getElementById('listItems');
 el.innerHTML=state.products.length?state.products.map(p=>`<div class="item"><div><strong>${esc(p.name)}</strong><span class="muted">Quantidade: ${p.qty}</span></div><button class="secondary" onclick="removeProduct('${p.id}')">Remover</button></div>`).join(''):'<div class="empty">Sua lista de faltas está vazia.</div>';
}
function renderPrices(){
 const el=document.getElementById('priceItems');
 el.innerHTML=state.prices.length?[...state.prices].reverse().map(p=>`<div class="item"><div><strong>${esc(p.product)}</strong><span class="muted">${esc(p.store)}</span></div><div><span class="price">${money(p.value)}</span> <button class="secondary" onclick="removePrice('${p.id}')">Excluir</button></div></div>`).join(''):'<div class="empty">Nenhum preço cadastrado.</div>';
}
function renderPurchase(){
 const rows=getBest(), el=document.getElementById('smartPurchase');
 if(!rows.length){el.innerHTML='<div class="empty">Adicione produtos à lista.</div>';document.getElementById('purchaseTotal').textContent='';return}
 const missing=rows.filter(r=>!r.best);
 const grouped={};
 rows.filter(r=>r.best).forEach(r=>(grouped[r.best.store]??=[]).push(r));
 let html='';
 Object.entries(grouped).forEach(([store,items])=>{
  html+=`<div class="store-group"><h3>🏪 ${esc(store)}</h3>`;
  html+=items.map(r=>`<div class="item best"><div><strong>${esc(r.name)}</strong><span class="muted">${r.qty} × ${money(r.best.value)}</span></div><span class="price">${money(r.total)}</span></div>`).join('');
  html+='</div>';
 });
 if(missing.length)html+=`<div class="empty">⚠️ Sem preço cadastrado: ${missing.map(r=>esc(r.name)).join(', ')}</div>`;
 el.innerHTML=html;
 const total=rows.reduce((s,r)=>s+r.total,0);
 document.getElementById('purchaseTotal').textContent=`Total estimado: ${money(total)}`;
}
function renderHistory(){
 const total=state.purchases.reduce((s,p)=>s+p.total,0);
 document.getElementById('summary').innerHTML=`<div class="item"><div><strong>Total registrado</strong><span class="muted">${state.purchases.length} compra(s)</span></div><span class="price">${money(total)}</span></div>`;
 document.getElementById('historyItems').innerHTML=state.purchases.length?state.purchases.map(p=>`<div class="item"><div><strong>${new Date(p.date).toLocaleDateString('pt-BR')}</strong><span class="muted">${p.items} itens</span></div><span class="price">${money(p.total)}</span></div>`).join(''):'<div class="empty">Nenhuma compra registrada ainda.</div>';
}
function renderAll(){renderList();renderPrices();renderPurchase();renderHistory()}
window.removeProduct=id=>{state.products=state.products.filter(x=>x.id!==id);save()};
window.removePrice=id=>{state.prices=state.prices.filter(x=>x.id!==id);save()};
renderAll();
