// assets/site.js
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

/* McGill ratios (tools.html) */
(function(){
  const tFlex = qs('#tFlex');
  if(!tFlex) return;
  const tExt = qs('#tExt'), tSideR = qs('#tSideR'), tSideL = qs('#tSideL');
  const outFE=qs('#ratioFE'), outRE=qs('#ratioRE'), outLE=qs('#ratioLE'), outRL=qs('#ratioRL');
  const bar = qs('#mcgillBar'), msg = qs('#mcgillMsg');

  function fe(){
    const flex=+tFlex.value||0, ext=+tExt.value||1, sr=+tSideR.value||0, sl=+tSideL.value||0;
    outFE.textContent=(flex/ext).toFixed(2);
    outRE.textContent=(sr/ext).toFixed(2);
    outLE.textContent=(sl/ext).toFixed(2);
    outRL.textContent= (ext>0 && sl>0 && sr>0) ? (sr/sl).toFixed(2) : '—';

    let pass=0;
    if (flex/ext < 1.0) pass++;
    if (sr/ext < 0.75) pass++;
    if (sl/ext < 0.75) pass++;
    const balanceOK = (sr && sl) ? Math.abs(sr/sl - 1) <= 0.05 : false;
    const pct = Math.min(100, Math.round((pass/3 + (balanceOK?0.33:0))*75));
    bar.style.width = pct + '%';
    msg.textContent = (pass===3 && balanceOK)
      ? '✅ Ratios pass. If symptoms allow, youre ready for Phase 3 work.'
      : 'Keep building short, crisp holds and retest. Aim for all 3 ratios + side balance within ±0.05.';
  }
  [tFlex,tExt,tSideR,tSideL].forEach(i=> i.addEventListener('input', fe)); fe();
})();

/* Pain/load self-check (tools.html) */
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
  }
  [pain,persist,bw,perHand].forEach(i=> i.addEventListener('input', check)); check();
})();

/* Phase tracker (tools.html) */
(function(){
  const ids=['p0','p1','p2','p3','p4'];
  const bar = qs('#phaseBar');
  if(!bar) return;
  function render(){
    let done=0;
    ids.forEach(id=>{
      const el = qs('#'+id);
      if(el && el.checked) done++;
      if(el) el.addEventListener('change', ()=>{
        localStorage.setItem('phase_'+id, el.checked ? '1' : '0');
        render();
      });
      if(localStorage.getItem('phase_'+id) === '1' && el){
        el.checked = true;
        done++;
      }
    });
    bar.style.width = Math.round((done/ids.length)*100)+'%';
  }
  render();
})();