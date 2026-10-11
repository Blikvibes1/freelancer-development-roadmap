
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const PLANS=[{id:"free",name:"Starter",price:0,period:"forever",features:["3 projects","Community support"]},
{id:"pro",name:"Pro",price:19,period:"month",featured:true,features:["Unlimited projects","Priority support","Theme Mode kits"]},
{id:"studio",name:"Studio",price:49,period:"month",features:["Everything in Pro","Team seats","White-label"]}];
const MK="member-sub";
function load(){try{return JSON.parse(localStorage.getItem(MK)||"null")}catch(e){return null}}
function render(){
  const cur=load();
  plans.innerHTML=PLANS.map(p=>`<article class="card plan${p.featured?" featured":""}">
    ${p.featured?'<span class="badge">Popular</span>':""}
    <h3 style="margin:.35rem 0">${p.name}</h3>
    <div class="price">$${p.price}<span style="font-size:.9rem;color:var(--muted);font-weight:500">/${p.period}</span></div>
    <ul>${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>
    <button class="btn ${p.featured?"btn-primary":""}" style="width:100%" type="button" data-id="${p.id}" ${cur&&cur.plan===p.id?"disabled":""}>
      ${cur&&cur.plan===p.id?"Current":p.price===0?"Continue free":"Subscribe"}
    </button></article>`).join("");
  plans.querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>{const plan=PLANS.find(x=>x.id===b.dataset.id);
    localStorage.setItem(MK,JSON.stringify({plan:plan.id,name:plan.name,price:plan.price,at:new Date().toISOString()}));render()});
  const m=load();membership.textContent=m?`${m.name} · $${m.price}/mo · since ${m.at.slice(0,10)}`:"No active plan.";
}
render();
