/* mrjindev — bet-win widget enhancement */
(function () {
    'use strict';

    /* ── Thresholds (easy to tune) ─────────────────────────────────────── */
    var TIER = {
        big:  { payout: 1000,  mult: 50  },
        mega: { payout: 10000, mult: 100 }
    };

    /* ── Guard against double-init ──────────────────────────────────────── */
    if (window.__bwWidgetInit) return;
    window.__bwWidgetInit = true;

    /* ── Helpers ────────────────────────────────────────────────────────── */
    function parseNum(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
    }

    function getTier(payout, mult) {
        if (payout >= TIER.mega.payout || mult >= TIER.mega.mult) return 'mega';
        if (payout >= TIER.big.payout  || mult >= TIER.big.mult)  return 'big';
        return 'normal';
    }

    /* ── Multiplier badge ───────────────────────────────────────────────── */
    function styleMultCell(cell) {
        if (cell.querySelector('.bw-mult-badge')) return;
        var raw = cell.textContent.trim();
        cell.textContent = '';
        var badge = document.createElement('span');
        badge.className = 'bw-mult-badge';
        badge.textContent = raw;
        cell.appendChild(badge);
    }

    /* ── Count-up animation ─────────────────────────────────────────────── */
    function countUp(cell, target, duration) {
        var start = 0;
        var startTime = null;
        var prefix = cell.textContent.replace(/[\d.,]+/, '').trim();
        function step(ts) {
            if (!startTime) startTime = ts;
            var progress = Math.min((ts - startTime) / duration, 1);
            var val = Math.floor(progress * target);
            cell.textContent = prefix + ' ' + val.toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
            else cell.textContent = prefix + ' ' + target.toLocaleString();
        }
        requestAnimationFrame(step);
    }

    /* ── Process a single row ───────────────────────────────────────────── */
    function processRow(row, isNew) {
        if (!row.classList.contains('sl-table-row')) return;
        if (row.dataset.bwProcessed) return;
        row.dataset.bwProcessed = '1';

        var cells = row.querySelectorAll('.sl-table-cell');
        if (cells.length < 6) return;

        var multCell   = cells[4]; /* col 5 — MULTIPLIER */
        var payoutCell = cells[5]; /* col 6 — PAYOUT     */

        var multVal   = parseNum(multCell.textContent);
        var payoutVal = parseNum(payoutCell.textContent);

        var tier = getTier(payoutVal, multVal);
        row.setAttribute('data-tier', tier);

        styleMultCell(multCell);

        if (tier === 'mega') {
            if (!row.querySelector('.bw-mega-icon')) {
                var icon = document.createElement('span');
                icon.className = 'bw-mega-icon';
                icon.textContent = '👑';
                payoutCell.appendChild(icon);
            }
        }

        if (isNew) {
            row.classList.add('bw-new-row');
            setTimeout(function () { row.classList.remove('bw-new-row'); }, 600);
            if (payoutVal > 0) countUp(payoutCell, payoutVal, 400);
        }
    }

    /* ── Process all existing rows ──────────────────────────────────────── */
    function processAll(widget) {
        var rows = widget.querySelectorAll('tr.sl-table-row');
        rows.forEach(function (row) { processRow(row, false); });
    }

    /* ── MutationObserver ───────────────────────────────────────────────── */
    var debounceTimer;
    function observeWidget(widget) {
        var observer = new MutationObserver(function (mutations) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (node) {
                        if (node.nodeType !== 1) return;
                        if (node.classList && node.classList.contains('sl-table-row')) {
                            processRow(node, true);
                        } else {
                            node.querySelectorAll && node.querySelectorAll('tr.sl-table-row').forEach(function (r) {
                                processRow(r, true);
                            });
                        }
                    });
                });
            }, 50);
        });
        observer.observe(widget, { childList: true, subtree: true });
    }

    /* ── Init ───────────────────────────────────────────────────────────── */
    function init() {
        var widget = document.querySelector('section[data-mj="widget-bet-win"]');
        if (!widget) return;
        processAll(widget);
        observeWidget(widget);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
