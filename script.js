// ==UserScript==
// @name         Giu - Mercado Livre - Aplicador Automático de Cupons
// @version      1.0
// @description  Aplica todos os cupons de todas as páginas automaticamente
// @author       Giu
// @match        https://www.mercadolivre.com.br/cupons*
// @grant        none
// @run-at       document-ready
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 SUPER AUTOMATOR - Script iniciado:', window.location.href);

    // Chaves para localStorage
    const STORAGE = {
        running: 'ML_AUTO_RUNNING',
        page: 'ML_AUTO_PAGE',
        total: 'ML_AUTO_TOTAL',
        applied: 'ML_AUTO_APPLIED',
        processed: 'ML_AUTO_PROCESSED'
    };

    // Estado global persistente
    let state = {
        isRunning: localStorage.getItem(STORAGE.running) === 'true',
        currentPage: parseInt(localStorage.getItem(STORAGE.page) || '1'),
        totalPages: parseInt(localStorage.getItem(STORAGE.total) || '22'),
        totalApplied: parseInt(localStorage.getItem(STORAGE.applied) || '0'),
        processedPages: JSON.parse(localStorage.getItem(STORAGE.processed) || '[]')
    };

    console.log('Estado atual:', state);

    // Salvar estado
    function saveState() {
        localStorage.setItem(STORAGE.running, state.isRunning);
        localStorage.setItem(STORAGE.page, state.currentPage);
        localStorage.setItem(STORAGE.total, state.totalPages);
        localStorage.setItem(STORAGE.applied, state.totalApplied);
        localStorage.setItem(STORAGE.processed, JSON.stringify(state.processedPages));
        console.log('Estado salvo:', state);
    }

    // Limpar estado
    function clearState() {
        Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        state = { isRunning: false, currentPage: 1, totalPages: 22, totalApplied: 0, processedPages: [] };
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
            border-left: 5px solid #22c55e !important;
            display: block !important;
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

    // Mostrar status permanente
    function updateStatus(message) {
        let status = document.getElementById('super-status');
        if (!status) {
            status = document.createElement('div');
            status.id = 'super-status';
            document.body.appendChild(status);
        }

        const info = `
📊 SUPER AUTOMATOR ATIVO
${message}
━━━━━━━━━━━━━━━━━━━━━━
📄 Página: ${getCurrentPage()} / ${state.totalPages}
✅ Cupons aplicados: ${state.totalApplied}
📋 Páginas processadas: ${state.processedPages.length}
━━━━━━━━━━━━━━━━━━━━━━
Status: ${state.isRunning ? '🔄 RODANDO...' : '⏹️ PARADO'}
        `.trim();

        status.innerHTML = info.replace(/\n/g, '<br>');
        console.log(message);
    }

    // Obter página atual da URL
    function getCurrentPage() {
        const url = new URL(window.location.href);
        return parseInt(url.searchParams.get('page') || '1');
    }

    // Obter total de páginas (mais agressivo)
    function getTotalPages() {
        try {
            // Método 1: Links de paginação
            const links = document.querySelectorAll('a[href*="page="]');
            let maxPage = 1;

            links.forEach(link => {
                const match = link.href.match(/page=(\d+)/);
                if (match) {
                    maxPage = Math.max(maxPage, parseInt(match[1]));
                }
            });

            // Método 2: Texto dos botões de paginação
            const pageButtons = document.querySelectorAll('.andes-paginationlink');
            pageButtons.forEach(btn => {
                const pageNum = parseInt(btn.textContent.trim());
                if (!isNaN(pageNum)) {
                    maxPage = Math.max(maxPage, pageNum);
                }
            });

            // Se encontrou algo, usa, senão assume 25 páginas
            return maxPage > 1 ? maxPage : 25;
        } catch (error) {
            console.log('Erro ao detectar páginas, assumindo 25:', error);
            return 25;
        }
    }

    // Encontrar botões de cupons (MUITO mais agressivo)
    function findCouponButtons() {
        const selectors = [
            'button:contains("Aplicar")',
            'button[class*="andes-button"]:contains("Aplicar")',
            'button.andes-button--loud',
            '.andes-button:contains("Aplicar")',
            '[class*="bottom-row"] button',
            'button:contains("aplicar")',
            'button[id*="R"]' // IDs que começam com R (padrão do ML)
        ];

        const buttons = [];

        // Método 1: Seletores CSS
        selectors.forEach(selector => {
            try {
                if (selector.includes(':contains')) {
                    // Para seletores :contains, faz busca manual
                    document.querySelectorAll('button').forEach(btn => {
                        if (btn.textContent.toLowerCase().includes('aplicar') &&
                            !btn.disabled &&
                            btn.offsetParent !== null) {
                            buttons.push(btn);
                        }
                    });
                } else {
                    document.querySelectorAll(selector).forEach(btn => {
                        if (btn.textContent.toLowerCase().includes('aplicar') &&
                            !btn.disabled &&
                            btn.offsetParent !== null) {
                            buttons.push(btn);
                        }
                    });
                }
            } catch (e) {}
        });

        // Método 2: Busca por todas as divs que contêm "aplicar"
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.tagName === 'BUTTON' &&
                el.textContent.toLowerCase().trim() === 'aplicar' &&
                !el.disabled &&
                el.offsetParent !== null) {
                buttons.push(el);
            }
        });

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

        // Aguarda carregamento
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

                // Clica no botão
                buttons[i].click();
                applied++;

                console.log(`✅ Cupom ${i+1} aplicado com sucesso`);

                // Aguarda entre cliques
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

    // Navegar para próxima página (FORÇADO)
    function goToNextPage() {
        const currentPage = getCurrentPage();
        const nextPage = currentPage + 1;

        if (nextPage > state.totalPages) {
            console.log('🏁 Última página alcançada!');
            return false;
        }

        console.log(`🚀 Navegando FORÇADAMENTE para página ${nextPage}...`);

        // Atualiza estado
        state.currentPage = nextPage;
        saveState();

        // FORÇA navegação pela URL
        const baseUrl = 'https://www.mercadolivre.com.br/cupons/filter';
        const newUrl = `${baseUrl}?all=true&page=${nextPage}`;

        updateStatus(`🚀 Navegando para página ${nextPage}/${state.totalPages}...`);

        // FORÇA mudança de página
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
            // Aplica cupons da página atual
            const appliedCount = await applyCouponsOnCurrentPage();

            // Aguarda um pouco
            await sleep(2000);

            // Se ainda está rodando, vai para próxima página
            if (state.isRunning) {
                const hasNextPage = goToNextPage();

                if (!hasNextPage) {
                    // Terminou todas as páginas
                    finishAutomation();
                }
                // Se tem próxima página, o script vai recarregar e continuar automaticamente
            }

        } catch (error) {
            console.error('❌ Erro na automação:', error);
            updateStatus(`❌ Erro na página ${currentPage}: ${error.message}`);

            // Mesmo com erro, tenta continuar
            await sleep(3000);
            if (state.isRunning) {
                const hasNextPage = goToNextPage();
                if (!hasNextPage) {
                    finishAutomation();
                }
            }
        }
    }

    // Iniciar automação
    function startAutomation() {
        console.log('🚀 INICIANDO SUPER AUTOMAÇÃO!');

        const totalPages = getTotalPages();

        state.isRunning = true;
        state.currentPage = getCurrentPage();
        state.totalPages = totalPages;
        state.totalApplied = state.totalApplied || 0;
        state.processedPages = state.processedPages || [];

        saveState();
        updateButton();
        updateStatus(`🚀 AUTOMAÇÃO INICIADA! Processando ${totalPages} páginas...`);

        // Inicia o processo
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
        saveState();
        updateButton();

        const message = `🎉 AUTOMAÇÃO CONCLUÍDA!
✅ Total de cupons aplicados: ${state.totalApplied}
📄 Páginas processadas: ${state.processedPages.length}/${state.totalPages}
🎯 Páginas: ${state.processedPages.join(', ')}`;

        updateStatus(message);

        // Limpa estado após 10 segundos
        setTimeout(() => {
            clearState();
            updateStatus('✅ Pronto para nova automação!');
        }, 10000);
    }

    // Atualizar botão
    function updateButton() {
        const btn = document.getElementById('super-coupon-btn');
        if (!btn) return;

        if (state.isRunning) {
            btn.textContent = '⏹️ PARAR AUTOMAÇÃO';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btn.style.animation = 'pulse-red 1.5s infinite';
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
            } else {
                startAutomation();
            }
        });

        document.body.appendChild(btn);
        updateButton();
    }

    // INICIALIZAÇÃO PRINCIPAL
    function initialize() {
        console.log('🎯 Inicializando SUPER AUTOMATOR...');

        addCSS();
        createButton();

        // Se estava rodando, continua automaticamente
        if (state.isRunning) {
            console.log('🔄 CONTINUANDO AUTOMAÇÃO AUTOMATICAMENTE...');
            updateStatus('🔄 Continuando automação...');
            updateButton();

            // Continua automação após 3 segundos
            setTimeout(() => runAutomation(), 3000);
        } else {
            updateStatus('✅ SUPER AUTOMATOR carregado!\nClique no botão para começar.');
        }
    }

    // INICIA ASSIM QUE POSSÍVEL
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
    } else {
        setTimeout(initialize, 1000);
    }

    console.log('🎯 SUPER AUTOMATOR DE CUPONS CARREGADO!');

})();
