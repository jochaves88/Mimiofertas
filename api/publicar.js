function checkAuth(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'] || req.headers['X-Admin-Password'];
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
      'User-Agent': 'MimiOfertas-VercelFunction'
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
      'User-Agent': 'MimiOfertas-VercelFunction'
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'GITHUB_TOKEN não configurado nas variáveis de ambiente da Vercel.'
    });
  }

  try {
    // GET: Retornar produtos atuais do GitHub
    if (req.method === 'GET') {
      const { sha, produtos } = await getFileFromGithub(token);
      return res.status(200).json({
        success: true,
        sha,
        produtos
      });
    }

    // POST: Publicar novos itens ou remover itens existentes
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const action = body.action || 'adicionar';
      const { sha, produtos: produtosAtuais } = await getFileFromGithub(token);

      let novosProdutos = [...produtosAtuais];

      if (action === 'remover') {
        const idParaRemover = body.id;
        if (!idParaRemover) {
          return res.status(400).json({ error: 'ID do produto é obrigatório para remoção.' });
        }
        novosProdutos = novosProdutos.filter(p => String(p.id) !== String(idParaRemover));
      } else if (action === 'substituir') {
        if (!Array.isArray(body.produtos)) {
          return res.status(400).json({ error: 'Array de produtos é obrigatório.' });
        }
        novosProdutos = body.produtos;
      } else {
        const itensParaAdicionar = Array.isArray(body.produtos) ? body.produtos : [body.produto].filter(Boolean);

        for (const item of itensParaAdicionar) {
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

          const indexExistente = novosProdutos.findIndex(p => String(p.id) === String(novoProdutoFormatado.id));
          if (indexExistente >= 0) {
            novosProdutos[indexExistente] = novoProdutoFormatado;
          } else {
            novosProdutos.unshift(novoProdutoFormatado);
          }
        }
      }

      const commitMsg = body.commitMessage || `feat: atualiza produtos via painel (${novosProdutos.length} itens)`;
      const githubRes = await updateFileOnGithub(token, sha, novosProdutos, commitMsg);

      return res.status(200).json({
        success: true,
        message: 'Arquivo data/produtos.json atualizado com sucesso no GitHub!',
        commitSha: githubRes.commit?.sha,
        totalProdutos: novosProdutos.length,
        produtos: novosProdutos
      });
    }

    return res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    return res.status(500).json({
      error: 'Erro ao comunicar com GitHub: ' + err.message
    });
  }
};
