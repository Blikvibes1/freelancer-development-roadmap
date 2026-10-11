
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SEED_P=[{title:"Pinpoint Directory",summary:"Map-synced local business finder.",tag:"Product"},{title:"Mission Log",summary:"NASA APOD flight log.",tag:"Space"}];
const SEED_B=[{title:"Theme Mode over dark toggles",summary:"Design language switching as a differentiator.",tag:"Design"}];
function load(key,seed){try{const v=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(v)&&v.length?v:seed}catch(e){return seed}}
function save(key,val){localStorage.setItem(key,JSON.stringify(val))}
let view="projects";
function render(){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("is-active",t.dataset.view===view));
  const items=view==="projects"?load("folio-projects",SEED_P):load("folio-posts",SEED_B);
  viewEl.innerHTML=`<div class="grid2">${items.map(p=>`<article class="card"><span class="badge">${p.tag||""}</span><h3 style="margin:.5rem 0 .25rem;font-size:1rem">${p.title}</h3><p style="margin:0;color:var(--muted);font-size:.88rem">${p.summary}</p></article>`).join("")}</div>`;
}
const viewEl=document.getElementById("view");
document.getElementById("tabs").onclick=(e)=>{const t=e.target.closest(".tab");if(!t)return;view=t.dataset.view;render()};
document.getElementById("cms-form").onsubmit=(e)=>{e.preventDefault();const item={title:ctitle.value.trim(),summary:csum.value.trim(),tag:ctag.value.trim()||"General"};
  if(ctype.value==="project"){const a=load("folio-projects",SEED_P);a.unshift(item);save("folio-projects",a);view="projects"}
  else{const a=load("folio-posts",SEED_B);a.unshift(item);save("folio-posts",a);view="posts"}
  document.getElementById("cms-status").textContent="Published to localStorage CMS.";e.target.reset();render()};
render();
