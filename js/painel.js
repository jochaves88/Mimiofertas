/**
 * Mimi Ofertas - Painel Gerenciador e Minerador Shopee
 * Lógica 100% Mobile-First, com requisições granulares anti-timeout e diagnóstico HTTP resiliente
 */

(function () {
  const API_MINERAR = '/api/minerar';
  const API_PUBLICAR = '/api/publicar';

  let adminPassword = sessionStorage.getItem('mimi_admin_password') || '';
  let activeTab = 'minerar';
  let mineradosList = [];
  let publicadosList = [];
  let selectedIds = new Set();
  let categoryMap = {};

  // Elementos do DOM
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

  // Mineração Feed & Controles
  const btnIniciarMineracao = document.getElementById('btn-iniciar-mineracao');
  const iconMinerBtn = document.getElementById('icon-miner-btn');
  const labelMinerBtn = document.getElementById('label-miner-btn');
  const statusMineracaoBox = document.getElementById('status-mineracao-box');
  const statusMineracaoTxt = document.getElementById('status-mineracao-txt');
  const btnToggleSelectAll = document.getElementById('btn-toggle-select-all');
  const mineracaoResultsGrid = document.getElementById('mineracao-results-grid');

  // Publicados Feed & Controles
  const searchPublicados = document.getElementById('search-publicados');
  const btnRecarregarPublicados = document.getElementById('btn-recarregar-publicados');
  const publicadosListDiv = document.getElementById('publicados-list');

  // Mobile Footer Action Bar
  const mobileActionBar = document.getElementById('mobile-action-bar');
  const selectedCounter = document.getElementById('selected-counter');
  const btnSelecionarTodosFooter = document.getElementById('btn-selecionar-todos-footer');
  const btnPublicarSelecionados = document.getElementById('btn-publicar-selecionados');
  const btnPublicarLabel = document.getElementById('btn-publicar-label');

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

  // Função utilitária segura para fetch com verificação estrita de JSON e status
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
    if (adminPassword) {
      loginModal.classList.add('hidden');
      loadPublicados();
    } else {
      loginModal.classList.remove('hidden');
    }
    setupEventListeners();
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

    // Accordion Filtros
    btnToggleFiltros.addEventListener('click', () => {
      formMineracao.classList.toggle('hidden');
      iconChevronFiltros.classList.toggle('rotate-180');
    });

    // Submissão da Mineração
    formMineracao.addEventListener('submit', async (e) => {
      e.preventDefault();
      await executarMineracaoGranular();
    });

    // Seleção em massa
    btnToggleSelectAll.addEventListener('click', toggleSelectAll);
    btnSelecionarTodosFooter.addEventListener('click', toggleSelectAll);

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
      mobileActionBar.classList.remove('hidden');
    } else {
      tabMinerar.classList.add('hidden');
      tabPublicados.classList.remove('hidden');
      tabBtnPublicados.classList.add('border-orange-500', 'text-orange-400');
      tabBtnPublicados.classList.remove('border-transparent', 'text-slate-400');
      tabBtnMinerar.classList.remove('border-orange-500', 'text-orange-400');
      tabBtnMinerar.classList.add('border-transparent', 'text-slate-400');
      mobileActionBar.classList.add('hidden');
      loadPublicados();
    }
  }

  // ================= MINERAÇÃO GRANULAR (LOOP NO FRONTEND COM BARRA DE PROGRESSO) =================
  async function executarMineracaoGranular() {
    const rawKeywords = document.getElementById('filter-keywords').value;
    const keywords = rawKeywords.split(',').map(s => s.trim()).filter(Boolean);

    if (keywords.length === 0) {
      showToast('Insira ao menos uma palavra-chave para minerar.', true);
      return;
    }

    const pagIni = parseInt(document.getElementById('filter-pag-ini').value, 10) || 1;
    const pagFim = parseInt(document.getElementById('filter-pag-fim').value, 10) || 3;
    const precoMin = parseFloat(document.getElementById('filter-preco-min').value) || 0;
    const precoMax = parseFloat(document.getElementById('filter-preco-max').value) || 999999;
    const vendasMin = parseInt(document.getElementById('filter-vendas-min').value, 10) || 0;
    const vendasMax = parseInt(document.getElementById('filter-vendas-max').value, 10) || 999999;
    const comissaoPctMin = parseFloat(document.getElementById('filter-comissao-pct').value) || 0;
    const comissaoReaisMin = parseFloat(document.getElementById('filter-comissao-reais').value) || 0;
    const notaMin = parseFloat(document.getElementById('filter-nota-min').value) || 0;

    // Calcular o total de passos para a barra de progresso
    const steps = [];
    for (const kw of keywords) {
      for (let p = pagIni; p <= pagFim; p++) {
        steps.push({ keyword: kw, page: p });
      }
    }

    const totalSteps = steps.length;
    let completedSteps = 0;
    const itensAcumulados = new Map();

    // UI Loading com barra de progresso
    btnIniciarMineracao.disabled = true;
    labelMinerBtn.textContent = 'Minerando...';
    iconMinerBtn.innerHTML = `
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    `;
    iconMinerBtn.classList.add('animate-spin');

    mineracaoResultsGrid.innerHTML = `
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
        <div class="flex items-center justify-between text-xs text-slate-400 font-bold">
          <span id="progress-step-txt">Iniciando requisições...</span>
          <span id="progress-pct-txt">0%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60">
          <div id="progress-bar-fill" class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300 w-0"></div>
        </div>
        <p id="progress-sub-txt" class="text-xs text-slate-500">Executando chamadas individuais para evitar timeouts.</p>
      </div>
    `;

    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressStepTxt = document.getElementById('progress-step-txt');
    const progressPctTxt = document.getElementById('progress-pct-txt');
    const progressSubTxt = document.getElementById('progress-sub-txt');

    try {
      for (const step of steps) {
        if (progressStepTxt) {
          progressStepTxt.textContent = `Buscando "${step.keyword}" (página ${step.page})...`;
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
              keyword: step.keyword,
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
                itensAcumulados.set(item.itemId, item);
              }
            }
          }
        } catch (stepErr) {
          console.warn(`Erro no passo ${step.keyword} p${step.page}:`, stepErr.message);
          // Continua os outros passos mesmo que uma página falhe
        }

        completedSteps++;
        const pct = Math.round((completedSteps / totalSteps) * 100);
        if (progressBarFill) progressBarFill.style.width = `${pct}%`;
        if (progressPctTxt) progressPctTxt.textContent = `${pct}%`;
      }

      // Ordenar por maior comissão em Reais
      mineradosList = Array.from(itensAcumulados.values()).sort((a, b) => b.commission - a.commission);
      selectedIds.clear();
      updateSelectedCounter();

      statusMineracaoBox.classList.remove('hidden');
      statusMineracaoTxt.textContent = `${mineradosList.length} ofertas mineradas (ordenadas por maior comissão)`;

      // Fechar accordion de filtros
      formMineracao.classList.add('hidden');
      iconChevronFiltros.classList.remove('rotate-180');

      renderMinerados();
      showToast(`${mineradosList.length} ofertas encontradas!`);
    } catch (err) {
      mineracaoResultsGrid.innerHTML = `
        <div class="p-6 bg-red-950/40 border border-red-800 rounded-3xl text-center">
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
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
          <p class="text-sm text-slate-400">Nenhum produto atendeu aos critérios deste filtro.</p>
          <p class="text-xs text-slate-500 mt-1">Experimente reduzir a nota mínima ou ampliar a faixa de preço.</p>
        </div>
      `;
      return;
    }

    mineracaoResultsGrid.innerHTML = mineradosList.map(item => {
      const isSelected = selectedIds.has(item.itemId);
      const catAtual = categoryMap[item.itemId] || guessCategory(item.productName);
      categoryMap[item.itemId] = catAtual;

      return `
        <div class="bg-slate-900 border ${isSelected ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-800'} rounded-3xl p-4 flex flex-col sm:flex-row gap-4 transition-all">
          
          <div class="relative w-full sm:w-28 h-44 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 shrink-0">
            <img src="${item.imageUrl}" alt="${item.productName}" class="w-full h-full object-cover"/>
            
            <label class="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer">
              <input 
                type="checkbox" 
                data-id="${item.itemId}" 
                class="item-checkbox w-4 h-4 text-orange-600 rounded bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                ${isSelected ? 'checked' : ''}
              />
            </label>

            <div class="absolute bottom-2 right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
              +R$ ${item.commission.toFixed(2)}
            </div>
          </div>

          <div class="flex-1 flex flex-col justify-between space-y-2.5">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ${item.commissionRate}% de Comissão
                </span>
                <div class="flex items-center gap-1 text-xs text-amber-400 font-bold">
                  <span>★ ${item.ratingStar.toFixed(1)}</span>
                  <span class="text-slate-500 font-normal">(${item.sales} vend.)</span>
                </div>
              </div>

              <h4 class="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 mt-1 leading-snug">
                ${item.productName}
              </h4>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div class="text-base font-black text-orange-400">
                R$ ${item.priceMin.toFixed(2).replace('.', ',')}
              </div>

              <div class="flex items-center gap-2">
                <select 
                  data-id="${item.itemId}" 
                  class="select-categoria bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
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
                  class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
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

    document.querySelectorAll('.item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateSelectedCounter();
        const card = e.target.closest('.rounded-3xl');
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

    document.querySelectorAll('.select-categoria').forEach(sel => {
      sel.addEventListener('change', (e) => {
        categoryMap[e.target.dataset.id] = e.target.value;
      });
    });
  }

  function guessCategory(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('panela') || n.includes('fritadeira') || n.includes('pote') || n.includes('copo') || n.includes('cozinha') || n.includes('air fryer') || n.includes('faca')) return 'cozinha';
    if (n.includes('fone') || n.includes('bluetooth') || n.includes('projetor') || n.includes('carregador') || n.includes('led') || n.includes('relogio') || n.includes('smart')) return 'eletronicos';
    if (n.includes('skincare') || n.includes('serum') || n.includes('escova') || n.includes('maquiagem') || n.includes('cabelo') || n.includes('batom') || n.includes('beleza')) return 'beleza';
    return 'casa';
  }

  function toggleSelectAll() {
    if (selectedIds.size === mineradosList.length) {
      selectedIds.clear();
    } else {
      mineradosList.forEach(item => selectedIds.add(item.itemId));
    }
    renderMinerados();
    updateSelectedCounter();
  }

  function updateSelectedCounter() {
    const count = selectedIds.size;
    selectedCounter.textContent = `${count} ${count === 1 ? 'produto' : 'produtos'}`;
    btnPublicarSelecionados.disabled = count === 0;
    btnPublicarLabel.textContent = count > 0 ? `Publicar (${count})` : 'Publicar no Site';
  }

  // ================= PUBLICAÇÃO NO GITHUB =================
  async function publicarItensSelecionados() {
    if (selectedIds.size === 0) return;

    const itensParaPublicar = mineradosList
      .filter(item => selectedIds.has(item.itemId))
      .map(item => {
        return {
          id: String(item.itemId),
          titulo: item.productName,
          preco: item.priceMin,
          preco_original: parseFloat((item.priceMin * 1.5).toFixed(2)),
          desconto: 33,
          nota: item.ratingStar,
          vendas: item.sales,
          categoria: categoryMap[item.itemId] || 'casa',
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
      selectedIds.clear();
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

  // ================= CARREGAR E GERENCIAR PUBLICADOS =================
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
      renderPublicados();
    } catch (err) {
      publicadosListDiv.innerHTML = `
        <div class="p-4 bg-red-950/40 border border-red-800 rounded-2xl text-center text-xs text-red-300">
          Erro ao carregar do GitHub: ${err.message}
        </div>
      `;
    }
  }

  function renderPublicados(query = '') {
    const filtrados = publicadosList.filter(p => {
      if (!query) return true;
      return (p.titulo || '').toLowerCase().includes(query) || (p.categoria || '').toLowerCase().includes(query);
    });

    if (filtrados.length === 0) {
      publicadosListDiv.innerHTML = `
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-xs text-slate-400">
          Nenhum produto publicado encontrado.
        </div>
      `;
      return;
    }

    publicadosListDiv.innerHTML = filtrados.map(item => {
      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="${item.imagem}" alt="${item.titulo}" class="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0"/>
            <div class="truncate">
              <span class="text-[10px] font-bold uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">${item.categoria}</span>
              <h5 class="text-xs font-bold text-white truncate mt-0.5">${item.titulo}</h5>
              <div class="text-xs text-slate-400 mt-0.5">
                <span class="text-white font-bold">R$ ${item.preco.toFixed(2).replace('.', ',')}</span> • ★ ${item.nota} • ${item.vendas} vendas
              </div>
            </div>
          </div>

          <button 
            data-id="${item.id}" 
            class="btn-remover-item p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0 cursor-pointer"
            title="Remover do site"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-remover-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Deseja realmente remover este produto do site?')) return;
        await removerProdutoDoSite(id);
      });
    });
  }

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
          id: id,
          commitMessage: `chore: remove produto ${id} do catalogo`
        })
      });

      showToast('Produto removido com sucesso!');
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
