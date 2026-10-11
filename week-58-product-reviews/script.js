
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const RK="stars-reviews";
const SEED=[{name:"Maya",rating:5,body:"Beautiful leather.",at:"2026-09-12"},{name:"Jon",rating:4,body:"Great tote.",at:"2026-09-20"}];
function load(){try{const v=JSON.parse(localStorage.getItem(RK)||"null");return Array.isArray(v)&&v.length?v:SEED}catch(e){return SEED}}
function save(list){localStorage.setItem(RK,JSON.stringify(list));render()}
function stars(n){return "★★★★★☆☆☆☆☆".slice(5-Math.round(n),10-Math.round(n))}
function render(){const list=load();const avg=list.reduce((s,r)=>s+r.rating,0)/list.length;
  document.getElementById("avg").textContent=avg.toFixed(1);document.getElementById("avg-stars").textContent=stars(avg);
  document.getElementById("count").textContent=list.length+" reviews";
  listEl.innerHTML=list.map(r=>`<article class="review"><div class="stars">${stars(r.rating)}</div><strong>${r.name}</strong>
    <span style="color:var(--faint);font-size:.8rem"> · ${r.at}</span><p style="margin:.35rem 0 0;color:var(--muted)">${r.body}</p></article>`).join("")}
const listEl=document.getElementById("list");
function paintStars(n){document.getElementById("star-input").innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="${i<=n?"on":""}" data-r="${i}">★</button>`).join("");
  document.querySelectorAll("#star-input button").forEach(b=>b.onclick=()=>{rating.value=b.dataset.r;paintStars(+b.dataset.r)})}
paintStars(5);
form.onsubmit=(e)=>{e.preventDefault();const list=load();list.unshift({name:name.value.trim(),rating:+rating.value,body:body.value.trim(),at:new Date().toISOString().slice(0,10)});save(list);form.reset();rating.value=5;paintStars(5)};
render();
