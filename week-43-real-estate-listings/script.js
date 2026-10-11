
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const HOMES=[
{id:1,title:"East Side Bungalow",type:"house",beds:3,baths:2,price:525000,img:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",addr:"1204 Willow St"},
{id:2,title:"Downtown Loft",type:"condo",beds:1,baths:1,price:389000,img:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",addr:"500 Congress #12"},
{id:3,title:"Oak Hill Family Home",type:"house",beds:4,baths:3,price:875000,img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",addr:"88 Mesa Ridge"},
{id:4,title:"Riverside Townhome",type:"townhome",beds:2,baths:2.5,price:615000,img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",addr:"22 River Bend"},
{id:5,title:"Mueller Modern",type:"house",beds:3,baths:2,price:720000,img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",addr:"901 Aldrich St"},
{id:6,title:"Studio at The Pearl",type:"condo",beds:1,baths:1,price:295000,img:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",addr:"200 Pearl #4"},
];
let selected=null;
function money(n){return n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}
function render(){
  const list=HOMES.filter(h=>h.beds>=+beds.value&&h.price<=+maxPrice.value&&(type.value==="all"||h.type===type.value));
  listings.innerHTML=list.map(h=>`<article class="card listing" data-id="${h.id}" style="cursor:pointer;${selected===h.id?"border-color:var(--accent)":""}"><img src="${h.img}" alt="" loading="lazy"/><h3 style="margin:.55rem 0 .2rem;font-size:1rem">${h.title}</h3><div style="color:var(--muted);font-size:.85rem">${h.addr} · ${h.beds} bd</div><div style="color:var(--gold);font-weight:700;margin-top:.3rem">${money(h.price)}</div></article>`).join("")||"<p style='color:var(--muted)'>No homes match.</p>";
  listings.querySelectorAll(".listing").forEach(el=>el.onclick=()=>{selected=+el.dataset.id;const h=HOMES.find(x=>x.id===selected);selectedEl.textContent="Inquiring about: "+h.title+" — "+money(h.price);render()});
}
const selectedEl=document.getElementById("selected");
[beds,maxPrice,type].forEach(el=>el.onchange=render);
contact.onsubmit=(e)=>{e.preventDefault();if(!selected){cstatus.style.display="block";cstatus.style.color="var(--danger)";cstatus.textContent="Pick a listing first.";return}cstatus.style.display="block";cstatus.style.color="var(--ok)";cstatus.textContent="Inquiry sent (demo) to "+cemail.value+".";contact.reset()};
render();
