(function(){
  const KEY="relay-theme";
  const $ = (id)=>document.getElementById(id);
  function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
  (function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);$("theme-switch").onclick=()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir");})();
  let socket=null,self=null;
  const typingMap=new Map(), msgNodes=new Map();
  const esc=(s)=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  function setConn(ok){$("conn-dot").classList.toggle("online",ok);$("conn-label").textContent=ok?"Connected":"Offline"}
  function appendSys(t){const el=document.createElement("div");el.className="sys";el.textContent=t;$("messages").appendChild(el);$("messages").scrollTop=1e9}
  function receiptLabel(msg){if(!self||msg.from.id!==self.id)return"";const o=(a)=>(a||[]).filter(id=>id!==self.id);if(o(msg.readBy).length)return"Read";if(o(msg.deliveredTo).length)return"Delivered";return"Sent"}
  function renderMessage(msg){
    let node=msgNodes.get(msg.id);
    if(!node){node=document.createElement("article");node.className="msg"+(self&&msg.from.id===self.id?" me":"");msgNodes.set(msg.id,node);$("messages").appendChild(node);
      if(self&&msg.from.id!==self.id&&socket){socket.emit("delivered",{messageId:msg.id});if(document.visibilityState==="visible")socket.emit("read",{messageId:msg.id})}}
    const rc=receiptLabel(msg);
    node.innerHTML=`<div class="meta"><strong>${esc(msg.from.name)}</strong> · ${new Date(msg.at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div><div>${esc(msg.text)}</div>${rc?`<div class="receipts${rc==="Read"?" read":""}">${rc}</div>`:""}`;
    $("messages").scrollTop=1e9;
  }
  function join(name,room){
    socket=io({transports:["websocket","polling"]});
    socket.on("connect",()=>setConn(true));socket.on("disconnect",()=>setConn(false));
    socket.emit("join",{name,room},(res)=>{if(!res?.ok)return;self=res.self;$("gate").hidden=true;$("chat").hidden=false;$("room-label").textContent="#"+self.room;$("input").disabled=false;$("send").disabled=false;$("input").focus()});
    socket.on("history",(list)=>{msgNodes.clear();$("messages").innerHTML="";(list||[]).forEach(renderMessage)});
    socket.on("message",renderMessage);
    socket.on("system",(p)=>p?.text&&appendSys(p.text));
    socket.on("presence",(list)=>{$("roster").innerHTML=(list||[]).map(u=>`<li>${esc(u.name)}${self&&u.id===self.id?" (you)":""}</li>`).join("");$("online-count").textContent=(list||[]).length+" online"});
    socket.on("typing",({id,name:n,typing})=>{if(self&&id===self.id)return;if(typing)typingMap.set(id,n);else typingMap.delete(id);const names=[...typingMap.values()];$("typing").textContent=names.length?(names.length===1?names[0]+" is typing…":names.join(", ")+" are typing…"):""});
    socket.on("receipt",({messageId,deliveredTo,readBy})=>{const node=msgNodes.get(messageId);if(!node||!node.classList.contains("me"))return;const o=(a)=>(a||[]).filter(id=>self&&id!==self.id);let rc="Sent";if(o(readBy).length)rc="Read";else if(o(deliveredTo).length)rc="Delivered";let el=node.querySelector(".receipts");if(!el){el=document.createElement("div");el.className="receipts";node.appendChild(el)}el.textContent=rc;el.classList.toggle("read",rc==="Read")});
  }
  $("join-form").onsubmit=(e)=>{e.preventDefault();join($("name").value.trim(),$("room").value.trim()||"general")};
  let typing=false,timer=null;
  $("input").oninput=()=>{if(!socket)return;if(!typing){typing=true;socket.emit("typing",true)}clearTimeout(timer);timer=setTimeout(()=>{typing=false;socket.emit("typing",false)},1200)};
  $("composer").onsubmit=(e)=>{e.preventDefault();const t=$("input").value.trim();if(!t||!socket)return;socket.emit("typing",false);typing=false;socket.emit("message",{text:t});$("input").value=""};
})();
