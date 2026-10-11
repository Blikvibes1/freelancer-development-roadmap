
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
const WK="kept-wishlist";
function load(){try{return new Set(JSON.parse(localStorage.getItem(WK)||"[]"))}catch(e){return new Set()}}
function save(s){localStorage.setItem(WK,JSON.stringify([...s]));wc.textContent=s.size}
let mode="all";
function render(){
  const wish=load();save(wish);
  const list=mode==="wish"?PRODUCTS.filter(p=>wish.has(p.id)):PRODUCTS;
  grid.innerHTML=list.map(p=>`<article class="card product" style="position:relative">
    <button type="button" class="heart" data-id="${p.id}">${wish.has(p.id)?"♥":"♡"}</button>
    <img src="${p.img}" alt=""/><h3 style="margin:.4rem 0 .15rem;font-size:.9rem">${p.name}</h3>
    <div style="color:var(--gold);font-weight:700">$${p.price}</div></article>`).join("")||"<p style='color:var(--muted)'>Empty wishlist.</p>";
  grid.querySelectorAll(".heart").forEach(b=>b.onclick=()=>{const s=load();if(s.has(b.dataset.id))s.delete(b.dataset.id);else s.add(b.dataset.id);save(s);render()});
}
document.getElementById("tab-all").onclick=()=>{mode="all";render()};
document.getElementById("tab-wish").onclick=()=>{mode="wish";render()};
render();
