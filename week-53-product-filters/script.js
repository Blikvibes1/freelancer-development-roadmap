
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
function params(){return new URLSearchParams(location.search)}
function selected(key){return params().getAll(key)}
function toggle(key,val){const p=params();const all=p.getAll(key);p.delete(key);if(all.includes(val))all.filter(x=>x!==val).forEach(v=>p.append(key,v));else{all.forEach(v=>p.append(key,v));p.append(key,val)}history.replaceState(null,"","?"+p.toString());render()}
function render(){
  const brands=[...new Set(PRODUCTS.map(p=>p.brand))],colors=[...new Set(PRODUCTS.map(p=>p.color))],cats=[...new Set(PRODUCTS.map(p=>p.cat))];
  const mk=(title,key,opts)=>`<div style="margin-bottom:1rem"><strong style="font-size:.75rem;color:var(--faint)">${title}</strong>${opts.map(o=>`<label class="chk"><input type="checkbox" data-k="${key}" data-v="${o}" ${selected(key).includes(o)?"checked":""}/> ${o}</label>`).join("")}</div>`;
  filters.innerHTML=mk("Brand","brand",brands)+mk("Color","color",colors)+mk("Category","cat",cats);
  filters.querySelectorAll("input").forEach(i=>i.onchange=()=>toggle(i.dataset.k,i.dataset.v));
  let list=PRODUCTS.filter(item=>{for(const key of ["brand","color","cat"]){const sel=selected(key);if(sel.length&&!sel.includes(item[key]))return false}return true});
  if(sort.value==="price-asc")list.sort((a,b)=>a.price-b.price);if(sort.value==="price-desc")list.sort((a,b)=>b.price-a.price);
  count.textContent=list.length+" products";
  grid.innerHTML=list.map(p=>`<article class="card product"><img src="${p.img}" alt=""/><h3 style="margin:.4rem 0 .15rem;font-size:.9rem">${p.name}</h3><div style="color:var(--gold);font-weight:700">$${p.price}</div></article>`).join("")||"<p style='color:var(--muted)'>No matches.</p>";
}
sort.onchange=render;render();
