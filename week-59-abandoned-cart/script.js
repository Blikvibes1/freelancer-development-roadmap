
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SK="nudge-sessions",QK="nudge-queue";
function loadS(){try{return JSON.parse(localStorage.getItem(SK)||"[]")}catch(e){return[]}}
function loadQ(){try{return JSON.parse(localStorage.getItem(QK)||"[]")}catch(e){return[]}}
function render(){
  const s=loadS();
  sessions.innerHTML=s.length?s.map(x=>`<div style="padding:.55rem 0;border-bottom:1px solid var(--line)"><strong>${x.email}</strong> · ${x.items} items · $${x.value}
    <div style="color:var(--faint);font-size:.8rem">${x.checkedOut?"Checked out":"Abandoned"}</div></div>`).join(""):"<p style='color:var(--muted)'>No sessions.</p>";
  const q=loadQ();
  queue.innerHTML=q.length?q.map(x=>`<article style="border-bottom:1px solid var(--line);padding:.65rem 0"><strong>${x.email}</strong><div style="color:var(--muted);font-size:.85rem">${x.subject}</div></article>`).join(""):"<p style='color:var(--muted);font-size:.9rem'>Queue empty.</p>";
}
seed.onclick=()=>{const s=loadS();s.unshift({email:`shopper${Math.floor(Math.random()*90+10)}@mail.com`,items:Math.floor(Math.random()*3)+1,value:(Math.random()*150+40).toFixed(2),lastActive:new Date(Date.now()-6*3600000).toISOString(),checkedOut:false});localStorage.setItem(SK,JSON.stringify(s.slice(0,20)));render()};
run.onclick=()=>{const s=loadS(),q=loadQ();s.filter(x=>!x.checkedOut).forEach(x=>q.unshift({email:x.email,subject:`You left ${x.items} item(s) ($${x.value})`,at:new Date().toISOString()}));localStorage.setItem(QK,JSON.stringify(q.slice(0,30)));render()};
render();
