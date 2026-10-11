
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const DATA=[
{id:"b1",name:"Summit Plumbing Co.",category:"plumber",rating:4.8,address:"1204 E 6th St",lat:30.2655,lng:-97.7322,openNow:true,blurb:"Emergency and scheduled plumbing."},
{id:"b2",name:"ArcLight Electric",category:"electrician",rating:4.9,address:"908 Congress Ave",lat:30.2701,lng:-97.7425,openNow:true,blurb:"Residential and commercial electrical."},
{id:"b3",name:"CoolStream HVAC",category:"hvac",rating:4.5,address:"5600 N Lamar",lat:30.3288,lng:-97.7271,openNow:true,blurb:"Fast AC and heating service."},
{id:"b4",name:"GreenCanopy Landscaping",category:"landscaping",rating:4.6,address:"3401 S Lamar",lat:30.2412,lng:-97.7851,openNow:false,blurb:"Drought-smart landscape design."},
{id:"b5",name:"Keystone Lock & Security",category:"locksmith",rating:4.7,address:"200 E Riverside",lat:30.2439,lng:-97.7472,openNow:true,blurb:"24/7 lockouts and smart locks."},
{id:"b6",name:"BrightNest Cleaning",category:"cleaning",rating:4.7,address:"2200 Manor Rd",lat:30.2874,lng:-97.7158,openNow:true,blurb:"Detail-focused home cleaning."},
];
const CATS=["all","plumber","electrician","hvac","landscaping","locksmith","cleaning"];
let cat="all", map, markers={};
function boot(){
  map=L.map("map").setView([30.27,-97.74],12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OSM"}).addTo(map);
  renderChips(); refresh();
  document.getElementById("q").oninput=refresh;
  document.getElementById("openOnly").onchange=refresh;
}
function renderChips(){
  chips.innerHTML=CATS.map(c=>`<button type="button" class="chip${c===cat?" is-active":""}" data-c="${c}">${c}</button>`).join("");
  chips.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cat=b.dataset.c;renderChips();refresh()});
}
function refresh(){
  const q=(document.getElementById("q").value||"").toLowerCase();
  const open=document.getElementById("openOnly").checked;
  const list=DATA.filter(b=>{
    if(cat!=="all"&&b.category!==cat)return false;
    if(open&&!b.openNow)return false;
    if(q&&!(b.name+" "+b.blurb+" "+b.address).toLowerCase().includes(q))return false;
    return true;
  });
  results.innerHTML=list.map(b=>`<button type="button" class="card card-btn" data-id="${b.id}"><strong>${b.name}</strong><div style="color:var(--muted);font-size:.85rem">${b.category} · ${b.rating}★ · ${b.address}</div><p style="margin:.4rem 0 0;color:var(--muted);font-size:.88rem">${b.blurb}</p></button>`).join("")||"<p style='color:var(--muted)'>No matches.</p>";
  Object.values(markers).forEach(m=>map.removeLayer(m)); markers={};
  list.forEach(b=>{const m=L.marker([b.lat,b.lng]).addTo(map).bindPopup("<strong>"+b.name+"</strong>");markers[b.id]=m;});
  results.querySelectorAll(".card-btn").forEach(el=>el.onclick=()=>{const m=markers[el.dataset.id];if(m){map.panTo(m.getLatLng());m.openPopup()}});
  setTimeout(()=>map.invalidateSize(),100);
}
if(typeof L!=="undefined") boot(); else window.addEventListener("load",()=>setTimeout(boot,50));
