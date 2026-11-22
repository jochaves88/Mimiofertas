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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  if (!checkAuth(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado. Senha de admin inválida.' }) };
  }

  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_SECRET;

  if (!appId || !secret) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'SHOPEE_APP_ID ou SHOPEE_SECRET não configurados no ambiente Netlify.' })
    };
  }

  try {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON de requisição malformado.' }) };
    }

    // Recebe apenas 1 keyword e 1 página por requisição (respostas ultra rápidas < 2s)
    const keyword = (body.keyword || 'achadinhos').toString().trim();
    const page = parseInt(body.page, 10) || 1;

    // Filtros opcionais aplicados nesta página
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

    const payloadObj = {
      query: graphqlQuery,
      variables: {
        keyword: keyword,
        page: page,
        limit: 50
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
      return {
        statusCode: resShopee.status,
        headers,
        body: JSON.stringify({ 
          error: `Erro retornado pela API da Shopee (${resShopee.status}): ${errText.slice(0, 200)}` 
        })
      };
    }

    const resJson = await resShopee.json();
    if (resJson.errors && resJson.errors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Erro GraphQL Shopee: ${resJson.errors[0].message || 'Falha na consulta'}` 
        })
      };
    }

    const nodes = resJson?.data?.productOfferV2?.nodes || [];
    const hasNextPage = resJson?.data?.productOfferV2?.pageInfo?.hasNextPage || false;

    // Filtragem dos itens recebidos nesta página
    const itensFiltrados = [];

    for (const item of nodes) {
      if (!item || !item.itemId) continue;

      const price = parseFloat(item.priceMin) || 0;
      const sales = parseInt(item.sales, 10) || 0;
      const rating = parseFloat(item.ratingStar) || 0;

      let commRate = parseFloat(item.commissionRate) || 0;
      if (commRate > 0 && commRate <= 1) {
        commRate = commRate * 100;
      }

      let commValue = parseFloat(item.commission) || 0;
      if (commValue === 0 && commRate > 0 && price > 0) {
        commValue = (price * commRate) / 100;
      }

      if (price < precoMin || price > precoMax) continue;
      if (sales < vendasMin || sales > vendasMax) continue;
      if (rating < notaMin) continue;
      if (commRate < comissaoPctMin) continue;
      if (commValue < comissaoReaisMin) continue;

      itensFiltrados.push({
        itemId: String(item.itemId),
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        keyword,
        page,
        hasNextPage,
        totalPagina: itensFiltrados.length,
        produtos: itensFiltrados
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno ao processar mineração: ' + err.message })
    };
  }
};
