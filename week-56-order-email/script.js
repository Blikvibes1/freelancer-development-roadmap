
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


send.onclick=()=>{const log=JSON.parse(localStorage.getItem("receipt-log")||"[]");log.unshift({order:"#1042",at:new Date().toISOString()});localStorage.setItem("receipt-log",JSON.stringify(log));status.style.display="block";status.textContent="Receipt queued (demo)."};
