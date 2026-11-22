/**
 * Mimi Ofertas - App Logic (Filtros, Busca Instantânea, Ordenação e Renderização)
 */

(function () {
  let allProducts = [];
  let currentCategory = 'todas';
  let searchQuery = '';
  let currentSort = 'relevancia';

  const productGrid = document.getElementById('produtos-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const categoryChips = document.querySelectorAll('.category-chip');
  const resultsCounter = document.getElementById('results-counter');

  // Inicialização
  async function init() {
    // Ler parâmetros de URL se existirem (ex: index.html?cat=casa)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
      currentCategory = catParam;
      updateActiveCategoryChip(catParam);
    }

    await loadProducts();
    setupEventListeners();
  }

  // Carregar JSON de produtos
  async function loadProducts() {
    try {
      const response = await fetch('data/produtos.json');
      if (!response.ok) throw new Error('Erro ao carregar dados dos produtos');
      allProducts = await response.json();
      applyFiltersAndRender();
    } catch (error) {
      console.error(error);
      if (productGrid) {
        productGrid.innerHTML = `
          <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-lg font-bold text-slate-800">Não foi possível carregar as ofertas</h3>
            <p class="text-sm text-slate-500 mt-1">Verifique sua conexão ou tente novamente em instantes.</p>
          </div>
        `;
      }
    }
  }

  // Configurar listeners de interação
  function setupEventListeners() {
    // Busca instantânea com debounce leve
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFiltersAndRender();
      });
    }

    // Ordenação
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
      });
    }

    // Categorias (chips)
    categoryChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.category;
        currentCategory = cat;
        updateActiveCategoryChip(cat);
        applyFiltersAndRender();
      });
    });
  }

  function updateActiveCategoryChip(cat) {
    categoryChips.forEach((btn) => {
      if (btn.dataset.category === cat) {
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        btn.classList.add('bg-orange-600', 'text-white', 'border-orange-600', 'shadow-sm', 'shadow-orange-600/30');
      } else {
        btn.classList.remove('bg-orange-600', 'text-white', 'border-orange-600', 'shadow-sm', 'shadow-orange-600/30');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
      }
    });
  }

  // Filtragem e Ordenação
  function applyFiltersAndRender() {
    let filtered = allProducts.filter((product) => {
      // Filtro categoria
      const matchCat = currentCategory === 'todas' || product.categoria === currentCategory;

      // Filtro busca
      const matchSearch =
        !searchQuery ||
        product.titulo.toLowerCase().includes(searchQuery) ||
        product.categoria.toLowerCase().includes(searchQuery);

      return matchCat && matchSearch;
    });

    // Ordenação
    if (currentSort === 'preco-asc') {
      filtered.sort((a, b) => a.preco - b.preco);
    } else if (currentSort === 'preco-desc') {
      filtered.sort((a, b) => b.preco - a.preco);
    } else if (currentSort === 'desconto') {
      filtered.sort((a, b) => b.desconto - a.desconto);
    } else if (currentSort === 'vendas') {
      filtered.sort((a, b) => b.vendas - a.vendas);
    } else if (currentSort === 'nota') {
      filtered.sort((a, b) => b.nota - a.nota);
    }

    renderProducts(filtered);
  }

  // Formatação de Moeda
  function formatMoney(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Formatação de Vendas
  function formatVendas(vendas) {
    if (vendas >= 1000) {
      return (vendas / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return vendas;
  }

  // Renderização dos Cards
  function renderProducts(products) {
    if (!productGrid) return;

    if (resultsCounter) {
      resultsCounter.textContent = `${products.length} ${products.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}`;
    }

    if (products.length === 0) {
      productGrid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    productGrid.innerHTML = products
      .map((item) => {
        return `
        <article class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col overflow-hidden group">
          
          <!-- Imagem e Badges -->
          <div class="relative overflow-hidden aspect-square bg-slate-50">
            <img 
              src="${item.imagem}" 
              alt="${item.titulo}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            
            <!-- Badge Desconto -->
            <div class="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <svg class="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
              </svg>
              <span>-${item.desconto}% OFF</span>
            </div>

            <!-- Categoria Tag -->
            <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white font-medium text-[11px] px-2.5 py-0.5 rounded-full capitalize">
              ${item.categoria}
            </div>
          </div>

          <!-- Conteúdo do Card -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <!-- Avaliação e Vendas -->
              <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                <div class="flex items-center gap-1 text-amber-500 font-bold">
                  <svg class="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span>${item.nota.toFixed(1)}</span>
                </div>
                <span class="text-slate-400">${formatVendas(item.vendas)} vendidos</span>
              </div>

              <!-- Título -->
              <h3 class="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-orange-600 transition-colors title-clamp leading-snug">
                ${item.titulo}
              </h3>
            </div>

            <!-- Bloco de Preço e CTA -->
            <div class="mt-4 pt-3 border-t border-slate-100">
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-slate-400 text-xs line-through">${formatMoney(item.preco_original)}</span>
                <span class="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">${formatMoney(item.preco)}</span>
              </div>

              <!-- CTA de Afiliado com atributos de conformidade -->
              <a 
                href="${item.link_afiliado}" 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                class="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 hover:shadow-md transition-all transform active:scale-[0.98] cursor-pointer"
              >
                <span>Ver na Shopee</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </a>
            </div>

          </div>

        </article>
        `;
      })
      .join('');
  }

  // Executa ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
