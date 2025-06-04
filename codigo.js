// ==UserScript==
// @name         Giu - Mercado Livre - Aplicador Automático de Cupons
// @version      1.2
// @description  Aplica todos os cupons de todas as páginas automaticamente
// @author       Giu
// @match        https://www.mercadolivre.com.br/cupons*
// @grant        none
// @run-at       document-ready
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Giu Auto ML Cupom - Script iniciado:', window.location.href);

    // Chaves para localStorage
    const STORAGE = {
        running: 'ML_AUTO_RUNNING',
        page: 'ML_AUTO_PAGE',
        total: 'ML_AUTO_TOTAL',
        applied: 'ML_AUTO_APPLIED',
        processed: 'ML_AUTO_PROCESSED',
        finished: 'ML_AUTO_FINISHED',
        startTime: 'ML_AUTO_START_TIME'
    };

    // Estado global persistente
    let state = {
        isRunning: localStorage.getItem(STORAGE.running) === 'true',
        currentPage: parseInt(localStorage.getItem(STORAGE.page) || '1'),
        totalPages: parseInt(localStorage.getItem(STORAGE.total) || '25'),
        totalApplied: parseInt(localStorage.getItem(STORAGE.applied) || '0'),
        processedPages: JSON.parse(localStorage.getItem(STORAGE.processed) || '[]'),
        isFinished: localStorage.getItem(STORAGE.finished) === 'true',
        startTime: localStorage.getItem(STORAGE.startTime) || Date.now()
    };

    console.log('Estado atual:', state);

    // Salvar estado
    function saveState() {
        localStorage.setItem(STORAGE.running, state.isRunning);
        localStorage.setItem(STORAGE.page, state.currentPage);
        localStorage.setItem(STORAGE.total, state.totalPages);
        localStorage.setItem(STORAGE.applied, state.totalApplied);
        localStorage.setItem(STORAGE.processed, JSON.stringify(state.processedPages));
        localStorage.setItem(STORAGE.finished, state.isFinished);
        localStorage.setItem(STORAGE.startTime, state.startTime);
        console.log('Estado salvo:', state);
    }

    // Limpar estado
    function clearState() {
        Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        state = {
            isRunning: false,
            currentPage: 1,
            totalPages: 25,
            totalApplied: 0,
            processedPages: [],
            isFinished: false,
            startTime: Date.now()
        };
        console.log('Estado limpo');
    }

    // CSS
    const css = `
        #super-coupon-btn {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: ${state.isRunning ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)'} !important;
            color: white !important;
            border: none !important;
            padding: 15px 25px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            font-family: Arial, sans-serif !important;
            min-width: 250px !important;
            animation: ${state.isRunning ? 'pulse-red 1.5s infinite' : 'none'} !important;
        }

        @keyframes pulse-red {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6); }
        }

        #super-status {
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            padding: 15px 20px !important;
            border-radius: 10px !important;
            font-size: 14px !important;
            font-family: monospace !important;
            max-width: 350px !important;
            border-left: 5px solid ${state.isFinished ? '#22c55e' : '#3b82f6'} !important;
            display: block !important;
        }

        #super-final-stats {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1000000 !important;
            background: linear-gradient(135deg, #22c55e, #16a34a) !important;
            color: white !important;
            padding: 30px !important;
            border-radius: 15px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
            text-align: center !important;
            min-width: 400px !important;
            animation: slideIn 0.5s ease-out !important;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .stats-close-btn {
            position: absolute !important;
            top: 10px !important;
            right: 15px !important;
            background: rgba(255,255,255,0.2) !important;
            border: none !important;
            color: white !important;
            font-size: 18px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            padding: 5px 10px !important;
            border-radius: 50% !important;
        }
    `;

    // Adicionar CSS
    function addCSS() {
        if (!document.getElementById('super-css')) {
            const style = document.createElement('style');
            style.id = 'super-css';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    // Formatear tempo decorrido
    function formatElapsedTime() {
        const elapsed = Date.now() - state.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Mostrar status permanente
    function updateStatus(message) {
        let status = document.getElementById('super-status');
        if (!status) {
            status = document.createElement('div');
            status.id = 'super-status';
            document.body.appendChild(status);
        }

        const currentPage = getCurrentPage();
        const elapsedTime = formatElapsedTime();

        const info = `
📊 Giu Auto ML Cupom ${state.isFinished ? 'FINALIZADO' : 'ATIVADO'}
${message}
━━━━━━━━━━━━━━━━━━━━━━
📄 Página: ${currentPage} / ${state.totalPages}
✅ Cupons aplicados: ${state.totalApplied}
📋 Páginas processadas: ${state.processedPages.length}
⏱️ Tempo decorrido: ${elapsedTime}
━━━━━━━━━━━━━━━━━━━━━━
Status: ${state.isRunning ? '🔄 RODANDO...' : state.isFinished ? '🎉 CONCLUÍDO!' : '⏹️ PARADO'}
        `.trim();

        status.innerHTML = info.replace(/\n/g, '<br>');
        console.log(message);
    }

    // Mostrar estatísticas finais
    function showFinalStats() {
        // Remove qualquer modal anterior
        const existingModal = document.getElementById('super-final-stats');
        if (existingModal) {
            existingModal.remove();
        }

        const elapsedTime = formatElapsedTime();

        const modal = document.createElement('div');
        modal.id = 'super-final-stats';

        // Função para fechar o modal
        function closeModal() {
            const modalElement = document.getElementById('super-final-stats');
            if (modalElement) {
                modalElement.remove();
            }
        }

        modal.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">🎉 AUTOMAÇÃO CONCLUÍDA!</h2>
            <div style="text-align: left; margin: 20px 0;">
                <p><strong>✅ Total de cupons aplicados:</strong> ${state.totalApplied}</p>
                <p><strong>📄 Páginas processadas:</strong> ${state.processedPages.length}/${state.totalPages}</p>
                <p><strong>⏱️ Tempo total:</strong> ${elapsedTime}</p>
                <p><strong>🎯 Páginas visitadas:</strong> ${state.processedPages.sort((a,b) => a-b).join(', ')}</p>
            </div>
            <div style="margin-top: 20px;">
                <button id="close-stats-btn" style="
                    background: rgba(255,255,255,0.2) !important;
                    border: 1px solid white !important;
                    color: white !important;
                    padding: 10px 20px !important;
                    border-radius: 5px !important;
                    cursor: pointer !important;
                    margin-right: 10px !important;
                    font-size: 14px !important;
                ">Fechar</button>
                <button id="new-automation-btn" style="
                    background: rgba(255,255,255,0.9) !important;
                    border: 1px solid white !important;
                    color: #22c55e !important;
                    padding: 10px 20px !important;
                    border-radius: 5px !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                ">Nova Automação</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Adiciona eventos de clique
        document.getElementById('close-stats-btn').addEventListener('click', closeModal);
        document.getElementById('new-automation-btn').addEventListener('click', () => {
            clearState();
            closeModal();
            updateButton();
            updateStatus('✅ Pronto para nova automação!');
        });

        // Fechar com ESC
        function handleEscKey(event) {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        document.addEventListener('keydown', handleEscKey);

        // Fechar clicando fora do modal
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Remove automaticamente após 60 segundos se não for fechado manualmente
        setTimeout(() => {
            if (document.getElementById('super-final-stats')) {
                closeModal();
            }
        }, 60000);
    }

    // Obter página atual da URL
    function getCurrentPage() {
        const url = new URL(window.location.href);
        return parseInt(url.searchParams.get('page') || '1');
    }

    // Verificar se há próxima página (corrigido)
    function hasNextPage() {
        const currentPage = getCurrentPage();

        console.log(`🔍 Verificando se há próxima página após a atual: ${currentPage}`);

        try {
            // Primeiro verifica se existem elementos de paginação
            const paginationExists = document.querySelector('.andes-pagination') ||
                                    document.querySelector('[class*="pagination"]') ||
                                    document.querySelector('a[href*="page="]');

            if (!paginationExists) {
                console.log('❌ Não encontrou elementos de paginação - assumindo que há mais páginas');
                // Se não tem paginação visível, continua até um limite seguro
                return currentPage < 50; // Limita a 50 páginas para evitar loop infinito
            }

            // Verifica se existem links para próxima página
            const nextPageSelectors = [
                `a[href*="page=${currentPage + 1}"]`,
                'a[title="Siguiente"]',
                'a[aria-label="Siguiente"]',
                '.andes-pagination__button--next:not([disabled])',
                'a[aria-label="Próximo"]',
                'a[title="Próximo"]'
            ];

            let hasNext = false;
            nextPageSelectors.forEach(selector => {
                try {
                    const element = document.querySelector(selector);
                    if (element && !element.disabled && element.getAttribute('aria-disabled') !== 'true') {
                        console.log(`✅ Encontrou próxima página com seletor: ${selector}`);
                        hasNext = true;
                    }
                } catch (e) {
                    console.log(`Erro ao verificar seletor ${selector}:`, e);
                }
            });

            // Se não encontrou via seletores, verifica se o número da página atual é muito baixo
            if (!hasNext && currentPage < 5) {
                console.log('🤔 Não encontrou próxima página mas está nas primeiras páginas - continuando');
                hasNext = true; // Nas primeiras páginas, assume que há mais
            }

            // Verifica se há cupons na página atual (corrigido sem :contains)
            const allButtons = document.querySelectorAll('button');
            let couponsOnPage = 0;

            allButtons.forEach(btn => {
                if (btn.textContent.toLowerCase().includes('aplicar') &&
                    !btn.disabled &&
                    btn.offsetParent !== null) {
                    couponsOnPage++;
                }
            });

            // Também verifica por outros elementos que podem indicar cupons
            const couponElements = document.querySelectorAll('[class*="coupon"], [class*="promocode"], [class*="discount"]');
            couponsOnPage += couponElements.length;

            if (couponsOnPage === 0 && currentPage > 1) {
                console.log('❌ Não há cupons na página atual - provavelmente chegou ao fim');
                hasNext = false;
            }

            console.log(`🔍 Página ${currentPage}: ${hasNext ? 'TEM' : 'NÃO TEM'} próxima página`);
            return hasNext;

        } catch (error) {
            console.error('Erro ao verificar próxima página:', error);
            // Em caso de erro, assume que há próxima página se estiver nas primeiras páginas
            return currentPage < 10;
        }
    }

    // Obter total de páginas (melhorado)
    function getTotalPages() {
        try {
            let maxPage = 1;

            // Método 1: Links de paginação
            const links = document.querySelectorAll('a[href*="page="]');
            links.forEach(link => {
                const match = link.href.match(/page=(\d+)/);
                if (match) {
                    maxPage = Math.max(maxPage, parseInt(match[1]));
                }
            });

            // Método 2: Botões de paginação
            const pageButtons = document.querySelectorAll('.andes-pagination__button');
            pageButtons.forEach(btn => {
                const pageNum = parseInt(btn.textContent.trim());
                if (!isNaN(pageNum) && pageNum > 0) {
                    maxPage = Math.max(maxPage, pageNum);
                }
            });

            // Método 3: Informações de resultados
            const resultInfo = document.querySelector('.ui-search-results-quantity');
            if (resultInfo) {
                const text = resultInfo.textContent;
                const match = text.match(/(\d+)\s*resultados/);
                if (match) {
                    const totalResults = parseInt(match[1]);
                    const estimatedPages = Math.ceil(totalResults / 48); // ML mostra ~48 cupons por página
                    maxPage = Math.max(maxPage, estimatedPages);
                }
            }

            // Se não encontrou nada específico, usa o valor atual do estado ou assume um valor padrão
            return maxPage > 1 ? maxPage : state.totalPages;
        } catch (error) {
            console.log('Erro ao detectar páginas, usando valor atual:', error);
            return state.totalPages;
        }
    }

    // Encontrar botões de cupons (corrigido)
    function findCouponButtons() {
        const buttons = [];

        try {
            // Busca por todos os botões que contenham "aplicar"
            const allButtons = document.querySelectorAll('button');

            allButtons.forEach(btn => {
                const text = btn.textContent.toLowerCase().trim();
                if ((text.includes('aplicar') || text.includes('ativar') || text.includes('usar')) &&
                    !btn.disabled &&
                    btn.offsetParent !== null &&
                    !text.includes('filtro')) { // Exclui botões de filtro
                    buttons.push(btn);
                }
            });

            // Busca por seletores específicos do Mercado Livre
            const specificSelectors = [
                'button.andes-button--loud',
                'button[class*="andes-button"][class*="primary"]',
                'button[id*="coupon"]',
                'button[data-testid*="coupon"]'
            ];

            specificSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(btn => {
                        if (!btn.disabled &&
                            btn.offsetParent !== null &&
                            !buttons.includes(btn)) {
                            buttons.push(btn);
                        }
                    });
                } catch (e) {
                    console.log(`Erro no seletor ${selector}:`, e);
                }
            });

        } catch (error) {
            console.error('Erro ao buscar botões de cupons:', error);
        }

        // Remove duplicatas
        const uniqueButtons = [...new Set(buttons)];

        console.log(`🎯 Encontrados ${uniqueButtons.length} botões de cupons`);
        uniqueButtons.forEach((btn, i) => {
            console.log(`Botão ${i+1}:`, btn.textContent.trim(), btn.className);
        });

        return uniqueButtons;
    }

    // Aplicar cupons na página atual
    async function applyCouponsOnCurrentPage() {
        const currentPage = getCurrentPage();

        updateStatus(`🔍 Buscando cupons na página ${currentPage}...`);
        await sleep(3000);

        const buttons = findCouponButtons();

        if (buttons.length === 0) {
            updateStatus(`⚠️ Nenhum cupom encontrado na página ${currentPage}`);
            return 0;
        }

        updateStatus(`🎯 Aplicando ${buttons.length} cupons na página ${currentPage}...`);

        let applied = 0;

        for (let i = 0; i < buttons.length; i++) {
            if (!state.isRunning) break;

            try {
                updateStatus(`🔄 Aplicando cupom ${i+1}/${buttons.length} (Página ${currentPage})`);
                buttons[i].click();
                applied++;
                console.log(`✅ Cupom ${i+1} aplicado com sucesso`);
                await sleep(1200);
            } catch (error) {
                console.error(`❌ Erro no cupom ${i+1}:`, error);
                await sleep(500);
            }
        }

        // Atualiza contador total
        state.totalApplied += applied;

        // Marca página como processada
        if (!state.processedPages.includes(currentPage)) {
            state.processedPages.push(currentPage);
        }

        saveState();

        updateStatus(`✅ Página ${currentPage}: ${applied} cupons aplicados!`);
        return applied;
    }

    // Navegar para próxima página
    function goToNextPage() {
        const currentPage = getCurrentPage();
        const nextPage = currentPage + 1;

        // Verifica se realmente há próxima página
        if (!hasNextPage()) {
            console.log('🏁 Não há próxima página disponível!');
            return false;
        }

        console.log(`🚀 Navegando para página ${nextPage}...`);

        state.currentPage = nextPage;
        saveState();

        const baseUrl = 'https://www.mercadolivre.com.br/cupons/filter';
        const newUrl = `${baseUrl}?all=true&page=${nextPage}`;

        updateStatus(`🚀 Navegando para página ${nextPage}/${state.totalPages}...`);
        window.location.replace(newUrl);

        return true;
    }

    // Função de sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Processar automação completa
    async function runAutomation() {
        if (!state.isRunning) return;

        const currentPage = getCurrentPage();
        console.log(`🚀 Processando página ${currentPage}...`);

        try {
            // Atualiza o total de páginas dinamicamente
            const detectedPages = getTotalPages();
            if (detectedPages > state.totalPages) {
                state.totalPages = detectedPages;
                saveState();
            }

            // Aplica cupons da página atual
            await applyCouponsOnCurrentPage();
            await sleep(2000);

            // Verifica se ainda está rodando e se há próxima página
            if (state.isRunning) {
                if (hasNextPage()) {
                    goToNextPage();
                } else {
                    // Não há próxima página - finaliza
                    finishAutomation();
                }
            }

        } catch (error) {
            console.error('❌ Erro na automação:', error);
            updateStatus(`❌ Erro na página ${currentPage}: ${error.message}`);

            await sleep(3000);
            if (state.isRunning) {
                if (hasNextPage()) {
                    goToNextPage();
                } else {
                    finishAutomation();
                }
            }
        }
    }

    // Iniciar automação
    function startAutomation() {
        console.log('🚀 INICIANDO AUTOMAÇÃO!');

        const totalPages = getTotalPages();

        state.isRunning = true;
        state.currentPage = getCurrentPage();
        state.totalPages = totalPages;
        state.isFinished = false;
        state.startTime = Date.now();

        saveState();
        updateButton();
        updateStatus(`🚀 AUTOMAÇÃO INICIADA! Processando até ${totalPages} páginas...`);

        setTimeout(() => runAutomation(), 2000);
    }

    // Parar automação
    function stopAutomation() {
        console.log('⏹️ PARANDO AUTOMAÇÃO...');

        state.isRunning = false;
        saveState();
        updateButton();
        updateStatus('⏹️ AUTOMAÇÃO PARADA PELO USUÁRIO');
    }

    // Finalizar automação
    function finishAutomation() {
        console.log('🎉 AUTOMAÇÃO FINALIZADA!');

        state.isRunning = false;
        state.isFinished = true;
        saveState();
        updateButton();

        updateStatus('🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');

        // Mostra estatísticas finais
        setTimeout(() => {
            showFinalStats();
        }, 1000);

        // Limpa o estado após 5 minutos para permitir nova automação
        setTimeout(() => {
            clearState();
            updateStatus('✅ Pronto para nova automação!');
        }, 300000); // 5 minutos
    }

    // Atualizar botão
    function updateButton() {
        const btn = document.getElementById('super-coupon-btn');
        if (!btn) return;

        if (state.isRunning) {
            btn.textContent = '⏹️ PARAR AUTOMAÇÃO';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btn.style.animation = 'pulse-red 1.5s infinite';
        } else if (state.isFinished) {
            btn.textContent = '🎉 VER ESTATÍSTICAS';
            btn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            btn.style.animation = 'none';
        } else {
            btn.textContent = '🚀 APLICAR TODOS OS CUPONS';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            btn.style.animation = 'none';
        }
    }

    // Criar botão
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

    // INICIALIZAÇÃO PRINCIPAL
    function initialize() {
        console.log('🎯 Inicializando Giu Auto ML Cupom...');

        addCSS();
        createButton();

        // Se estava rodando, continua automaticamente
        if (state.isRunning && !state.isFinished) {
            console.log('🔄 CONTINUANDO AUTOMAÇÃO AUTOMATICAMENTE...');
            updateStatus('🔄 Continuando automação...');
            updateButton();
            setTimeout(() => runAutomation(), 3000);
        } else if (state.isFinished) {
            updateStatus('🎉 Automação já foi concluída! Clique no botão para ver as estatísticas.');
            updateButton();
        } else {
            updateStatus('✅ Giu Auto ML Cupom carregado!\nClique no botão para começar.');
        }
    }

    // INICIA ASSIM QUE POSSÍVEL
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
    } else {
        setTimeout(initialize, 1000);
    }

    console.log('🎯 Giu Auto ML Cupom CARREGADO!');

})();
