module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
  }

  const targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Apenas URLs https:// são permitidas' });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const host = parsed.hostname.toLowerCase();
  const allowedSuffixes = ['susercontent.com', 'shopee.com.br', 'shopee.com'];
  const isAllowed = allowedSuffixes.some((s) => host === s || host.endsWith('.' + s));

  if (!isAllowed) {
    return res.status(400).json({ error: 'Domínio de imagem não permitido' });
  }

  try {
    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Erro upstream Shopee: ${upstreamRes.status}` });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: `Falha ao obter imagem: ${err.message}` });
  }
};
