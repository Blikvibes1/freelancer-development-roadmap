
const KEY="phase56-theme";
function applyTheme(t){const n=t==="lumen"?"lumen":"noir";document.documentElement.dataset.theme=n;try{localStorage.setItem(KEY,n)}catch(e){}}
(function(){let s="noir";try{const v=localStorage.getItem(KEY);if(v==="noir"||v==="lumen")s=v}catch(e){}applyTheme(s);document.getElementById("theme-switch")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="noir"?"lumen":"noir"));})();


pay.onsubmit=async(e)=>{e.preventDefault();const st=document.getElementById("status");st.style.display="block";st.style.color="var(--muted)";st.textContent="Processing…";
  await new Promise(r=>setTimeout(r,800));
  const digits=card.value.replace(/\s/g,"");
  if(digits.startsWith("4242")){st.style.color="var(--ok)";st.textContent="Payment succeeded (test simulation). Wire Stripe Checkout Session server-side for production."}
  else{st.style.color="var(--danger)";st.textContent="Declined. Use 4242 4242 4242 4242."}};
