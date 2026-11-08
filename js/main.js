/* Entwurf Zahnarztpraxis Dr. Neuhaus – Leon Oßendorf */
(function () {
  var html = document.documentElement;

  /* Barrierefreiheit: Einstellungen merken (nur im Browser, kein Cookie) */
  var btn = document.querySelector('.a11y-btn'), panel = document.getElementById('a11y');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var offen = panel.classList.toggle('offen');
      btn.setAttribute('aria-expanded', offen);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('offen')) { panel.classList.remove('offen'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('offen') && !panel.contains(e.target) && !btn.contains(e.target)) { panel.classList.remove('offen'); btn.setAttribute('aria-expanded', 'false'); }
    });
    panel.querySelectorAll('[data-schalter]').forEach(function (b) {
      var k = b.getAttribute('data-schalter');
      var an = false; try { an = localStorage.getItem('nh-' + k) === '1'; } catch (e) {}
      if (an) { html.classList.add(k); b.setAttribute('aria-pressed', 'true'); }
      b.addEventListener('click', function () {
        var jetzt = html.classList.toggle(k);
        b.setAttribute('aria-pressed', jetzt);
        try { localStorage.setItem('nh-' + k, jetzt ? '1' : '0'); } catch (e) {}
      });
    });
    var vor = document.getElementById('vorlesen');
    if (vor) {
      if (!('speechSynthesis' in window)) { vor.hidden = true; }
      vor.addEventListener('click', function () {
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); vor.setAttribute('aria-pressed', 'false'); return; }
        var main = document.querySelector('main');
        var u = new SpeechSynthesisUtterance(main.innerText.replace(/\s+/g, ' '));
        u.lang = 'de-DE'; u.rate = 0.95;
        u.onend = function () { vor.setAttribute('aria-pressed', 'false'); };
        speechSynthesis.speak(u); vor.setAttribute('aria-pressed', 'true');
      });
    }
  }

  /* Status „heute“ aus den echten Sprechzeiten */
  var ZEITEN = { 1: [[510, 750], [840, 1080]], 2: [[510, 750], [840, 1080]], 3: [[510, 750]], 4: [[510, 750], [840, 1080]], 5: [[510, 840]] };
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function uhr(m) { var h = Math.floor(m / 60), mi = m % 60; return h + (mi ? '.' + String(mi).padStart(2, '0') : '') + ' Uhr'; }
  function jetztBerlin() {
    var t = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var w = { 'So': 0, 'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6 }, o = {};
    t.forEach(function (p) { o[p.type] = p.value; });
    return { tag: w[o.weekday.replace('.', '')], min: (+o.hour) * 60 + (+o.minute) };
  }
  var st = document.getElementById('status'), stt = document.getElementById('status-text');
  if (st && stt) {
    var n = jetztBerlin(), heute = ZEITEN[n.tag] || [], text = '', offen = false;
    for (var i = 0; i < heute.length; i++) {
      if (n.min >= heute[i][0] && n.min < heute[i][1]) { offen = true; text = 'Jetzt geöffnet bis ' + uhr(heute[i][1]); break; }
    }
    if (!offen) {
      for (var d = 0; d < 8; d++) {
        var tg = (n.tag + d) % 7, z = ZEITEN[tg] || [], gef = null;
        for (var j = 0; j < z.length; j++) { if (d > 0 || z[j][0] > n.min) { gef = z[j]; break; } }
        if (gef) { text = 'Gerade geschlossen. Wieder geöffnet ' + (d === 0 ? 'heute' : d === 1 ? 'morgen' : 'am ' + TAGE[tg]) + ' ab ' + uhr(gef[0]); break; }
      }
      stt.innerHTML = text + ' · <a href="#notdienst">Notdienst</a>';
    } else { stt.textContent = text; }
    st.classList.toggle('auf', offen);
    var row = document.querySelector('#zeiten tr[data-tag="' + n.tag + '"]');
    if (row) row.classList.add('heute');
  }

  /* Festzuschuss-Rechner */
  var WERTE = { '0': [60, 50], '5': [70, 60], '10': [75, 65] };
  function rechne() {
    var c = document.querySelector('input[name=bonus]:checked'); if (!c) return;
    var w = WERTE[c.value];
    document.getElementById('b-alt').style.width = w[0] + '%';
    document.getElementById('b-neu').style.width = w[1] + '%';
    document.getElementById('w-alt').textContent = w[0] + ' %';
    document.getElementById('w-neu').textContent = w[1] + ' %';
  }
  document.querySelectorAll('input[name=bonus]').forEach(function (r) { r.addEventListener('change', rechne); });
  if (document.getElementById('b-alt')) rechne();

  /* Einstiege wählen die passende Auswahl vor */
  document.querySelectorAll('[data-anliegen]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = document.querySelector('input[name=anliegen][value="' + a.getAttribute('data-anliegen') + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
    });
  });
  document.querySelectorAll('[data-stelle]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = document.querySelector('input[name=stelle][value="' + a.getAttribute('data-stelle') + '"]');
      if (r) r.checked = true;
    });
  });
  var schmerz = document.getElementById('info-schmerz');
  document.querySelectorAll('input[name=anliegen]').forEach(function (r) {
    r.addEventListener('change', function () { if (schmerz) schmerz.classList.toggle('zeigen', r.value === 'schmerzen' && r.checked); });
  });

  /* Formulare: nur Rückweg Pflicht, Entwurf verschickt nichts */
  function formular(id, tel, mail, fehler, danke) {
    var f = document.getElementById(id); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = document.getElementById(tel), m = document.getElementById(mail), fe = document.getElementById(fehler);
      if (!t.value.trim() && !m.value.trim()) {
        fe.hidden = false; t.setAttribute('aria-invalid', 'true'); m.setAttribute('aria-invalid', 'true'); t.focus(); return;
      }
      fe.hidden = true; f.hidden = true;
      var d = document.getElementById(danke); d.classList.add('zeigen'); d.focus();
    });
  }
  formular('form-termin', 't-tel', 't-mail', 't-fehler', 'danke-termin');
  formular('form-bewerbung', 'b-tel', 'b-mail', 'b-fehler', 'danke-bewerbung');

  /* Sanftes Einblenden */
  var els = document.querySelectorAll('.zeig');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('da'); }); }
})();
