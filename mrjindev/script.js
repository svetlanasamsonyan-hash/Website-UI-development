/* mrjindev — bet-win widget v4: payout headline, bet×mult subtext */
(function () {
    'use strict';

    if (window.__mjBetWinInit) return;
    window.__mjBetWinInit = true;

    /* ── Thresholds ─────────────────────────────────────────────────────── */
    var TIER = {
        mega: { payout: 10000, mult: 100 },
        big:  { payout: 1000,  mult: 50  }
    };

    var GAME_THUMBNAILS = {};
    var seenIds = new Set();
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Avatar helpers ─────────────────────────────────────────────────── */
    var AVATAR_COLORS = [
        '#1a6b3c','#0d5c8a','#7a2d8c','#8a3a0d','#1a5c6b',
        '#6b1a3c','#3a6b1a','#4a2d8c','#8c6b0d','#1a3c6b'
    ];
    function hashColor(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
    }
    function initials(name) {
        var parts = name.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
    }
    function makeAvatar(gameName) {
        var el = document.createElement('span');
        el.className = 'mj-avatar';
        var thumb = GAME_THUMBNAILS[gameName];
        if (thumb) {
            var img = document.createElement('img');
            img.src = thumb; img.alt = gameName;
            el.appendChild(img);
        } else {
            el.textContent = initials(gameName);
            el.style.background = hashColor(gameName);
        }
        return el;
    }

    /* ── Number helpers ─────────────────────────────────────────────────── */
    var fmtNum = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function parseNum(cell) {
        var clone = cell.cloneNode(true);
        clone.querySelectorAll('object,img.currency,svg,.mj-payout-amount,.mj-bet-sub').forEach(function (n) { n.remove(); });
        return parseFloat(clone.textContent.replace(/[^0-9.]/g, '')) || 0;
    }
    function parseMult(cell) {
        var clone = cell.cloneNode(true);
        clone.querySelectorAll('.mj-mult-badge').forEach(function (n) { n.remove(); });
        return parseFloat(clone.textContent.replace(/[^0-9.]/g, '')) || 0;
    }
    function getTier(payout, mult) {
        if (payout >= TIER.mega.payout || mult >= TIER.mega.mult) return 'mega';
        if (payout >= TIER.big.payout  || mult >= TIER.big.mult)  return 'big';
        return 'normal';
    }

    /* ── Count-up on payout headline ────────────────────────────────────── */
    function countUp(el, target, duration) {
        var startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            el.textContent = fmtNum.format(p * target);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = fmtNum.format(target);
        }
        requestAnimationFrame(step);
    }

    /* ── Build payout cell content ──────────────────────────────────────── */
    function buildPayoutCell(payoutCell, betCell, multCell, isNew) {
        /* grab currency icon from payout cell */
        var currencyNode = payoutCell.querySelector('object') || payoutCell.querySelector('img.currency');
        var savedCur = currencyNode ? currencyNode.cloneNode(true) : null;

        var payoutVal = parseNum(payoutCell);
        var betVal    = parseNum(betCell);
        var multVal   = parseMult(multCell);

        /* headline: currency icon + amount */
        var amountEl = document.createElement('span');
        amountEl.className = 'mj-payout-amount';
        if (savedCur) amountEl.appendChild(savedCur);
        var numSpan = document.createElement('span');
        numSpan.textContent = fmtNum.format(payoutVal);
        amountEl.appendChild(numSpan);

        /* subtext: bet × mult */
        var subEl = document.createElement('span');
        subEl.className = 'mj-bet-sub';
        subEl.textContent = fmtNum.format(betVal) + ' × x' + multVal.toFixed(2);

        payoutCell.innerHTML = '';
        payoutCell.appendChild(amountEl);
        payoutCell.appendChild(subEl);

        if (isNew && payoutVal > 0) countUp(numSpan, payoutVal, 400);

        return { payoutVal: payoutVal, multVal: multVal };
    }

    /* ── Process one row ────────────────────────────────────────────────── */
    function processRow(row, isNew) {
        if (!row.classList.contains('sl-table-row')) return;
        var cells = row.querySelectorAll('.sl-table-cell');
        if (cells.length < 6) return;

        var gameCell   = cells[0];
        var idCell     = cells[1];
        var betCell    = cells[3];
        var multCell   = cells[4];
        var payoutCell = cells[5];

        var rowId = idCell.textContent.trim();
        if (row.dataset.mjDone) return;
        row.dataset.mjDone = '1';

        /* ── Avatar + game name ── */
        if (!gameCell.querySelector('.mj-avatar')) {
            var gameName = gameCell.textContent.trim();
            var avatar   = makeAvatar(gameName);
            var nameEl   = document.createElement('span');
            nameEl.className = 'mj-game-name';
            nameEl.textContent = gameName;
            gameCell.innerHTML = '';
            gameCell.appendChild(avatar);
            gameCell.appendChild(nameEl);
        }

        /* ── Payout headline + bet×mult subtext ── */
        var isUnseen = !seenIds.has(rowId);
        seenIds.add(rowId);

        var vals = buildPayoutCell(payoutCell, betCell, multCell, isNew && isUnseen && !reducedMotion);

        /* ── Tier ── */
        var tier = getTier(vals.payoutVal, vals.multVal);
        row.setAttribute('data-tier', tier);

        if (tier === 'mega' && !row.querySelector('.mj-mega-icon')) {
            var crown = document.createElement('span');
            crown.className = 'mj-mega-icon';
            crown.textContent = '👑';
            crown.style.cssText = 'position:absolute;top:6px;right:8px;font-size:13px;pointer-events:none;z-index:2;';
            row.appendChild(crown);
        }
    }

    /* ── FLIP ───────────────────────────────────────────────────────────── */
    function flip(container) {
        if (reducedMotion) return;
        var cards = Array.from(container.querySelectorAll('tr.sl-table-row'));
        var tops  = cards.map(function (c) { return c.getBoundingClientRect().top; });
        requestAnimationFrame(function () {
            cards.forEach(function (card, i) {
                var delta = tops[i] - card.getBoundingClientRect().top;
                if (Math.abs(delta) < 1) return;
                card.style.transition = 'none';
                card.style.transform  = 'translateY(' + delta + 'px)';
                requestAnimationFrame(function () {
                    card.style.transition = 'transform 0.4s cubic-bezier(0.22,0.61,0.36,1)';
                    card.style.transform  = '';
                });
            });
        });
    }

    /* ── Staggered slide-in ─────────────────────────────────────────────── */
    var staggerQueue = [], staggerTimer = null;
    function animateIn(row) {
        row.style.opacity = '0';
        row.style.transform = 'translateY(-10px) scale(0.98)';
        row.style.transition = 'none';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                row.style.transition = 'opacity 0.4s cubic-bezier(0.22,0.61,0.36,1), transform 0.4s cubic-bezier(0.22,0.61,0.36,1)';
                row.style.opacity = '1';
                row.style.transform = '';
                row.classList.add('mj-flash');
                setTimeout(function () { row.classList.remove('mj-flash'); }, 50);
            });
        });
    }
    function drainStagger() {
        staggerQueue.splice(0, 5).forEach(function (r, i) { setTimeout(function () { animateIn(r); }, i * 60); });
        staggerTimer = staggerQueue.length ? setTimeout(drainStagger, 360) : null;
    }

    /* ── processAll ─────────────────────────────────────────────────────── */
    function processAll(widget) {
        widget.querySelectorAll('tr.sl-table-row').forEach(function (r) {
            var idCell = r.querySelectorAll('.sl-table-cell')[1];
            if (idCell) seenIds.add(idCell.textContent.trim());
            processRow(r, false);
        });
    }

    /* ── Observer ───────────────────────────────────────────────────────── */
    var debounce;
    function observe(widget) {
        var body = widget.querySelector('.sl-table-body') || widget;
        new MutationObserver(function (mutations) {
            clearTimeout(debounce);
            debounce = setTimeout(function () {
                var newRows = [];
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (node) {
                        if (node.nodeType !== 1) return;
                        var rows = node.classList && node.classList.contains('sl-table-row')
                            ? [node]
                            : Array.from(node.querySelectorAll ? node.querySelectorAll('tr.sl-table-row') : []);
                        rows.forEach(function (r) {
                            var idTxt = (r.querySelectorAll('.sl-table-cell')[1] || {}).textContent || '';
                            if (!seenIds.has(idTxt.trim())) newRows.push(r);
                            processRow(r, true);
                        });
                    });
                });
                processAll(widget);
                if (newRows.length && !reducedMotion) {
                    flip(body);
                    newRows.forEach(function (r) { staggerQueue.push(r); });
                    if (!staggerTimer) staggerTimer = setTimeout(drainStagger, 0);
                }
            }, 60);
        }).observe(body, { childList: true, subtree: true });
    }

    /* ── Init ───────────────────────────────────────────────────────────── */
    function init() {
        var widget = document.querySelector('section[data-mj="widget-bet-win"]');
        if (!widget) return;
        processAll(widget);
        observe(widget);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
