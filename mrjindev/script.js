/* mrjindev — bet-win widget: card/avatar leaderboard */
(function () {
    'use strict';

    /* ── Guard double-init ──────────────────────────────────────────────── */
    if (window.__mjBetWinInit) return;
    window.__mjBetWinInit = true;

    /* ── Thresholds ─────────────────────────────────────────────────────── */
    var TIER = {
        mega: { payout: 10000, mult: 100 },
        big:  { payout: 1000,  mult: 50  }
    };

    /* ── Optional thumbnail map: { "Game Name": "https://..." } ─────────── */
    var GAME_THUMBNAILS = {};

    /* ── Avatar palette (deterministic by name hash) ────────────────────── */
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
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    /* ── Parse number from cell (strips currency objects, symbols) ───────── */
    function parseNum(cell) {
        var clone = cell.cloneNode(true);
        clone.querySelectorAll('object, img, svg').forEach(function (el) { el.remove(); });
        return parseFloat(clone.textContent.replace(/[^0-9.]/g, '')) || 0;
    }

    function parseMult(cell) {
        return parseFloat(cell.textContent.replace(/[^0-9.]/g, '')) || 0;
    }

    /* ── Tier ───────────────────────────────────────────────────────────── */
    function getTier(payout, mult) {
        if (payout >= TIER.mega.payout || mult >= TIER.mega.mult) return 'mega';
        if (payout >= TIER.big.payout  || mult >= TIER.big.mult)  return 'big';
        return 'normal';
    }

    /* ── Count-up on payout cell ────────────────────────────────────────── */
    function countUp(cell, target, duration) {
        /* preserve the currency <object> node */
        var currencyNode = cell.querySelector('object') || cell.querySelector('img.currency');
        var startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var val = Math.floor(p * target);
            cell.textContent = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (currencyNode) cell.prepend(currencyNode.cloneNode(true));
            if (p < 1) requestAnimationFrame(step);
            else {
                cell.textContent = target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (currencyNode) cell.prepend(currencyNode.cloneNode(true));
            }
        }
        requestAnimationFrame(step);
    }

    /* ── Build avatar element ────────────────────────────────────────────── */
    function makeAvatar(gameName) {
        var el = document.createElement('span');
        el.className = 'mj-avatar';
        var thumb = GAME_THUMBNAILS[gameName];
        if (thumb) {
            var img = document.createElement('img');
            img.src = thumb;
            img.alt = gameName;
            el.appendChild(img);
        } else {
            el.textContent = initials(gameName);
            el.style.background = hashColor(gameName);
        }
        return el;
    }

    /* ── Process a single row ────────────────────────────────────────────── */
    function processRow(row, isNew) {
        if (!row.classList.contains('sl-table-row')) return;
        var cells = row.querySelectorAll('.sl-table-cell');
        if (cells.length < 6) return; /* skip empty spacer rows */
        if (row.dataset.mjDone) return;
        row.dataset.mjDone = '1';

        var gameCell   = cells[0];
        var idCell     = cells[1];
        var dateCell   = cells[2];
        var multCell   = cells[4];
        var payoutCell = cells[5];

        /* ── Avatar + game info block ── */
        if (!gameCell.querySelector('.mj-avatar')) {
            var gameName = gameCell.textContent.trim();

            var avatar = makeAvatar(gameName);

            var info = document.createElement('span');
            info.className = 'mj-game-info';

            var nameEl = document.createElement('span');
            nameEl.className = 'mj-game-name';
            nameEl.textContent = gameName;

            var sub = document.createElement('span');
            sub.className = 'mj-game-sub';
            sub.textContent = [idCell.textContent.trim(), dateCell.textContent.trim()].filter(Boolean).join(' · ');

            info.appendChild(nameEl);
            info.appendChild(sub);

            /* Clear game cell and rebuild */
            gameCell.innerHTML = '';
            gameCell.appendChild(avatar);
            gameCell.appendChild(info);
        }

        /* ── Multiplier badge ── */
        if (!multCell.querySelector('.mj-mult-badge')) {
            var rawMult = multCell.textContent.trim();
            multCell.innerHTML = '';
            var badge = document.createElement('span');
            badge.className = 'mj-mult-badge';
            badge.textContent = rawMult.startsWith('x') ? rawMult : rawMult + 'x';
            multCell.appendChild(badge);
        }

        /* ── Tier ── */
        var payout = parseNum(payoutCell);
        var mult   = parseMult(multCell);
        var tier   = getTier(payout, mult);
        row.setAttribute('data-tier', tier);

        /* ── Mega crown icon ── */
        if (tier === 'mega' && !row.querySelector('.mj-mega-icon')) {
            var crown = document.createElement('span');
            crown.className = 'mj-mega-icon';
            crown.textContent = '👑';
            crown.style.cssText = 'position:absolute;top:8px;right:8px;font-size:14px;';
            row.appendChild(crown);
        }

        /* ── New-row effects ── */
        if (isNew) {
            row.classList.add('mj-new-row');
            setTimeout(function () { row.classList.remove('mj-new-row'); }, 500);
            if (payout > 0) countUp(payoutCell, payout, 400);
        }
    }

    /* ── Process all existing rows ───────────────────────────────────────── */
    function processAll(widget) {
        widget.querySelectorAll('tr.sl-table-row').forEach(function (r) { processRow(r, false); });
    }

    /* ── MutationObserver ────────────────────────────────────────────────── */
    var debounce;
    function observe(widget) {
        var body = widget.querySelector('.sl-table-body') || widget;
        var obs = new MutationObserver(function (mutations) {
            clearTimeout(debounce);
            debounce = setTimeout(function () {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (node) {
                        if (node.nodeType !== 1) return;
                        if (node.classList && node.classList.contains('sl-table-row')) {
                            processRow(node, true);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('tr.sl-table-row').forEach(function (r) { processRow(r, true); });
                        }
                    });
                });
                /* React may replace whole tbody — re-scan for unprocessed rows */
                processAll(widget);
            }, 60);
        });
        obs.observe(body, { childList: true, subtree: true });
    }

    /* ── Init ────────────────────────────────────────────────────────────── */
    function init() {
        var widget = document.querySelector('section[data-mj="widget-bet-win"]');
        if (!widget) return;
        processAll(widget);
        observe(widget);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
