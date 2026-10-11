
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();

const PRODUCTS=[
  {id:"p1",name:"Noir Leather Tote",price:148,img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",cat:"bags",color:"black",brand:"Atelier",stock:12},
  {id:"p2",name:"Lumen Silk Scarf",price:64,img:"https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80",cat:"accessories",color:"cream",brand:"Atelier",stock:30},
  {id:"p3",name:"Canvas Weekender",price:122,img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",cat:"bags",color:"olive",brand:"Field",stock:8},
  {id:"p4",name:"Brass Card Case",price:42,img:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",cat:"accessories",color:"gold",brand:"Field",stock:40},
  {id:"p5",name:"Merino Beanie",price:38,img:"https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&q=80",cat:"accessories",color:"charcoal",brand:"North",stock:3},
  {id:"p6",name:"Crossbody Mini",price:96,img:"https://images.unsplash.com/photo-1590874103328-eac38a941378?w=400&q=80",cat:"bags",color:"tan",brand:"Atelier",stock:15},
];
const TAX=0.0825,CK="cartkit-cart";
function load(){try{return JSON.parse(localStorage.getItem(CK)||"{}")}catch(e){return{}}}
function save(c){localStorage.setItem(CK,JSON.stringify(c));render()}
function money(n){return n.toLocaleString("en-US",{style:"currency",currency:"USD"})}
function render(){
  const cart=load();
  grid.innerHTML=PRODUCTS.map(p=>`<article class="card product"><img src="${p.img}" alt=""/><h3 style="margin:.5rem 0 .2rem;font-size:.95rem">${p.name}</h3><div style="color:var(--gold);font-weight:700">${money(p.price)}</div>
    <button class="btn btn-primary" style="width:100%;margin-top:.5rem" data-add="${p.id}" type="button">Add</button></article>`).join("");
  grid.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{const c=load();c[b.dataset.add]=(c[b.dataset.add]||0)+1;save(c)});
  const ids=Object.keys(cart).filter(id=>cart[id]>0);
  count.textContent=ids.reduce((s,id)=>s+cart[id],0);
  if(!ids.length){lines.innerHTML="<p style='color:var(--muted);font-size:.9rem'>Empty.</p>";totals.innerHTML="";return}
  let sub=0;
  lines.innerHTML=ids.map(id=>{const p=PRODUCTS.find(x=>x.id===id);const q=cart[id];const line=p.price*q;sub+=line;
    return `<div class="line"><img src="${p.img}" alt=""/><div style="flex:1"><strong style="font-size:.85rem">${p.name}</strong>
      <div class="qty" style="display:flex;gap:.35rem;align-items:center;margin-top:.25rem">
        <button type="button" data-dec="${id}">−</button><span>${q}</span><button type="button" data-inc="${id}">+</button>
        <button type="button" data-rm="${id}" style="margin-left:auto;font-size:.75rem;border:0;background:transparent;color:var(--muted);cursor:pointer">Remove</button>
      </div></div><div style="color:var(--gold);font-weight:600">${money(line)}</div></div>`}).join("");
  const tax=sub*TAX;
  totals.innerHTML=`<div style="display:flex;justify-content:space-between;margin:.3rem 0"><span>Subtotal</span><span>${money(sub)}</span></div>
    <div style="display:flex;justify-content:space-between;margin:.3rem 0;color:var(--muted)"><span>Tax</span><span>${money(tax)}</span></div>
    <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--line)"><span>Total</span><span>${money(sub+tax)}</span></div>`;
  lines.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{const c=load();c[b.dataset.inc]++;save(c)});
  lines.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>{const c=load();c[b.dataset.dec]=Math.max(0,(c[b.dataset.dec]||0)-1);if(!c[b.dataset.dec])delete c[b.dataset.dec];save(c)});
  lines.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{const c=load();delete c[b.dataset.rm];save(c)});
}
checkout.onclick=()=>{if(!Object.keys(load()).length)return;msg.style.display="block";msg.textContent="Demo checkout done.";localStorage.removeItem(CK);render()};
render();
