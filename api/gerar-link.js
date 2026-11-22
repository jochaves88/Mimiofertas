const crypto = require('crypto');

function checkAuth(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'] || req.headers['X-Admin-Password'];
  if (!adminPassword || providedPassword !== adminPassword) {
    return false;
  }
  return true;
}

function generateShopeeSignature(appId, secret, timestamp, payloadStr) {
  const baseStr = `${appId}${timestamp}${payloadStr}${secret}`;
  return crypto.createHash('sha256').update(baseStr, 'utf8').digest('hex');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado. Senha de admin inválida.' });
  }

  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_SECRET;

  if (!appId || !secret) {
    return res.status(500).json({
      error: 'SHOPEE_APP_ID ou SHOPEE_SECRET não configurados no ambiente Vercel.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const originUrl = (body.originUrl || '').trim();
    const plataforma = (body.plataforma || 'whatsapp').toLowerCase().trim();

    if (!originUrl) {
      return res.status(400).json({ error: 'Parâmetro originUrl é obrigatório.' });
    }

    const shopeeApiUrl = 'https://open-api.affiliate.shopee.com.br/graphql';
    const graphqlMutation = `
      mutation($originUrl: String!, $subIds: [String!]) {
        generateShortLink(input: { originUrl: $originUrl, subIds: $subIds }) {
          shortLink
        }
      }
    `;

    const payloadObj = {
      query: graphqlMutation,
      variables: {
        originUrl: originUrl,
        subIds: [plataforma]
      }
    };

    const payloadStr = JSON.stringify(payloadObj);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateShopeeSignature(appId, secret, timestamp, payloadStr);
    const authHeader = `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;

    const resShopee = await fetch(shopeeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: payloadStr
    });

    if (!resShopee.ok) {
      const errText = await resShopee.text();
      return res.status(200).json({
        success: true,
        shortLink: originUrl,
        fallback: true,
        warning: `Shopee API ${resShopee.status}: ${errText.slice(0, 150)}`
      });
    }

    const resJson = await resShopee.json();

    if (resJson.errors && resJson.errors.length > 0) {
      return res.status(200).json({
        success: true,
        shortLink: originUrl,
        fallback: true,
        warning: resJson.errors[0].message || 'Falha GraphQL'
      });
    }

    const shortLink = resJson?.data?.generateShortLink?.shortLink || originUrl;

    return res.status(200).json({
      success: true,
      originUrl,
      plataforma,
      shortLink
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Erro interno ao gerar link rastreado: ' + err.message
    });
  }
};
