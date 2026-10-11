
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const MENU=[{cat:"starters",name:"Charred broccolini",desc:"Lemon, chili crisp",price:14},{cat:"starters",name:"Citrus crudo",desc:"Yuzu, olive oil",price:18},{cat:"mains",name:"Heritage chicken",desc:"Pan sauce, roots",price:28},{cat:"mains",name:"Mushroom risotto",desc:"Thyme, pecorino",price:24},{cat:"desserts",name:"Olive oil cake",desc:"Citrus curd",price:12},{cat:"drinks",name:"House spritz",desc:"Bitter orange",price:12}];
const CATS=["all","starters","mains","desserts","drinks"]; let active="all";
function renderCats(){cats.innerHTML=CATS.map(c=>`<button type="button" class="chip${c===active?" is-active":""}" data-c="${c}">${c}</button>`).join("");cats.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{active=b.dataset.c;renderCats();renderMenu()})}
function renderMenu(){menu.innerHTML=MENU.filter(m=>active==="all"||m.cat===active).map(m=>`<article class="card item"><div><h3>${m.name}</h3><p>${m.desc}</p></div><div class="price">$${m.price}</div></article>`).join("")}
const BK="tablethyme-bookings";
function loadB(){try{return JSON.parse(localStorage.getItem(BK)||"[]")}catch(e){return[]}}
function renderB(){const all=loadB();bookings.innerHTML=all.length?"<strong>Recent</strong><ul style='margin:.4rem 0 0;padding-left:1.1rem'>"+all.map(b=>`<li>${b.date} ${b.time} · ${b.guests} · ${b.name}</li>`).join("")+"</ul>":"No bookings yet."}
document.getElementById("book-form").onsubmit=(e)=>{e.preventDefault();const data={name:name.value.trim(),email:email.value.trim(),date:date.value,time:time.value,guests:guests.value};const all=loadB();all.unshift(data);localStorage.setItem(BK,JSON.stringify(all.slice(0,10)));toast.textContent=`Request for ${data.date} at ${data.time}`;toast.classList.add("show");e.target.reset();renderB()};
const d=new Date();d.setDate(d.getDate()+1);date.value=d.toISOString().slice(0,10);
renderCats();renderMenu();renderB();
