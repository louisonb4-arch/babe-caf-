/* BABE — v3 « Glisse & caféine » */
(() => {
  const d = document, html = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined';
  const hasST = hasG && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  const eur = n => n.toFixed(2).replace('.', ',');
  $('#y').textContent = new Date().getFullYear();

  /* =====================================================
     TEMPS (heure de Paris) · statut · sessions · marées
     ===================================================== */
  const HOURS = { 1: [840, 1050], 2: [570, 1050], 3: [570, 1050], 4: [570, 1050], 5: [570, 1050] };
  const CLOSED = ['2026-11-20', '2026-11-23']; // fermetures exceptionnelles (bio Instagram)
  const EVENTS = [
    { iso: '2026-11-27', t: "Je t'aime Rachel" },
    { iso: '2026-11-28', t: "Saturday's Flow" },
  ];
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const fmt = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  function paris(off = 0) {
    const t = new Date(Date.now() + off * 864e5);
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(t).map(x => [x.type, x.value]));
    return { iso: `${p.year}-${p.month}-${p.day}`, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: (+p.hour % 24) * 60 + +p.minute };
  }
  const openOn = day => !CLOSED.includes(day.iso) && HOURS[day.dow];
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  function status() {
    const now = paris(), h = openOn(now);
    if (h && now.min >= h[0] && now.min < h[1]) return { open: true, long: `Ouvert jusqu'à ${fmt(h[1])}`, short: `Ouvert · jusqu'à ${fmt(h[1])}` };
    if (h && now.min < h[0]) return { open: false, long: `Ouvre à ${fmt(h[0])}`, short: `Fermé · ouvre à ${fmt(h[0])}` };
    for (let i = 1; i < 10; i++) {
      const n = paris(i), nh = openOn(n);
      if (nh) { const w = i === 1 ? 'demain' : DAYS[n.dow]; return { open: false, long: `Fermé, rouvre ${w} ${fmt(nh[0])}`, short: `Fermé · ${w} ${fmt(nh[0])}` }; }
    }
    return { open: false, long: 'Fermé', short: 'Fermé' };
  }
  function paintTime() {
    const s = status(), now = paris();
    $$('[data-status]').forEach(el => { el.classList.toggle('open', s.open); $('span', el).textContent = s.short; });
    const dd = $('[data-status-long]'); dd.textContent = s.long; dd.classList.toggle('open-dd', s.open);
    $('[data-today]').textContent = new Date(now.iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    // prochaine session
    const next = EVENTS.find(e => e.iso >= now.iso);
    const rel = n => n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`;
    $('[data-next-session]').textContent = next ? `${next.t}, ${rel(dayDiff(now.iso, next.iso))}` : 'à suivre sur Insta';
    $$('.surf').forEach(b => {
      const n = dayDiff(now.iso, b.dataset.date);
      $('[data-count]', b).textContent = n < 0 ? 'passé' : n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `J-${n}`;
      b.classList.toggle('past', n < 0);
    });
    // marées : aujourd'hui + trait « maintenant »
    $$('.tides-list li').forEach(li => li.classList.toggle('today', +li.dataset.d === now.dow));
    $$('.tides-now').forEach(x => x.remove());
    const h = now.min / 60, todayLi = $(`.tides-list li[data-d="${now.dow}"]`);
    if (todayLi && h >= 9 && h <= 18) {
      const m = d.createElement('span'); m.className = 'tides-now'; m.style.left = `${(h - 9) / 9 * 100}%`;
      $('i', todayLi).appendChild(m);
    }
    const up = CLOSED.filter(x => x >= now.iso), note = $('[data-closure]');
    if (up.length) {
      note.textContent = 'Fermeture exceptionnelle : ' + up.map(iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })).join(' et ');
      note.hidden = false;
    } else note.hidden = true;
  }
  paintTime(); setInterval(paintTime, 60e3);

  /* =====================================================
     LE VERSEMENT — le café remplit les lettres une à une
     ===================================================== */
  const LET = { b1: 244, a: 633, b2: 1024, e: 1371 };   // centre de chaque lettre
  const BOTTOM = 680, TOP = 30;
  function pour(root, { delay = 0, speed = 1 } = {}) {
    const svg = $('.pour-svg', root), stream = $('.stream', root);
    const liqs = $$('.liq', root);
    const fill = () => { liqs.forEach(l => l.setAttribute('transform', `translate(0 ${TOP})`)); root.classList.add('full'); };
    if (!hasG || RM) { fill(); return; }
    // les vagues ondulent pendant le remplissage
    const waves = liqs.map(l => gsap.to($$('path', l), { x: -180, duration: .9, ease: 'none', repeat: -1 }));
    const tl = gsap.timeline({ delay, onComplete: () => { waves.forEach(w => w.kill()); root.classList.add('full'); } });
    const st = { x: LET.b1, top: -900, bot: -900 };
    const draw = () => { stream.setAttribute('x', st.x - 17); stream.setAttribute('y', st.top); stream.setAttribute('height', Math.max(0, st.bot - st.top)); };
    liqs.forEach((l, i) => {
      const k = l.dataset.k, lv = { y: BOTTOM };
      const setL = () => { l.setAttribute('transform', `translate(0 ${lv.y})`); st.bot = Math.min(st.bot, lv.y + 30); draw(); };
      if (i === 0) tl.set(st, { x: LET[k], onComplete: draw });
      else tl.to(st, { x: LET[k], duration: .16 * speed, ease: 'power2.inOut', onUpdate: draw });
      tl.to(st, { bot: BOTTOM - 40, top: -900, duration: .16 * speed, ease: 'power2.in', onUpdate: draw })
        .to(lv, { y: TOP, duration: .62 * speed, ease: 'power1.inOut', onUpdate: setL })
        .add(() => { st.bot = BOTTOM - 40; });
    });
    tl.to(st, { top: 640, bot: 640, duration: .3, ease: 'power2.in', onUpdate: draw });
    return tl;
  }
  /* =====================================================
     HERO — les verres glissent sur le comptoir
     ===================================================== */
  /* ouverture : BABE s'écrit au centre de l'écran, puis se pose dans la hero */
  if (hasG && !RM) {
    html.classList.add('intro-on');
    const h1 = $('.hc-babe'), L = $$('.hc-babe .L');
    const r = h1.getBoundingClientRect();
    const s = Math.max(1, Math.min(innerWidth * .78 / r.width, innerHeight * .42 / r.height, 1.7));
    const dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
    gsap.set(h1, { x: dx, y: dy, scale: s, transformOrigin: '50% 50%' });
    gsap.set(L, { scale: 0, rotation: i => [-18, 14, -12, 20][i] });
    const reveal = ['.hc-bar', '.hc-t', '.hc-p', '.hc-cta', '.hc-side', '.glass', '.tag', '.wood'];
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .25 });
    tl.to(L, { scale: 1, rotation: 0, duration: .75, stagger: .16, ease: 'back.out(2.4)' })
      // petit « boing » collectif
      .to(L, { scaleY: .86, scaleX: 1.08, duration: .14, stagger: .03, ease: 'power2.in' }, '+=.08')
      .to(L, { scaleY: 1, scaleX: 1, duration: .5, stagger: .03, ease: 'elastic.out(1.1,.45)' })
      // BABE file à sa place
      .to(h1, { x: 0, y: 0, scale: 1, duration: 1, ease: 'power4.inOut' }, '+=.1')
      .add(() => { html.classList.remove('intro-on'); gsap.set(reveal, { opacity: 1 }); }, '-=.45')
      .from('.hc-bar > *', { y: -14, opacity: 0, duration: .6, stagger: .06 }, '<')
      .from('.hc-t, .hc-p', { y: 24, opacity: 0, duration: .8, stagger: .08 }, '<.05')
      .from('.wood', { scaleX: 0, transformOrigin: '100% 50%', duration: .8, ease: 'power3.inOut' }, '<')
      .from('.glass', { x: () => innerWidth * 1.05, rotation: 6, duration: 1.05, stagger: { each: .16, from: 'end' }, ease: 'power3.out' }, '<.2')
      .to('.glass', { keyframes: [{ rotation: -2.5, duration: .12 }, { rotation: 1.2, duration: .14 }, { rotation: 0, duration: .2 }], stagger: { each: .16, from: 'end' } }, '-=.55')
      .from('.tag', { y: -40, opacity: 0, duration: .6, stagger: .1, ease: 'back.out(2.2)' }, '-=.3')
      .from('.hc-cta .b, .hc-side', { y: 16, opacity: 0, duration: .6, stagger: .07 }, '<');
    // un tap ou une touche : on passe directement à la fin
    const skip = () => { if (tl.progress() < 1) tl.progress(1); off(); };
    const off = () => { removeEventListener('pointerdown', skip); removeEventListener('keydown', skip); removeEventListener('wheel', skip); };
    addEventListener('pointerdown', skip); addEventListener('keydown', skip); addEventListener('wheel', skip, { passive: true });
    tl.eventCallback('onComplete', off);
  }
  // toucher un verre = le composer
  $$('.glass').forEach(g => g.addEventListener('click', () => {
    const chip = $(`.opts .chip[data-id="${g.dataset.drink}"]`);
    if (chip) chip.click();
    $('#composer').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  const dock = $('.dock');
  const dockCheck = () => dock.classList.toggle('on', $('.hero').getBoundingClientRect().bottom < innerHeight * .55);
  dockCheck(); addEventListener('scroll', dockCheck, { passive: true });

  /* =====================================================
     COMPOSE TA TASSE
     ===================================================== */
  const BASES = [
    { id: 'espresso', n: 'Espresso', p: 2.5, shot: 1 },
    { id: 'double', n: 'Double espresso', p: 3.5, shot: 1 },
    { id: 'latte', n: 'Flat white / Latte', p: 4, milk: 1, shot: 1 },
    { id: 'cappu', n: 'Cappuccino', p: 4, milk: 1, shot: 1 },
    { id: 'matcha', n: 'Matcha latte', p: 4.5, milk: 1 },
    { id: 'chai', n: 'Chai / Golden latte', p: 4.5, milk: 1 },
    { id: 'choco', n: 'Chocolat 65%', p: 4, milk: 1 },
    { id: 'iced', n: 'Latte glacé', p: 4, milk: 1, shot: 1 },
    { id: 'baby', n: 'Babyccino', p: 3, milk: 1 },
  ];
  const SIGS = [
    { id: 'pumpkin', n: 'Pumpkin chai latte', p: 5.5, milk: 1 },
    { id: 'pista', n: 'Pistachio latte', p: 5.5, milk: 1 },
    { id: 'pandan', n: 'Matcha pandan vanille', p: 6, milk: 1, novan: 1 },
  ];
  const MILKS = [{ id: 'vache', n: 'Vache', p: 0 }, { id: 'avoine', n: 'Avoine', p: 0 }, { id: 'coco', n: 'Coco', p: .5 }];
  const EXTRAS = [{ id: 'shot', n: 'Extra shot', p: .5 }, { id: 'vanille', n: 'Sirop vanille maison', p: .8 }];
  const st = { drink: BASES[2], milk: 'vache', shot: false, vanille: false };
  [...BASES, ...SIGS].forEach(o => { const i = new Image(); i.src = `assets/drinks/${o.id}.webp`; });

  const chip = (g, o, price) => `<button type="button" class="chip" data-g="${g}" data-id="${o.id}" aria-pressed="false">${o.n}${price ? `<small>${price}</small>` : ''}</button>`;
  $('[data-group=base]').innerHTML = BASES.map(o => chip('base', o, eur(o.p))).join('');
  $('[data-group=sig]').innerHTML = SIGS.map(o => chip('sig', o, eur(o.p))).join('');
  $('[data-group=milk]').innerHTML = MILKS.map(o => chip('milk', o, o.p ? '+' + eur(o.p) : 'offert')).join('');
  $('[data-group=extra]').innerHTML = EXTRAS.map(o => chip('extra', o, '+' + eur(o.p))).join('');

  const cup = $('.cup'); let shown = 'latte';
  function swapCup(id, name) {
    const cur = $('.cup-img', cup);
    cur.alt = name;
    if (id === shown) { hasG && !RM && gsap.fromTo(cur, { rotation: -4 }, { rotation: 0, duration: .5, ease: 'elastic.out(1,.4)' }); return; }
    shown = id;
    const nx = new Image(); nx.className = 'cup-img'; nx.src = `assets/drinks/${id}.webp`; nx.alt = name; nx.width = 330; nx.height = 420;
    cup.appendChild(nx);
    if (!hasG || RM) { cur.remove(); return; }
    gsap.to(cur, { x: -40, rotation: -14, opacity: 0, duration: .35, ease: 'power2.in', onComplete: () => cur.remove() });
    gsap.fromTo(nx, { x: 50, y: -20, rotation: 12, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: .6, delay: .12, ease: 'back.out(1.7)' });
  }
  function update() {
    const dk = st.drink;
    $('[data-needs=milk]').disabled = !dk.milk;
    $$('.chip').forEach(c => {
      const g = c.dataset.g, id = c.dataset.id;
      const on = (g === 'base' || g === 'sig') ? dk.id === id : g === 'milk' ? st.milk === id : st[id];
      c.setAttribute('aria-pressed', !!on);
      if (g === 'extra') c.disabled = (id === 'shot' && !dk.shot) || (id === 'vanille' && dk.novan);
    });
    const price = dk.p + (dk.milk && st.milk === 'coco' ? .5 : 0) + (st.shot && dk.shot ? .5 : 0) + (st.vanille && !dk.novan ? .8 : 0);
    const parts = [dk.n];
    if (dk.milk) parts.push('lait ' + st.milk);
    if (st.shot && dk.shot) parts.push('extra shot');
    if (st.vanille && !dk.novan) parts.push('sirop vanille');
    $('[data-name]').textContent = parts.join(' · ');
    swapCup(dk.id, dk.n);
    const pe = $('[data-price]');
    if (hasG && !RM) { const o = { v: parseFloat(pe.textContent.replace(',', '.')) || 0 }; gsap.to(o, { v: price, duration: .5, ease: 'power2.out', onUpdate: () => pe.textContent = eur(o.v) }); }
    else pe.textContent = eur(price);
  }
  $('.opts').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    const g = c.dataset.g, id = c.dataset.id;
    if (g === 'base') st.drink = BASES.find(o => o.id === id);
    if (g === 'sig') st.drink = SIGS.find(o => o.id === id);
    if (g === 'milk') st.milk = id;
    if (g === 'extra') st[id] = !st[id];
    update();
  });
  update();

  /* =====================================================
     LE MUR — souris : partout · tactile : par le scotch
     ===================================================== */
  const board = $('[data-board]');
  let zTop = 10;
  $$('.note', board).forEach(n => {
    const grip = d.createElement('span'); grip.className = 'grip'; grip.setAttribute('aria-hidden', 'true'); n.prepend(grip);
    let sx, sy, ox, oy, on = false;
    const start = e => {
      if (e.pointerType !== 'mouse' && !e.target.closest('.grip')) return;
      e.preventDefault();
      if (!n.dataset.px) { n.style.left = n.offsetLeft + 'px'; n.style.top = n.offsetTop + 'px'; n.style.right = 'auto'; n.dataset.px = 1; }
      on = true; sx = e.clientX; sy = e.clientY; ox = n.offsetLeft; oy = n.offsetTop;
      n.setPointerCapture(e.pointerId); n.classList.add('dragging'); n.style.zIndex = ++zTop;
      hasG && gsap.to(n, { rotation: 0, scale: 1.04, duration: .25 });
    };
    const move = e => {
      if (!on) return;
      const x = Math.max(-20, Math.min(board.clientWidth - n.offsetWidth + 20, ox + e.clientX - sx));
      const y = Math.max(-20, Math.min(board.clientHeight - n.offsetHeight + 20, oy + e.clientY - sy));
      n.style.left = x + 'px'; n.style.top = y + 'px';
    };
    const end = () => {
      if (!on) return; on = false; n.classList.remove('dragging');
      hasG && gsap.to(n, { rotation: (Math.random() * 10 - 5), scale: 1, duration: .5, ease: 'back.out(2)' });
    };
    n.addEventListener('pointerdown', start); n.addEventListener('pointermove', move);
    n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
    if (hasG) gsap.set(n, { rotation: parseFloat(getComputedStyle(n).getPropertyValue('--r')) || 0 });
  });

  /* =====================================================
     LE PUZZLE
     ===================================================== */
  const pzb = $('[data-puzzle]'), movesEl = $('[data-moves]'), win = $('[data-win]');
  let order = [], sel = null, moves = 0;
  const pos = i => `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`;
  function shuffle() {
    do { order = [...Array(9).keys()].sort(() => Math.random() - .5); } while (order.every((v, i) => v === i));
    moves = 0; movesEl.textContent = 0; win.hidden = true; pzb.classList.remove('solved'); drawPz();
  }
  function drawPz() {
    pzb.innerHTML = order.map((v, i) => `<button type="button" class="pz" data-slot="${i}" style="background-position:${pos(v)}" aria-label="Pièce ${i + 1}"></button>`).join('');
  }
  pzb.addEventListener('click', e => {
    const t = e.target.closest('.pz'); if (!t || pzb.classList.contains('solved')) return;
    const i = +t.dataset.slot;
    if (sel === null) { sel = i; t.classList.add('sel'); return; }
    if (sel === i) { t.classList.remove('sel'); sel = null; return; }
    [order[sel], order[i]] = [order[i], order[sel]];
    const a = pzb.children[sel], b = pzb.children[i];
    a.style.backgroundPosition = pos(order[sel]); b.style.backgroundPosition = pos(order[i]);
    a.classList.remove('sel'); sel = null; moves++; movesEl.textContent = moves;
    hasG && gsap.fromTo([a, b], { scale: .86 }, { scale: 1, duration: .45, ease: 'back.out(2.5)' });
    if (order.every((v, k) => v === k)) {
      pzb.classList.add('solved'); win.hidden = false;
      hasG && gsap.from(win, { y: 16, opacity: 0, duration: .6, ease: 'power3.out' });
    }
  });
  $('[data-shuffle]').addEventListener('click', shuffle);
  shuffle();

  /* footer : les lettres BABE montent une à une, au rythme du scroll */
  if (hasST && !RM) {
    const FL = $$('.foot-sign .L');
    const ftl = gsap.timeline({ scrollTrigger: { trigger: '.foot', start: 'top 95%', end: 'bottom bottom', scrub: .7 } });
    ftl.from(FL, { yPercent: 115, rotation: i => [-16, 12, -10, 18][i], scaleY: .6, ease: 'none', duration: 1, stagger: .22 })
       .from('.foot-bliss', { y: 30, opacity: 0, ease: 'none', duration: .6 }, 0);
  }

  /* =====================================================
     SCROLL
     ===================================================== */
  if (hasST && !RM) {
    gsap.to('.hc-counter', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    const rv = (sel, vars = {}, trig) => $$(sel).forEach((el, i) => gsap.from(el, { y: 34, opacity: 0, duration: .9, ease: 'power3.out', delay: vars.stagger ? i * vars.stagger : 0, scrollTrigger: { trigger: trig || el, start: 'top 88%' }, ...vars.extra }));
    gsap.from('.report-list > div', { x: -24, opacity: 0, duration: .6, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '.report-list', start: 'top 80%' } });
    gsap.from('.report h2', { yPercent: 40, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.report', start: 'top 80%' } });
    gsap.from('.bar-t', { yPercent: 30, opacity: 0, rotation: -3, duration: .9, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.bar', start: 'top 80%' } });
    gsap.from('.chip', { y: 12, opacity: 0, duration: .4, stagger: .02, ease: 'power2.out', scrollTrigger: { trigger: '.opts', start: 'top 85%' } });
    gsap.from('.sheet', { y: 80, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.carte', start: 'top 75%' } });
    gsap.from('.tape', { scaleX: 0, duration: .5, stagger: .1, delay: .5, ease: 'power2.out', scrollTrigger: { trigger: '.carte', start: 'top 75%' } });
    gsap.from('.pin', { y: -40, opacity: 0, rotation: 0, duration: .8, stagger: .15, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.sheet', start: 'bottom 95%' } });
    gsap.from('.note', { y: 60, opacity: 0, duration: .8, stagger: .12, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.board', start: 'top 80%' } });
    gsap.from('.pz', { scale: 0, duration: .5, stagger: { each: .05, from: 'random' }, ease: 'back.out(2)', scrollTrigger: { trigger: '.pz-board', start: 'top 85%' } });
    gsap.from('.surf', { xPercent: i => i ? 60 : -60, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.boards', start: 'top 82%' } });
    $$('.tides-list i').forEach((el, k) => gsap.fromTo(el, { '--p': 0 }, { '--p': 1, duration: .9, delay: k * .06, ease: 'power3.out', scrollTrigger: { trigger: '.tides', start: 'top 80%' } }));
    gsap.from('.m-pin', { scale: 0, transformOrigin: '50% 50%', duration: .7, ease: 'back.out(2.4)', scrollTrigger: { trigger: '.map', start: 'top 70%' } });
    const rt = $('mask .m-route'); if (rt) { const L = Math.ceil(rt.getTotalLength()); rt.style.strokeDasharray = L; gsap.fromTo(rt, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, delay: .3, ease: 'power2.inOut', scrollTrigger: { trigger: '.map', start: 'top 70%' } }); }
    gsap.from('.m-walk', { scale: 0, transformOrigin: '50% 50%', duration: .6, delay: 1.6, ease: 'back.out(2)', scrollTrigger: { trigger: '.map', start: 'top 70%' } });
  }
})();
