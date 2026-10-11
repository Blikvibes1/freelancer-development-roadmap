
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
const IK="stockroom-inv";
function load(){try{const v=JSON.parse(localStorage.getItem(IK)||"null");if(Array.isArray(v)&&v.length)return v}catch(e){}return PRODUCTS.map(p=>({id:p.id,name:p.name,stock:p.stock}))}
function save(rows){localStorage.setItem(IK,JSON.stringify(rows));render()}
function render(){
  const rows=load();const low=rows.filter(r=>r.stock<=5).length;const total=rows.reduce((s,r)=>s+r.stock,0);
  stats.innerHTML=`<div class="card"><div class="badge">SKUs</div><div style="font-size:1.4rem;font-weight:800">${rows.length}</div></div>
    <div class="card"><div class="badge">Units</div><div style="font-size:1.4rem;font-weight:800">${total}</div></div>
    <div class="card"><div class="badge">Low</div><div style="font-size:1.4rem;font-weight:800;color:${low?"var(--danger)":"var(--ok)"}">${low}</div></div>`;
  document.getElementById("rows").innerHTML=rows.map(r=>`<tr><td>${r.name}</td>
    <td><input type="number" min="0" value="${r.stock}" data-id="${r.id}" style="width:80px;padding:.35rem"/></td>
    <td class="${r.stock<=5?"low":"ok"}">${r.stock<=5?"Low":"OK"}</td>
    <td><button class="btn" type="button" data-del="${r.id}" style="padding:.3rem .5rem;font-size:.75rem">Del</button></td></tr>`).join("");
  document.querySelectorAll("input[data-id]").forEach(i=>i.onchange=()=>{const rows=load();const row=rows.find(x=>x.id===i.dataset.id);if(row){row.stock=+i.value;save(rows)}});
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>save(load().filter(x=>x.id!==b.dataset.del)));
}
add.onsubmit=(e)=>{e.preventDefault();const rows=load();rows.unshift({id:"x"+Date.now(),name:n.value.trim(),stock:+q.value});save(rows);e.target.reset()};
render();
