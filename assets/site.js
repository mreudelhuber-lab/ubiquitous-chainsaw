// assets/site.js
const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

/* ---------- Active nav link ---------- */
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

/* ---------- McGill ratios (tools.html) ---------- */
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

/* ---------- Pain/load (tools.html) ---------- */
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

/* ---------- Phase tracker (tools.html) ---------- */
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

/* ==================================================
   Coach Timer (reusable for exercise pages)
   ================================================== */
(function(){
  const coaches = qsa('.coach');
  if (!coaches.length) return;

  function fmt(s){
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sc = (s%60).toString().padStart(2,'0');
    return `${m}:${sc}`;
  }

  function beep(){
    try{
      const a = new (window.AudioContext||window.webkitAudioContext)();
      const o = a.createOscillator(); const g = a.createGain();
      o.type='sine'; o.frequency.value=880; g.gain.value=0.06;
      o.connect(g); g.connect(a.destination); o.start(); setTimeout(()=>{o.stop();a.close();},180);
    }catch(_){}
  }

  coaches.forEach(root=>{
    const title = root.dataset.title || 'Session';
    const key   = `coach-${title.replace(/\s+/g,'-').toLowerCase()}`;

    // Elements
    const setsEl   = root.querySelector('[data-sets]');
    const repsEl   = root.querySelector('[data-reps]');
    const workEl   = root.querySelector('[data-work]');
    const restEl   = root.querySelector('[data-rest]');
    const setRestEl= root.querySelector('[data-setrest]');
    const soundEl  = root.querySelector('[data-sound]');
    const startBtn = root.querySelector('[data-start]');
    const pauseBtn = root.querySelector('[data-pause]');
    const resetBtn = root.querySelector('[data-reset]');
    const banner   = root.querySelector('.coach-banner');
    const phaseChip= root.querySelector('.phase-chip');
    const titleEl  = root.querySelector('.coach-title');
    const actionEl = root.querySelector('.coach-action');
    const timeEl   = root.querySelector('.countdown');
    const barEl    = root.querySelector('.coach-progressbar > i');
    const live     = root.querySelector('.coach-live');

    const workText = root.dataset.workText || 'Perform the action';
    const restText = root.dataset.restText || 'Release abdomen and breathe deeply';

    // Restore saved values
    try{
      const saved = JSON.parse(localStorage.getItem(key)||'{}');
      if(saved.sets!=null) setsEl.value=saved.sets;
      if(saved.reps!=null) repsEl.value=saved.reps;
      if(saved.work!=null) workEl.value=saved.work;
      if(saved.rest!=null) restEl.value=saved.rest;
      if(saved.setrest!=null) setRestEl.value=saved.setrest;
      if(saved.sound!=null) soundEl.checked=saved.sound;
    }catch(_){}

    function persist(){
      localStorage.setItem(key, JSON.stringify({
        sets:+setsEl.value, reps:+repsEl.value, work:+workEl.value,
        rest:+restEl.value, setrest:+setRestEl.value, sound:soundEl.checked
      }));
    }

    let timer=null, totalSteps=0, stepIndex=0, stepEnd=0, stepStart=0, currentPhase='rest';
    let plan=[];

    function buildPlan(){
      plan=[]; totalSteps=0;
      const sets = Math.max(1, +setsEl.value||1);
      const reps = Math.max(1, +repsEl.value||1);
      const work = Math.max(1, +workEl.value||1);
      const rest = Math.max(0, +restEl.value||0);
      const setR = Math.max(0, +setRestEl.value||0);

      for(let s=1; s<=sets; s++){
        for(let r=1; r<=reps; r++){
          plan.push({phase:'work', dur:work, label:`Set ${s}/${sets} • Rep ${r}/${reps}`, text:workText});
          if(rest>0 && r<reps) plan.push({phase:'rest', dur:rest, label:`Rest • Set ${s}/${sets}`, text:restText});
        }
        if(setR>0 && s<sets) plan.push({phase:'rest', dur:setR, label:`Set Rest • ${s}/${sets}`, text:restText});
      }
      totalSteps = plan.length;
    }

    function announce(t){
      if(live){ live.textContent=''; setTimeout(()=> live.textContent=t, 10); }
    }

    function renderStep(){
      const now = Date.now()/1000;
      const remain = Math.max(0, Math.ceil(stepEnd - now));
      timeEl.textContent = fmt(remain);
      const elapsed = Math.max(0, stepEnd - now > 0 ? (now - stepStart) : (stepEnd - stepStart));
      const pct = Math.min(100, Math.round((elapsed/Math.max(1,(stepEnd-stepStart)))*100));
      barEl.style.width = `${pct}%`;
      if(remain<=0){
        nextStep();
      }
    }

    function nextStep(){
      if(stepIndex >= totalSteps){ // done
        clearInterval(timer); timer=null;
        root.classList.remove('running');
        phaseChip.textContent='DONE'; phaseChip.className='phase-chip';
        titleEl.textContent = `${title} complete`;
        actionEl.textContent= 'Great work. Cool down with easy breaths.';
        timeEl.textContent  = '00:00'; barEl.style.width='100%';
        announce(`${title} complete`);
        if(soundEl.checked) beep();
        return;
      }
      const step = plan[stepIndex++];
      currentPhase = step.phase;
      root.classList.add('running');
      banner.style.display='flex';
      phaseChip.textContent = step.phase==='work' ? 'WORK' : 'REST';
      phaseChip.className = `phase-chip ${step.phase==='work'?'phase-work':'phase-rest'}`;
      titleEl.textContent  = step.label;
      actionEl.textContent = step.text;
      stepStart = Date.now()/1000;
      stepEnd   = stepStart + step.dur;
      announce(`${step.phase.toUpperCase()}: ${step.text}`);
      if(soundEl.checked) beep();
    }

    function start(){
      persist(); buildPlan();
      stepIndex=0; nextStep();
      if(timer) clearInterval(timer);
      timer = setInterval(renderStep, 200);
    }
    function pause(){
      if(!timer) return;
      clearInterval(timer); timer=null;
      // Adjust remaining by recomputing end based on pause duration
      const remain = Math.max(0, Math.ceil(stepEnd - Date.now()/1000));
      stepEnd = Date.now()/1000 + remain;
    }
    function reset(){
      if(timer) clearInterval(timer); timer=null;
      root.classList.remove('running');
      phaseChip.textContent='READY'; phaseChip.className='phase-chip';
      titleEl.textContent  = `${title}`;
      actionEl.textContent = 'Press Start to begin.';
      timeEl.textContent   = '00:00'; barEl.style.width='0%';
    }

    // Wire controls
    startBtn.addEventListener('click', (e)=>{e.preventDefault(); start();});
    pauseBtn.addEventListener('click', (e)=>{e.preventDefault(); pause();});
    resetBtn.addEventListener('click', (e)=>{e.preventDefault(); reset();});
    [setsEl,repsEl,workEl,restEl,setRestEl,soundEl].forEach(el=> el && el.addEventListener('change', persist));

    // Initial state
    titleEl.textContent = title; actionEl.textContent='Press Start to begin.'; timeEl.textContent='00:00';
  });
})();