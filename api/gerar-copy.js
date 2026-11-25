function checkAuth(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'] || req.headers['X-Admin-Password'];
  if (!adminPassword || providedPassword !== adminPassword) {
    return false;
  }
  return true;
}

const TRIGGER_INSTRUCTIONS = {
  auto: 'Escolha e combine os melhores gatilhos mentais (prova social, benefício prático e urgência leve) de forma natural e humana.',
  escassez: 'Use gatilho de escassez e urgência realista (poucas unidades, oferta relâmpago ou preço promocional que pode subir), sem parecer spam.',
  prova_social: 'Destaque a prova social real usando a nota de avaliação e o volume de vendas (ex.: milhares de compradores satisfeitos, queridinho da Shopee).',
  curiosidade: 'Desperte curiosidade genuína na primeira linha (ex.: "O achadinho que está salvando a rotina...", "Por que todo mundo está comprando isso?").',
  beneficio: 'Foque no benefício prático imediato e na facilidade que o produto traz para o dia a dia em casa.'
};

function stripMarkdownFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no ambiente Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const titulo = String(body.titulo || '').trim();
    const preco = Number(body.preco || 0);
    const nota = Number(body.nota || 4.8);
    const vendas = Number(body.vendas || 0);
    const categoria = String(body.categoria || 'geral').trim();
    const plataforma = String(body.plataforma || 'pinterest').toLowerCase().trim();
    const gatilho = String(body.gatilho || 'auto').toLowerCase().trim();

    if (!titulo) {
      return res.status(400).json({ error: 'Parâmetro titulo é obrigatório.' });
    }

    if (plataforma !== 'pinterest' && plataforma !== 'whatsapp') {
      return res.status(400).json({ error: 'Plataforma inválida. Use "pinterest" ou "whatsapp".' });
    }

    const triggerGuide = TRIGGER_INSTRUCTIONS[gatilho] || TRIGGER_INSTRUCTIONS.auto;
    const precoFmt = preco > 0 ? `R$ ${preco.toFixed(2).replace('.', ',')}` : 'preço promocional';
    const notaFmt = nota > 0 ? nota.toFixed(1) : '4.8';

    let prompt = '';
    if (plataforma === 'pinterest') {
      prompt = `Você é um copywriter brasileiro especialista em Pinterest SEO e achadinhos da Shopee.
Escreva em português do Brasil natural, humano e persuasivo, sem parecer robô ou spam, sem excesso de exclamações.

Dados do produto:
- Título: ${titulo}
- Preço: ${precoFmt}
- Avaliação: ${notaFmt} estrelas
- Vendas: ${vendas} vendidos
- Categoria: ${categoria}

Diretriz de gatilho mental: ${triggerGuide}

Retorne APENAS um JSON válido exatamente neste formato:
{
  "title": "título atrativo com SEO de busca no Pinterest, máximo 95 caracteres",
  "description": "descrição persuasiva com gatilho mental, benefício claro, CTA sutil para clicar no link e exatamente 4 hashtags relevantes no final, máximo 450 caracteres no total",
  "keywords": "exatamente 5 palavras-chave de busca separadas por vírgula"
}`;
    } else {
      prompt = `Você é um copywriter brasileiro especialista em grupos de ofertas e achadinhos no WhatsApp.
Escreva em português do Brasil natural, direto, próximo e persuasivo, sem parecer robô ou spam.

Dados do produto:
- Título: ${titulo}
- Preço: ${precoFmt}
- Avaliação: ${notaFmt} estrelas
- Vendas: ${vendas} vendidos
- Categoria: ${categoria}

Diretriz de gatilho mental: ${triggerGuide}

Regras da mensagem:
- Curta e escaneável com emojis na medida certa e quebras de linha.
- Use negrito do WhatsApp (*texto*) apenas nos pontos-chave (nome curto ou preço).
- NÃO invente URLs e NÃO inclua links, pois o link rastreado será adicionado logo abaixo da mensagem.
- Termine com uma chamada para ação curta convidando a clicar no link abaixo.

Retorne APENAS um JSON válido exatamente neste formato:
{
  "message": "texto completo pronto para enviar no WhatsApp"
}`;
    }

    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({
        error: `Erro na API Gemini (${geminiRes.status}): ${errText.slice(0, 200)}`
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(stripMarkdownFences(rawText));

    if (plataforma === 'pinterest') {
      const title = String(parsed.title || titulo).trim().slice(0, 95);
      const description = String(parsed.description || '').trim().slice(0, 450);
      const keywordsList = String(parsed.keywords || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
        .slice(0, 5);

      return res.status(200).json({
        title,
        description,
        keywords: keywordsList.join(', ')
      });
    }

    const message = String(parsed.message || '').trim();
    return res.status(200).json({ message });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno ao gerar copy com IA.' });
  }
};
