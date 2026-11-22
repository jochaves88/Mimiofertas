# Mimi Ofertas - Vitrine de Achadinhos & Afiliados Shopee

Vitrine moderna, responsiva, de alta conversão e ultra leve para achadinhos da Shopee Brasil. Estruturada especificamente para publicação estática no **GitHub Pages**, aprovação de compliance na API oficial do Pinterest/Meta e automação futura via script Python.

---

## 🚀 Tecnologias Utilizadas
- **HTML5 Semântico**
- **Tailwind CSS (CDN)**
- **Vanilla JavaScript Modular** (sem frameworks pesados ou dependências de compilação)
- **JSON Desacoplado** (`data/produtos.json`) para alimentação dinâmica e updates automáticos via bots/scripts

---

## 📁 Estrutura de Arquivos
```text
├── index.html          # Vitrine principal (Hero, Busca instantânea, Filtros e Grid de Cards)
├── sobre.html          # Apresentação da marca, curadoria e e-mail de contato
├── termos.html         # Termos de uso e aviso explícito de afiliado Shopee
├── privacidade.html    # Política de Privacidade (LGPD + Declaração de conformidade com APIs)
├── robots.txt          # Regras de indexação amigáveis ao Pinterestbot e Googlebot
├── sitemap.xml         # Mapa do site para SEO e validação do domínio
├── data/
│   └── produtos.json   # Base de dados dos produtos com campos padronizados
└── js/
    ├── components.js   # Header e Footer dinâmicos reutilizáveis em todas as páginas
    └── app.js          # Busca instantânea, filtros por categoria, ordenação e renderização
```

---

## 🤖 Atualização Automatizada via Python
O catálogo de ofertas é alimentado pelo arquivo `data/produtos.json`. Qualquer script Python de automação pode atualizar a vitrine simplesmente sobrescrevendo ou adicionando novos itens ao JSON com o seguinte formato:

```json
{
  "id": "prod-009",
  "titulo": "Nome do Produto Achadinho",
  "preco": 49.90,
  "preco_original": 99.00,
  "desconto": 50,
  "nota": 4.9,
  "vendas": 1500,
  "categoria": "casa",
  "imagem": "https://url-da-imagem.jpg",
  "link_afiliado": "https://shopee.com.br/link-de-afiliado"
}
```

---

## 🌐 Publicação no GitHub Pages
1. Faça commit e envie os arquivos para a branch `main`:
   ```bash
   git add .
   git commit -m "feat: site completo mimi ofertas"
   git push origin main
   ```
2. No repositório GitHub (`https://github.com/jochaves88/Mimiofertas`), vá em:
   - **Settings** > **Pages**
   - Em **Branch**, selecione `main` e a pasta `/(root)`.
   - Clique em **Save**.
3. O site estará disponível em `https://jochaves88.github.io/Mimiofertas/`.
