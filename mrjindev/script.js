/* mrjindev — bet-win widget v2: aligned numbers + smooth FLIP insertion */
(function () {
    'use strict';

    if (window.__mjBetWinInit) return;
    window.__mjBetWinInit = true;

    /* ── Thresholds ─────────────────────────────────────────────────────── */
    var TIER = {
        mega: { payout: 10000, mult: 100 },
        big:  { payout: 1000,  mult: 50  }
    };

    /* ── Optional thumbnail map ─────────────────────────────────────────── */
    var GAME_THUMBNAILS = {};

    /* ── Seen IDs — track rows that already existed (suppress re-animation) */
    var seenIds = new Set();

    /* ── Reduced-motion check ───────────────────────────────────────────── */
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Avatar palette ─────────────────────────────────────────────────── */
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

    /* ── Number formatting ──────────────────────────────────────────────── */
    var fmtPayout = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function parseNum(cell) {
        var clone = cell.cloneNode(true);
        clone.querySelectorAll('object, img.currency, svg').forEach(function (el) { el.remove(); });
        return parseFloat(clone.textContent.replace(/[^0-9.]/g, '')) || 0;
    }

    function parseMult(cell) {
        return parseFloat(cell.textContent.replace(/[^0-9.]/g, '')) || 0;
    }

    function formatMult(val) {
        return 'x' + val.toFixed(2);
    }

    /* ── Tier ───────────────────────────────────────────────────────────── */
    function getTier(payout, mult) {
        if (payout >= TIER.mega.payout || mult >= TIER.mega.mult) return 'mega';
        if (payout >= TIER.big.payout  || mult >= TIER.big.mult)  return 'big';
        return 'normal';
    }

    /* ── Count-up ───────────────────────────────────────────────────────── */
    function countUp(cell, target, duration) {
        var currencyNode = cell.querySelector('object') || cell.querySelector('img.currency');
        var startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var val = p * target;
            var txt = fmtPayout.format(val);
            cell.textContent = txt;
            if (currencyNode) cell.prepend(currencyNode.cloneNode(true));
            if (p < 1) requestAnimationFrame(step);
            else {
                cell.textContent = fmtPayout.format(target);
                if (currencyNode) cell.prepend(currencyNode.cloneNode(true));
            }
        }
        requestAnimationFrame(step);
    }

    /* ── Avatar ─────────────────────────────────────────────────────────── */
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

    /* ── Wrap mult + payout cells in .mj-right grid container ───────────── */
    function ensureRightCluster(row) {
        if (row.querySelector('.mj-right')) return;
        var cells = row.querySelectorAll('.sl-table-cell');
        if (cells.length < 6) return;
        var multCell   = cells[4];
        var payoutCell = cells[5];
        var wrap = document.createElement('div');
        wrap.className = 'mj-right';
        row.insertBefore(wrap, multCell);
        wrap.appendChild(multCell);
        wrap.appendChild(payoutCell);
    }

    /* ── Process one row ────────────────────────────────────────────────── */
    function processRow(row, isNew) {
        if (!row.classList.contains('sl-table-row')) return;
        var cells = row.querySelectorAll('.sl-table-cell');
        if (cells.length < 6) return;

        var gameCell   = cells[0];
        var idCell     = cells[1];
        var dateCell   = cells[2];
        var multCell   = cells[4];
        var payoutCell = cells[5];

        var rowId = idCell.textContent.trim();

        /* Already fully processed? */
        if (row.dataset.mjDone) return;
        row.dataset.mjDone = '1';

        /* ── Avatar + game info ── */
        if (!gameCell.querySelector('.mj-avatar')) {
            var gameName = gameCell.textContent.trim();
            var avatar   = makeAvatar(gameName);
            var info     = document.createElement('span');
            info.className = 'mj-game-info';
            var nameEl = document.createElement('span');
            nameEl.className = 'mj-game-name';
            nameEl.textContent = gameName;
            var sub = document.createElement('span');
            sub.className = 'mj-game-sub';
            sub.textContent = [rowId, dateCell.textContent.trim()].filter(Boolean).join(' · ');
            info.appendChild(nameEl);
            info.appendChild(sub);
            gameCell.innerHTML = '';
            gameCell.appendChild(avatar);
            gameCell.appendChild(info);
        }

        /* ── Multiplier badge with normalized 2dp ── */
        if (!multCell.querySelector('.mj-mult-badge')) {
            var rawMult = parseMult(multCell);
            multCell.innerHTML = '';
            var badge = document.createElement('span');
            badge.className = 'mj-mult-badge';
            badge.textContent = formatMult(rawMult);
            multCell.appendChild(badge);
        }

        /* ── Normalize payout to 2dp, keep currency icon ── */
        var payoutVal = parseNum(payoutCell);
        var currencyNode = payoutCell.querySelector('object') || payoutCell.querySelector('img.currency');
        if (currencyNode) {
            var saved = currencyNode.cloneNode(true);
            payoutCell.textContent = fmtPayout.format(payoutVal);
            payoutCell.prepend(saved);
        } else {
            payoutCell.textContent = fmtPayout.format(payoutVal);
        }

        /* ── Right cluster grid ── */
        ensureRightCluster(row);

        /* ── Tier ── */
        var multVal = parseMult(multCell);
        var tier    = getTier(payoutVal, multVal);
        row.setAttribute('data-tier', tier);

        if (tier === 'mega' && !row.querySelector('.mj-mega-icon')) {
            var crown = document.createElement('span');
            crown.className = 'mj-mega-icon';
            crown.textContent = '👑';
            crown.style.cssText = 'position:absolute;top:8px;right:8px;font-size:14px;pointer-events:none;';
            row.appendChild(crown);
        }

        /* ── Animation for new rows ── */
        var isUnseen = !seenIds.has(rowId);
        seenIds.add(rowId);

        if (isNew && isUnseen && !reducedMotion) {
            /* count-up on payout */
            countUp(payoutCell, payoutVal, 400);
        }
    }

    /* ── FLIP animation for new-row insertion ───────────────────────────── */
    var staggerQueue = [];
    var staggerTimer = null;
    var MAX_CONCURRENT = 5;

    function drainStagger() {
        var batch = staggerQueue.splice(0, MAX_CONCURRENT);
        batch.forEach(function (row, i) {
            setTimeout(function () { animateIn(row); }, i * 60);
        });
        if (staggerQueue.length) staggerTimer = setTimeout(drainStagger, batch.length * 60 + 60);
        else staggerTimer = null;
    }

    function animateIn(row) {
        if (reducedMotion) return;
        /* start state */
        row.style.opacity = '0';
        row.style.transform = 'translateY(-10px) scale(0.98)';
        row.style.transition = 'none';

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                row.style.transition = 'opacity 0.4s cubic-bezier(0.22,0.61,0.36,1), transform 0.4s cubic-bezier(0.22,0.61,0.36,1)';
                row.style.opacity = '1';
                row.style.transform = '';

                /* green flash */
                row.classList.add('mj-flash');
                setTimeout(function () { row.classList.remove('mj-flash'); }, 50);
            });
        });
    }

    /* ── FLIP: record positions of existing cards, apply inverse, transition to 0 */
    function flipExisting(container) {
        if (reducedMotion) return;
        var cards = Array.from(container.querySelectorAll('tr.sl-table-row[data-mj-done]'));
        /* READ phase */
        var tops = cards.map(function (c) { return c.getBoundingClientRect().top; });
        /* WRITE phase — after browser has inserted new node */
        requestAnimationFrame(function () {
            cards.forEach(function (card, i) {
                var newTop = card.getBoundingClientRect().top;
                var delta  = tops[i] - newTop;
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

    /* ── Process all existing rows ──────────────────────────────────────── */
    function processAll(widget) {
        widget.querySelectorAll('tr.sl-table-row').forEach(function (r) {
            var idCell = r.querySelectorAll('.sl-table-cell')[1];
            if (idCell) seenIds.add(idCell.textContent.trim());
            processRow(r, false);
        });
    }

    /* ── MutationObserver ───────────────────────────────────────────────── */
    var debounce;
    function observe(widget) {
        var body = widget.querySelector('.sl-table-body') || widget;
        var obs  = new MutationObserver(function (mutations) {
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
                            var idCell = r.querySelectorAll('.sl-table-cell')[1];
                            var rowId  = idCell ? idCell.textContent.trim() : '';
                            var unseen = !seenIds.has(rowId);
                            processRow(r, true);
                            if (unseen) newRows.push(r);
                        });
                    });
                });
                /* Re-scan for React full-replacement renders */
                processAll(widget);
                if (newRows.length) {
                    flipExisting(body);
                    newRows.forEach(function (r) { staggerQueue.push(r); });
                    if (!staggerTimer) staggerTimer = setTimeout(drainStagger, 0);
                }
            }, 60);
        });
        obs.observe(body, { childList: true, subtree: true });
    }

    /* ── Init ───────────────────────────────────────────────────────────── */
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
