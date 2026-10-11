
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const DOCS=[
{cat:"Getting started",title:"Create your account",body:"Sign up with email, verify the link, then complete your profile."},
{cat:"Getting started",title:"Install Theme Mode",body:"Theme Mode switches full design tokens, not only background color."},
{cat:"Billing",title:"Update payment method",body:"Open Billing → Payment methods. Invoices export as PDF."},
{cat:"Billing",title:"Cancel subscription",body:"Cancel anytime. Access continues until the period ends."},
{cat:"Deploy",title:"Environment variables",body:"Never expose service role keys with NEXT_PUBLIC_ prefix."},
{cat:"Troubleshooting",title:"Map tiles not loading",body:"Allow requests to tile.openstreetmap.org on HTTPS pages."},
];
const cats=["All",...new Set(DOCS.map(d=>d.cat))]; let active="All";
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
function highlight(text,q){if(!q)return esc(text);const i=text.toLowerCase().indexOf(q.toLowerCase());if(i<0)return esc(text);return esc(text.slice(0,i))+"<mark class='hl'>"+esc(text.slice(i,i+q.length))+"</mark>"+esc(text.slice(i+q.length))}
function render(){
  document.getElementById("cats").innerHTML=cats.map(c=>`<button type="button" class="${c===active?"is-active":""}" data-c="${c}">${c}</button>`).join("");
  document.querySelectorAll("#cats button").forEach(b=>b.onclick=()=>{active=b.dataset.c;render()});
  const q=document.getElementById("q").value.trim();
  const list=DOCS.filter(d=>(active==="All"||d.cat===active)&&(!q||(d.title+" "+d.body).toLowerCase().includes(q.toLowerCase())));
  results.innerHTML=list.length?list.map(d=>`<article class="card article"><span class="badge">${esc(d.cat)}</span><h3 style="margin:.4rem 0">${highlight(d.title,q)}</h3><p style="margin:0;color:var(--muted)">${highlight(d.body,q)}</p></article>`).join(""):"<p style='color:var(--muted)'>No articles match.</p>";
}
q.addEventListener("input",render);render();
