/* E-Sport FIFA - bracket site logic. No build step, no dependencies. */
(function () {
  'use strict';

  var ROUNDS = [
    { key: 'r32', id: 'R32', label: 'Pusingan 32', short: 'P32', count: 16, next: 'Pusingan 16' },
    { key: 'r16', id: 'R16', label: 'Pusingan 16', short: 'P16', count: 8, next: 'Suku Akhir' },
    { key: 'qf', id: 'QF', label: 'Suku Akhir', short: 'SA', count: 4, next: 'Separuh Akhir' },
    { key: 'sf', id: 'SF', label: 'Separuh Akhir', short: 'SA', count: 2, next: 'Final' },
    { key: 'f', id: 'F', label: 'Final', short: 'F', count: 1, next: null }
  ];

  /* Mirrored layout: four columns each side, final in the centre. */
  var LAYOUT = [
    { r: 0, start: 0, end: 8, side: 'left' },
    { r: 1, start: 0, end: 4, side: 'left' },
    { r: 2, start: 0, end: 2, side: 'left' },
    { r: 3, start: 0, end: 1, side: 'left' },
    { r: 4, start: 0, end: 1, side: 'centre' },
    { r: 3, start: 1, end: 2, side: 'right' },
    { r: 2, start: 2, end: 4, side: 'right' },
    { r: 1, start: 4, end: 8, side: 'right' },
    { r: 0, start: 8, end: 16, side: 'right' }
  ];

  var BASE_W = 1740;
  var BASE_H = 840;
  var STORAGE_KEY = 'esportfifa.cyberjaya.draft.v2';
  var MOBILE_QUERY = window.matchMedia('(max-width: 1180px)');
  var EXPORT_HEADER = [
    '/*',
    '  E-SPORT FIFA - Peringkat Kalah Mati',
    '  Masjid Raja Haji Fi Sabilillah, Cyberjaya - 24 Oktober 2026',
    '',
    '  Ini satu-satunya fail data untuk laman. Edit melalui butang "Sunting"',
    '  di laman, kemudian klik "Eksport" dan gantikan fail ini.',
    '  Boleh juga edit terus di sini.',
    '',
    '  players: susunan pemain mengikut carta, 32 pemain (16 perlawanan pertama).',
    '  matches: keputusan setiap perlawanan. Pemenang mara secara automatik.',
    '  status: "scheduled" | "live" | "final"',
    '  winner: null (auto ikut skor) | "a" | "b" (paksa pemenang)',
    '  Tukar dateISO jika waktu mula sebenar berbeza.',
    '*/',
    ''
  ].join('\n');

  var state = {
    data: null,
    draft: false,
    edit: false,
    fit: true,
    zoom: 1,
    activeRound: null,
    editingId: null,
    editingBefore: null,
    toastTimer: null,
    countdownTimer: null,
    resizeTimer: null
  };

  var els = {};
  var countryByName = new Map();
  var knownCodes = new Set();

  var ALIASES = {
    'holland': 'nl', 'belanda': 'nl',
    'perancis': 'fr', 'france': 'fr',
    'jerman': 'de', 'germany': 'de',
    'sepanyol': 'es', 'spain': 'es',
    'itali': 'it', 'italy': 'it',
    'maghribi': 'ma', 'morocco': 'ma',
    'jepun': 'jp', 'japan': 'jp',
    'korea selatan': 'kr', 'south korea': 'kr', 'korea republik': 'kr', 'republic of korea': 'kr',
    'korea utara': 'kp', 'north korea': 'kp', 'dpr korea': 'kp',
    'amerika syarikat': 'us', 'usa': 'us', 'us': 'us', 'united states of america': 'us',
    'uk': 'gb', 'britain': 'gb', 'great britain': 'gb', 'united kingdom': 'gb',
    'england': 'gb-eng', 'scotland': 'gb-sct', 'wales': 'gb-wls',
    'northern ireland': 'gb-nir', 'ireland utara': 'gb-nir',
    'arab saudi': 'sa', 'saudi': 'sa',
    'mesir': 'eg', 'egypt': 'eg',
    'republik czech': 'cz', 'czech republic': 'cz',
    'turki': 'tr', 'turkey': 'tr', 'turkiye': 'tr',
    'ivory coast': 'ci', 'cote divoire': 'ci', "cote d'ivoire": 'ci',
    'cape verde': 'cv', 'cabo verde': 'cv',
    'dr congo': 'cd', 'drc': 'cd', 'democratic republic of the congo': 'cd',
    'republic of ireland': 'ie', 'eire': 'ie',
    'uae': 'ae', 'united arab emirates': 'ae',
    'macedonia': 'mk', 'north macedonia': 'mk',
    'bosnia': 'ba', 'bosnia and herzegovina': 'ba',
    'burma': 'mm', 'myanmar': 'mm',
    'swaziland': 'sz', 'eswatini': 'sz',
    'east timor': 'tl', 'timor-leste': 'tl',
    'cina': 'cn', 'china': 'cn',
    'thailand': 'th', 'siam': 'th',
    'indonesia': 'id',
    'filipina': 'ph', 'philippines': 'ph',
    'vietnam': 'vn',
    'india': 'in',
    'pakistan': 'pk',
    'bangladesh': 'bd',
    'sri lanka': 'lk',
    'australia': 'au',
    'new zealand': 'nz',
    'afrika selatan': 'za', 'south africa': 'za',
    'nigeria': 'ng', 'ghana': 'gh', 'senegal': 'sn', 'cameroon': 'cm',
    'brazil': 'br', 'brasil': 'br',
    'argentina': 'ar', 'uruguay': 'uy', 'paraguay': 'py', 'chile': 'cl',
    'colombia': 'co', 'peru': 'pe', 'ecuador': 'ec', 'mexico': 'mx', 'canada': 'ca',
    'croatia': 'hr', 'serbia': 'rs', 'switzerland': 'ch',
    'denmark': 'dk', 'norway': 'no', 'sweden': 'se', 'finland': 'fi',
    'poland': 'pl', 'portugal': 'pt', 'greece': 'gr',
    'russia': 'ru', 'ukraine': 'ua', 'belgium': 'be', 'austria': 'at',
    'iceland': 'is', 'ireland': 'ie', 'wales': 'gb-wls'
  };

  /* ---------------------------------------------------------------- utils */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function isScore(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0;
  }

  function allMatchIds() {
    var ids = [];
    ROUNDS.forEach(function (round, r) {
      for (var i = 0; i < round.count; i++) ids.push(matchId(r, i));
    });
    return ids;
  }

  function matchId(roundIndex, matchIndex) {
    return ROUNDS[roundIndex].id + '-' + (matchIndex + 1);
  }

  function parseId(id) {
    var parts = String(id).split('-');
    var r = -1;
    ROUNDS.forEach(function (round, index) {
      if (round.id === parts[0]) r = index;
    });
    return { r: r, i: Math.max(0, parseInt(parts[1], 10) - 1) };
  }

  function safeUrl(value) {
    try {
      var url = new URL(value, window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('ms-MY', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }

  /* --------------------------------------------------------------- flags */

  function buildCountryMaps() {
    var list = Array.isArray(window.COUNTRIES) ? window.COUNTRIES : [];
    list.forEach(function (country) {
      if (!country || !country.code || !country.name) return;
      knownCodes.add(country.code);
      countryByName.set(normalize(country.name), country.code);
    });
    Object.keys(ALIASES).forEach(function (alias) {
      countryByName.set(normalize(alias), ALIASES[alias]);
    });
  }

  function lookupCode(name) {
    if (!name) return '';
    var code = countryByName.get(normalize(name));
    return code || '';
  }

  function resolveCode(player) {
    if (!player) return '';
    if (player.code && knownCodes.has(player.code)) return player.code;
    return lookupCode(player.team);
  }

  function flagMarkup(player, extraClass) {
    var code = resolveCode(player);
    var cls = 'flag' + (extraClass ? ' ' + extraClass : '');
    if (code) {
      return '<span class="' + cls + '"><img src="assets/flags/' + esc(code) + '.svg" alt="" loading="lazy"></span>';
    }
    if (player && (player.team || player.name)) {
      var initial = String(player.team || player.name).trim().charAt(0).toUpperCase();
      return '<span class="' + cls + ' flag--text" aria-hidden="true">' + esc(initial || '?') + '</span>';
    }
    return '<span class="' + cls + ' flag--empty" aria-hidden="true"></span>';
  }

  function setFlagPreview(element, code, name) {
    if (!element) return;
    if (code && knownCodes.has(code)) {
      element.innerHTML = '<img src="assets/flags/' + esc(code) + '.svg" alt="">';
      element.classList.remove('is-empty');
    } else if (name) {
      element.textContent = String(name).trim().charAt(0).toUpperCase();
      element.classList.add('is-empty');
    } else {
      element.innerHTML = '<span class="flag-glyph" aria-hidden="true"></span>';
      element.classList.add('is-empty');
    }
  }

  /* ------------------------------------------------------------- bracket */

  function participant(id, slot) {
    var info = parseId(id);
    if (info.r < 0) return null;
    if (info.r === 0) {
      var player = state.data.players[info.i * 2 + slot];
      return player ? { player: player, from: null } : null;
    }
    var sourceId = matchId(info.r - 1, info.i * 2 + slot);
    var winner = getWinner(sourceId);
    if (!winner) return null;
    return participant(sourceId, winner === 'a' ? 0 : 1);
  }

  function getWinner(id) {
    var match = state.data.matches[id];
    if (!match) return null;
    if (match.status === 'live') return null;
    if (match.winner === 'a' || match.winner === 'b') return match.winner;
    var scoreA = match.score ? match.score[0] : null;
    var scoreB = match.score ? match.score[1] : null;
    if (!isScore(scoreA) || !isScore(scoreB)) return null;
    if (scoreA > scoreB) return 'a';
    if (scoreB > scoreA) return 'b';
    var pensA = match.pens ? match.pens[0] : null;
    var pensB = match.pens ? match.pens[1] : null;
    if (isScore(pensA) && isScore(pensB) && pensA !== pensB) {
      return pensA > pensB ? 'a' : 'b';
    }
    return null;
  }

  function winnerPlayer(id) {
    var winner = getWinner(id);
    if (!winner) return null;
    var slot = participant(id, winner === 'a' ? 0 : 1);
    return slot ? slot.player : null;
  }

  function displayStatus(match) {
    if (!match) return 'scheduled';
    if (match.status === 'live') return 'live';
    if (isScore(match.score && match.score[0]) && isScore(match.score && match.score[1])) return 'final';
    if (match.status === 'final') return 'final';
    return 'scheduled';
  }

  function statusLabel(status) {
    if (status === 'live') return 'Sedang';
    if (status === 'final') return 'Selesai';
    return 'Belum';
  }

  function hasResult(match) {
    if (!match) return false;
    return (match.score && (isScore(match.score[0]) || isScore(match.score[1]))) ||
      (match.pens && (isScore(match.pens[0]) || isScore(match.pens[1]))) ||
      match.status === 'final' || match.status === 'live' ||
      match.winner === 'a' || match.winner === 'b';
  }

  function signature(id) {
    var a = participant(id, 0);
    var b = participant(id, 1);
    return (a ? a.player.id : '-') + '|' + (b ? b.player.id : '-');
  }

  function snapshotSignatures() {
    var map = {};
    allMatchIds().forEach(function (id) { map[id] = signature(id); });
    return map;
  }

  function roundProgress(round) {
    var done = 0;
    for (var i = 0; i < round.count; i++) {
      if (getWinner(matchId(ROUNDS.indexOf(round), i))) done++;
    }
    return { done: done, total: round.count };
  }

  function defaultRound() {
    for (var i = 0; i < ROUNDS.length; i++) {
      if (roundProgress(ROUNDS[i]).done < ROUNDS[i].count) return ROUNDS[i].key;
    }
    return 'f';
  }

  function champion() {
    return winnerPlayer('F-1');
  }

  /* -------------------------------------------------------------- render */

  function rowMarkup(id, slot) {
    var match = state.data.matches[id];
    var p = participant(id, slot);
    var winner = getWinner(id);
    var isWinner = winner === (slot === 0 ? 'a' : 'b');
    var isLoser = !!winner && !isWinner;
    var score = match.score ? match.score[slot] : null;
    var pensDecided = isScore(match.score && match.score[0]) && isScore(match.score && match.score[1]) &&
      match.score[0] === match.score[1] && isScore(match.pens && match.pens[0]) && isScore(match.pens && match.pens[1]);
    var pensText = pensDecided ? 'P ' + match.pens[0] + '\u2013' + match.pens[1] : '';

    var classes = 'team-row';
    if (isWinner) classes += ' is-winner';
    if (isLoser) classes += ' is-loser';

    return '<div class="' + classes + '">' +
      flagMarkup(p) +
      '<span class="who">' +
        '<span class="player' + (p ? '' : ' is-tbd') + '">' + (p ? esc(p.player.name) : 'TBD') + '</span>' +
        (p && p.player.team ? '<span class="team">' + esc(p.player.team) + (pensText ? ' <span class="pens">' + pensText + '</span>' : '') + '</span>' : '') +
      '</span>' +
      '<span class="score' + (isScore(score) ? '' : ' score--empty') + '">' + (isScore(score) ? score : '\u2013') + '</span>' +
    '</div>';
  }

  function cardMarkup(id, options) {
    options = options || {};
    var match = state.data.matches[id];
    if (!match) return '';
    var status = displayStatus(match);
    var info = parseId(id);
    var label = ROUNDS[info.r] ? ROUNDS[info.r].label : '';
    var classes = ['match-card'];
    if (status === 'live') classes.push('is-live');
    if (options.wide) classes.push('match-card--wide');
    if (state.edit) classes.push('is-editable');
    var aria = state.edit
      ? ' tabindex="0" role="button" aria-label="Sunting ' + esc(label + ', perlawanan ' + (info.i + 1)) + '"'
      : '';
    return '<article class="' + classes.join(' ') + '" data-match-id="' + esc(id) + '"' + aria + '>' +
      rowMarkup(id, 0) +
      '<span class="lwn-chip" aria-hidden="true">LWN</span>' +
      rowMarkup(id, 1) +
    '</article>';
  }

  function finalColumnMarkup() {
    var p = champion();
    return '<div class="final-col">' +
      '<div class="final-art" aria-hidden="true">' +
        '<span class="final-art__label">Piala Kejohanan</span>' +
        '<img src="assets/img/trophy.svg" alt="" width="128" height="183">' +
      '</div>' +
      '<div class="final-card-wrap">' + cardMarkup('F-1', { wide: true }) + '</div>' +
      '<div class="final-plate' + (p ? ' is-champion' : '') + '">' +
        '<span class="final-plate__label">Juara</span>' +
        (p
          ? '<strong>' + esc(p.name) + '</strong>' + (p.team ? '<span class="final-plate__team">' + esc(p.team) + '</span>' : '')
          : '<span class="final-plate__empty">Belum ditentukan</span>') +
      '</div>' +
    '</div>';
  }

  function renderBracket() {
    var keepScroll = els.bracketScroll ? els.bracketScroll.scrollLeft : 0;
    els.bracketHead.innerHTML = LAYOUT.map(function (col) {
      var label = ROUNDS[col.r].label;
      return '<span class="round-label' + (col.side === 'centre' ? ' round-label--final' : '') + '">' + esc(label) + '</span>';
    }).join('');

    var html = LAYOUT.map(function (col) {
      if (col.side === 'centre') return finalColumnMarkup();
      var cards = '';
      for (var i = col.start; i < col.end; i++) {
        cards += cardMarkup(matchId(col.r, i), {});
      }
      return '<div class="round-col round-col--' + col.side + '" data-round="' + ROUNDS[col.r].key + '">' + cards + '</div>';
    }).join('');

    els.bracketGrid.innerHTML = html;
    if (els.bracketScroll) els.bracketScroll.scrollLeft = keepScroll;
  }

  function renderMobile() {
    if (!state.activeRound) state.activeRound = defaultRound();
    els.mobileTabs.innerHTML = ROUNDS.map(function (round) {
      var progress = roundProgress(round);
      var active = state.activeRound === round.key;
      return '<button type="button" class="round-tab' + (active ? ' is-active' : '') + '" role="tab" aria-selected="' + active + '" data-round="' + round.key + '">' +
        '<span class="round-tab__name">' + esc(round.label) + '</span>' +
        '<span class="round-tab__count">' + progress.done + '/' + progress.total + '</span>' +
      '</button>';
    }).join('');

    var idx = 0;
    ROUNDS.forEach(function (round, index) { if (round.key === state.activeRound) idx = index; });
    var round = ROUNDS[idx];
    var p = champion();
    var html = '<div class="mboard-head">' +
      '<h2>' + esc(round.label) + '</h2>' +
      '<p>' + esc(round.next ? 'Pemenang mara ke ' + round.next + '.' : 'Perlawanan penentuan juara.') + '</p>' +
    '</div>';

    if (round.key === 'f' && p) {
      html += '<div class="mchampion"><img src="assets/img/trophy.svg" alt="" width="48" height="69">' +
        '<div><span>Juara</span><strong>' + esc(p.name) + '</strong>' + (p.team ? '<em>' + esc(p.team) + '</em>' : '') + '</div></div>';
    }

    for (var i = 0; i < round.count; i++) {
      var id = matchId(idx, i);
      var match = state.data.matches[id];
      var status = displayStatus(match);
      var winner = winnerPlayer(id);
      html += '<div class="mmatch' + (state.edit ? ' is-editable' : '') + '" data-match-id="' + esc(id) + '"' +
        (state.edit ? ' tabindex="0" role="button" aria-label="Sunting ' + esc(round.label + ', perlawanan ' + (i + 1)) + '"' : '') + '>' +
        '<div class="mmatch__head">' +
          '<span class="mmatch__no">Perlawanan ' + (i + 1) + '</span>' +
          '<span class="status status--' + status + '"><i></i>' + statusLabel(status) + '</span>' +
        '</div>' +
        cardMarkup(id, { wide: true }) +
        '<div class="mmatch__foot">' +
          '<span class="mmatch__winner">' + (winner ? '<span class="mmatch__winner-label">Mara</span> ' + esc(winner.name) : '<span class="muted">Belum ada keputusan</span>') + '</span>' +
          (state.edit ? '<span class="mmatch__edit">Sunting</span>' : '') +
        '</div>' +
      '</div>';
    }

    els.mobileBoard.innerHTML = html;
  }

  function renderHeader() {
    var ev = state.data.event;
    var parts = String(ev.title || 'E-Sport FIFA').trim().split(/\s+/);
    var last = parts.length > 1 ? parts.pop() : '';
    els.eventTitle.innerHTML = esc(parts.join(' ')).toUpperCase() + (last ? ' <em>' + esc(last).toUpperCase() + '</em>' : '');

    var weekday = 'Sabtu';
    try {
      weekday = new Intl.DateTimeFormat('ms-MY', { weekday: 'long', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(ev.dateISO));
    } catch (error) { /* keep fallback */ }
    els.weekdayText.textContent = weekday.toUpperCase();
    els.shortDate.textContent = ev.shortDate || '';
    els.stageText.textContent = ev.stage || '';
    els.venueText.textContent = ev.venue || '';
    els.footerDate.textContent = ev.venue ? 'Cyberjaya · ' + (ev.dateLabel || '') : (ev.dateLabel || '');
    els.footerOrganiser.textContent = ev.organiser || 'Masjid Raja Haji Fi Sabilillah';
    els.tournamentStats.textContent = state.data.players.length + ' pemain · ' + allMatchIds().length + ' perlawanan';

    if (Array.isArray(ev.logos) && ev.logos.length) {
      els.brandline.innerHTML = ev.logos.map(function (logo) {
        var src = String(logo.src || '').trim();
        if (!src || /^javascript:/i.test(src)) return '';
        return '<span class="brandline__item brandline__item--logo"><img src="' + esc(src) + '" alt="' + esc(logo.name || '') + '"></span>';
      }).join('');
      $$('#brandline img').forEach(function (img) {
        img.addEventListener('error', function () {
          var name = img.getAttribute('alt') || '';
          var span = document.createElement('span');
          span.className = 'brandline__item';
          span.textContent = name;
          img.parentNode.replaceWith(span);
        });
      });
    } else {
      var items = Array.isArray(ev.brandline) ? ev.brandline : [];
      els.brandline.innerHTML = items.map(function (name, index) {
        return '<span class="brandline__item' + (index === 0 ? ' is-lead' : '') + '">' + esc(name) + '</span>';
      }).join('');
    }
  }

  function renderSocials() {
    var socials = state.data.event.socials || [];
    var icons = {
      instagram: 'icon-instagram',
      tiktok: 'icon-tiktok',
      youtube: 'icon-youtube',
      facebook: 'icon-facebook'
    };
    els.footerSocials.innerHTML = socials.map(function (social) {
      var url = safeUrl(social.url || '');
      var icon = icons[social.platform] || 'icon-link';
      var inner = '<svg class="icon" aria-hidden="true"><use href="#' + icon + '"></use></svg><span>' + esc(social.label || social.platform || '') + '</span>';
      if (url) {
        return '<a class="social social--' + esc(social.platform || 'link') + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
      }
      return '<span class="social social--' + esc(social.platform || 'link') + '">' + inner + '</span>';
    }).join('');
  }

  function renderFooter() {
    var updated = formatDate(state.data.updatedAt);
    els.updatedAt.textContent = updated ? 'Dikemas kini ' + updated : '';
    updateDraftBadge();
    renderSocials();
  }

  function updateDraftBadge() {
    if (!els.draftBadge) return;
    els.draftBadge.hidden = !state.draft;
  }

  function updateEditStatus() {
    if (!els.editStatus) return;
    if (state.draft) {
      els.editStatus.textContent = 'Draf tempatan · perubahan disimpan pada peranti ini';
    } else {
      els.editStatus.textContent = 'Mod suntingan · klik mana-mana kad untuk sunting';
    }
  }

  function renderLive() {
    var liveId = null;
    allMatchIds().some(function (id) {
      if (state.data.matches[id] && state.data.matches[id].status === 'live') {
        liveId = id;
        return true;
      }
      return false;
    });

    if (!liveId) {
      els.liveStrip.hidden = true;
      if (els.sbLive) els.sbLive.innerHTML = '<span class="sb-live__idle">Menanti perlawanan</span>';
      return;
    }

    var info = parseId(liveId);
    var round = ROUNDS[info.r];
    var a = participant(liveId, 0);
    var b = participant(liveId, 1);
    var match = state.data.matches[liveId];
    var sa = isScore(match.score && match.score[0]) ? match.score[0] : '\u2013';
    var sb = isScore(match.score && match.score[1]) ? match.score[1] : '\u2013';
    var nameA = a ? a.player.name : 'TBD';
    var nameB = b ? b.player.name : 'TBD';

    els.liveStrip.hidden = false;
    els.liveStrip.innerHTML = '<span class="live-pill"><i></i>LIVE</span>' +
      '<span class="live-strip__score">' + esc(nameA) + ' <b>' + sa + '</b><span class="live-strip__dash">:</span><b>' + sb + '</b> ' + esc(nameB) + '</span>' +
      '<span class="live-strip__round">' + esc(round.label) + ' · Perlawanan ' + (info.i + 1) + '</span>';

    if (els.sbLive) {
      els.sbLive.innerHTML = '<span class="live-pill"><i></i>LIVE</span><span class="sb-live__score">' + esc(nameA) + ' <b>' + sa + ' : ' + sb + '</b> ' + esc(nameB) + '</span>';
    }
  }

  function renderAll() {
    renderHeader();
    renderLive();
    renderBracket();
    renderMobile();
    renderFooter();
    updateEditStatus();
    applyFit();
    window.requestAnimationFrame(drawConnectors);
  }

  /* ----------------------------------------------------------- connectors */

  function cardRect(card, bodyRect, scale) {
    var rect = card.getBoundingClientRect();
    return {
      left: (rect.left - bodyRect.left) / scale,
      right: (rect.right - bodyRect.left) / scale,
      top: (rect.top - bodyRect.top) / scale,
      bottom: (rect.bottom - bodyRect.top) / scale,
      cx: ((rect.left + rect.right) / 2 - bodyRect.left) / scale,
      cy: ((rect.top + rect.bottom) / 2 - bodyRect.top) / scale
    };
  }

  function drawConnectors() {
    var svg = els.connectors;
    var body = els.bracketBody;
    if (!svg || !body || !els.bracketGrid) return;
    var scoreboard = document.body.classList.contains('is-scoreboard');
    if (!body.offsetWidth || !body.offsetHeight || (MOBILE_QUERY.matches && !scoreboard)) {
      svg.innerHTML = '';
      return;
    }

    var bodyRect = body.getBoundingClientRect();
    var scale = bodyRect.width / body.offsetWidth;
    if (!scale || !isFinite(scale)) scale = 1;

    var cardMap = new Map();
    $$('.match-card[data-match-id]', els.bracketGrid).forEach(function (card) {
      cardMap.set(card.getAttribute('data-match-id'), card);
    });

    var width = body.offsetWidth;
    var height = body.offsetHeight;
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    var frag = document.createDocumentFragment();

    for (var r = 1; r < ROUNDS.length; r++) {
      var destCount = ROUNDS[r].count;
      for (var destIndex = 0; destIndex < destCount; destIndex++) {
        var destId = matchId(r, destIndex);
        var destCard = cardMap.get(destId);
        if (!destCard) continue;
        var destRect = cardRect(destCard, bodyRect, scale);

        for (var slot = 0; slot < 2; slot++) {
          var sourceId = matchId(r - 1, destIndex * 2 + slot);
          var sourceCard = cardMap.get(sourceId);
          if (!sourceCard) continue;
          var sourceRect = cardRect(sourceCard, bodyRect, scale);
          var side = destCount === 1 ? (slot === 0 ? 'left' : 'right') : (destIndex < destCount / 2 ? 'left' : 'right');
          var sx = side === 'left' ? sourceRect.right : sourceRect.left;
          var dx = side === 'left' ? destRect.left : destRect.right;
          var midX = (sx + dx) / 2;
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sourceRect.cy.toFixed(1) +
            'H' + midX.toFixed(1) + 'V' + destRect.cy.toFixed(1) +
            'H' + dx.toFixed(1));
          path.setAttribute('class', 'connector' + (getWinner(sourceId) ? ' is-active' : ''));
          frag.appendChild(path);
        }
      }
    }

    svg.innerHTML = '';
    svg.appendChild(frag);
  }

  /* ---------------------------------------------------------------- fit */

  function applyFit() {
    if (!els.bracket) return;
    var scoreboard = document.body.classList.contains('is-scoreboard');
    var scale = 1;

    if (scoreboard) {
      var availW = window.innerWidth - 32;
      var barH = els.scoreboardBar ? els.scoreboardBar.offsetHeight : 60;
      var availH = window.innerHeight - barH - 28;
      scale = Math.min(availW / BASE_W, availH / (BASE_H + 50), 1.35);
    } else if (!MOBILE_QUERY.matches && state.fit) {
      var scrollPad = 48;
      var avail = els.bracketScroll.clientWidth - scrollPad;
      scale = Math.min(1, avail / BASE_W);
    }

    if (!isFinite(scale) || scale <= 0) scale = 1;
    scale = Math.max(0.4, scale);
    state.zoom = scale;
    els.bracket.style.zoom = scale;
    els.bracket.dataset.scale = String(scale);
    updateFitButton();
    window.requestAnimationFrame(function () {
      drawConnectors();
      updateOverflowHint();
    });
  }

  function updateFitButton() {
    if (!els.fitBtn) return;
    els.fitBtn.setAttribute('aria-pressed', String(state.fit));
    els.fitBtn.classList.toggle('is-active', state.fit);
  }

  function updateOverflowHint() {
    if (!els.bracketShell || !els.bracketScroll) return;
    var overflow = !document.body.classList.contains('is-scoreboard') &&
      !MOBILE_QUERY.matches &&
      els.bracketScroll.scrollWidth > els.bracketScroll.clientWidth + 4;
    els.bracketShell.classList.toggle('is-overflowing', overflow);
  }

  /* ------------------------------------------------------------ countdown */

  function startCountdown() {
    if (state.countdownTimer) window.clearInterval(state.countdownTimer);
    updateCountdown();
    state.countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    if (!els.countdownWrap || !state.data) return;
    var target = new Date(state.data.event.dateISO).getTime();
    if (isNaN(target)) {
      els.countdownWrap.innerHTML = '';
      return;
    }
    var diff = target - Date.now();

    if (diff > 0) {
      var total = Math.floor(diff / 1000);
      var days = Math.floor(total / 86400);
      var hours = Math.floor((total % 86400) / 3600);
      var minutes = Math.floor((total % 3600) / 60);
      var seconds = total % 60;
      els.countdownWrap.innerHTML =
        '<span class="countdown__label">Menjelang</span>' +
        '<span class="countdown__box"><b>' + String(days).padStart(2, '0') + '</b><small>Hari</small></span>' +
        '<span class="countdown__box"><b>' + String(hours).padStart(2, '0') + '</b><small>Jam</small></span>' +
        '<span class="countdown__box"><b>' + String(minutes).padStart(2, '0') + '</b><small>Minit</small></span>' +
        '<span class="countdown__box"><b>' + String(seconds).padStart(2, '0') + '</b><small>Detik</small></span>';
    } else if (Date.now() < target + 24 * 60 * 60 * 1000) {
      els.countdownWrap.innerHTML = '<span class="countdown__today"><i></i>Hari ini</span>';
    } else {
      els.countdownWrap.innerHTML = '<span class="countdown__done">Kejohanan tamat</span>';
    }
  }

  /* ---------------------------------------------------------------- edit */

  function setEditMode(on) {
    state.edit = !!on;
    document.body.classList.toggle('is-editing', state.edit);
    els.bracket.classList.toggle('is-editing', state.edit);
    els.editBar.hidden = !state.edit;
    els.editBtn.setAttribute('aria-pressed', String(state.edit));
    els.editBtn.classList.toggle('is-active', state.edit);
    els.footerEditBtn.setAttribute('aria-pressed', String(state.edit));
    $$('.js-edit-label').forEach(function (el) { el.textContent = state.edit ? 'Selesai' : 'Sunting'; });
    updateEditStatus();
    renderBracket();
    renderMobile();
    applyFit();
    if (state.edit && !MOBILE_QUERY.matches) {
      window.requestAnimationFrame(function () {
        els.bracketShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function toggleEdit() {
    setEditMode(!state.edit);
  }

  function readDraft() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function saveDraft() {
    state.data.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      state.draft = true;
    } catch (error) {
      toast('Tidak dapat menyimpan draf pada peranti ini.');
    }
    updateEditStatus();
    updateDraftBadge();
    els.updatedAt.textContent = 'Dikemas kini ' + formatDate(state.data.updatedAt);
  }

  function discardDraft() {
    if (!state.draft) {
      toast('Tiada draf untuk dibuang.');
      return;
    }
    if (!window.confirm('Buang semua perubahan draf pada peranti ini? Perubahan yang belum dieksport akan hilang.')) return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
    window.location.reload();
  }

  function exportData() {
    saveDraft();
    var text = EXPORT_HEADER + 'window.TOURNAMENT = ' + JSON.stringify(state.data, null, 2) + ';\n';
    var blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'tournament.js';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast('Fail dimuat turun. Gantikan data/tournament.js dalam repo, kemudian commit dan push.');
  }

  function importData(file) {
    if (!file) return;
    file.text().then(function (text) {
      var source = String(text || '').trim();
      var object = null;
      try {
        var cleaned = source
          .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
          .replace(/^\s*window\.TOURNAMENT\s*=\s*/, '')
          .replace(/;\s*$/, '');
        object = JSON.parse(cleaned);
      } catch (error) {
        try { object = JSON.parse(source); } catch (error2) { object = null; }
      }
      if (!object) {
        toast('Fail tidak sah. Gunakan fail tournament.js yang dieksport dari laman ini.');
        return;
      }
      var normalized = normalizeData(object);
      if (!normalized) {
        toast('Struktur data tidak sah. Pastikan 32 pemain dan 31 perlawanan lengkap.');
        return;
      }
      normalized.updatedAt = new Date().toISOString();
      state.data = normalized;
      state.draft = false;
      saveDraft();
      state.activeRound = defaultRound();
      renderAll();
      toast('Data berjaya diimport ke draf tempatan.');
    }).catch(function () {
      toast('Fail tidak dapat dibaca.');
    });
  }

  function normalizeData(input) {
    if (!input || typeof input !== 'object') return null;
    var source;
    try { source = JSON.parse(JSON.stringify(input)); } catch (error) { return null; }
    var fallback = window.TOURNAMENT || {};
    var fallbackEvent = fallback.event || {};
    var event = source.event && typeof source.event === 'object' ? source.event : {};
    if (!Array.isArray(source.players) || source.players.length !== 32) return null;
    if (!source.matches || typeof source.matches !== 'object') return null;

    var ids = {};
    var players = source.players.map(function (player, index) {
      var p = player && typeof player === 'object' ? player : {};
      var id = String(p.id || 'p' + String(index + 1).padStart(2, '0'));
      if (ids[id]) return null;
      ids[id] = true;
      return {
        id: id,
        name: String(p.name || '').trim() || 'Pemain ' + (index + 1),
        team: String(p.team || '').trim(),
        code: String(p.code || '').trim().toLowerCase()
      };
    });
    if (players.some(function (p) { return !p; })) return null;

    var matches = {};
    allMatchIds().forEach(function (id) {
      var m = source.matches[id] && typeof source.matches[id] === 'object' ? source.matches[id] : {};
      var score = Array.isArray(m.score) ? m.score : [null, null];
      var pens = Array.isArray(m.pens) ? m.pens : [null, null];
      var status = ['scheduled', 'live', 'final'].indexOf(m.status) >= 0 ? m.status : 'scheduled';
      var winner = m.winner === 'a' || m.winner === 'b' ? m.winner : null;
      matches[id] = {
        score: [isScore(score[0]) ? Math.floor(score[0]) : null, isScore(score[1]) ? Math.floor(score[1]) : null],
        pens: [isScore(pens[0]) ? Math.floor(pens[0]) : null, isScore(pens[1]) ? Math.floor(pens[1]) : null],
        status: status,
        winner: winner
      };
    });

    var mergedEvent = {
      title: String(event.title || fallbackEvent.title || 'E-Sport FIFA'),
      stage: String(event.stage || fallbackEvent.stage || 'Peringkat Kalah Mati'),
      dateISO: String(event.dateISO || fallbackEvent.dateISO || '2026-10-24T00:00:00+08:00'),
      dateLabel: String(event.dateLabel || fallbackEvent.dateLabel || 'Sabtu, 24 Oktober 2026'),
      shortDate: String(event.shortDate || fallbackEvent.shortDate || '24 OKT 26'),
      venue: String(event.venue || fallbackEvent.venue || 'Masjid Raja Haji Fi Sabilillah, Cyberjaya'),
      organiser: String(event.organiser || fallbackEvent.organiser || 'Masjid Raja Haji Fi Sabilillah'),
      brandline: Array.isArray(event.brandline) ? event.brandline.map(String) : (fallbackEvent.brandline || []),
      logos: Array.isArray(event.logos) ? event.logos : (fallbackEvent.logos || []),
      socials: Array.isArray(event.socials) ? event.socials : (fallbackEvent.socials || [])
    };

    return {
      schema: 1,
      updatedAt: String(source.updatedAt || new Date().toISOString()),
      event: mergedEvent,
      players: players,
      matches: matches
    };
  }

  function loadInitialData() {
    var committed = window.TOURNAMENT;
    if (!committed) {
      els.bracketGrid.innerHTML = '<div class="fatal">Data kejohanan tidak ditemui. Pastikan data/tournament.js dimuatkan.</div>';
      return false;
    }
    var base = normalizeData(committed);
    if (!base) {
      els.bracketGrid.innerHTML = '<div class="fatal">Struktur data tidak sah. Semak data/tournament.js.</div>';
      return false;
    }
    var draft = readDraft();
    if (draft) {
      var normalizedDraft = normalizeData(draft);
      var draftTime = normalizedDraft ? Date.parse(normalizedDraft.updatedAt) : NaN;
      var baseTime = Date.parse(base.updatedAt);
      if (normalizedDraft && draftTime > baseTime) {
        state.data = normalizedDraft;
        state.draft = true;
        return true;
      }
    }
    state.data = base;
    state.draft = false;
    return true;
  }

  /* --------------------------------------------------------------- dialog */

  function openMatchDialog(id) {
    if (!state.edit) return;
    var match = state.data.matches[id];
    if (!match) return;
    var info = parseId(id);
    var round = ROUNDS[info.r];
    var a = participant(id, 0);
    var b = participant(id, 1);

    state.editingId = id;
    state.editingBefore = snapshotSignatures();

    els.dialogRound.textContent = round.label;
    els.dialogTitle.textContent = 'Perlawanan ' + (info.i + 1);
    els.dialogNote.hidden = info.r === 0;
    els.dialogNote.textContent = 'Peserta mara dari pusingan sebelumnya. Perubahan nama dikongsi sepanjang kejohanan.';

    fillEditSide('a', a ? a.player : null, match.score ? match.score[0] : null, match.pens ? match.pens[0] : null);
    fillEditSide('b', b ? b.player : null, match.score ? match.score[1] : null, match.pens ? match.pens[1] : null);

    refreshWinnerOptions();
    els.winnerSelect.value = (match.winner === 'a' && a) || (match.winner === 'b' && b) ? match.winner : '';

    var display = displayStatus(match);
    $$('input[name="matchStatus"]').forEach(function (radio) {
      radio.checked = radio.value === display;
    });

    els.dialogError.hidden = true;
    els.dialogError.textContent = '';

    if (typeof els.dialog.showModal === 'function') {
      if (!els.dialog.open) els.dialog.showModal();
    } else {
      els.dialog.setAttribute('open', '');
    }
    window.setTimeout(function () {
      var target = !els.scoreA.disabled ? els.scoreA : els.nameA;
      if (target && !target.disabled) target.focus();
    }, 60);
  }

  function fillEditSide(side, player, score, pens) {
    var name = side === 'a' ? els.nameA : els.nameB;
    var team = side === 'a' ? els.teamA : els.teamB;
    var scoreInput = side === 'a' ? els.scoreA : els.scoreB;
    var pensInput = side === 'a' ? els.pensA : els.pensB;
    var flag = side === 'a' ? els.flagA : els.flagB;
    var note = side === 'a' ? els.noteA : els.noteB;

    name.value = player ? player.name : '';
    team.value = player ? player.team : '';
    scoreInput.value = isScore(score) ? score : '';
    pensInput.value = isScore(pens) ? pens : '';
    name.disabled = team.disabled = scoreInput.disabled = pensInput.disabled = !player;
    name.placeholder = team.placeholder = player ? '' : 'Menunggu keputusan';
    if (note) note.hidden = !!player;
    setFlagPreview(flag, player ? resolveCode(player) : '', player ? player.team : '');
    if (player) {
      updateTeamPreview(side);
    }
  }

  function updateTeamPreview(side) {
    var team = side === 'a' ? els.teamA : els.teamB;
    var flag = side === 'a' ? els.flagA : els.flagB;
    var code = lookupCode(team.value);
    setFlagPreview(flag, code, team.value.trim());
  }

  function refreshWinnerOptions() {
    var value = els.winnerSelect.value;
    var options = '<option value="">Auto ikut skor</option>';
    if (!els.nameA.disabled) {
      options += '<option value="a">' + esc(els.nameA.value.trim() || 'Pemain A') + '</option>';
    }
    if (!els.nameB.disabled) {
      options += '<option value="b">' + esc(els.nameB.value.trim() || 'Pemain B') + '</option>';
    }
    els.winnerSelect.innerHTML = options;
    if (value === 'a' || value === 'b') els.winnerSelect.value = value;
  }

  function readNumber(input) {
    var value = String(input.value || '').trim();
    if (value === '') return null;
    var number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > 99) return NaN;
    return number;
  }

  function showDialogError(message, field) {
    els.dialogError.textContent = message;
    els.dialogError.hidden = false;
    if (field) field.focus();
  }

  function saveMatch(event) {
    if (event) event.preventDefault();
    var id = state.editingId;
    if (!id) return;
    var info = parseId(id);
    var match = state.data.matches[id];
    var a = participant(id, 0);
    var b = participant(id, 1);

    var scoreA = readNumber(els.scoreA);
    var scoreB = readNumber(els.scoreB);
    var pensA = readNumber(els.pensA);
    var pensB = readNumber(els.pensB);

    if (isNaN(scoreA) || isNaN(scoreB)) {
      showDialogError('Skor mesti nombor bulat antara 0 dan 99.', els.scoreA);
      return;
    }
    if (isNaN(pensA) || isNaN(pensB)) {
      showDialogError('Skor penalti mesti nombor bulat antara 0 dan 99.', els.pensA);
      return;
    }
    if (pensA !== null && pensB === null || pensA === null && pensB !== null) {
      showDialogError('Masukkan kedua-dua skor penalti, atau kosongkan kedua-duanya.', els.pensA);
      return;
    }

    var status = 'scheduled';
    $$('input[name="matchStatus"]').forEach(function (radio) {
      if (radio.checked) status = radio.value;
    });
    if (status === 'scheduled' && scoreA !== null && scoreB !== null) status = 'final';

    var winner = els.winnerSelect.value === 'a' || els.winnerSelect.value === 'b' ? els.winnerSelect.value : null;
    if (status === 'final') {
      if (scoreA === null || scoreB === null) {
        showDialogError('Masukkan skor kedua-dua pemain untuk menandakan perlawanan selesai.', els.scoreA);
        return;
      }
      if (scoreA === scoreB) {
        var pensValid = pensA !== null && pensB !== null && pensA !== pensB;
        if (!pensValid && !winner) {
          showDialogError('Skor seri. Masukkan skor penalti atau pilih pemenang.', els.pensA);
          return;
        }
      }
    }
    if (pensA !== null && pensB !== null && pensA === pensB) {
      showDialogError('Skor penalti tidak boleh seri.', els.pensA);
      return;
    }
    if (winner === 'a' && !a || winner === 'b' && !b) {
      winner = null;
    }

    var nameA = els.nameA.disabled ? '' : els.nameA.value.trim();
    var nameB = els.nameB.disabled ? '' : els.nameB.value.trim();
    if (a && !nameA) {
      showDialogError('Nama pemain tidak boleh kosong.', els.nameA);
      return;
    }
    if (b && !nameB) {
      showDialogError('Nama pemain tidak boleh kosong.', els.nameB);
      return;
    }

    if (a) {
      a.player.name = nameA;
      a.player.team = els.teamA.value.trim();
      a.player.code = lookupCode(a.player.team);
    }
    if (b) {
      b.player.name = nameB;
      b.player.team = els.teamB.value.trim();
      b.player.code = lookupCode(b.player.team);
    }

    match.score = [scoreA, scoreB];
    match.pens = [pensA, pensB];
    match.status = status;
    match.winner = winner;

    var cleared = clearInvalidated(info.r, state.editingBefore);

    saveDraft();
    closeDialog();
    state.activeRound = state.activeRound || defaultRound();
    renderAll();
    toast(cleared > 0
      ? 'Keputusan disimpan. ' + cleared + ' keputusan pusingan seterusnya dikosongkan kerana peserta berubah.'
      : 'Keputusan disimpan dalam draf tempatan.');
  }

  function clearInvalidated(editedRound, before) {
    var cleared = 0;
    for (var r = editedRound + 1; r < ROUNDS.length; r++) {
      for (var i = 0; i < ROUNDS[r].count; i++) {
        var id = matchId(r, i);
        if (before[id] !== signature(id)) {
          var match = state.data.matches[id];
          if (match && hasResult(match)) {
            match.score = [null, null];
            match.pens = [null, null];
            match.status = 'scheduled';
            match.winner = null;
            cleared++;
          }
        }
      }
    }
    return cleared;
  }

  function closeDialog() {
    if (els.dialog.open) els.dialog.close();
    else els.dialog.removeAttribute('open');
    state.editingId = null;
    state.editingBefore = null;
  }

  function clearDialogScores() {
    els.scoreA.value = '';
    els.scoreB.value = '';
    els.pensA.value = '';
    els.pensB.value = '';
    els.winnerSelect.value = '';
    $$('input[name="matchStatus"]').forEach(function (radio) {
      radio.checked = radio.value === 'scheduled';
    });
    els.dialogError.hidden = true;
  }

  /* ---------------------------------------------------------------- toast */

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, 4200);
  }

  /* ------------------------------------------------------------ scoreboard */

  function enterScoreboard() {
    document.body.classList.add('is-scoreboard');
    applyFit();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () { /* pseudo fullscreen */ });
    }
    window.setTimeout(function () { applyFit(); drawConnectors(); }, 250);
  }

  function exitScoreboard() {
    document.body.classList.remove('is-scoreboard');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () { /* ignore */ });
    }
    applyFit();
    window.setTimeout(drawConnectors, 120);
  }

  function toggleScoreboard() {
    if (document.body.classList.contains('is-scoreboard')) exitScoreboard();
    else enterScoreboard();
  }

  /* --------------------------------------------------------------- wiring */

  function cacheElements() {
    [
      'brandline', 'eventTitle', 'weekdayText', 'shortDate', 'stageText', 'venueText',
      'countdownWrap', 'liveStrip', 'footerDate', 'footerOrganiser', 'tournamentStats',
      'bracket', 'bracketShell', 'bracketScroll', 'bracketHead', 'bracketBody', 'bracketGrid', 'connectors',
      'fitBtn', 'fullBtn', 'editBtn', 'footerEditBtn', 'editBar', 'editStatus', 'exportBtn', 'importBtn',
      'importFile', 'discardBtn', 'doneBtn', 'draftBadge', 'updatedAt', 'footerSocials',
      'mobileTabs', 'mobileBoard', 'toast', 'teamOptions',
      'matchDialog', 'matchForm', 'dialogRound', 'dialogTitle', 'dialogNote', 'dialogClose', 'dialogCancel',
      'dialogClear', 'dialogError', 'nameA', 'teamA', 'scoreA', 'pensA', 'flagA', 'noteA',
      'nameB', 'teamB', 'scoreB', 'pensB', 'flagB', 'noteB', 'winnerSelect',
      'scoreboardBar', 'sbLive', 'exitScoreboard', 'scrollHint'
    ].forEach(function (id) { els[id] = document.getElementById(id); });
    els.dialog = els.matchDialog;
  }

  function buildTeamOptions() {
    if (!els.teamOptions || !Array.isArray(window.COUNTRIES)) return;
    els.teamOptions.innerHTML = window.COUNTRIES.map(function (country) {
      return '<option value="' + esc(country.name) + '"></option>';
    }).join('');
  }

  function wireEvents() {
    els.fitBtn.addEventListener('click', function () {
      state.fit = !state.fit;
      applyFit();
    });

    els.fullBtn.addEventListener('click', toggleScoreboard);
    if (els.exitScoreboard) els.exitScoreboard.addEventListener('click', exitScoreboard);
    els.editBtn.addEventListener('click', toggleEdit);
    els.footerEditBtn.addEventListener('click', toggleEdit);
    els.doneBtn.addEventListener('click', function () { setEditMode(false); });
    els.exportBtn.addEventListener('click', exportData);
    els.discardBtn.addEventListener('click', discardDraft);
    els.importBtn.addEventListener('click', function () { els.importFile.click(); });
    els.importFile.addEventListener('change', function () {
      var file = els.importFile.files && els.importFile.files[0];
      importData(file);
      els.importFile.value = '';
    });

    els.bracketGrid.addEventListener('click', function (event) {
      if (!state.edit) return;
      var card = event.target.closest('.match-card');
      if (card) openMatchDialog(card.getAttribute('data-match-id'));
    });
    els.bracketGrid.addEventListener('keydown', function (event) {
      if (!state.edit) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var card = event.target.closest('.match-card');
      if (!card) return;
      event.preventDefault();
      openMatchDialog(card.getAttribute('data-match-id'));
    });

    els.mobileTabs.addEventListener('click', function (event) {
      var tab = event.target.closest('[data-round]');
      if (!tab) return;
      state.activeRound = tab.getAttribute('data-round');
      renderMobile();
      var active = els.mobileTabs.querySelector('.round-tab.is-active');
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    els.mobileBoard.addEventListener('click', function (event) {
      if (!state.edit) return;
      var card = event.target.closest('.mmatch');
      if (card) openMatchDialog(card.getAttribute('data-match-id'));
    });
    els.mobileBoard.addEventListener('keydown', function (event) {
      if (!state.edit) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var card = event.target.closest('.mmatch');
      if (!card) return;
      event.preventDefault();
      openMatchDialog(card.getAttribute('data-match-id'));
    });

    [['a', els.teamA], ['b', els.teamB]].forEach(function (pair) {
      pair[1].addEventListener('input', function () { updateTeamPreview(pair[0]); });
    });

    els.nameA.addEventListener('input', refreshWinnerOptions);
    els.nameB.addEventListener('input', refreshWinnerOptions);

    els.matchForm.addEventListener('submit', saveMatch);
    els.dialogClose.addEventListener('click', closeDialog);
    els.dialogCancel.addEventListener('click', closeDialog);
    els.dialogClear.addEventListener('click', clearDialogScores);
    els.dialog.addEventListener('click', function (event) {
      if (event.target === els.dialog) closeDialog();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && els.dialog.open) {
        closeDialog();
        return;
      }
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable) return;
      if (event.key === 'e' || event.key === 'E') {
        if (!event.metaKey && !event.ctrlKey && !event.altKey && !els.dialog.open) {
          event.preventDefault();
          toggleEdit();
        }
      }
    });

    window.addEventListener('resize', function () {
      if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(function () {
        applyFit();
        drawConnectors();
      }, 150);
    });

    if (MOBILE_QUERY.addEventListener) {
      MOBILE_QUERY.addEventListener('change', function () { applyFit(); });
    }

    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && document.body.classList.contains('is-scoreboard')) {
        document.body.classList.remove('is-scoreboard');
        applyFit();
      }
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { drawConnectors(); });
    }
  }

  function init() {
    try {
      cacheElements();
      buildCountryMaps();
      buildTeamOptions();
      if (!loadInitialData()) {
        document.documentElement.classList.add('is-ready');
        return;
      }
      state.activeRound = defaultRound();

      var params = new URLSearchParams(window.location.search);
      var editFromUrl = params.get('edit') === '1' || window.location.hash === '#edit';

      renderAll();
      startCountdown();
      wireEvents();

      if (editFromUrl) {
        setEditMode(true);
        var matchParam = params.get('match');
        if (matchParam && state.data.matches[matchParam]) openMatchDialog(matchParam);
      }

      document.documentElement.classList.add('is-ready');
      window.setTimeout(applyFit, 300);
    } catch (error) {
      /* Never leave the page invisible because one widget failed. */
      document.documentElement.classList.add('is-ready');
      if (window.console && window.console.error) window.console.error(error);
      if (els.bracketGrid) {
        els.bracketGrid.innerHTML = '<div class="fatal">Ralat memaparkan carta. Muat semula halaman atau semak konsol pelayar.</div>';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
