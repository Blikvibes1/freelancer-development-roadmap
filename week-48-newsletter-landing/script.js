
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


nl.onsubmit=(e)=>{e.preventDefault();const list=JSON.parse(localStorage.getItem("dispatch-subs")||"[]");list.unshift({email:email.value.trim(),at:new Date().toISOString()});localStorage.setItem("dispatch-subs",JSON.stringify(list.slice(0,200)));document.getElementById("nl-status").style.display="block";document.getElementById("nl-status").textContent="You're on the list (demo).";nl.reset()};
