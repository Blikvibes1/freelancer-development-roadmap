
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SPEAKERS=[{name:"Amina Cole",role:"Design Systems",bio:"Tokens and multi-brand UI."},{name:"Jon Park",role:"Perf Engineer",bio:"Core Web Vitals."},{name:"Rhea Nair",role:"Freelance Director",bio:"Scoping client builds."}];
speakers.innerHTML=SPEAKERS.map(s=>`<article class="card"><strong>${s.name}</strong><div style="color:var(--accent);font-size:.85rem">${s.role}</div><p style="margin:.4rem 0 0;color:var(--muted);font-size:.88rem">${s.bio}</p></article>`).join("");
const TARGET=new Date();TARGET.setDate(TARGET.getDate()+18);TARGET.setHours(9,0,0,0);
function tick(){const diff=Math.max(0,TARGET-new Date());const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  countdown.innerHTML=[["Days",d],["Hours",h],["Min",m],["Sec",s]].map(([l,v])=>`<div class="unit"><b>${v}</b><span style="font-size:.72rem;color:var(--muted)">${l}</span></div>`).join("")}
tick();setInterval(tick,1000);
reg.onsubmit=(e)=>{e.preventDefault();rstatus.style.display="block";rstatus.textContent=`Ticket ${rticket.value} reserved for ${remail.value} (demo).`;reg.reset()};
