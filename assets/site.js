// assets/site.js
const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

/* Active nav link (aria-current="page") */
(function() {
  const links = qsa("nav a[href]");
  if (!links.length) return;

  const here = new URL(location.href);
  const herePath = here.pathname.replace(/\/+$/, "");

  links.forEach(a => {
    const hrefPath = new URL(a.getAttribute("href"), here).pathname.replace(/\/+$/, "");
    const isSame = hrefPath === herePath;
    const isIndexMatch = (hrefPath.endsWith("/index.html") && (herePath.endsWith("/") || herePath.endsWith("/index.html")));
    if (isSame || isIndexMatch) a.setAttribute("aria-current","page");
  });
})();

/* McGill ratios (tools.html) */
(function(){
  const tFlex = qs('#tFlex'); 
  const tExt  = qs('#tExt');
  const tSideR= qs('#tSideR'); 
  const tSideL= qs('#tSideL');
  if (![tFlex,tExt,tSideR,tSideL].every(Boolean)) return;

  const outFE = qs('#ratioFE'), outRE=qs('#ratioRE'), outLE=qs('#ratioLE'), outRL=qs('#ratioRL');
  const bar   = qs('#mcgillBar'), msg = qs('#mcgillMsg');
  if (msg) msg.setAttribute('role','status');

  function render(){
    const flex=+tFlex.value||0, ext=+tExt.value||1, sr=+tSideR.value||0, sl=+tSideL.value||0;
    outFE.textContent=(flex/ext).toFixed(2);
    outRE.textContent=(sr/ext).toFixed(2);
    outLE.textContent=(sl/ext).toFixed(2);
    outRL.textContent=(ext>0 && sl>0 && sr>0) ? (sr/sl).toFixed(2) : '—';

    let pass=0; if (flex/ext < 1.0) pass++; if (sr/ext < 0.75) pass++; if (sl/ext < 0.75) pass++;
    const balanceOK = (sr && sl) ? Math.abs(sr/sl - 1) <= 0.05 : false;
    const pct = Math.min(100, Math.round((pass/3 + (balanceOK?0.33:0))*75));
    if (bar) bar.style.width = pct + '%';
    if (msg) msg.textContent = (pass===3 && balanceOK)
      ? '✅ Ratios pass. If symptoms allow, you’re ready for Phase 3 work.'
      : 'Keep building short, crisp holds and retest. Aim for all 3 ratios + side balance within ±0.05.';

    localStorage.setItem('mcgill', JSON.stringify({flex,ext,sr,sl}));
  }

  [tFlex,tExt,tSideR,tSideL].forEach(i=> i.addEventListener('input', render));

  try {
    const saved = JSON.parse(localStorage.getItem('mcgill')||'{}');
    if (saved.flex!=null) tFlex.value=saved.flex;
    if (saved.ext!=null)  tExt.value=saved.ext;
    if (saved.sr!=null)   tSideR.value=saved.sr;
    if (saved.sl!=null)   tSideL.value=saved.sl;
  } catch(e){}
  render();
})();

/* Pain/load check (tools.html) */
(function(){
  const pain=qs('#painNow'); if(!pain) return;
  const persist=qs('#persist2h'), bw=qs('#bw'), perHand=qs('#perHand');
  const outCarry=qs('#carryRatio'), outSug=qs('#suggestion');

  function check(){
    const p=+pain.value, pers=persist.value, w=+bw.value||0, ph=+perHand.value||0;
    outCarry.textContent = w>0 ? ((ph*2)/w).toFixed(2) : '—';
    outSug.textContent =
      (p>=6 || pers==='yes') ? '🔴 Regress volume/complexity and respect the 2-hour rule.' :
      (p>=4) ? '🟠 Caution: reduce volume; keep holds shorter, add sets.' :
      '🟢 OK to progress conservatively if form is crisp and ratios are in range.';
    localStorage.setItem('painload', JSON.stringify({p, pers, w, ph}));
  }
  [pain,persist,bw,perHand].forEach(i=> i.addEventListener('input', check));
  try {
    const s = JSON.parse(localStorage.getItem('painload')||'{}');
    if (s.p!=null) pain.value=s.p; if (s.pers) persist.value=s.pers;
    if (s.w!=null) bw.value=s.w; if (s.ph!=null) perHand.value=s.ph;
  } catch(e){}
  check();
})();

/* Phase tracker (tools.html) */
(function(){
  const ids=['p0','p1','p2','p3','p4'];
  const bar = qs('#phaseBar'); 
  if(!bar) return;
  function render(){
    let done=0;
    ids.forEach(id=>{
      const el=qs('#'+id);
      const v = localStorage.getItem('phase_'+id)==='1';
      if(el){
        el.checked=v; if(v) done++;
        el.onchange=()=>{ localStorage.setItem('phase_'+id, el.checked?'1':'0'); render(); };
      }
    });
    bar.style.width = Math.round((done/ids.length)*100)+'%';
  }
  render();
})();