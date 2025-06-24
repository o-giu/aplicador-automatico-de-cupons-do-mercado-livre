// ==UserScript==
// @name         Giu - Mercado Livre - Aplicador Automático de Cupons
// @version      2.0
// @description  Aplica todos os cupons de todas as páginas automaticamente no Mercado Livre
// @author       Giu
// @match        https://www.mercadolivre.com.br/cupons*
// @grant        none
// @run-at       document-ready
// ==/UserScript==

(function() {
    'use strict';

    if (window.self !== window.top) {
        return;
    }

    const validCouponPagePaths = ['/cupons', '/cupons/filter'];
    const isMainCouponPage = validCouponPagePaths.some(path => window.location.pathname.startsWith(path));

    if (!isMainCouponPage) {
        return;
    }

    const STORAGE = {
        running: 'ML_AUTO_RUNNING_V2',
        page: 'ML_AUTO_PAGE_V2',
        total: 'ML_AUTO_TOTAL_V2',
        applied: 'ML_AUTO_APPLIED_V2',
        processed: 'ML_AUTO_PROCESSED_V2',
        finished: 'ML_AUTO_FINISHED_V2',
        startTime: 'ML_AUTO_START_TIME_V2'
    };

    let state = {
        isRunning: localStorage.getItem(STORAGE.running) === 'true',
        currentPage: parseInt(localStorage.getItem(STORAGE.page) || '1', 10),
        totalPages: parseInt(localStorage.getItem(STORAGE.total) || '25', 10),
        totalApplied: parseInt(localStorage.getItem(STORAGE.applied) || '0', 10),
        processedPages: JSON.parse(localStorage.getItem(STORAGE.processed) || '[]'),
        isFinished: localStorage.getItem(STORAGE.finished) === 'true',
        startTime: parseInt(localStorage.getItem(STORAGE.startTime) || '0', 10)
    };

    function saveState() {
        localStorage.setItem(STORAGE.running, state.isRunning);
        localStorage.setItem(STORAGE.page, state.currentPage);
        localStorage.setItem(STORAGE.total, state.totalPages);
        localStorage.setItem(STORAGE.applied, state.totalApplied);
        localStorage.setItem(STORAGE.processed, JSON.stringify(state.processedPages));
        localStorage.setItem(STORAGE.finished, state.isFinished);
        localStorage.setItem(STORAGE.startTime, state.startTime);
    }

    function clearState() {
        Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        state = {
            isRunning: false,
            currentPage: 1,
            totalPages: 25,
            totalApplied: 0,
            processedPages: [],
            isFinished: false,
            startTime: 0
        };
        saveState();
    }

    const css = `
        #super-coupon-btn {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            color: white !important;
            border: none !important;
            padding: 15px 25px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            font-family: Arial, sans-serif !important;
            min-width: 280px !important;
            transition: background 0.3s ease, transform 0.3s ease;
        }

        @keyframes pulse-red {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6); }
        }

        #super-status {
            position: fixed !important;
            top: 90px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            padding: 15px 20px !important;
            border-radius: 10px !important;
            font-size: 14px !important;
            font-family: monospace !important;
            max-width: 350px !important;
            border-left: 5px solid #3b82f6 !important;
            display: block !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            white-space: pre-wrap;
        }

        #super-final-stats {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1000000 !important;
            background: linear-gradient(135deg, #1f2937, #111827) !important;
            color: white !important;
            padding: 30px !important;
            border-radius: 15px !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
            text-align: center !important;
            width: 450px !important;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.5s ease-out !important;
            border: 2px solid rgba(255,255,255,0.1);
        }

        .stats-content-wrapper {
            overflow-y: auto;
            padding-right: 15px;
            margin: 20px 0;
            text-align: left;
        }
        
        .stats-content-wrapper p {
            word-wrap: break-word;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .stats-button {
            background: rgba(255,255,255,0.2) !important;
            border: 1px solid white !important;
            color: white !important;
            padding: 10px 20px !important;
            border-radius: 5px !important;
            cursor: pointer !important;
            margin: 5px !important;
            font-size: 14px !important;
            transition: background 0.2s ease, transform 0.1s ease;
        }
        .stats-button:hover {
            background: rgba(255,255,255,0.3) !important;
            transform: translateY(-1px);
        }
        #new-automation-btn {
            background: rgba(59, 130, 246, 0.9) !important;
            color: white !important;
            font-weight: bold !important;
        }
        #new-automation-btn:hover {
            background: rgba(59, 130, 246, 1) !important;
        }
    `;

    function addCSS() {
        if (!document.getElementById('super-css')) {
            const style = document.createElement('style');
            style.id = 'super-css';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    function formatElapsedTime() {
        if (!state.startTime || state.startTime === 0) return '0:00';
        const start = parseInt(state.startTime, 10);
        if (isNaN(start)) return '0:00';

        const elapsed = Date.now() - start;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateStatus(message) {
        let status = document.getElementById('super-status');
        if (!status) {
            status = document.createElement('div');
            status.id = 'super-status';
            document.body.appendChild(status);
        }
        
        if (state.isFinished) {
            status.style.borderLeftColor = '#22c55e';
        } else if (state.isRunning) {
            status.style.borderLeftColor = '#ef4444';
        } else {
            status.style.borderLeftColor = '#3b82f6';
        }

        const currentPage = getCurrentPage();
        const elapsedTime = formatElapsedTime();

        const info = `
📊 Giu Auto ML Cupom ${state.isFinished ? 'FINALIZADO' : 'ATIVO'}
${message}
━━━━━━━━━━━━━━━━━━━━━━
📄 Página: ${state.processedPages.length > 0 ? currentPage : '-'} / ${state.totalPages}
✅ Cupons aplicados: ${state.totalApplied}
📋 Páginas processadas: ${state.processedPages.length}
⏱️ Tempo decorrido: ${elapsedTime}
━━━━━━━━━━━━━━━━━━━━━━
Status: ${state.isRunning ? '🔄 RODANDO...' : state.isFinished ? '🎉 CONCLUÍDO!' : '⏹️ PARADO'}
        `.trim();

        status.innerHTML = info.replace(/\n/g, '<br>');
    }

    function showFinalStats() {
        const existingModal = document.getElementById('super-final-stats');
        if (existingModal) existingModal.remove();

        const elapsedTime = formatElapsedTime();
        const modal = document.createElement('div');
        modal.id = 'super-final-stats';

        const closeModal = () => {
            const modalElement = document.getElementById('super-final-stats');
            if (modalElement) modalElement.remove();
        };

        modal.innerHTML = `
            <h2 style="margin: 0 0 10px 0; font-size: 24px; flex-shrink: 0;">🎉 AUTOMAÇÃO CONCLUÍDA!</h2>
            <div class="stats-content-wrapper">
                <p><strong>✅ Total de cupons aplicados:</strong> ${state.totalApplied}</p>
                <p><strong>📄 Páginas processadas:</strong> ${state.processedPages.length} de ${state.totalPages}</p>
                <p><strong>⏱️ Tempo total:</strong> ${elapsedTime}</p>
                <p><strong>🎯 Páginas visitadas:</strong> ${state.processedPages.length > 0 ? state.processedPages.sort((a,b) => a-b).join(', ') : 'Nenhuma'}</p>
            </div>
            <div style="margin-top: auto; flex-shrink: 0;">
                <button id="close-stats-btn" class="stats-button">Fechar</button>
                <button id="new-automation-btn" class="stats-button">Nova Automação</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-stats-btn').addEventListener('click', closeModal);
        document.getElementById('new-automation-btn').addEventListener('click', () => {
            clearState();
            closeModal();
            updateButton();
            updateStatus('Pronto para nova automação!');
        });

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    function getCurrentPage() {
        const url = new URL(window.location.href);
        return parseInt(url.searchParams.get('page') || '1', 10);
    }

    function hasNextPage() {
        const currentPage = getCurrentPage();
        const nextPageSelectors = [
            `a[href*="page=${currentPage + 1}"]`,
            'a[title="Siguiente"]',
            'a[aria-label="Siguiente"]',
            'a[aria-label="Próximo"]',
            '.andes-pagination__button--next:not([disabled])'
        ];

        for (const selector of nextPageSelectors) {
            const element = document.querySelector(selector);
            if (element && !element.disabled && element.getAttribute('aria-disabled') !== 'true') {
                return true;
            }
        }
        
        if (currentPage < state.totalPages) {
             return true;
        }

        const hasCouponButtons = findCouponButtons().length > 0;
        if (!hasCouponButtons && currentPage > 1) {
            return false;
        }

        return false;
    }

    function getTotalPages() {
        let maxPage = 1;
        const pageLinks = document.querySelectorAll('.andes-pagination__button a[href*="page="], .andes-pagination__button');
        pageLinks.forEach(link => {
            const pageNumText = link.href ? (link.href.match(/page=(\d+)/) || [])[1] : link.textContent.trim();
            const pageNum = parseInt(pageNumText, 10);
            if (!isNaN(pageNum) && pageNum > maxPage) {
                maxPage = pageNum;
            }
        });
        return Math.max(maxPage, state.currentPage, state.totalPages || 1);
    }

    function findCouponButtons() {
        const buttons = new Set();
        const allButtons = document.querySelectorAll('button, a.andes-button');

        allButtons.forEach(btn => {
            const text = btn.textContent.toLowerCase().trim();
            const isRelevantText = text.includes('aplicar') || text.includes('ativar') || text.includes('usar');
            const isVisible = btn.offsetParent !== null;
            const isNotDisabled = !btn.disabled && btn.getAttribute('aria-disabled') !== 'true';

            if (isRelevantText && isVisible && isNotDisabled) {
                buttons.add(btn);
            }
        });
        return [...buttons];
    }

    async function applyCouponsOnCurrentPage() {
        const currentPage = getCurrentPage();
        updateStatus(`Buscando cupons na pág. ${currentPage}...`);
        await sleep(1000);

        const buttons = findCouponButtons();
        if (buttons.length === 0) {
            updateStatus(`Nenhum cupom aplicável na pág. ${currentPage}.`);
            return 0;
        }

        updateStatus(`Aplicando ${buttons.length} cupons na pág. ${currentPage}...`);
        let applied = 0;
        for (let i = 0; i < buttons.length; i++) {
            if (!state.isRunning) break;
            try {
                buttons[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(200);
                updateStatus(`Aplicando cupom ${i+1}/${buttons.length} (Pág. ${currentPage})`);
                buttons[i].click();
                applied++;
                await sleep(400);
            } catch (error) {
                console.error(`Erro ao clicar no cupom ${i+1}:`, error);
                await sleep(500);
            }
        }

        state.totalApplied += applied;
        if (!state.processedPages.includes(currentPage)) {
            state.processedPages.push(currentPage);
        }
        saveState();
        updateStatus(`Pág. ${currentPage}: ${applied} cupons aplicados!`);
        return applied;
    }

    function goToNextPage() {
        if (!hasNextPage()) {
            return false;
        }
        const nextPage = getCurrentPage() + 1;
        state.currentPage = nextPage;
        saveState();
        const newUrl = `https://www.mercadolivre.com.br/cupons/filter?all=true&page=${nextPage}`;
        updateStatus(`Navegando p/ pág. ${nextPage}/${state.totalPages}...`);
        window.location.replace(newUrl);
        return true;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runAutomation() {
        if (!state.isRunning) return;
        
        const currentPage = getCurrentPage();
        try {
            const detectedPages = getTotalPages();
            if (detectedPages > state.totalPages) {
                state.totalPages = detectedPages;
                saveState();
                updateStatus(`Total de páginas atualizado para ${state.totalPages}.`);
            }

            await applyCouponsOnCurrentPage();
            await sleep(1500);

            if (state.isRunning) {
                if (!goToNextPage()) {
                    finishAutomation();
                }
            }
        } catch (error) {
            console.error('Erro na automação:', error);
            updateStatus(`Erro na pág. ${currentPage}. Tentando avançar...`);
            await sleep(3000);
            if (state.isRunning) {
                if (!goToNextPage()) {
                    finishAutomation();
                }
            }
        }
    }

    function startAutomation() {
        if (state.isFinished || (!state.isRunning && state.totalApplied > 0)) {
            if (!confirm('Deseja iniciar uma nova automação? O progresso anterior será apagado.')) {
                return;
            }
            clearState();
        }

        state.isRunning = true;
        state.currentPage = getCurrentPage();
        state.totalPages = getTotalPages();
        state.isFinished = false;
        if (!state.startTime || state.startTime === 0) {
            state.startTime = Date.now();
        }
        saveState();
        updateButton();
        updateStatus(`Automação iniciada! Processando até ${state.totalPages} pág...`);
        setTimeout(() => runAutomation(), 1000);
    }

    function stopAutomation() {
        state.isRunning = false;
        saveState();
        updateButton();
        updateStatus('Automação parada pelo usuário.');
    }

    function finishAutomation() {
        state.isRunning = false;
        state.isFinished = true;
        saveState();
        updateButton();
        updateStatus('Automação concluída com sucesso!');
        setTimeout(() => showFinalStats(), 1000);
    }

    function updateButton() {
        const btn = document.getElementById('super-coupon-btn');
        if (!btn) return;

        if (state.isRunning) {
            btn.textContent = '⏹️ PARAR AUTOMAÇÃO';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btn.style.animation = 'pulse-red 1.5s infinite';
        } else if (state.isFinished) {
            btn.textContent = '📊 VER ESTATÍSTICAS';
            btn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            btn.style.animation = 'none';
        } else {
            btn.textContent = '🚀 APLICAR TODOS OS CUPONS';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            btn.style.animation = 'none';
        }
    }

    function createButton() {
        if (document.getElementById('super-coupon-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'super-coupon-btn';
        btn.addEventListener('click', () => {
            if (state.isRunning) {
                stopAutomation();
            } else if (state.isFinished) {
                showFinalStats();
            } else {
                startAutomation();
            }
        });
        document.body.appendChild(btn);
        updateButton();
    }

    function initialize() {
        addCSS();
        createButton();

        if (state.isRunning && !state.isFinished) {
            updateStatus('Continuando automação...');
            setTimeout(() => runAutomation(), 2000);
        } else if (state.isFinished) {
            updateStatus('Automação concluída! Veja as estatísticas.');
            updateButton();
        } else {
            updateStatus('Pronto para começar. Clique no botão!');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
    } else {
        setTimeout(initialize, 500);
    }
})();
