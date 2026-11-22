/**
 * Mimi Ofertas - Painel Gerenciador e Minerador Shopee
 * Lógica 100% Mobile-First com suporte a Categorias Shopee Oficiais,
 * Exclusão em Lote e Excluir Tudo em Commit Único na Vercel / GitHub
 */

(function () {
  const API_MINERAR = '/api/minerar';
  const API_PUBLICAR = '/api/publicar';

  // Lista oficial das 14 principais categorias da Shopee Brasil com mapeamento
  const SHOPEE_CATEGORIAS_OFICIAIS = [
    { id: 'casa', label: 'Casa e Decoração', keywords: ['decoracao casa', 'organizador casa'], siteCat: 'casa' },
    { id: 'cozinha', label: 'Cozinha e Utilidades', keywords: ['utilidades cozinha', 'panela frigideira', 'pote hermetico'], siteCat: 'cozinha' },
    { id: 'beleza', label: 'Beleza e Cuidados', keywords: ['skincare serum', 'maquiagem beleza'], siteCat: 'beleza' },
    { id: 'celulares', label: 'Celulares e Acessórios', keywords: ['suporte celular', 'carregador rapido inducao'], siteCat: 'eletronicos' },
    { id: 'eletronicos', label: 'Áudio e Eletrônicos', keywords: ['fone bluetooth', 'mini projetor smart', 'caixa de som'], siteCat: 'eletronicos' },
    { id: 'moda', label: 'Moda Feminina', keywords: ['moda feminina', 'vestido cropped'], siteCat: 'beleza' },
    { id: 'bolsas', label: 'Bolsas e Acessórios', keywords: ['bolsa feminina transversal', 'mochila antifurto'], siteCat: 'casa' },
    { id: 'ferramentas', label: 'Ferramentas e Construção', keywords: ['parafusadeira eletrica', 'jogo de chaves'], siteCat: 'casa' },
    { id: 'esporte', label: 'Esporte e Lazer', keywords: ['garrafa termica inox', 'corda treino fitness'], siteCat: 'casa' },
    { id: 'saude', label: 'Saúde e Bem-Estar', keywords: ['massageador eletrico cervical', 'balanca digital bioimpedancia'], siteCat: 'beleza' },
    { id: 'pet', label: 'Pet Shop', keywords: ['comedouro pet automatico', 'brinquedo arranhador gato'], siteCat: 'casa' },
    { id: 'papelaria', label: 'Papelaria e Escritório', keywords: ['papelaria fofa caneta', 'organizador mesa escritorio'], siteCat: 'casa' },
    { id: 'automotivo', label: 'Automotivo', keywords: ['aspirador de po automotivo', 'suporte celular veicular'], siteCat: 'eletronicos' },
    { id: 'bebes', label: 'Bebês e Brinquedos', keywords: ['brinquedo educativo infantil', 'copo infantil antivazamento'], siteCat: 'casa' }
  ];

  // Estado da aplicação
  let adminPassword = sessionStorage.getItem('mimi_admin_password') || '';
  let activeTab = 'minerar';
  let selectedShopeeCategories = new Set(['casa', 'cozinha', 'beleza', 'eletronicos']);

  let mineradosList = [];
  let mineradosSelectedIds = new Set();
  let mineradosCategoryMap = {};

  let publicadosList = [];
  let publicadosSelectedIds = new Set();

  // Elementos do DOM: Login
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const adminPasswordInput = document.getElementById('admin-password-input');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');

  // Tabs
  const tabBtnMinerar = document.getElementById('tab-btn-minerar');
  const tabBtnPublicados = document.getElementById('tab-btn-publicados');
  const tabMinerar = document.getElementById('tab-minerar');
  const tabPublicados = document.getElementById('tab-publicados');
  const badgeTotalPublicados = document.getElementById('badge-total-publicados');

  // Filtros Accordion
  const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
  const formMineracao = document.getElementById('form-mineracao');
  const iconChevronFiltros = document.getElementById('icon-chevron-filtros');

  // Categorias Shopee (Drawer / Checkboxes)
  const btnToggleCatDrawer = document.getElementById('btn-toggle-cat-drawer');
  const catDrawer = document.getElementById('cat-drawer');
  const iconChevronCat = document.getElementById('icon-chevron-cat');
  const badgeCatCount = document.getElementById('badge-cat-count');
  const catDrawerSummary = document.getElementById('cat-drawer-summary');
  const shopeeCategoriesGrid = document.getElementById('shopee-categories-grid');
  const btnSelectAllCats = document.getElementById('btn-select-all-cats');
  const btnClearAllCats = document.getElementById('btn-clear-all-cats');

  // Palavras-chave Secundárias
  const btnToggleCustomKw = document.getElementById('btn-toggle-custom-kw');
  const customKwContainer = document.getElementById('custom-kw-container');
  const iconChevronKw = document.getElementById('icon-chevron-kw');
  const filterKeywordsInput = document.getElementById('filter-keywords');

  // Mineração Ações
  const btnIniciarMineracao = document.getElementById('btn-iniciar-mineracao');
  const iconMinerBtn = document.getElementById('icon-miner-btn');
  const labelMinerBtn = document.getElementById('label-miner-btn');
  const statusMineracaoBox = document.getElementById('status-mineracao-box');
  const statusMineracaoTxt = document.getElementById('status-mineracao-txt');
  const btnToggleSelectAll = document.getElementById('btn-toggle-select-all');
  const mineracaoResultsGrid = document.getElementById('mineracao-results-grid');

  // Barra Fixa de Publicação (Minerar)
  const mobileActionBarMinerar = document.getElementById('mobile-action-bar-minerar');
  const selectedCounter = document.getElementById('selected-counter');
  const btnSelecionarTodosFooter = document.getElementById('btn-selecionar-todos-footer');
  const btnPublicarSelecionados = document.getElementById('btn-publicar-selecionados');
  const btnPublicarLabel = document.getElementById('btn-publicar-label');

  // Publicados (No Ar)
  const searchPublicados = document.getElementById('search-publicados');
  const btnRecarregarPublicados = document.getElementById('btn-recarregar-publicados');
  const publicadosListDiv = document.getElementById('publicados-list');
  const checkboxSelectAllPublicados = document.getElementById('checkbox-select-all-publicados');
  const btnExcluirTudoPublicados = document.getElementById('btn-excluir-tudo-publicados');

  // Barra Fixa de Exclusão em Lote
  const mobileActionBarExcluir = document.getElementById('mobile-action-bar-excluir');
  const excluirCounter = document.getElementById('excluir-counter');
  const btnLimparSelecaoExcluir = document.getElementById('btn-limpar-selecao-excluir');
  const btnExcluirLoteConfirmar = document.getElementById('btn-excluir-lote-confirmar');
  const btnExcluirLoteLabel = document.getElementById('btn-excluir-lote-label');

  // Toast
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastBody = document.getElementById('toast-body');

  function showToast(message, isError = false) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    if (isError) {
      toastBody.className = 'px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-red-600 text-white border border-red-500';
    } else {
      toastBody.className = 'px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-emerald-600 text-white border border-emerald-500';
    }
    toast.classList.remove('-translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-20', 'opacity-0');
    }, 3500);
  }

  async function safeFetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const rawText = await res.text();
      const snippet = (rawText || '').trim().slice(0, 150) || '(resposta vazia)';
      throw new Error(`Resposta inválida [HTTP ${res.status}]: ${snippet}`);
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Erro HTTP ${res.status}`);
    }
    return data;
  }

  // ================= INICIALIZAÇÃO =================
  function init() {
    renderShopeeCategoriesCheckboxes();
    updateShopeeCategoriesUI();

    if (adminPassword) {
      loginModal.classList.add('hidden');
      loadPublicados();
    } else {
      loginModal.classList.remove('hidden');
    }
    setupEventListeners();
  }

  // Renderizar checkboxes de categorias
  function renderShopeeCategoriesCheckboxes() {
    if (!shopeeCategoriesGrid) return;
    shopeeCategoriesGrid.innerHTML = SHOPEE_CATEGORIAS_OFICIAIS.map(cat => {
      const isChecked = selectedShopeeCategories.has(cat.id);
      return `
        <label class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border ${isChecked ? 'border-orange-500/80 bg-orange-950/20' : 'border-slate-800'} hover:border-slate-700 transition-colors cursor-pointer select-none">
          <input 
            type="checkbox" 
            value="${cat.id}" 
            class="shopee-cat-checkbox w-4 h-4 text-orange-600 rounded bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
            ${isChecked ? 'checked' : ''}
          />
          <span class="text-xs text-slate-200 font-medium truncate">${cat.label}</span>
        </label>
      `;
    }).join('');

    // Listener para cada checkbox de categoria
    document.querySelectorAll('.shopee-cat-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const catId = e.target.value;
        if (e.target.checked) {
          selectedShopeeCategories.add(catId);
        } else {
          selectedShopeeCategories.delete(catId);
        }
        updateShopeeCategoriesUI();
      });
    });
  }

  function updateShopeeCategoriesUI() {
    const total = selectedShopeeCategories.size;
    badgeCatCount.textContent = `${total} ${total === 1 ? 'selecionada' : 'selecionadas'}`;
    
    if (total === 0) {
      catDrawerSummary.textContent = 'Nenhuma categoria oficial selecionada';
    } else {
      const labels = SHOPEE_CATEGORIAS_OFICIAIS
        .filter(c => selectedShopeeCategories.has(c.id))
        .map(c => c.label.split(' ')[0]);
      catDrawerSummary.textContent = labels.join(', ');
    }

    // Atualiza bordas dos labels
    document.querySelectorAll('.shopee-cat-checkbox').forEach(cb => {
      const parentLabel = cb.closest('label');
      if (parentLabel) {
        if (cb.checked) {
          parentLabel.classList.add('border-orange-500/80', 'bg-orange-950/20');
          parentLabel.classList.remove('border-slate-800');
        } else {
          parentLabel.classList.remove('border-orange-500/80', 'bg-orange-950/20');
          parentLabel.classList.add('border-slate-800');
        }
      }
    });
  }

  function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = adminPasswordInput.value.trim();
      if (!pwd) return;

      loginError.classList.add('hidden');
      const submitBtn = document.getElementById('btn-login');
      submitBtn.textContent = 'Autenticando...';
      submitBtn.disabled = true;

      try {
        const data = await safeFetchJson(API_PUBLICAR, {
          headers: { 'x-admin-password': pwd }
        });

        adminPassword = pwd;
        sessionStorage.setItem('mimi_admin_password', pwd);
        loginModal.classList.add('hidden');
        showToast('Login realizado com sucesso!');
        publicadosList = data.produtos || [];
        badgeTotalPublicados.textContent = publicadosList.length;
        renderPublicados();
      } catch (err) {
        loginError.textContent = err.message || 'Erro na autenticação.';
        loginError.classList.remove('hidden');
      } finally {
        submitBtn.textContent = 'Acessar Painel';
        submitBtn.disabled = false;
      }
    });

    // Logout
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('mimi_admin_password');
      adminPassword = '';
      loginModal.classList.remove('hidden');
      adminPasswordInput.value = '';
    });

    // Tabs
    tabBtnMinerar.addEventListener('click', () => switchTab('minerar'));
    tabBtnPublicados.addEventListener('click', () => switchTab('publicados'));

    // Accordion Filtros Geral
    btnToggleFiltros.addEventListener('click', () => {
      formMineracao.classList.toggle('hidden');
      iconChevronFiltros.classList.toggle('rotate-180');
    });

    // Gaveta de Categorias Shopee
    btnToggleCatDrawer.addEventListener('click', () => {
      catDrawer.classList.toggle('hidden');
      iconChevronCat.classList.toggle('rotate-180');
    });

    btnSelectAllCats.addEventListener('click', () => {
      SHOPEE_CATEGORIAS_OFICIAIS.forEach(c => selectedShopeeCategories.add(c.id));
      renderShopeeCategoriesCheckboxes();
      updateShopeeCategoriesUI();
    });

    btnClearAllCats.addEventListener('click', () => {
      selectedShopeeCategories.clear();
      renderShopeeCategoriesCheckboxes();
      updateShopeeCategoriesUI();
    });

    // Accordion Palavras-Chave Secundárias
    btnToggleCustomKw.addEventListener('click', () => {
      customKwContainer.classList.toggle('hidden');
      iconChevronKw.classList.toggle('rotate-180');
    });

    // Submissão da Mineração
    formMineracao.addEventListener('submit', async (e) => {
      e.preventDefault();
      await executarMineracaoGranular();
    });

    // Seleção na Mineração
    btnToggleSelectAll.addEventListener('click', toggleSelectAllMinerados);
    btnSelecionarTodosFooter.addEventListener('click', toggleSelectAllMinerados);

    // Publicar no GitHub
    btnPublicarSelecionados.addEventListener('click', async () => {
      await publicarItensSelecionados();
    });

    // Busca rápida nos publicados
    if (searchPublicados) {
      searchPublicados.addEventListener('input', (e) => {
        renderPublicados(e.target.value.trim().toLowerCase());
      });
    }

    if (btnRecarregarPublicados) {
      btnRecarregarPublicados.addEventListener('click', loadPublicados);
    }

    // Selecionar Todos nos Publicados
    if (checkboxSelectAllPublicados) {
      checkboxSelectAllPublicados.addEventListener('change', (e) => {
        toggleSelectAllPublicados(e.target.checked);
      });
    }

    // Excluir Tudo nos Publicados
    if (btnExcluirTudoPublicados) {
      btnExcluirTudoPublicados.addEventListener('click', async () => {
        await excluirTudoPublicados();
      });
    }

    // Limpar Seleção Exclusão em Lote
    if (btnLimparSelecaoExcluir) {
      btnLimparSelecaoExcluir.addEventListener('click', () => {
        publicadosSelectedIds.clear();
        if (checkboxSelectAllPublicados) checkboxSelectAllPublicados.checked = false;
        updatePublicadosSelectionUI();
        renderPublicados();
      });
    }

    // Confirmar Exclusão em Lote
    if (btnExcluirLoteConfirmar) {
      btnExcluirLoteConfirmar.addEventListener('click', async () => {
        await excluirLotePublicados();
      });
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'minerar') {
      tabMinerar.classList.remove('hidden');
      tabPublicados.classList.add('hidden');
      tabBtnMinerar.classList.add('border-orange-500', 'text-orange-400');
      tabBtnMinerar.classList.remove('border-transparent', 'text-slate-400');
      tabBtnPublicados.classList.remove('border-orange-500', 'text-orange-400');
      tabBtnPublicados.classList.add('border-transparent', 'text-slate-400');
      mobileActionBarMinerar.classList.remove('hidden');
      mobileActionBarExcluir.classList.add('hidden');
    } else {
      tabMinerar.classList.add('hidden');
      tabPublicados.classList.remove('hidden');
      tabBtnPublicados.classList.add('border-orange-500', 'text-orange-400');
      tabBtnPublicados.classList.remove('border-transparent', 'text-slate-400');
      tabBtnMinerar.classList.remove('border-orange-500', 'text-orange-400');
      tabBtnMinerar.classList.add('border-transparent', 'text-slate-400');
      mobileActionBarMinerar.classList.add('hidden');
      updatePublicadosSelectionUI();
      loadPublicados();
    }
  }

  // ================= MINERAÇÃO GRANULAR (COM CATEGORIAS E KEYWORDS) =================
  async function executarMineracaoGranular() {
    // 1. Coleta termos das categorias selecionadas
    const targetsToMine = []; // { query, defaultCat }

    SHOPEE_CATEGORIAS_OFICIAIS.forEach(cat => {
      if (selectedShopeeCategories.has(cat.id)) {
        cat.keywords.forEach(kw => {
          targetsToMine.push({ query: kw, defaultCat: cat.siteCat });
        });
      }
    });

    // 2. Coleta palavras-chave customizadas se existirem
    const rawCustomKw = (filterKeywordsInput?.value || '').trim();
    if (rawCustomKw) {
      const customKws = rawCustomKw.split(',').map(s => s.trim()).filter(Boolean);
      customKws.forEach(kw => {
        targetsToMine.push({ query: kw, defaultCat: guessCategory(kw) });
      });
    }

    if (targetsToMine.length === 0) {
      showToast('Selecione ao menos 1 categoria da Shopee ou informe uma palavra-chave.', true);
      return;
    }

    const pagIni = parseInt(document.getElementById('filter-pag-ini').value, 10) || 1;
    const pagFim = parseInt(document.getElementById('filter-pag-fim').value, 10) || 2;
    const precoMin = parseFloat(document.getElementById('filter-preco-min').value) || 0;
    const precoMax = parseFloat(document.getElementById('filter-preco-max').value) || 999999;
    const vendasMin = parseInt(document.getElementById('filter-vendas-min').value, 10) || 0;
    const vendasMax = parseInt(document.getElementById('filter-vendas-max').value, 10) || 999999;
    const comissaoPctMin = parseFloat(document.getElementById('filter-comissao-pct').value) || 0;
    const comissaoReaisMin = parseFloat(document.getElementById('filter-comissao-reais').value) || 0;
    const notaMin = parseFloat(document.getElementById('filter-nota-min').value) || 0;

    const steps = [];
    for (const target of targetsToMine) {
      for (let p = pagIni; p <= pagFim; p++) {
        steps.push({ query: target.query, page: p, defaultCat: target.defaultCat });
      }
    }

    const totalSteps = steps.length;
    let completedSteps = 0;
    const itensAcumulados = new Map();

    btnIniciarMineracao.disabled = true;
    labelMinerBtn.textContent = 'Minerando na Shopee...';
    iconMinerBtn.innerHTML = `
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    `;
    iconMinerBtn.classList.add('animate-spin');

    mineracaoResultsGrid.innerHTML = `
      <div class="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl text-center space-y-3.5 shadow-xl">
        <div class="flex items-center justify-between text-xs text-slate-400 font-bold">
          <span id="progress-step-txt" class="truncate pr-2">Iniciando mineração...</span>
          <span id="progress-pct-txt" class="shrink-0">0%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60">
          <div id="progress-bar-fill" class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300 w-0"></div>
        </div>
        <p id="progress-sub-txt" class="text-[11px] sm:text-xs text-slate-500">Executando requisições granulares anti-timeout.</p>
      </div>
    `;

    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressStepTxt = document.getElementById('progress-step-txt');
    const progressPctTxt = document.getElementById('progress-pct-txt');
    const progressSubTxt = document.getElementById('progress-sub-txt');

    try {
      for (const step of steps) {
        if (progressStepTxt) {
          progressStepTxt.textContent = `Buscando "${step.query}" (página ${step.page})...`;
        }
        if (progressSubTxt) {
          progressSubTxt.textContent = `${itensAcumulados.size} achadinhos aprovados pelos filtros até agora.`;
        }

        try {
          const data = await safeFetchJson(API_MINERAR, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': adminPassword
            },
            body: JSON.stringify({
              keyword: step.query,
              page: step.page,
              precoMin,
              precoMax,
              vendasMin,
              vendasMax,
              comissaoPctMin,
              comissaoReaisMin,
              notaMin
            })
          });

          if (Array.isArray(data.produtos)) {
            for (const item of data.produtos) {
              if (item && item.itemId && !itensAcumulados.has(item.itemId)) {
                // Já associa categoria correspondente
                mineradosCategoryMap[item.itemId] = step.defaultCat || guessCategory(item.productName);
                itensAcumulados.set(item.itemId, item);
              }
            }
          }
        } catch (stepErr) {
          console.warn(`Erro no passo ${step.query} p${step.page}:`, stepErr.message);
        }

        completedSteps++;
        const pct = Math.round((completedSteps / totalSteps) * 100);
        if (progressBarFill) progressBarFill.style.width = `${pct}%`;
        if (progressPctTxt) progressPctTxt.textContent = `${pct}%`;
      }

      mineradosList = Array.from(itensAcumulados.values()).sort((a, b) => b.commission - a.commission);
      mineradosSelectedIds.clear();
      updateSelectedCounter();

      statusMineracaoBox.classList.remove('hidden');
      statusMineracaoTxt.textContent = `${mineradosList.length} ofertas mineradas (maior comissão)`;

      formMineracao.classList.add('hidden');
      iconChevronFiltros.classList.remove('rotate-180');

      renderMinerados();
      showToast(`${mineradosList.length} ofertas encontradas!`);
    } catch (err) {
      mineracaoResultsGrid.innerHTML = `
        <div class="p-6 bg-red-950/40 border border-red-800 rounded-2xl text-center">
          <p class="text-sm font-bold text-red-300">Falha na mineração</p>
          <p class="text-xs text-red-400 mt-2 font-mono break-all">${err.message}</p>
        </div>
      `;
      showToast(err.message, true);
    } finally {
      btnIniciarMineracao.disabled = false;
      labelMinerBtn.textContent = 'Iniciar Mineração na Shopee';
      iconMinerBtn.classList.remove('animate-spin');
      iconMinerBtn.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>`;
    }
  }

  function renderMinerados() {
    if (mineradosList.length === 0) {
      mineracaoResultsGrid.innerHTML = `
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <p class="text-xs sm:text-sm text-slate-400">Nenhum produto atendeu aos critérios deste filtro.</p>
          <p class="text-[11px] text-slate-500 mt-1">Experimente marcar mais categorias ou reduzir a comissão mínima.</p>
        </div>
      `;
      return;
    }

    mineracaoResultsGrid.innerHTML = mineradosList.map(item => {
      const isSelected = mineradosSelectedIds.has(item.itemId);
      const catAtual = mineradosCategoryMap[item.itemId] || guessCategory(item.productName);
      mineradosCategoryMap[item.itemId] = catAtual;

      return `
        <div class="bg-slate-900 border ${isSelected ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-800'} rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 transition-all">
          
          <div class="relative w-full sm:w-28 h-40 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 shrink-0">
            <img src="${item.imageUrl}" alt="${item.productName}" class="w-full h-full object-cover"/>
            
            <label class="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer min-w-[34px] min-h-[34px]">
              <input 
                type="checkbox" 
                data-id="${item.itemId}" 
                class="item-checkbox-miner w-4 h-4 text-orange-600 rounded bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                ${isSelected ? 'checked' : ''}
              />
            </label>

            <div class="absolute bottom-2 right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
              +R$ ${item.commission.toFixed(2)}
            </div>
          </div>

          <div class="flex-1 flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ${item.commissionRate}% de Comissão
                </span>
                <div class="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <span>★ ${item.ratingStar.toFixed(1)}</span>
                  <span class="text-slate-500 font-normal">(${item.sales} vend.)</span>
                </div>
              </div>

              <h4 class="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 mt-1 leading-snug">
                ${item.productName}
              </h4>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div class="text-sm sm:text-base font-black text-orange-400">
                R$ ${item.priceMin.toFixed(2).replace('.', ',')}
              </div>

              <div class="flex items-center gap-1.5">
                <select 
                  data-id="${item.itemId}" 
                  class="select-categoria-miner bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2 py-1.5 outline-none cursor-pointer min-h-[38px]"
                >
                  <option value="casa" ${catAtual === 'casa' ? 'selected' : ''}>Casa</option>
                  <option value="cozinha" ${catAtual === 'cozinha' ? 'selected' : ''}>Cozinha</option>
                  <option value="beleza" ${catAtual === 'beleza' ? 'selected' : ''}>Beleza</option>
                  <option value="eletronicos" ${catAtual === 'eletronicos' ? 'selected' : ''}>Eletrônicos</option>
                </select>

                <a 
                  href="${item.offerLink}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Conferir na Shopee"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

        </div>
      `;
    }).join('');

    document.querySelectorAll('.item-checkbox-miner').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          mineradosSelectedIds.add(id);
        } else {
          mineradosSelectedIds.delete(id);
        }
        updateSelectedCounter();
        const card = e.target.closest('.rounded-2xl, .rounded-3xl');
        if (card) {
          if (e.target.checked) {
            card.classList.add('border-orange-500', 'ring-1', 'ring-orange-500/50');
            card.classList.remove('border-slate-800');
          } else {
            card.classList.remove('border-orange-500', 'ring-1', 'ring-orange-500/50');
            card.classList.add('border-slate-800');
          }
        }
      });
    });

    document.querySelectorAll('.select-categoria-miner').forEach(sel => {
      sel.addEventListener('change', (e) => {
        mineradosCategoryMap[e.target.dataset.id] = e.target.value;
      });
    });
  }

  function guessCategory(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('panela') || n.includes('fritadeira') || n.includes('pote') || n.includes('copo') || n.includes('cozinha') || n.includes('air fryer') || n.includes('faca')) return 'cozinha';
    if (n.includes('fone') || n.includes('bluetooth') || n.includes('projetor') || n.includes('carregador') || n.includes('led') || n.includes('relogio') || n.includes('smart') || n.includes('celular')) return 'eletronicos';
    if (n.includes('skincare') || n.includes('serum') || n.includes('escova') || n.includes('maquiagem') || n.includes('cabelo') || n.includes('batom') || n.includes('beleza') || n.includes('saude')) return 'beleza';
    return 'casa';
  }

  function toggleSelectAllMinerados() {
    if (mineradosSelectedIds.size === mineradosList.length) {
      mineradosSelectedIds.clear();
    } else {
      mineradosList.forEach(item => mineradosSelectedIds.add(item.itemId));
    }
    renderMinerados();
    updateSelectedCounter();
  }

  function updateSelectedCounter() {
    const count = mineradosSelectedIds.size;
    selectedCounter.textContent = `${count} ${count === 1 ? 'produto' : 'produtos'}`;
    btnPublicarSelecionados.disabled = count === 0;
    btnPublicarLabel.textContent = count > 0 ? `Publicar (${count})` : 'Publicar no Site';
  }

  // ================= PUBLICAÇÃO NO GITHUB =================
  async function publicarItensSelecionados() {
    if (mineradosSelectedIds.size === 0) return;

    const itensParaPublicar = mineradosList
      .filter(item => mineradosSelectedIds.has(item.itemId))
      .map(item => {
        return {
          id: String(item.itemId),
          titulo: item.productName,
          preco: item.priceMin,
          preco_original: parseFloat((item.priceMin * 1.5).toFixed(2)),
          desconto: 33,
          nota: item.ratingStar,
          vendas: item.sales,
          categoria: mineradosCategoryMap[item.itemId] || 'casa',
          imagem: item.imageUrl,
          link_afiliado: item.offerLink
        };
      });

    btnPublicarSelecionados.disabled = true;
    btnPublicarLabel.textContent = 'Publicando...';

    try {
      await safeFetchJson(API_PUBLICAR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          action: 'adicionar',
          produtos: itensParaPublicar,
          commitMessage: `feat: adiciona ${itensParaPublicar.length} achadinhos via painel minerador`
        })
      });

      showToast(`${itensParaPublicar.length} ofertas publicadas no GitHub!`);
      mineradosSelectedIds.clear();
      updateSelectedCounter();
      renderMinerados();
      loadPublicados();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btnPublicarSelecionados.disabled = false;
      btnPublicarLabel.textContent = 'Publicar no Site';
    }
  }

  // ================= CARREGAR E GERENCIAR PUBLICADOS (NO AR) =================
  async function loadPublicados() {
    if (!adminPassword) return;

    publicadosListDiv.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs">
        Carregando catálogo atual do GitHub...
      </div>
    `;

    try {
      const data = await safeFetchJson(API_PUBLICAR, {
        method: 'GET',
        headers: { 'x-admin-password': adminPassword }
      });

      publicadosList = data.produtos || [];
      badgeTotalPublicados.textContent = publicadosList.length;
      publicadosSelectedIds.clear();
      if (checkboxSelectAllPublicados) checkboxSelectAllPublicados.checked = false;
      updatePublicadosSelectionUI();
      renderPublicados();
    } catch (err) {
      publicadosListDiv.innerHTML = `
        <div class="p-4 bg-red-950/40 border border-red-800 rounded-2xl text-center text-xs text-red-300">
          Erro ao carregar do GitHub: ${err.message}
        </div>
      `;
    }
  }

  function getFilteredPublicados() {
    const query = (searchPublicados?.value || '').trim().toLowerCase();
    return publicadosList.filter(p => {
      if (!query) return true;
      return (p.titulo || '').toLowerCase().includes(query) || (p.categoria || '').toLowerCase().includes(query);
    });
  }

  function renderPublicados() {
    const filtrados = getFilteredPublicados();

    if (filtrados.length === 0) {
      publicadosListDiv.innerHTML = `
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
          Nenhum produto publicado encontrado.
        </div>
      `;
      return;
    }

    publicadosListDiv.innerHTML = filtrados.map(item => {
      const isSelected = publicadosSelectedIds.has(String(item.id));

      return `
        <div class="bg-slate-900 border ${isSelected ? 'border-red-500/80 bg-red-950/10' : 'border-slate-800'} rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 transition-all">
          
          <div class="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
            <!-- Checkbox de Seleção em Lote Touch -->
            <label class="p-1.5 flex items-center justify-center cursor-pointer min-h-[38px] min-w-[38px]">
              <input 
                type="checkbox" 
                data-id="${item.id}" 
                class="item-checkbox-publicado w-4 h-4 text-orange-600 rounded bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                ${isSelected ? 'checked' : ''}
              />
            </label>

            <img src="${item.imagem}" alt="${item.titulo}" class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-slate-950 shrink-0"/>
            
            <div class="truncate">
              <span class="text-[9px] font-bold uppercase text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">${item.categoria}</span>
              <h5 class="text-xs font-bold text-white truncate mt-0.5">${item.titulo}</h5>
              <div class="text-[11px] text-slate-400 mt-0.5">
                <span class="text-white font-bold">R$ ${item.preco.toFixed(2).replace('.', ',')}</span> • ★ ${item.nota} • ${item.vendas} vend.
              </div>
            </div>
          </div>

          <!-- Botão Exclusão Individual -->
          <button 
            data-id="${item.id}" 
            class="btn-remover-item p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Remover do site"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Eventos nos checkboxes dos publicados
    document.querySelectorAll('.item-checkbox-publicado').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = String(e.target.dataset.id);
        if (e.target.checked) {
          publicadosSelectedIds.add(id);
        } else {
          publicadosSelectedIds.delete(id);
        }
        updatePublicadosSelectionUI();
        renderPublicados();
      });
    });

    // Eventos de Remoção Individual
    document.querySelectorAll('.btn-remover-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Deseja realmente remover este produto do site?')) return;
        await removerProdutoDoSite(id);
      });
    });
  }

  function toggleSelectAllPublicados(checked) {
    const filtrados = getFilteredPublicados();
    if (checked) {
      filtrados.forEach(p => publicadosSelectedIds.add(String(p.id)));
    } else {
      filtrados.forEach(p => publicadosSelectedIds.delete(String(p.id)));
    }
    updatePublicadosSelectionUI();
    renderPublicados();
  }

  function updatePublicadosSelectionUI() {
    const count = publicadosSelectedIds.size;
    excluirCounter.textContent = `${count} ${count === 1 ? 'selecionado' : 'selecionados'}`;
    btnExcluirLoteLabel.textContent = `Excluir (${count})`;

    if (count > 0 && activeTab === 'publicados') {
      mobileActionBarExcluir.classList.remove('hidden');
    } else {
      mobileActionBarExcluir.classList.add('hidden');
    }
  }

  // ================= AÇÕES DESTRUTIVAS: REMOÇÃO INDIVIDUAL, LOTE E TUDO =================
  async function removerProdutoDoSite(id) {
    try {
      showToast('Removendo produto no GitHub...');
      await safeFetchJson(API_PUBLICAR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          action: 'remover',
          id: id
        })
      });

      showToast('Produto removido com sucesso!');
      await loadPublicados();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function excluirLotePublicados() {
    const count = publicadosSelectedIds.size;
    if (count === 0) return;

    const confirma = confirm(`Tem certeza que deseja excluir ${count} produto(s) selecionado(s) da vitrine? Esta ação atualizará o site em commit único.`);
    if (!confirma) return;

    btnExcluirLoteConfirmar.disabled = true;
    btnExcluirLoteLabel.textContent = 'Excluindo...';

    try {
      showToast(`Excluindo ${count} produtos em commit único no GitHub...`);
      await safeFetchJson(API_PUBLICAR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          action: 'remover_lote',
          ids: Array.from(publicadosSelectedIds)
        })
      });

      showToast(`${count} produtos removidos com sucesso em commit único!`);
      publicadosSelectedIds.clear();
      if (checkboxSelectAllPublicados) checkboxSelectAllPublicados.checked = false;
      updatePublicadosSelectionUI();
      await loadPublicados();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btnExcluirLoteConfirmar.disabled = false;
      btnExcluirLoteLabel.textContent = 'Excluir Selecionados';
    }
  }

  async function excluirTudoPublicados() {
    const total = publicadosList.length;
    if (total === 0) {
      showToast('A vitrine já está vazia.', true);
      return;
    }

    const confirma = confirm(`ATENÇÃO: Deseja realmente EXCLUIR TODOS OS ${total} PRODUTOS da vitrine do Mimi Ofertas? A vitrine ficará vazia.`);
    if (!confirma) return;

    try {
      showToast('Limpando toda a vitrine no GitHub...');
      await safeFetchJson(API_PUBLICAR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          action: 'limpar_tudo'
        })
      });

      showToast('Todos os produtos foram removidos da vitrine!');
      publicadosSelectedIds.clear();
      if (checkboxSelectAllPublicados) checkboxSelectAllPublicados.checked = false;
      updatePublicadosSelectionUI();
      await loadPublicados();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
