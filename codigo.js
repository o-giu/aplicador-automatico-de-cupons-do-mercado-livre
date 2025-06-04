// ==UserScript==
// @name         Giu - Mercado Livre - Aplicador Automático de Cupons
// @version      1.4 // Versão atualizada
// @description  Aplica todos os cupons de todas as páginas automaticamente no Mercado Livre
// @author       Giu
// @match        https://www.mercadolivre.com.br/cupons*
// @grant        none
// @run-at       document-ready
// ==/UserScript==

(function() {
    'use strict';

    // --- VERIFICAÇÕES CRÍTICAS DE URL E CONTEXTO ---
    // 1. Assegura que o script só roda no frame principal (não em iframes, que são comuns em modais)
    if (window.self !== window.top) {
        console.log('Giu Auto ML Cupom - Rodando dentro de um iframe (modal de cupom no carrinho, etc.). Script não será executado neste contexto.');
        return; // Sai do script imediatamente
    }

    // 2. Assegura que o script só roda nas URLs específicas da página *principal* de cupons.
    // Isso evita que ele apareça em modais ou URLs que contenham "cupons" mas não sejam a página dedicada.
    const validCouponPagePaths = ['/cupons', '/cupons/filter'];
    const isMainCouponPage = validCouponPagePaths.some(path => window.location.pathname.startsWith(path));

    if (!isMainCouponPage) {
        console.log('Giu Auto ML Cupom - Não é a página principal de cupons do Mercado Livre. Script não será executado.');
        return; // Sai do script imediatamente
    }
    // --- FIM DAS VERIFICAÇÕES CRÍTICAS ---

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
        totalPages: parseInt(localStorage.getItem(STORAGE.total) || '25'), // Valor padrão se não houver no storage
        totalApplied: parseInt(localStorage.getItem(STORAGE.applied) || '0'),
        processedPages: JSON.parse(localStorage.getItem(STORAGE.processed) || '[]'),
        isFinished: localStorage.getItem(STORAGE.finished) === 'true',
        startTime: localStorage.getItem(STORAGE.startTime) || Date.now() // Mantém o tempo de início se já estiver rodando
    };

    console.log('Estado atual carregado:', state);

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
            totalPages: 25, // Resetar para o valor padrão
            totalApplied: 0,
            processedPages: [],
            isFinished: false,
            startTime: Date.now()
        };
        saveState(); // Salva o estado limpo
        console.log('Estado limpo');
    }

    // CSS
    const css = `
        #super-coupon-btn {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: ${state.isRunning ? 'linear-gradient(135deg, #ef4444, #dc2626)' : (state.isFinished ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'linear-gradient(135deg, #22c55e, #16a34a)')} !important;
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
            transition: background 0.3s ease, transform 0.3s ease;
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
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            white-space: pre-wrap; /* Permite quebras de linha no HTML */
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
            border: 2px solid rgba(255,255,255,0.3);
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
            background: rgba(255,255,255,0.9) !important;
            color: #22c55e !important;
            font-weight: bold !important;
        }
        #new-automation-btn:hover {
            background: white !important;
            color: #16a34a !important;
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
        if (!state.startTime) return '0:00'; // Caso startTime não esteja definido
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
📄 Página: ${state.processedPages.length > 0 ? currentPage : '-'} / ${state.totalPages}
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
                <p><strong>📄 Páginas processadas:</strong> ${state.processedPages.length} de ${state.totalPages}</p>
                <p><strong>⏱️ Tempo total:</strong> ${elapsedTime}</p>
                <p><strong>🎯 Páginas visitadas:</strong> ${state.processedPages.length > 0 ? state.processedPages.sort((a,b) => a-b).join(', ') : 'Nenhuma'}</p>
            </div>
            <div style="margin-top: 20px;">
                <button id="close-stats-btn" class="stats-button">Fechar</button>
                <button id="new-automation-btn" class="stats-button">Nova Automação</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Adiciona eventos de clique
        document.getElementById('close-stats-btn').addEventListener('click', closeModal);
        document.getElementById('new-automation-btn').addEventListener('click', () => {
            clearState(); // Limpa o estado
            closeModal(); // Fecha o modal
            updateButton(); // Atualiza o botão para o estado inicial
            updateStatus('✅ Pronto para nova automação!'); // Atualiza o status
        });

        // Fechar com ESC
        function handleEscKey(event) {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        document.addEventListener('keydown', handleEscKey);
    }

    // Obter página atual da URL
    function getCurrentPage() {
        const url = new URL(window.location.href);
        return parseInt(url.searchParams.get('page') || '1');
    }

    // Verificar se há próxima página
    function hasNextPage() {
        const currentPage = getCurrentPage();

        // 1. Verificar se existe um link explícito para a próxima página
        const nextPageSelectors = [
            `a[href*="page=${currentPage + 1}"]`,
            'a[title="Siguiente"]', // Título para "Próximo" em espanhol
            'a[aria-label="Siguiente"]',
            'a[aria-label="Próximo"]', // Título para "Próximo" em português
            '.andes-pagination__button--next:not([disabled])' // Botão "Próximo" não desabilitado
        ];

        for (const selector of nextPageSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element && !element.disabled && element.getAttribute('aria-disabled') !== 'true') {
                    console.log(`✅ Encontrou próxima página com seletor: ${selector}`);
                    return true;
                }
            } catch (e) {
                console.log(`Erro ao verificar seletor ${selector}:`, e);
            }
        }

        // 2. Verificar se a página atual é menor que o total de páginas estimado
        // Isso cobre casos onde o ML não mostra o link explícito da próxima página no DOM,
        // mas ainda existem páginas a serem visitadas.
        if (currentPage < state.totalPages) {
             console.log(`🤔 Página atual (${currentPage}) menor que totalPages estimado (${state.totalPages}). Assumindo que há próxima.`);
             return true;
        }

        // 3. Verificar se há cupons na página atual.
        // Se não houver mais cupons na página atual (e não for a primeira página),
        // é um forte indicativo que chegamos ao fim.
        const allButtons = document.querySelectorAll('button');
        let couponsOnPage = 0;

        allButtons.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            if ((text.includes('aplicar') || text.includes('ativar') || text.includes('usar')) &&
                !btn.disabled &&
                btn.offsetParent !== null && // Garante que o botão está visível
                !text.includes('filtro') && // Exclui botões de filtro
                !text.includes('adicionar')) { // Exclui botões de adicionar genéricos
                couponsOnPage++;
            }
        });

        if (couponsOnPage === 0 && currentPage > 1) {
            console.log('❌ Não há cupons "Aplicar/Ativar/Usar" na página atual e não é a primeira página - provavelmente chegou ao fim.');
            return false;
        }

        // 4. Se não achou nada e não está na primeira página (e não há cupons), assume que acabou.
        if (couponsOnPage === 0 && currentPage > 1) {
            console.log('❌ Não há cupons na página atual e não é a primeira página - provavelmente chegou ao fim.');
            return false;
        }

        console.log(`🔍 Página ${currentPage}: NÃO TEM próxima página ou cupons`);
        return false;
    }


    // Obter total de páginas (melhorado)
    function getTotalPages() {
        let maxPage = 1;

        try {
            // Método 1: Links de paginação
            const links = document.querySelectorAll('.andes-pagination__button a[href*="page="]');
            links.forEach(link => {
                const match = link.href.match(/page=(\d+)/);
                if (match) {
                    maxPage = Math.max(maxPage, parseInt(match[1]));
                }
            });

            // Método 2: Botões de paginação por texto (último número)
            const pageButtons = document.querySelectorAll('.andes-pagination__button');
            pageButtons.forEach(btn => {
                const pageNum = parseInt(btn.textContent.trim());
                if (!isNaN(pageNum) && pageNum > 0) {
                    maxPage = Math.max(maxPage, pageNum);
                }
            });

            // Método 3: Informações de resultados (estimativa)
            const resultInfo = document.querySelector('.ui-search-results-quantity'); // Ex: "100 resultados"
            if (resultInfo) {
                const text = resultInfo.textContent;
                const match = text.match(/(\d+)\s*resultados/);
                if (match) {
                    const totalResults = parseInt(match[1]);
                    // Assumindo que ML mostra ~48 itens por página de cupons (pode variar)
                    const estimatedPages = Math.ceil(totalResults / 48);
                    maxPage = Math.max(maxPage, estimatedPages);
                }
            }
        } catch (error) {
            console.log('Erro ao detectar páginas, usando valor atual do estado ou padrão:', error);
        }

        // Garante que o total de páginas seja pelo menos a página atual ou o valor pré-existente
        return Math.max(maxPage, state.currentPage, state.totalPages || 1);
    }

    // Encontrar botões de cupons (corrigido e aprimorado)
    function findCouponButtons() {
        const buttons = [];

        try {
            // Seletores que podem indicar botões de cupom
            const commonSelectors = [
                'button.andes-button',
                'a.andes-button', // Às vezes são links com estilo de botão
                '[data-testid*="coupon"] button',
                '[id*="coupon"] button',
                '.coupon-card button', // Exemplo de um componente de cupom
                '[class*="apply-button"]',
                '[class*="activate-button"]'
            ];

            commonSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(btn => {
                    if (btn.tagName.toLowerCase() !== 'button' && btn.tagName.toLowerCase() !== 'a') return; // Apenas botões ou links com classe de botão

                    const text = btn.textContent.toLowerCase().trim();
                    const isRelevantText = text.includes('aplicar') || text.includes('ativar') || text.includes('usar');
                    const isNotFilter = !text.includes('filtro');
                    const isNotAdd = !text.includes('adicionar'); // Evita botões de adicionar genéricos
                    const isVisible = btn.offsetParent !== null;
                    const isNotDisabled = !btn.disabled && btn.getAttribute('aria-disabled') !== 'true';

                    if (isRelevantText && isNotFilter && isNotAdd && isVisible && isNotDisabled) {
                        buttons.push(btn);
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao buscar botões de cupons:', error);
        }

        // Remove duplicatas (seletor pode pegar o mesmo botão)
        const uniqueButtons = [...new Set(buttons)];

        console.log(`🎯 Encontrados ${uniqueButtons.length} botões de cupons`);
        uniqueButtons.forEach((btn, i) => {
            console.log(`Botão ${i+1}: "${btn.textContent.trim()}" (Classe: ${btn.className})`);
        });

        return uniqueButtons;
    }

    // Aplicar cupons na página atual
    async function applyCouponsOnCurrentPage() {
        const currentPage = getCurrentPage();

        updateStatus(`🔍 Buscando cupons na página ${currentPage}...`);
        await sleep(3000); // Espera um pouco para a página carregar completamente

        const buttons = findCouponButtons();

        if (buttons.length === 0) {
            updateStatus(`⚠️ Nenhum cupom encontrado na página ${currentPage}.`);
            return 0;
        }

        updateStatus(`🎯 Aplicando ${buttons.length} cupons na página ${currentPage}...`);

        let applied = 0;

        for (let i = 0; i < buttons.length; i++) {
            if (!state.isRunning) break; // Interrompe se o usuário parar a automação

            try {
                // Rola até o botão para garantir visibilidade antes do clique
                buttons[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(500); // Pequena pausa para a rolagem

                updateStatus(`🔄 Aplicando cupom ${i+1}/${buttons.length} (Página ${currentPage})`);
                buttons[i].click();
                applied++;
                console.log(`✅ Cupom ${i+1} ("${buttons[i].textContent.trim()}") aplicado com sucesso`);
                await sleep(1500); // Tempo para o ML processar o clique
            } catch (error) {
                console.error(`❌ Erro ao clicar no cupom ${i+1} ("${buttons[i].textContent.trim()}"):`, error);
                await sleep(700); // Pequena pausa antes de tentar o próximo
            }
        }

        // Atualiza contador total e marca página como processada
        state.totalApplied += applied;
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

        if (!hasNextPage()) {
            console.log('🏁 Não há próxima página disponível ou cupons para aplicar!');
            return false;
        }

        console.log(`🚀 Navegando para página ${nextPage}...`);

        state.currentPage = nextPage;
        saveState();

        const baseUrl = 'https://www.mercadolivre.com.br/cupons/filter';
        const newUrl = `${baseUrl}?all=true&page=${nextPage}`;

        updateStatus(`🚀 Navegando para página ${nextPage}/${state.totalPages}...`);
        window.location.replace(newUrl); // Usa replace para não poluir o histórico

        return true;
    }

    // Função de sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Processar automação completa
    async function runAutomation() {
        if (!state.isRunning) {
            console.log('Automação interrompida.');
            return;
        }

        const currentPage = getCurrentPage();
        console.log(`🚀 Processando página ${currentPage}...`);

        try {
            // Atualiza o total de páginas dinamicamente
            const detectedPages = getTotalPages();
            if (detectedPages > state.totalPages) {
                state.totalPages = detectedPages;
                saveState();
                updateStatus(`🔍 Total de páginas atualizado para ${state.totalPages}.`);
            }

            // Aplica cupons da página atual
            await applyCouponsOnCurrentPage();
            await sleep(2000); // Pausa antes de decidir a próxima ação

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
            console.error('❌ Erro inesperado na automação:', error);
            updateStatus(`❌ Erro na página ${currentPage}: ${error.message}. Tentando avançar...`);

            await sleep(3000); // Espera um pouco em caso de erro
            if (state.isRunning) {
                if (hasNextPage()) {
                    goToNextPage(); // Tenta ir para a próxima página mesmo com erro
                } else {
                    finishAutomation(); // Finaliza se não há mais páginas
                }
            }
        }
    }

    // Iniciar automação
    function startAutomation() {
        console.log('🚀 INICIANDO AUTOMAÇÃO!');

        // Garante que o estado seja limpo apenas se não houver uma automação "finalizada" que queremos inspecionar.
        // Se isFinished é true, mas o usuário quer iniciar uma nova, ele deve ter clicado em "Nova Automação" no modal.
        if (state.isFinished) {
            clearState(); // Limpa se for uma nova partida após uma conclusão
        } else if (!state.isRunning && state.totalApplied > 0) {
            // Se não está rodando, mas já aplicou cupons (i.e., foi interrompido),
            // pergunta ao usuário se quer recomeçar ou continuar.
            if (!confirm('Uma automação anterior foi interrompida. Deseja iniciar uma nova automação (limpar tudo) ou continuar de onde parou? \n\nClique em OK para continuar a atual, ou CANCELAR para iniciar uma nova.')) {
                clearState();
            }
        }

        const totalPages = getTotalPages(); // Recalcula total de páginas no início

        state.isRunning = true;
        state.currentPage = getCurrentPage();
        state.totalPages = totalPages;
        state.isFinished = false;
        // Só define startTime se não houver um (primeira vez ou após clearState)
        if (!localStorage.getItem(STORAGE.startTime)) {
            state.startTime = Date.now();
        }

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
        saveState(); // Salva o estado como finalizado
        updateButton(); // Atualiza o botão para "Ver Estatísticas"

        updateStatus('🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');

        // Mostra estatísticas finais imediatamente
        setTimeout(() => {
            showFinalStats();
        }, 1000);

        // REMOVIDO: A limpeza automática do estado.
        // Agora, o estado só será limpo quando o usuário clicar em "Nova Automação" no modal de estatísticas.
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
            btn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)'; // Roxo para "Ver Estatísticas"
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
                showFinalStats(); // Mostra as estatísticas quando clicado se finalizado
            } else {
                startAutomation();
            }
        });

        document.body.appendChild(btn);
        updateButton(); // Define o texto e estilo inicial do botão
    }

    // INICIALIZAÇÃO PRINCIPAL
    function initialize() {
        console.log('🎯 Inicializando Giu Auto ML Cupom...');

        addCSS();
        createButton();

        // Lógica de continuação/status na inicialização
        if (state.isRunning && !state.isFinished) {
            console.log('🔄 CONTINUANDO AUTOMAÇÃO AUTOMATICAMENTE...');
            updateStatus('🔄 Continuando automação...');
            // Inicia a execução da automação após um pequeno atraso para a página carregar
            setTimeout(() => runAutomation(), 3000);
        } else if (state.isFinished) {
            // Se a automação terminou na última visita, informa e oferece para ver as estatísticas
            updateStatus('🎉 Automação já foi concluída! Clique no botão para ver as estatísticas ou iniciar uma nova.');
            updateButton(); // Assegura que o botão mostre "Ver Estatísticas"
            // Não mostra o modal automaticamente ao carregar, apenas via clique
        } else {
            // Estado inicial: script carregado, pronto para começar
            updateStatus('✅ Giu Auto ML Cupom carregado!\nClique no botão para começar.');
        }
    }

    // INICIA ASSIM QUE POSSÍVEL (document-ready)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
    } else {
        setTimeout(initialize, 1000);
    }

    console.log('🎯 Giu Auto ML Cupom CARREGADO!');

})();
