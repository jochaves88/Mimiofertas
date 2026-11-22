function checkAuth(event) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  if (!adminPassword || providedPassword !== adminPassword) {
    return false;
  }
  return true;
}

const GITHUB_REPO = 'jochaves88/Mimiofertas';
const GITHUB_BRANCH = 'main';
const FILE_PATH = 'data/produtos.json';

async function getFileFromGithub(token) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MimiOfertas-NetlifyFunction'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao obter arquivo do GitHub (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    sha: data.sha,
    produtos: JSON.parse(content)
  };
}

async function updateFileOnGithub(token, sha, produtos, commitMessage) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const contentBase64 = Buffer.from(JSON.stringify(produtos, null, 2), 'utf-8').toString('base64');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'MimiOfertas-NetlifyFunction'
    },
    body: JSON.stringify({
      message: commitMessage || 'chore: atualiza catalogo data/produtos.json via painel',
      content: contentBase64,
      sha: sha,
      branch: GITHUB_BRANCH
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao comitar no GitHub (${res.status}): ${errorText}`);
  }

  return await res.json();
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!checkAuth(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado. Senha inválida.' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GITHUB_TOKEN não configurado nas variáveis de ambiente da Netlify.' })
    };
  }

  try {
    // GET: Retornar produtos atuais do GitHub
    if (event.httpMethod === 'GET') {
      const { sha, produtos } = await getFileFromGithub(token);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sha,
          produtos
        })
      };
    }

    // POST: Publicar novos itens ou remover itens existentes
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const action = body.action || 'adicionar'; // 'adicionar', 'remover', 'substituir'
      const { sha, produtos: produtosAtuais } = await getFileFromGithub(token);

      let novosProdutos = [...produtosAtuais];

      if (action === 'remover') {
        const idParaRemover = body.id;
        if (!idParaRemover) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID do produto é obrigatório para remoção.' }) };
        }
        novosProdutos = novosProdutos.filter(p => String(p.id) !== String(idParaRemover));
      } else if (action === 'substituir') {
        if (!Array.isArray(body.produtos)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Array de produtos é obrigatório.' }) };
        }
        novosProdutos = body.produtos;
      } else {
        // 'adicionar': recebe itens novos (da mineração ou formulário)
        const itensParaAdicionar = Array.isArray(body.produtos) ? body.produtos : [body.produto].filter(Boolean);
        
        for (const item of itensParaAdicionar) {
          // Mapear campos da Shopee para o formato do Mimi Ofertas
          const preco = parseFloat(item.preco ?? item.priceMin ?? 0);
          const precoOriginal = parseFloat(item.preco_original ?? (preco * 1.5).toFixed(2));
          const descontoCalculado = precoOriginal > preco 
            ? Math.round(((precoOriginal - preco) / precoOriginal) * 100) 
            : 30;

          const novoProdutoFormatado = {
            id: String(item.id || item.itemId || `shopee-${Date.now()}-${Math.floor(Math.random() * 1000)}`),
            titulo: item.titulo || item.productName || 'Achadinho Shopee',
            preco: preco,
            preco_original: precoOriginal,
            desconto: parseInt(item.desconto ?? descontoCalculado, 10),
            nota: parseFloat(item.nota ?? item.ratingStar ?? 4.8),
            vendas: parseInt(item.vendas ?? item.sales ?? 100, 10),
            categoria: (item.categoria || 'casa').toLowerCase(),
            imagem: item.imagem || item.imageUrl || '',
            link_afiliado: item.link_afiliado || item.offerLink || item.productLink || ''
          };

          // Evitar duplicações pelo id
          const indexExistente = novosProdutos.findIndex(p => String(p.id) === String(novoProdutoFormatado.id));
          if (indexExistente >= 0) {
            novosProdutos[indexExistente] = novoProdutoFormatado;
          } else {
            novosProdutos.unshift(novoProdutoFormatado); // Adiciona no início da vitrine
          }
        }
      }

      const commitMsg = body.commitMessage || `feat: atualiza produtos via painel (${novosProdutos.length} itens)`;
      const githubRes = await updateFileOnGithub(token, sha, novosProdutos, commitMsg);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Arquivo data/produtos.json atualizado com sucesso no GitHub!',
          commitSha: githubRes.commit?.sha,
          totalProdutos: novosProdutos.length,
          produtos: novosProdutos
        })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não suportado' }) };
  } catch (err) {
    console.error('Erro na função publicar:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao comunicar com GitHub: ' + err.message })
    };
  }
};
