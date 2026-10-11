
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const HOURS=["09:00","09:30","10:00","10:30","11:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00"];
function key(day,slot){return `slotbook:${day}:${slot}`}
function isTaken(day,slot){return localStorage.getItem(key(day,slot))==="1"}
const start=new Date();start.setHours(0,0,0,0);
const dayList=[];for(let i=0;i<14;i++){const d=new Date(start);d.setDate(start.getDate()+i);if(d.getDay()!==0&&d.getDay()!==6)dayList.push(d)}
let selectedDay=dayList[0].toISOString().slice(0,10), selectedSlot=null;
function renderDays(){days.innerHTML=dayList.map(d=>{const iso=d.toISOString().slice(0,10);const label=d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});return `<button type="button" class="day${iso===selectedDay?" is-active":""}" data-d="${iso}">${label}</button>`}).join("");
  days.querySelectorAll(".day").forEach(b=>b.onclick=()=>{selectedDay=b.dataset.d;selectedSlot=null;renderDays();renderSlots()})}
function renderSlots(){slots.innerHTML=HOURS.map(h=>{const taken=isTaken(selectedDay,h);return `<button type="button" class="slot${selectedSlot===h?" is-active":""}${taken?" is-taken":""}" data-s="${h}" ${taken?"disabled":""}>${h}</button>`}).join("");
  slots.querySelectorAll(".slot:not(.is-taken)").forEach(b=>b.onclick=()=>{selectedSlot=b.dataset.s;renderSlots()})}
book.onsubmit=(e)=>{e.preventDefault();if(!selectedSlot){bstatus.style.display="block";bstatus.style.color="var(--danger)";bstatus.textContent="Pick a time.";return}
  localStorage.setItem(key(selectedDay,selectedSlot),"1");bstatus.style.display="block";bstatus.style.color="var(--ok)";bstatus.textContent=`Booked ${selectedDay} at ${selectedSlot}.`;selectedSlot=null;book.reset();renderSlots()};
renderDays();renderSlots();
