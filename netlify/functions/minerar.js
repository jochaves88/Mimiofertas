const crypto = require('crypto');

function checkAuth(event) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  if (!adminPassword || providedPassword !== adminPassword) {
    return false;
  }
  return true;
}

function generateShopeeSignature(appId, secret, timestamp, payloadStr) {
  const baseStr = `${appId}${timestamp}${payloadStr}${secret}`;
  return crypto.createHash('sha256').update(baseStr, 'utf8').digest('hex');
}

exports.handler = async (event) => {
  // Configurar CORS para o painel
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  if (!checkAuth(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado. Senha inválida.' }) };
  }

  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_SECRET;

  if (!appId || !secret) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Configuração de API Shopee ausente no ambiente (SHOPEE_APP_ID / SHOPEE_SECRET).' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Extrair parâmetros e filtros com defaults
    const keywords = Array.isArray(body.keywords) && body.keywords.length > 0 
      ? body.keywords 
      : ['organizador', 'cozinha', 'decoracao', 'fone bluetooth'];

    const paginaInicial = parseInt(body.paginaInicial, 10) || 1;
    const paginaFinal = parseInt(body.paginaFinal, 10) || 3;
    const precoMin = parseFloat(body.precoMin) || 0;
    const precoMax = parseFloat(body.precoMax) || 999999;
    const vendasMin = parseInt(body.vendasMin, 10) || 0;
    const vendasMax = parseInt(body.vendasMax, 10) || 999999;
    const comissaoPctMin = parseFloat(body.comissaoPctMin) || 0;
    const comissaoReaisMin = parseFloat(body.comissaoReaisMin) || 0;
    const notaMin = parseFloat(body.notaMin) || 0;

    const shopeeApiUrl = 'https://open-api.affiliate.shopee.com.br/graphql';
    const graphqlQuery = `
      query GetProductOffers($keyword: String, $page: Int, $limit: Int) {
        productOfferV2(keyword: $keyword, sortType: 5, page: $page, limit: $limit) {
          nodes {
            itemId
            productName
            priceMin
            sales
            ratingStar
            commissionRate
            commission
            imageUrl
            offerLink
            productLink
          }
          pageInfo {
            page
            limit
            hasNextPage
          }
        }
      }
    `;

    const rawOffers = [];

    // Iterar sobre keywords e páginas
    for (const keyword of keywords) {
      for (let page = paginaInicial; page <= paginaFinal; page++) {
        const payloadObj = {
          query: graphqlQuery,
          variables: {
            keyword: keyword.trim(),
            page: page,
            limit: 50
          }
        };

        const payloadStr = JSON.stringify(payloadObj);
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = generateShopeeSignature(appId, secret, timestamp, payloadStr);
        const authHeader = `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;

        try {
          const res = await fetch(shopeeApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: payloadStr
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error(`Shopee API error for ${keyword} p${page}:`, res.status, errText);
            continue;
          }

          const resJson = await res.json();
          const nodes = resJson?.data?.productOfferV2?.nodes;
          if (Array.isArray(nodes) && nodes.length > 0) {
            rawOffers.push(...nodes);
          }
        } catch (fetchErr) {
          console.error(`Fetch error for keyword "${keyword}" page ${page}:`, fetchErr);
        }
      }
    }

    // Deduplicar e aplicar filtros
    const seenItems = new Map();

    for (const item of rawOffers) {
      if (!item || !item.itemId) continue;
      const itemIdStr = String(item.itemId);
      if (seenItems.has(itemIdStr)) continue;

      const price = parseFloat(item.priceMin) || 0;
      const sales = parseInt(item.sales, 10) || 0;
      const rating = parseFloat(item.ratingStar) || 0;
      
      // commissionRate geralmente vem em fração ou porcentagem (ex: 0.12 ou 12)
      let commRate = parseFloat(item.commissionRate) || 0;
      if (commRate > 0 && commRate <= 1) {
        commRate = commRate * 100;
      }

      // commission estimada em R$
      let commValue = parseFloat(item.commission) || 0;
      if (commValue === 0 && commRate > 0 && price > 0) {
        commValue = (price * commRate) / 100;
      }

      // Aplicar filtros especificados
      if (price < precoMin || price > precoMax) continue;
      if (sales < vendasMin || sales > vendasMax) continue;
      if (rating < notaMin) continue;
      if (commRate < comissaoPctMin) continue;
      if (commValue < comissaoReaisMin) continue;

      seenItems.set(itemIdStr, {
        itemId: itemIdStr,
        productName: item.productName || 'Achadinho Shopee',
        priceMin: price,
        sales: sales,
        ratingStar: rating,
        commissionRate: parseFloat(commRate.toFixed(2)),
        commission: parseFloat(commValue.toFixed(2)),
        imageUrl: item.imageUrl || '',
        offerLink: item.offerLink || item.productLink || ''
      });
    }

    // Ordenar por maior valor de comissão em Reais
    const filteredResults = Array.from(seenItems.values()).sort((a, b) => b.commission - a.commission);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        totalEncontrado: filteredResults.length,
        produtos: filteredResults
      })
    };
  } catch (err) {
    console.error('Erro na função minerar:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno ao minerar ofertas: ' + err.message })
    };
  }
};
