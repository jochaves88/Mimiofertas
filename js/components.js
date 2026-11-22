/**
 * Mimi Ofertas - Reusable Header & Footer Components
 */

(function () {
  function renderHeader() {
    const headerContainer = document.getElementById('main-header');
    if (!headerContainer) return;

    // Detect active page
    const currentPath = window.location.pathname;
    const isHome = currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === '';
    const isSobre = currentPath.endsWith('sobre.html');
    const isTermos = currentPath.endsWith('termos.html');
    const isPrivacidade = currentPath.endsWith('privacidade.html');

    headerContainer.innerHTML = `
      <!-- Top banner de novidades -->
      <div class="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white text-xs font-semibold py-1.5 px-4 text-center tracking-wide shadow-inner">
        <div class="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>Achadinhos testados e verificados com cupons ativos na Shopee Brasil!</span>
        </div>
      </div>

      <!-- Main Navbar -->
      <nav class="bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm sticky top-0 z-40 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            <!-- Logo & Brand -->
            <a href="index.html" class="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg p-1">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  Mimi<span class="text-orange-600">Ofertas</span>
                </span>
                <span class="text-[10px] uppercase font-bold tracking-widest text-slate-600 -mt-1">Achadinhos Shopee</span>
              </div>
            </a>

            <!-- Navigation Links (Desktop) -->
            <div class="hidden md:flex items-center gap-6">
              <a href="index.html" class="font-medium text-sm transition-colors ${isHome ? 'text-orange-600 font-bold' : 'text-slate-600 hover:text-orange-600'}">Início</a>
              <a href="index.html#ofertas" class="font-medium text-sm text-slate-600 hover:text-orange-600 transition-colors">Ofertas em Destaque</a>
              <a href="sobre.html" class="font-medium text-sm transition-colors ${isSobre ? 'text-orange-600 font-bold' : 'text-slate-600 hover:text-orange-600'}">Sobre Nós</a>
              <a href="termos.html" class="font-medium text-sm transition-colors ${isTermos ? 'text-orange-600 font-bold' : 'text-slate-600 hover:text-orange-600'}">Termos</a>
              <a href="privacidade.html" class="font-medium text-sm transition-colors ${isPrivacidade ? 'text-orange-600 font-bold' : 'text-slate-600 hover:text-orange-600'}">Privacidade</a>
            </div>

            <!-- CTA Direto Shopee & Social -->
            <div class="flex items-center gap-2 sm:gap-3">
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="Pinterest do Mimi Ofertas" class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer" title="Siga no Pinterest">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.48.03-3.55.14-.98.92-3.9 1.13-4.78-.11-.22-.38-.97-.38-2.26 0-2.12 1.23-3.7 2.76-3.7 1.3 0 1.93.98 1.93 2.15 0 1.31-.83 3.27-1.27 5.09-.36 1.52.77 2.76 2.27 2.76 2.72 0 4.82-2.87 4.82-7.01 0-3.67-2.64-6.23-6.4-6.23-4.36 0-6.91 3.27-6.91 6.64 0 1.32.51 2.73 1.14 3.5.13.15.14.28.1.52-.11.45-.35 1.43-.4 1.62-.06.27-.22.33-.5.2-1.85-.86-3-3.56-3-5.73 0-4.67 3.39-8.96 9.78-8.96 5.23 0 9.3 3.73 9.3 8.71 0 5.2-3.28 9.39-7.83 9.39-1.53 0-2.97-.8-3.46-1.74l-.94 3.59c-.34 1.32-1.26 2.97-1.88 3.98A12 12 0 1 0 12 0z"/>
                </svg>
              </a>

              <a href="https://shopee.com.br" target="_blank" rel="noopener noreferrer nofollow sponsored" class="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 transition-all transform hover:-translate-y-0.5 cursor-pointer">
                <span>Shopee Oficial</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>

              <!-- Mobile Menu Toggle Button -->
              <button id="mobile-menu-toggle" type="button" class="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer" aria-label="Abrir menu de navegação">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>

          </div>

          <!-- Mobile Dropdown Menu -->
          <div id="mobile-menu" class="hidden md:hidden pb-4 pt-2 border-t border-slate-100 flex flex-col space-y-2">
            <a href="index.html" class="px-3 py-2 rounded-md text-sm font-medium ${isHome ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}">Início</a>
            <a href="index.html#ofertas" class="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Ofertas</a>
            <a href="sobre.html" class="px-3 py-2 rounded-md text-sm font-medium ${isSobre ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}">Sobre Nós</a>
            <a href="termos.html" class="px-3 py-2 rounded-md text-sm font-medium ${isTermos ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}">Termos de Uso</a>
            <a href="privacidade.html" class="px-3 py-2 rounded-md text-sm font-medium ${isPrivacidade ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}">Política de Privacidade</a>
          </div>

        </div>
      </nav>
    `;

    // Mobile menu toggle event
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (toggleBtn && mobileMenu) {
      toggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  }

  function renderFooter() {
    const footerContainer = document.getElementById('main-footer');
    if (!footerContainer) return;

    footerContainer.innerHTML = `
      <footer class="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            <!-- Coluna 1: Marca & Missão -->
            <div class="space-y-4 md:col-span-1">
              <a href="index.html" class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <span class="text-xl font-bold text-white tracking-tight">Mimi<span class="text-orange-500">Ofertas</span></span>
              </a>
              <p class="text-xs text-slate-400 leading-relaxed">
                Sua vitrine diária de achadinhos, tendências e descontos imperdíveis na Shopee Brasil. Curadoria independente para transformar suas compras.
              </p>
              
              <!-- Redes Sociais -->
              <div class="flex items-center gap-3 pt-2">
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="Pinterest" class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-colors">
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.98-.13-2.48.03-3.55.14-.98.92-3.9 1.13-4.78-.11-.22-.38-.97-.38-2.26 0-2.12 1.23-3.7 2.76-3.7 1.3 0 1.93.98 1.93 2.15 0 1.31-.83 3.27-1.27 5.09-.36 1.52.77 2.76 2.27 2.76 2.72 0 4.82-2.87 4.82-7.01 0-3.67-2.64-6.23-6.4-6.23-4.36 0-6.91 3.27-6.91 6.64 0 1.32.51 2.73 1.14 3.5.13.15.14.28.1.52-.11.45-.35 1.43-.4 1.62-.06.27-.22.33-.5.2-1.85-.86-3-3.56-3-5.73 0-4.67 3.39-8.96 9.78-8.96 5.23 0 9.3 3.73 9.3 8.71 0 5.2-3.28 9.39-7.83 9.39-1.53 0-2.97-.8-3.46-1.74l-.94 3.59c-.34 1.32-1.26 2.97-1.88 3.98A12 12 0 1 0 12 0z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="Instagram" class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600 transition-colors">
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Coluna 2: Categorias Rápidas -->
            <div>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Categorias</h4>
              <ul class="space-y-2 text-xs">
                <li><a href="index.html?cat=casa" class="hover:text-orange-400 transition-colors">Casa & Decoração</a></li>
                <li><a href="index.html?cat=cozinha" class="hover:text-orange-400 transition-colors">Cozinha Prática</a></li>
                <li><a href="index.html?cat=beleza" class="hover:text-orange-400 transition-colors">Beleza & Cuidados</a></li>
                <li><a href="index.html?cat=eletronicos" class="hover:text-orange-400 transition-colors">Eletrônicos & Smart</a></li>
              </ul>
            </div>

            <!-- Coluna 3: Links Institucionais -->
            <div>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Institucional</h4>
              <ul class="space-y-2 text-xs">
                <li><a href="sobre.html" class="hover:text-orange-400 transition-colors">Sobre a Mimi Ofertas</a></li>
                <li><a href="termos.html" class="hover:text-orange-400 transition-colors">Termos de Uso</a></li>
                <li><a href="privacidade.html" class="hover:text-orange-400 transition-colors">Política de Privacidade</a></li>
                <li><a href="termos.html#afiliados" class="hover:text-orange-400 transition-colors">Transparência de Afiliados</a></li>
              </ul>
            </div>

            <!-- Coluna 4: Aviso Legal & Integridade -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Aviso de Afiliado</h4>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                O site <strong class="text-slate-200">Mimi Ofertas</strong> participa do Programa de Afiliados da Shopee e outras plataformas parceiras. Podemos receber comissões por compras qualificadas sem qualquer custo adicional para o comprador. Preços e disponibilidade sujeitos a alteração direta na loja do anunciante.
              </p>
              <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300">
                🔒 Navegação segura & links verificados.
              </div>
            </div>

          </div>

          <!-- Linha Inferior com Copyright -->
          <div class="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>&copy; ${new Date().getFullYear()} Mimi Ofertas. Todos os direitos reservados.</p>
            <p class="flex items-center gap-1 text-[11px]">
              Desenvolvido com foco em alta performance e conformidade com APIs oficiais (Pinterest / Meta / Shopee).
            </p>
          </div>
        </div>
      </footer>
    `;
  }

  // Executa quando o DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderHeader();
      renderFooter();
    });
  } else {
    renderHeader();
    renderFooter();
  }
})();
