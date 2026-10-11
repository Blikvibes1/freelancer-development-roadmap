
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SEED=[{id:1,title:"Frontend Engineer",company:"Northline",location:"Austin, TX",type:"Full-time"},{id:2,title:"Product Designer",company:"Harbor UI",location:"Remote",type:"Full-time"},{id:3,title:"Web Developer",company:"Studio Peak",location:"Contract",type:"Contract"}];
function loadJobs(){try{const v=JSON.parse(localStorage.getItem("hireline-jobs")||"null");return Array.isArray(v)&&v.length?v:SEED}catch(e){return SEED}}
function saveJobs(j){localStorage.setItem("hireline-jobs",JSON.stringify(j))}
let selected=null;
function render(){
  const list=loadJobs();
  jobs.innerHTML=list.map(j=>`<article class="card job" data-id="${j.id}" style="${selected===j.id?"border-color:var(--accent)":""}"><div><h3 style="margin:0;font-size:1.05rem">${j.title}</h3><div style="color:var(--muted);font-size:.85rem;margin-top:.25rem">${j.company} · ${j.location} · ${j.type}</div></div><span class="badge">Apply</span></article>`).join("");
  jobs.querySelectorAll(".job").forEach(el=>el.onclick=()=>{selected=+el.dataset.id;const j=loadJobs().find(x=>x.id===selected);document.getElementById("apply-for").textContent="Applying to: "+j.title+" @ "+j.company;render()});
}
post.onsubmit=(e)=>{e.preventDefault();const list=loadJobs();list.unshift({id:Date.now(),title:jtitle.value.trim(),company:jco.value.trim(),location:jloc.value.trim()||"Remote",type:"Full-time"});saveJobs(list);e.target.reset();render()};
apply.onsubmit=(e)=>{e.preventDefault();if(!selected){astatus.style.display="block";astatus.style.color="var(--danger)";astatus.textContent="Select a job.";return}astatus.style.display="block";astatus.style.color="var(--ok)";astatus.textContent="Application sent (demo).";apply.reset()};
render();
