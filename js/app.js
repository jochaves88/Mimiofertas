/**
 * Mimi Ofertas - App Logic (Filtros, Busca Instantânea, Ordenação e Compartilhamento Social)
 * Compatível com as 14 categorias da Shopee + Compartilhamento com UTM (?p=[id]&utm_source=...)
 * Suporte a destaque de produto único via parâmetro ?p=[id] na URL
 */

(function () {
  let allProducts = [];
  let currentCategory = 'todas';
  let searchQuery = '';
  let currentSort = 'relevancia';
  let targetProductId = null; // Lido do ?p=[id]

  const productGrid = document.getElementById('produtos-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const categoryChips = document.querySelectorAll('.category-chip');
  const resultsCounter = document.getElementById('results-counter');
  const btnVerTodasOfertas = document.getElementById('btn-ver-todas-ofertas');

  // Scroll horizontal com setas no desktop
  const catScrollLeft = document.getElementById('cat-scroll-left');
  const catScrollRight = document.getElementById('cat-scroll-right');
  const categoriesScrollContainer = document.getElementById('categories-scroll-container');

  // Normalização de texto para comparações robustas
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  const CATEGORY_MAP = {
    'todas': ['todas'],
    'casa': ['casa', 'casa e decoracao', 'decoracao', 'decoracao casa'],
    'cozinha': ['cozinha', 'cozinha e utilidades', 'utilidades', 'cozinha pratica'],
    'beleza': ['beleza', 'beleza e cuidados', 'skincare', 'beleza & skincare', 'cuidados'],
    'celulares': ['celulares', 'celulares e acessorios', 'acessorios celular', 'celular'],
    'eletronicos': ['eletronicos', 'audio e eletronicos', 'eletronicos & smart', 'audio'],
    'moda': ['moda', 'moda feminina', 'roupas'],
    'bolsas': ['bolsas', 'bolsas e acessorios', 'malas'],
    'ferramentas': ['ferramentas', 'ferramentas e construcao', 'construcao'],
    'esporte': ['esporte', 'esporte e lazer', 'lazer', 'fitness'],
    'saude': ['saude', 'saude e bem-estar', 'bem-estar'],
    'pet': ['pet', 'pet shop', 'animais'],
    'papelaria': ['papelaria', 'papelaria e escritorio', 'escritorio'],
    'automotivo': ['automotivo', 'acessorios veiculares', 'carro'],
    'bebes': ['bebes', 'bebes e brinquedos', 'brinquedos', 'infantil']
  };

  // Inicialização
  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar se abriu com um produto específico (?p=[id])
    const pParam = urlParams.get('p');
    if (pParam) {
      targetProductId = pParam.trim();
    }

    const catParam = urlParams.get('cat');
    if (catParam) {
      currentCategory = normalizeText(catParam);
      updateActiveCategoryChip(currentCategory);
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
          <div class="col-span-full text-center py-10 bg-white rounded-2xl border border-red-100 shadow-sm p-4">
            <svg class="w-10 h-10 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-sm font-bold text-slate-800">Não foi possível carregar as ofertas</h3>
            <p class="text-xs text-slate-500 mt-1">Verifique sua conexão ou tente novamente em instantes.</p>
          </div>
        `;
      }
    }
  }

  // Configurar listeners de interação
  function setupEventListeners() {
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = normalizeText(e.target.value);
        targetProductId = null; // Cancela foco em produto único na busca
        applyFiltersAndRender();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
      });
    }

    categoryChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.category;
        currentCategory = cat;
        targetProductId = null; // Cancela foco em produto único ao mudar categoria
        updateActiveCategoryChip(cat);
        applyFiltersAndRender();
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });

    if (btnVerTodasOfertas) {
      btnVerTodasOfertas.addEventListener('click', () => {
        currentCategory = 'todas';
        targetProductId = null;
        updateActiveCategoryChip('todas');
        applyFiltersAndRender();
      });
    }

    if (catScrollLeft && categoriesScrollContainer) {
      catScrollLeft.addEventListener('click', () => {
        categoriesScrollContainer.scrollBy({ left: -220, behavior: 'smooth' });
      });
    }

    if (catScrollRight && categoriesScrollContainer) {
      catScrollRight.addEventListener('click', () => {
        categoriesScrollContainer.scrollBy({ left: 220, behavior: 'smooth' });
      });
    }
  }

  function updateActiveCategoryChip(targetCat) {
    categoryChips.forEach((btn) => {
      const btnCat = btn.dataset.category;
      if (btnCat === targetCat) {
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        btn.classList.add('bg-orange-600', 'text-white', 'border-orange-600', 'shadow-xs');
      } else {
        btn.classList.remove('bg-orange-600', 'text-white', 'border-orange-600', 'shadow-xs');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
      }
    });
  }

  function matchesCategory(prodCategory, selectedKey) {
    if (selectedKey === 'todas') return true;
    const prodCatNorm = normalizeText(prodCategory);
    const keyNorm = normalizeText(selectedKey);

    if (prodCatNorm === keyNorm) return true;

    const validVariants = CATEGORY_MAP[keyNorm] || [keyNorm];
    return validVariants.some(variant => {
      const vNorm = normalizeText(variant);
      return prodCatNorm.includes(vNorm) || vNorm.includes(prodCatNorm);
    });
  }

  // Filtragem e Ordenação
  function applyFiltersAndRender() {
    let filtered = [];

    // Se houver um produto específico solicitado via ?p=[id]
    if (targetProductId) {
      const foundProduct = allProducts.find(p => String(p.id) === String(targetProductId));
      if (foundProduct) {
        // Exibe o produto solicitado em primeiro lugar absoluto
        filtered = [foundProduct];
        renderProducts(filtered, true);
        return;
      }
    }

    filtered = allProducts.filter((product) => {
      const matchCat = matchesCategory(product.categoria, currentCategory);
      
      const titleNorm = normalizeText(product.titulo);
      const catNorm = normalizeText(product.categoria);
      const matchSearch =
        !searchQuery ||
        titleNorm.includes(searchQuery) ||
        catNorm.includes(searchQuery);

      return matchCat && matchSearch;
    });

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

    renderProducts(filtered, false);
  }

  function formatMoney(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatVendas(vendas) {
    if (vendas >= 1000) {
      return (vendas / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return vendas;
  }

  // Renderização dos Cards (Vitrine com links UTM para o próprio site)
  function renderProducts(products, isSingleHighlight = false) {
    if (!productGrid) return;

    if (resultsCounter) {
      if (isSingleHighlight) {
        resultsCounter.textContent = '1 oferta selecionada';
      } else {
        resultsCounter.textContent = `${products.length} ${products.length === 1 ? 'oferta' : 'ofertas'}`;
      }
    }

    if (products.length === 0) {
      productGrid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Base URL do site atual (sem querystrings antigas)
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

    let bannerHighlightHtml = '';
    if (isSingleHighlight) {
      bannerHighlightHtml = `
        <div class="col-span-full mb-2 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-300 flex items-center justify-between gap-3 shadow-xs">
          <div class="flex items-center gap-2">
            <span class="flex h-2.5 w-2.5 rounded-full bg-orange-600 animate-ping"></span>
            <span class="text-xs font-bold text-orange-950">Você abriu um achadinho compartilhado!</span>
          </div>
          <button 
            type="button" 
            id="btn-limpar-foco" 
            class="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
          >
            Ver todas as ofertas
          </button>
        </div>
      `;
    }

    const cardsHtml = products
      .map((item) => {
        const precoStr = formatMoney(item.preco);
        const precoOrigStr = formatMoney(item.preco_original);

        // Links de compartilhamento na vitrine (WhatsApp direciona ao site com UTM, Pinterest vai direto para o link de afiliado da Shopee)
        const shareSiteUrlWhatsapp = `${baseUrl}?p=${encodeURIComponent(item.id)}&utm_source=whatsapp`;

        const waText = `🔥 *${item.titulo}*\n💰 Por apenas *${precoStr}* (-${item.desconto}% OFF)\n⭐ Nota ${item.nota.toFixed(1)} | ${formatVendas(item.vendas)} vendidos\n\n👉 Veja todos os detalhes e garanta o desconto aqui:\n${shareSiteUrlWhatsapp}`;
        const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

        const pinDesc = `${item.titulo} por apenas ${precoStr} no Mimi Ofertas! #shopee #achadinhos #ofertas`;
        const pinHref = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(item.link_afiliado)}&media=${encodeURIComponent(item.imagem)}&description=${encodeURIComponent(pinDesc)}`;

        return `
        <article class="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-orange-200 transition-all duration-300 flex flex-col overflow-hidden group">
          
          <!-- Imagem, Badges e Botões de Compartilhamento Flutuantes -->
          <div class="relative overflow-hidden aspect-square bg-slate-50">
            <img 
              src="${item.imagem}" 
              alt="${item.titulo}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            
            <!-- Badge Desconto -->
            <div class="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
              <span>-${item.desconto}%</span>
            </div>

            <!-- Categoria Tag -->
            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white font-medium text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full capitalize">
              ${item.categoria}
            </div>

            <!-- Mini Botões de Compartilhar Sobrepostos (WhatsApp & Pinterest) -->
            <div class="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <!-- WhatsApp -->
              <a 
                href="${waHref}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Compartilhar no WhatsApp"
                aria-label="Compartilhar no WhatsApp"
              >
                <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.32z"/>
                </svg>
              </a>

              <!-- Pinterest -->
              <a 
                href="${pinHref}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Salvar no Pinterest"
                aria-label="Salvar no Pinterest"
              >
                <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.48.03-3.55.14-.98.92-3.9 1.13-4.78-.11-.22-.38-.97-.38-2.26 0-2.12 1.23-3.7 2.76-3.7 1.3 0 1.93.98 1.93 2.15 0 1.31-.83 3.27-1.27 5.09-.36 1.52.77 2.76 2.27 2.76 2.72 0 4.82-2.87 4.82-7.01 0-3.67-2.64-6.23-6.4-6.23-4.36 0-6.91 3.27-6.91 6.64 0 1.32.51 2.73 1.14 3.5.13.15.14.28.1.52-.11.45-.35 1.43-.4 1.62-.06.27-.22.33-.5.2-1.85-.86-3-3.56-3-5.73 0-4.67 3.39-8.96 9.78-8.96 5.23 0 9.3 3.73 9.3 8.71 0 5.2-3.28 9.39-7.83 9.39-1.53 0-2.97-.8-3.46-1.74l-.94 3.59c-.34 1.32-1.26 2.97-1.88 3.98A12 12 0 1 0 12 0z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Conteúdo do Card -->
          <div class="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              <!-- Avaliação e Vendas -->
              <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5">
                <div class="flex items-center gap-0.5 text-amber-500 font-bold">
                  <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span>${item.nota.toFixed(1)}</span>
                </div>
                <span class="text-slate-400 text-[10px] sm:text-xs">${formatVendas(item.vendas)} vend.</span>
              </div>

              <!-- Título -->
              <h3 class="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug min-h-[32px] sm:min-h-[40px]">
                ${item.titulo}
              </h3>
            </div>

            <!-- Bloco de Preço e CTA -->
            <div class="mt-2.5 pt-2 border-t border-slate-100">
              <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 mb-2">
                <span class="text-slate-400 text-[10px] sm:text-xs line-through leading-none">${precoOrigStr}</span>
                <span class="text-base sm:text-xl font-black text-orange-600 tracking-tight leading-tight">${precoStr}</span>
              </div>

              <!-- CTA de Afiliado Touch-friendly -->
              <a 
                href="${item.link_afiliado}" 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                class="w-full min-h-[40px] py-2 px-2 sm:px-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Ver na Shopee</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </a>
            </div>

          </div>

        </article>
        `;
      })
      .join('');

    productGrid.innerHTML = bannerHighlightHtml + cardsHtml;

    // Listener para o botão de limpar foco
    const btnLimparFoco = document.getElementById('btn-limpar-foco');
    if (btnLimparFoco) {
      btnLimparFoco.addEventListener('click', () => {
        targetProductId = null;
        // Limpa parâmetro da URL suavemente sem reload
        if (window.history.pushState) {
          const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
          window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        }
        applyFiltersAndRender();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
