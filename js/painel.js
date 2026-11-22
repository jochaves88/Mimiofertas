/**
 * Mimi Ofertas - Painel Gerenciador e Minerador Shopee
 * Lógica 100% Mobile-First com suporte a Categorias Shopee Oficiais,
 * Exclusão em Lote, Excluir Tudo e Compartilhamento com Link Rastreado (WhatsApp e Pinterest)
 */

(function () {
  const API_MINERAR = '/api/minerar';
  const API_PUBLICAR = '/api/publicar';
  const API_GERAR_LINK = '/api/gerar-link';
  const API_PROXY_IMAGEM = '/api/proxy-imagem';

  // Cache em memória de links rastreados para evitar chamadas redundantes
  // chave: `${originUrl}_${plataforma}` -> shortLink
  const linkCache = new Map();

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
  let selectedShopeeCategories = new Set(); // Inicia vazio (nenhuma categoria pré-selecionada)

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

  // ================= GERADOR DE LINK RASTREADO SHOPEE =================
  async function obterLinkRastreado(originUrl, plataforma) {
    if (!originUrl) return '';
    const cacheKey = `${originUrl}_${plataforma}`;
    if (linkCache.has(cacheKey)) {
      return linkCache.get(cacheKey);
    }

    try {
      const data = await safeFetchJson(API_GERAR_LINK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          originUrl,
          plataforma
        })
      });

      const finalLink = data.shortLink || originUrl;
      linkCache.set(cacheKey, finalLink);
      return finalLink;
    } catch (err) {
      console.warn('Fallback ao link original devido a erro na API:', err.message);
      linkCache.set(cacheKey, originUrl);
      return originUrl;
    }
  }

  // Ação de Compartilhar via WhatsApp ou Pinterest
  async function dispararCompartilhamento(item, plataforma, btnElement) {
    if (plataforma === 'pinterest') {
      abrirModalPinterest(item);
      return;
    }

    const originalHtml = btnElement ? btnElement.innerHTML : '';
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.innerHTML = `
        <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      `;
    }

    try {
      const originUrl = item.offerLink || item.link_afiliado || item.productLink || '';
      const shortLink = await obterLinkRastreado(originUrl, plataforma);

      const precoFmt = (item.priceMin || item.preco || 0).toFixed(2).replace('.', ',');
      const notaFmt = (item.ratingStar || item.nota || 4.8).toFixed(1);
      const vendasFmt = item.sales || item.vendas || 0;
      const titulo = item.productName || item.titulo || 'Achadinho Shopee';

      if (plataforma === 'whatsapp') {
        const copyWhatsapp = `🔥 *${titulo}*\n💰 Por apenas *R$ ${precoFmt}*\n⭐ Nota ${notaFmt} | ${vendasFmt} vendidos\n\n👉 Garanta aqui: ${shortLink}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(copyWhatsapp)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }

      showToast(`Link de ${plataforma} gerado com sucesso!`);
    } catch (err) {
      showToast(`Erro ao gerar link de ${plataforma}: ${err.message}`, true);
    } finally {
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHtml;
      }
    }
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
      badgeCatCount.className = 'text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full';
      catDrawerSummary.textContent = 'Selecionar categorias';
      catDrawerSummary.classList.add('text-slate-400');
    } else {
      badgeCatCount.className = 'text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full';
      const labels = SHOPEE_CATEGORIAS_OFICIAIS
        .filter(c => selectedShopeeCategories.has(c.id))
        .map(c => c.label.split(' ')[0]);
      catDrawerSummary.textContent = labels.join(', ');
      catDrawerSummary.classList.remove('text-slate-400');
    }

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
      linkCache.clear();
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

    // Modal Criar Novo Pin (Pinterest)
    setupPinterestModalEvents();
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

  // ================= MINERAÇÃO GRANULAR =================
  async function executarMineracaoGranular() {
    const targetsToMine = [];

    SHOPEE_CATEGORIAS_OFICIAIS.forEach(cat => {
      if (selectedShopeeCategories.has(cat.id)) {
        cat.keywords.forEach(kw => {
          targetsToMine.push({ query: kw, defaultCat: cat.siteCat });
        });
      }
    });

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

  // Renderizar itens minerados com botões de compartilhamento integrados
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
                <!-- Botões de Compartilhamento Rastreado -->
                <button 
                  type="button" 
                  data-action="share-wa" 
                  data-id="${item.itemId}" 
                  class="btn-share-miner-wa p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors cursor-pointer"
                  title="Compartilhar no WhatsApp com link rastreado"
                >
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.32z"/>
                  </svg>
                </button>

                <button 
                  type="button" 
                  data-action="share-pin" 
                  data-id="${item.itemId}" 
                  class="btn-share-miner-pin p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors cursor-pointer"
                  title="Salvar no Pinterest com link rastreado"
                >
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.48.03-3.55.14-.98.92-3.9 1.13-4.78-.11-.22-.38-.97-.38-2.26 0-2.12 1.23-3.7 2.76-3.7 1.3 0 1.93.98 1.93 2.15 0 1.31-.83 3.27-1.27 5.09-.36 1.52.77 2.76 2.27 2.76 2.72 0 4.82-2.87 4.82-7.01 0-3.67-2.64-6.23-6.4-6.23-4.36 0-6.91 3.27-6.91 6.64 0 1.32.51 2.73 1.14 3.5.13.15.14.28.1.52-.11.45-.35 1.43-.4 1.62-.06.27-.22.33-.5.2-1.85-.86-3-3.56-3-5.73 0-4.67 3.39-8.96 9.78-8.96 5.23 0 9.3 3.73 9.3 8.71 0 5.2-3.28 9.39-7.83 9.39-1.53 0-2.97-.8-3.46-1.74l-.94 3.59c-.34 1.32-1.26 2.97-1.88 3.98A12 12 0 1 0 12 0z"/>
                  </svg>
                </button>

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

    // Eventos nos checkboxes da mineração
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

    // Eventos nos selects de categoria
    document.querySelectorAll('.select-categoria-miner').forEach(sel => {
      sel.addEventListener('change', (e) => {
        mineradosCategoryMap[e.target.dataset.id] = e.target.value;
      });
    });

    // Eventos de Compartilhamento WhatsApp (Minerados)
    document.querySelectorAll('.btn-share-miner-wa').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = mineradosList.find(p => p.itemId === id);
        if (item) await dispararCompartilhamento(item, 'whatsapp', btn);
      });
    });

    // Eventos de Compartilhamento Pinterest (Minerados)
    document.querySelectorAll('.btn-share-miner-pin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = mineradosList.find(p => p.itemId === id);
        if (item) await dispararCompartilhamento(item, 'pinterest', btn);
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

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Botões de Compartilhamento Rastreado nos Publicados -->
            <button 
              type="button" 
              data-id="${item.id}" 
              class="btn-share-pub-wa p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Compartilhar no WhatsApp com link rastreado"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.32z"/>
              </svg>
            </button>

            <button 
              type="button" 
              data-id="${item.id}" 
              class="btn-share-pub-pin p-2 rounded-xl bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Salvar no Pinterest com link rastreado"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.48.03-3.55.14-.98.92-3.9 1.13-4.78-.11-.22-.38-.97-.38-2.26 0-2.12 1.23-3.7 2.76-3.7 1.3 0 1.93.98 1.93 2.15 0 1.31-.83 3.27-1.27 5.09-.36 1.52.77 2.76 2.27 2.76 2.72 0 4.82-2.87 4.82-7.01 0-3.67-2.64-6.23-6.4-6.23-4.36 0-6.91 3.27-6.91 6.64 0 1.32.51 2.73 1.14 3.5.13.15.14.28.1.52-.11.45-.35 1.43-.4 1.62-.06.27-.22.33-.5.2-1.85-.86-3-3.56-3-5.73 0-4.67 3.39-8.96 9.78-8.96 5.23 0 9.3 3.73 9.3 8.71 0 5.2-3.28 9.39-7.83 9.39-1.53 0-2.97-.8-3.46-1.74l-.94 3.59c-.34 1.32-1.26 2.97-1.88 3.98A12 12 0 1 0 12 0z"/>
              </svg>
            </button>

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

    // Eventos de Compartilhamento WhatsApp (Publicados)
    document.querySelectorAll('.btn-share-pub-wa').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = publicadosList.find(p => String(p.id) === String(id));
        if (item) await dispararCompartilhamento(item, 'whatsapp', btn);
      });
    });

    // Eventos de Compartilhamento Pinterest (Publicados)
    document.querySelectorAll('.btn-share-pub-pin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = publicadosList.find(p => String(p.id) === String(id));
        if (item) await dispararCompartilhamento(item, 'pinterest', btn);
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

  // ================= AÇÕES DESTRUTIVAS =================
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

  // ================= MODAL: CRIAR NOVO PIN (PINTEREST) =================
  const modalPinterest = document.getElementById('modal-pinterest');
  const btnCloseModalPinterest = document.getElementById('btn-close-modal-pinterest');
  const pinLinkStatus = document.getElementById('pin-link-status');
  const pinInputLink = document.getElementById('pin-input-link');
  const btnCopyPinLink = document.getElementById('btn-copy-pin-link');

  const btnImgModeShopee = document.getElementById('btn-img-mode-shopee');
  const btnImgModeUrl = document.getElementById('btn-img-mode-url');
  const btnImgModeFile = document.getElementById('btn-img-mode-file');
  const pinBoxImgUrl = document.getElementById('pin-box-img-url');
  const pinInputCustomUrl = document.getElementById('pin-input-custom-url');
  const btnApplyCustomUrl = document.getElementById('btn-apply-custom-url');
  const pinBoxImgFile = document.getElementById('pin-box-img-file');
  const pinInputFile = document.getElementById('pin-input-file');
  const btnTriggerFilePick = document.getElementById('btn-trigger-file-pick');
  const pinFileSelectedName = document.getElementById('pin-file-selected-name');

  const pinToggleCanvas = document.getElementById('pin-toggle-canvas');
  const pinCanvasOptions = document.getElementById('pin-canvas-options');
  const pinStyleClean = document.getElementById('pin-style-clean');
  const pinStyleOrange = document.getElementById('pin-style-orange');
  const pinShowPriceToggle = document.getElementById('pin-show-price-toggle');

  const pinPreviewDim = document.getElementById('pin-preview-dim');
  const pinPreviewSimpleWrap = document.getElementById('pin-preview-simple-wrap');
  const pinPreviewImg = document.getElementById('pin-preview-img');
  const pinPreviewCanvasWrap = document.getElementById('pin-preview-canvas-wrap');
  const pinCanvas = document.getElementById('pin-canvas');

  const pinInputTitulo = document.getElementById('pin-input-titulo');
  const pinCounterTitulo = document.getElementById('pin-counter-titulo');
  const btnCopyPinTitulo = document.getElementById('btn-copy-pin-titulo');

  const pinInputDesc = document.getElementById('pin-input-desc');
  const btnCopyPinDesc = document.getElementById('btn-copy-pin-desc');

  const pinQuickShareNotice = document.getElementById('pin-quick-share-notice');
  const btnPinPublicarRapido = document.getElementById('btn-pin-publicar-rapido');
  const btnPinBaixarArte = document.getElementById('btn-pin-baixar-arte');
  const btnPinBaixarLabel = document.getElementById('btn-pin-baixar-label');
  const btnPinAbrirCriador = document.getElementById('btn-pin-abrir-criador');

  let currentPinItem = null;
  let currentPinImgMode = 'shopee'; // 'shopee', 'url', 'file'
  let currentPinCustomUrl = '';
  let currentPinFileDataUrl = '';
  let isPinCanvasMode = false;
  let currentPinCanvasStyle = 'clean'; // 'clean', 'orange'
  let isPinShowPrice = true;
  let pinCanvasRenderToken = 0;

  function getProxyImageUrl(rawUrl) {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:')) return rawUrl;
    const isShopee = /susercontent\.com|shopee\.com\.br|shopee\.com/i.test(rawUrl);
    if (isShopee) {
      return `${API_PROXY_IMAGEM}?url=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  }

  function getActivePinImageUrl() {
    if (currentPinImgMode === 'file') {
      return currentPinFileDataUrl;
    }
    if (currentPinImgMode === 'url' && currentPinCustomUrl) {
      return currentPinCustomUrl;
    }
    return (currentPinItem && (currentPinItem.imageUrl || currentPinItem.imagem)) || '';
  }

  function updatePinImageTabsUI() {
    if (!btnImgModeShopee || !btnImgModeUrl || !btnImgModeFile) return;
    const tabs = [
      { btn: btnImgModeShopee, mode: 'shopee' },
      { btn: btnImgModeUrl, mode: 'url' },
      { btn: btnImgModeFile, mode: 'file' }
    ];

    tabs.forEach(({ btn, mode }) => {
      if (currentPinImgMode === mode) {
        btn.className = 'pin-img-tab min-h-[42px] px-2 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer bg-red-600/20 border-red-500 text-white';
      } else {
        btn.className = 'pin-img-tab min-h-[42px] px-2 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer bg-slate-800 border-slate-700 text-slate-300 hover:text-white';
      }
    });

    if (currentPinImgMode === 'url') {
      if (pinBoxImgUrl) pinBoxImgUrl.classList.remove('hidden');
      if (pinBoxImgFile) pinBoxImgFile.classList.add('hidden');
    } else if (currentPinImgMode === 'file') {
      if (pinBoxImgFile) pinBoxImgFile.classList.remove('hidden');
      if (pinBoxImgUrl) pinBoxImgUrl.classList.add('hidden');
    } else {
      if (pinBoxImgUrl) pinBoxImgUrl.classList.add('hidden');
      if (pinBoxImgFile) pinBoxImgFile.classList.add('hidden');
    }
  }

  function updatePinStyleButtons() {
    if (!pinStyleClean || !pinStyleOrange) return;
    if (currentPinCanvasStyle === 'clean') {
      pinStyleClean.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all bg-slate-700 text-white cursor-pointer';
      pinStyleOrange.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
    } else {
      pinStyleOrange.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all bg-orange-600 text-white cursor-pointer';
      pinStyleClean.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
    }
  }

  function copyTextWithFeedback(btn, text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const txtSpan = btn.querySelector('.btn-copy-text');
      if (txtSpan) {
        const prev = txtSpan.textContent;
        txtSpan.textContent = 'Copiado!';
        setTimeout(() => { txtSpan.textContent = prev; }, 2000);
      }
      showToast(`${label} copiado com sucesso!`);
    }).catch(() => {
      showToast(`Erro ao copiar ${label}`, true);
    });
  }

  function drawCanvasRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawCanvasWrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
    const words = (text || '').trim().split(/\s+/);
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line ? `${line} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = words[n];
        if (lines.length === maxLines - 1) {
          const remaining = words.slice(n).join(' ');
          let lastLine = remaining;
          while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 3) {
            lastLine = lastLine.slice(0, -1);
          }
          lines.push(lastLine + '...');
          line = '';
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line && lines.length < maxLines) {
      lines.push(line);
    }

    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], x, y + (k * lineHeight));
    }
  }

  async function renderPinCanvas(imgUrl) {
    if (!pinCanvas) return;
    const currentToken = ++pinCanvasRenderToken;
    const ctx = pinCanvas.getContext('2d');
    const W = 1000;
    const H = 1500;

    // 1. Fundo (Background)
    if (currentPinCanvasStyle === 'clean') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, '#F8FAFC');
      grad.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#E60023';
      ctx.fillRect(0, 0, W, 10);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#EE4D2D');
      grad.addColorStop(0.7, '#EA580C');
      grad.addColorStop(1, '#C2410C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Selo Superior: "Achadinho Shopee • Mimi Ofertas"
    ctx.save();
    const pillText = "ACHADINHO SHOPEE • MIMI OFERTAS";
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const pillMetrics = ctx.measureText(pillText);
    const pillW = pillMetrics.width + 48;
    const pillH = 46;
    const pillX = (W - pillW) / 2;
    const pillY = 56;

    if (currentPinCanvasStyle === 'clean') {
      ctx.fillStyle = '#FEE2E2';
      ctx.strokeStyle = '#FECACA';
      ctx.lineWidth = 1.5;
      drawCanvasRoundRect(ctx, pillX, pillY, pillW, pillH, 23, true, true);
      ctx.fillStyle = '#DC2626';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      drawCanvasRoundRect(ctx, pillX, pillY, pillW, pillH, 23, true, true);
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pillText, W / 2, pillY + (pillH / 2));
    ctx.restore();

    // 3. Moldura da Imagem (Card Branco Centralizado)
    const cardX = 75;
    const cardY = 126;
    const cardW = 850;
    const cardH = 850;
    const cardRadius = 36;

    ctx.save();
    if (currentPinCanvasStyle === 'clean') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3;
      drawCanvasRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius, true, true);
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = '#FFFFFF';
      drawCanvasRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius, true, false);
    }
    ctx.restore();

    // 4. Desenhar Foto do Produto
    if (imgUrl) {
      try {
        const resolvedSrc = getProxyImageUrl(imgUrl);
        const loadedImg = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Imagem indisponível'));
          img.src = resolvedSrc;
        });

        if (currentToken !== pinCanvasRenderToken) return;

        ctx.save();
        const imgInset = 16;
        const imgBoxX = cardX + imgInset;
        const imgBoxY = cardY + imgInset;
        const imgBoxW = cardW - (imgInset * 2);
        const imgBoxH = cardH - (imgInset * 2);

        drawCanvasRoundRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, cardRadius - 8, false, false);
        ctx.clip();

        const aspect = loadedImg.width / loadedImg.height;
        let dW, dH, dX, dY;
        if (aspect > 1) {
          dW = imgBoxW;
          dH = imgBoxW / aspect;
          dX = imgBoxX;
          dY = imgBoxY + (imgBoxH - dH) / 2;
        } else {
          dH = imgBoxH;
          dW = imgBoxH * aspect;
          dX = imgBoxX + (imgBoxW - dW) / 2;
          dY = imgBoxY;
        }
        ctx.drawImage(loadedImg, dX, dY, dW, dH);
        ctx.restore();
      } catch (err) {
        ctx.save();
        ctx.fillStyle = '#F8FAFC';
        drawCanvasRoundRect(ctx, cardX + 16, cardY + 16, cardW - 32, cardH - 32, 24, true, false);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Foto do Produto', W / 2, cardY + (cardH / 2));
        ctx.restore();
      }
    }

    // 5. Badge de Desconto (se houver desconto)
    const desconto = (currentPinItem && currentPinItem.desconto) || 0;
    if (desconto > 0) {
      ctx.save();
      const discText = `-${desconto}% OFF`;
      ctx.font = '900 24px -apple-system, sans-serif';
      const discW = ctx.measureText(discText).width + 36;
      const discH = 44;
      const discX = cardX + 24;
      const discY = cardY + 24;

      ctx.fillStyle = '#DC2626';
      drawCanvasRoundRect(ctx, discX, discY, discW, discH, 22, true, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(discText, discX + (discW / 2), discY + (discH / 2));
      ctx.restore();
    }

    // 6. Título do Pin (em 2 linhas)
    ctx.save();
    const tituloTexto = (pinInputTitulo && pinInputTitulo.value.trim()) || (currentPinItem && (currentPinItem.productName || currentPinItem.titulo)) || 'Achadinho Shopee';
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = currentPinCanvasStyle === 'clean' ? '#0F172A' : '#FFFFFF';
    drawCanvasWrapText(ctx, tituloTexto, W / 2, 1010, 840, 48, 2);
    ctx.restore();

    // 7. Avaliação e Vendas
    ctx.save();
    const nota = (currentPinItem && (currentPinItem.ratingStar || currentPinItem.nota)) || 4.9;
    const notaFmt = Number(nota).toFixed(1);
    const vendas = (currentPinItem && (currentPinItem.sales || currentPinItem.vendas)) || 0;
    const ratingStr = `★ ${notaFmt}  •  ${vendas} vendidos`;

    ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = currentPinCanvasStyle === 'clean' ? '#D97706' : '#FDE047';
    ctx.fillText(ratingStr, W / 2, 1120);
    ctx.restore();

    // 8. Selo de Preço em Destaque (se ligado)
    if (isPinShowPrice) {
      ctx.save();
      const precoVal = (currentPinItem && (currentPinItem.priceMin || currentPinItem.preco)) || 0;
      const precoFmt = Number(precoVal).toFixed(2).replace('.', ',');
      const priceText = `R$ ${precoFmt}`;

      ctx.font = '900 56px -apple-system, sans-serif';
      const pMetrics = ctx.measureText(priceText);
      const tagW = Math.max(pMetrics.width + 110, 360);
      const tagH = 92;
      const tagX = (W - tagW) / 2;
      const tagY = 1175;

      if (currentPinCanvasStyle === 'clean') {
        ctx.shadowColor = 'rgba(238, 77, 45, 0.35)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#EE4D2D';
        drawCanvasRoundRect(ctx, tagX, tagY, tagW, tagH, 28, true, false);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('POR APENAS', W / 2, tagY + 12);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 50px -apple-system, sans-serif';
        ctx.fillText(priceText, W / 2, tagY + 34);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#FFFFFF';
        drawCanvasRoundRect(ctx, tagX, tagY, tagW, tagH, 28, true, false);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#9A3412';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('POR APENAS', W / 2, tagY + 12);

        ctx.fillStyle = '#EE4D2D';
        ctx.font = '900 50px -apple-system, sans-serif';
        ctx.fillText(priceText, W / 2, tagY + 34);
      }
      ctx.restore();
    }

    // 9. Chamada para Ação no Rodapé (CTA)
    ctx.save();
    const ctaY = isPinShowPrice ? 1310 : 1230;
    const ctaText = "👉 TOQUE NO PIN PARA GARANTIR NA SHOPEE";
    ctx.font = 'bold 24px -apple-system, sans-serif';
    const ctaMetrics = ctx.measureText(ctaText);
    const ctaW = ctaMetrics.width + 56;
    const ctaH = 54;
    const ctaX = (W - ctaW) / 2;

    if (currentPinCanvasStyle === 'clean') {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      drawCanvasRoundRect(ctx, ctaX, ctaY, ctaW, ctaH, 27, true, true);
      ctx.fillStyle = '#0F172A';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      drawCanvasRoundRect(ctx, ctaX, ctaY, ctaW, ctaH, 27, true, true);
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ctaText, W / 2, ctaY + (ctaH / 2));
    ctx.restore();
  }

  function updatePinPreview() {
    const activeUrl = getActivePinImageUrl();

    if (isPinCanvasMode) {
      if (pinPreviewSimpleWrap) pinPreviewSimpleWrap.classList.add('hidden');
      if (pinPreviewCanvasWrap) pinPreviewCanvasWrap.classList.remove('hidden');
      if (pinPreviewDim) pinPreviewDim.textContent = '1000×1500 (2:3)';
      if (btnPinBaixarLabel) btnPinBaixarLabel.textContent = 'Baixar Arte (PNG)';

      if (btnPinPublicarRapido) btnPinPublicarRapido.disabled = true;
      if (pinQuickShareNotice) pinQuickShareNotice.classList.remove('hidden');

      renderPinCanvas(activeUrl);
    } else {
      if (pinPreviewCanvasWrap) pinPreviewCanvasWrap.classList.add('hidden');
      if (pinPreviewSimpleWrap) pinPreviewSimpleWrap.classList.remove('hidden');
      if (pinPreviewDim) pinPreviewDim.textContent = 'Formato original';
      if (btnPinBaixarLabel) btnPinBaixarLabel.textContent = 'Baixar Imagem';

      if (pinPreviewImg && activeUrl) {
        pinPreviewImg.src = activeUrl;
      }

      if (currentPinImgMode === 'file') {
        if (btnPinPublicarRapido) btnPinPublicarRapido.disabled = true;
        if (pinQuickShareNotice) pinQuickShareNotice.classList.remove('hidden');
      } else {
        if (btnPinPublicarRapido) btnPinPublicarRapido.disabled = false;
        if (pinQuickShareNotice) pinQuickShareNotice.classList.add('hidden');
      }
    }
  }

  async function abrirModalPinterest(item) {
    currentPinItem = item;
    currentPinImgMode = 'shopee';
    currentPinCustomUrl = '';
    currentPinFileDataUrl = '';
    isPinCanvasMode = false;
    currentPinCanvasStyle = 'clean';
    isPinShowPrice = true;

    if (pinToggleCanvas) pinToggleCanvas.checked = false;
    if (pinCanvasOptions) pinCanvasOptions.classList.add('hidden');
    if (pinShowPriceToggle) pinShowPriceToggle.checked = true;
    updatePinStyleButtons();

    if (pinInputCustomUrl) pinInputCustomUrl.value = '';
    if (pinFileSelectedName) pinFileSelectedName.textContent = 'Escolher imagem da galeria ou computador';
    updatePinImageTabsUI();

    const precoVal = item.priceMin || item.preco || 0;
    const precoFmt = Number(precoVal).toFixed(2).replace('.', ',');
    const notaVal = item.ratingStar || item.nota || 4.8;
    const notaFmt = Number(notaVal).toFixed(1);
    const vendasVal = item.sales || item.vendas || 0;
    const titulo = item.productName || item.titulo || 'Achadinho Shopee';
    const categoria = (item.categoria || '').trim();
    const hashtagNicho = categoria ? ` #${categoria.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';

    const titleTrunc = titulo.slice(0, 100);
    if (pinInputTitulo) {
      pinInputTitulo.value = titleTrunc;
    }
    if (pinCounterTitulo) {
      pinCounterTitulo.textContent = `${titleTrunc.length}/100`;
    }

    const descPadrao = `🔥 Achadinho Shopee imperdível!\n💰 Por apenas R$ ${precoFmt}\n⭐ Avaliação ${notaFmt} | ${vendasVal} vendidos\n\n👉 Garanta com desconto no link:\n\n#shopee #achadinhos #ofertas #comprinhas${hashtagNicho}`;
    if (pinInputDesc) {
      pinInputDesc.value = descPadrao;
    }

    if (pinInputLink) {
      pinInputLink.value = 'Gerando link rastreado...';
    }
    if (pinLinkStatus) {
      pinLinkStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin"></span> Gerando...';
    }

    if (modalPinterest) {
      modalPinterest.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    updatePinPreview();

    const originUrl = item.offerLink || item.link_afiliado || item.productLink || '';
    try {
      const shortLink = await obterLinkRastreado(originUrl, 'pinterest');
      if (pinInputLink) pinInputLink.value = shortLink;
      if (pinLinkStatus) pinLinkStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> subId: pinterest';
    } catch (err) {
      if (pinInputLink) pinInputLink.value = originUrl;
      if (pinLinkStatus) pinLinkStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> link padrão';
    }
  }

  function fecharModalPinterest() {
    if (modalPinterest) {
      modalPinterest.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
    currentPinItem = null;
  }

  function selectPinImageMode(mode) {
    currentPinImgMode = mode;
    updatePinImageTabsUI();
    updatePinPreview();
  }

  function applyCustomPinUrl() {
    const raw = (pinInputCustomUrl && pinInputCustomUrl.value) ? pinInputCustomUrl.value.trim() : '';
    if (!raw) {
      showToast('Digite uma URL válida de imagem.', true);
      return;
    }
    currentPinCustomUrl = raw;
    showToast('Imagem por URL aplicada!');
    updatePinPreview();
  }

  function publicarRapidoPin() {
    if (isPinCanvasMode || currentPinImgMode === 'file') {
      showToast('Para arte vertical ou arquivo local, baixe o arquivo e abra o Criador do Pinterest.', true);
      return;
    }

    const shortLink = (pinInputLink && pinInputLink.value.trim()) || (currentPinItem && (currentPinItem.offerLink || currentPinItem.link_afiliado || currentPinItem.productLink)) || '';
    const desc = (pinInputDesc && pinInputDesc.value.trim()) || '';
    const media = getActivePinImageUrl();

    if (!shortLink || !media) {
      showToast('Link ou imagem indisponíveis para publicação rápida.', true);
      return;
    }

    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shortLink)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(desc)}`;
    window.open(pinUrl, '_blank', 'noopener,noreferrer');
  }

  async function baixarImagemOuArtePin() {
    if (!currentPinItem) return;
    const safeTitle = (currentPinItem.productName || currentPinItem.titulo || 'produto')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);

    if (isPinCanvasMode) {
      try {
        const dataUrl = pinCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `pin-arte-${safeTitle}-1000x1500.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Arte vertical 1000×1500 baixada com sucesso!');
      } catch (err) {
        showToast('Erro ao exportar arte: ' + err.message, true);
      }
    } else {
      const activeUrl = getActivePinImageUrl();
      if (!activeUrl) return;

      if (currentPinImgMode === 'file' || activeUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.download = `pin-foto-${safeTitle}.png`;
        link.href = activeUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Imagem baixada com sucesso!');
      } else {
        try {
          const downloadUrl = getProxyImageUrl(activeUrl);
          const res = await fetch(downloadUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `pin-foto-${safeTitle}.jpg`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          showToast('Imagem baixada com sucesso!');
        } catch (err) {
          window.open(activeUrl, '_blank');
        }
      }
    }
  }

  function abrirCriadorPinsPinterest() {
    window.open('https://www.pinterest.com/pin-creation-tool/', '_blank', 'noopener,noreferrer');
    showToast('Criador do Pinterest aberto! Cole os campos copiados.');
  }

  function setupPinterestModalEvents() {
    if (btnCloseModalPinterest) btnCloseModalPinterest.addEventListener('click', fecharModalPinterest);
    if (modalPinterest) {
      modalPinterest.addEventListener('click', (e) => {
        if (e.target === modalPinterest) fecharModalPinterest();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalPinterest && !modalPinterest.classList.contains('hidden')) {
        fecharModalPinterest();
      }
    });

    if (btnCopyPinLink && pinInputLink) {
      btnCopyPinLink.addEventListener('click', () => copyTextWithFeedback(btnCopyPinLink, pinInputLink.value, 'Link'));
    }
    if (btnCopyPinTitulo && pinInputTitulo) {
      btnCopyPinTitulo.addEventListener('click', () => copyTextWithFeedback(btnCopyPinTitulo, pinInputTitulo.value, 'Título'));
    }
    if (btnCopyPinDesc && pinInputDesc) {
      btnCopyPinDesc.addEventListener('click', () => copyTextWithFeedback(btnCopyPinDesc, pinInputDesc.value, 'Descrição'));
    }

    if (btnImgModeShopee) btnImgModeShopee.addEventListener('click', () => selectPinImageMode('shopee'));
    if (btnImgModeUrl) btnImgModeUrl.addEventListener('click', () => selectPinImageMode('url'));
    if (btnImgModeFile) btnImgModeFile.addEventListener('click', () => selectPinImageMode('file'));

    if (btnApplyCustomUrl) btnApplyCustomUrl.addEventListener('click', applyCustomPinUrl);
    if (pinInputCustomUrl) {
      pinInputCustomUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyCustomPinUrl();
      });
    }

    if (btnTriggerFilePick && pinInputFile) {
      btnTriggerFilePick.addEventListener('click', () => pinInputFile.click());
    }
    if (pinInputFile) {
      pinInputFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (pinFileSelectedName) pinFileSelectedName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          currentPinFileDataUrl = evt.target.result;
          updatePinPreview();
        };
        reader.readAsDataURL(file);
      });
    }

    if (pinToggleCanvas) {
      pinToggleCanvas.addEventListener('change', () => {
        isPinCanvasMode = pinToggleCanvas.checked;
        if (pinCanvasOptions) {
          if (isPinCanvasMode) pinCanvasOptions.classList.remove('hidden');
          else pinCanvasOptions.classList.add('hidden');
        }
        updatePinPreview();
      });
    }

    if (pinStyleClean) {
      pinStyleClean.addEventListener('click', () => {
        currentPinCanvasStyle = 'clean';
        updatePinStyleButtons();
        if (isPinCanvasMode) updatePinPreview();
      });
    }
    if (pinStyleOrange) {
      pinStyleOrange.addEventListener('click', () => {
        currentPinCanvasStyle = 'orange';
        updatePinStyleButtons();
        if (isPinCanvasMode) updatePinPreview();
      });
    }

    if (pinShowPriceToggle) {
      pinShowPriceToggle.addEventListener('change', () => {
        isPinShowPrice = pinShowPriceToggle.checked;
        if (isPinCanvasMode) updatePinPreview();
      });
    }

    if (pinInputTitulo) {
      pinInputTitulo.addEventListener('input', () => {
        const len = pinInputTitulo.value.length;
        if (pinCounterTitulo) pinCounterTitulo.textContent = `${len}/100`;
        if (isPinCanvasMode) renderPinCanvas(getActivePinImageUrl());
      });
    }

    if (btnPinPublicarRapido) btnPinPublicarRapido.addEventListener('click', publicarRapidoPin);
    if (btnPinBaixarArte) btnPinBaixarArte.addEventListener('click', baixarImagemOuArtePin);
    if (btnPinAbrirCriador) btnPinAbrirCriador.addEventListener('click', abrirCriadorPinsPinterest);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
