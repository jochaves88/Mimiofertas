function checkAuth(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'] || req.headers['X-Admin-Password'];
  if (!adminPassword || providedPassword !== adminPassword) {
    return false;
  }
  return true;
}

const ALLOWED_IMAGE_DOMAINS = ['susercontent.com', 'shopee.com.br', 'shopee.com'];

function isAllowedShopeeImageUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_IMAGE_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const SCENARIO_PROMPTS = {
  auto: 'Choose the most natural, appealing Brazilian home setting that fits the product category (e.g., cozy living room, modern kitchen counter, clean bedroom dresser, or tidy desk).',
  mao_segurando: 'A person naturally holding the product in one hand inside a sunlit Brazilian home, soft natural background bokeh, authentic everyday smartphone snapshot.',
  ambiente_casa: 'The product placed naturally in real everyday use on a wooden table, kitchen countertop, shelf, or cozy home surface in a Brazilian apartment.',
  unboxing: 'The product freshly unboxed on a light-toned wooden table next to a plain brown cardboard shipping box and tissue paper, natural window lighting.'
};

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no ambiente Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const imageUrl = String(body.imageUrl || '').trim();
    const titulo = String(body.titulo || 'Shopee product').trim();
    const categoria = String(body.categoria || 'home').trim();
    const cenario = String(body.cenario || 'auto').toLowerCase().trim();

    if (!imageUrl || !isAllowedShopeeImageUrl(imageUrl)) {
      return res.status(400).json({
        error: 'URL de imagem inválida. Informe uma URL válida dos domínios Shopee (susercontent.com, shopee.com.br ou shopee.com).'
      });
    }

    // 1. Baixar imagem original da Shopee em base64
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!imgRes.ok) {
      return res.status(502).json({
        error: `Falha ao baixar imagem da Shopee (HTTP ${imgRes.status}).`
      });
    }

    const contentType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const inputBase64 = imgBuffer.toString('base64');

    // 2. Montar prompt UGC vertical 2:3 fiel ao produto
    const sceneInstruction = SCENARIO_PROMPTS[cenario] || SCENARIO_PROMPTS.auto;
    const prompt = [
      `Create a realistic UGC (User Generated Content) lifestyle photograph of this exact product ("${titulo}", category: "${categoria}") taken with a modern smartphone.`,
      'Use warm, natural daylight from a window inside a real, lived-in Brazilian home.',
      'Compose the image in a vertical 2:3 aspect ratio (portrait orientation, ideal for Pinterest).',
      'CRITICAL: Keep the product from the reference image completely faithful in shape, proportions, colors, textures, and details.',
      sceneInstruction,
      'Do NOT add any text, prices, stickers, logos, badges, borders, or watermarks anywhere in the image. Pure realistic photography only.'
    ].join(' ');

    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: inputBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({
        error: `Erro na API Gemini Imagem (${geminiRes.status}): ${errText.slice(0, 200)}`
      });
    }

    const geminiData = await geminiRes.json();
    const parts = geminiData?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData && p.inlineData.data);

    if (!imagePart) {
      return res.status(502).json({
        error: 'O modelo Gemini não retornou nenhuma imagem UGC.'
      });
    }

    const outBase64 = imagePart.inlineData.data;
    const outMime = imagePart.inlineData.mimeType || 'image/png';

    // 3. Upload opcional para ImgBB se IMGBB_API_KEY estiver configurada
    const imgbbKey = process.env.IMGBB_API_KEY;
    if (imgbbKey) {
      try {
        const formParams = new URLSearchParams();
        formParams.append('image', outBase64);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formParams.toString()
        });

        if (imgbbRes.ok) {
          const imgbbJson = await imgbbRes.json();
          const hostedUrl = imgbbJson?.data?.url || imgbbJson?.url;
          if (hostedUrl) {
            return res.status(200).json({
              ugcUrl: hostedUrl,
              hosted: true
            });
          }
        }
      } catch (uploadErr) {
        console.warn('Falha no upload ImgBB, retornando base64:', uploadErr.message);
      }
    }

    return res.status(200).json({
      ugcUrl: `data:${outMime};base64,${outBase64}`,
      hosted: false
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno ao gerar imagem UGC.' });
  }
};
