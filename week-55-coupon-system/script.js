
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SUB=212;
const CODES={SAVE10:{type:"percent",value:10,min:0,expires:"2027-01-01",usesLeft:99},FLAT20:{type:"fixed",value:20,min:100,expires:"2027-01-01",usesLeft:50},EXPIRED:{type:"percent",value:50,min:0,expires:"2020-01-01",usesLeft:10},MAXED:{type:"fixed",value:5,min:0,expires:"2027-01-01",usesLeft:0}};
function money(n){return n.toLocaleString("en-US",{style:"currency",currency:"USD"})}
apply.onclick=()=>{const code=(document.getElementById("code").value||"").trim().toUpperCase();const rule=CODES[code];
  if(!rule){msg.style.color="var(--danger)";msg.textContent="Invalid code.";return}
  if(rule.usesLeft<=0){msg.style.color="var(--danger)";msg.textContent="Usage limit reached.";return}
  if(new Date(rule.expires)<new Date()){msg.style.color="var(--danger)";msg.textContent="Code expired.";return}
  if(SUB<rule.min){msg.style.color="var(--danger)";msg.textContent="Minimum not met.";return}
  const d=rule.type==="percent"?SUB*(rule.value/100):rule.value;
  msg.style.color="var(--ok)";msg.textContent=`Applied ${code}`;disc.textContent="-"+money(d);total.textContent=money(SUB-d)};
