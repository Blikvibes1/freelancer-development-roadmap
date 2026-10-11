
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


const SESSION="desk-session";
function showDash(email){document.getElementById("login-view").style.display="none";document.getElementById("dash-view").style.display="block";welcome.textContent="Signed in as "+email}
function showLogin(){document.getElementById("login-view").style.display="block";document.getElementById("dash-view").style.display="none";try{localStorage.removeItem(SESSION)}catch(e){}}
try{const s=localStorage.getItem(SESSION);if(s)showDash(s)}catch(e){}
login.onsubmit=(e)=>{e.preventDefault();if(pass.value!=="demo"){document.getElementById("login-err").style.display="block";document.getElementById("login-err").textContent="Password must be demo.";return}
  localStorage.setItem(SESSION,email.value.trim());showDash(email.value.trim())};
logout.onclick=showLogin;
