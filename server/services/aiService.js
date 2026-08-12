const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b:free';

function parseInsights(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const jsonText = text.startsWith('{') ? text : text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) {
    const error = new Error('AI_GENERATION_FORMAT_ERROR');
    error.statusCode = 502;
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    const error = new Error('AI_GENERATION_FORMAT_ERROR');
    error.statusCode = 502;
    throw error;
  }
  const validItems = (items) => Array.isArray(items) && items.length > 0 && items.every((item) => typeof item?.title === 'string' && typeof item?.reason === 'string');
  if (!parsed || !validItems(parsed.suggestions) || !validItems(parsed.improvements)) {
    const error = new Error('AI_GENERATION_FORMAT_ERROR');
    error.statusCode = 502;
    throw error;
  }
  return {
    suggestions: parsed.suggestions.map(({ title, reason }) => ({ title: title.trim(), reason: reason.trim() })),
    improvements: parsed.improvements.map(({ title, reason }) => ({ title: title.trim(), reason: reason.trim() })),
  };
}

/** Sends pre-calculated financial context to the LLM and returns two practical insights. */
exports.generateFinancialInsights = async (financialSummary) => {
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error('AI insights are not configured. Add OPENROUTER_API_KEY to the server .env file.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 800,
      reasoning: { effort: 'low' },
      provider: { allow_fallbacks: true },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a careful personal-finance assistant. Interpret the supplied aggregate financial summary only; do not perform basic calculations from raw transactions. Give concise, practical, non-judgmental guidance. Do not provide investment, tax, legal, or debt advice. Return ONLY valid JSON with exactly two non-empty array keys: "suggestions" and "improvements". Choose however many items are genuinely useful based on the data; do not pad the response to a fixed count. Every object must have exactly "title" and "reason" string keys. Titles are specific, actionable recommendations or recognized positive progress. Reasons start with "Because" and cite relevant amounts, percentages, or month-to-month comparisons from the supplied data when available. Do not invent data. Keep each title and reason to one concise sentence.' },
        { role: 'user', content: `Generate fresh insights for this selected-period financial summary:\n${JSON.stringify(financialSummary)}` },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Keep upstream details in server logs, while avoiding a cryptic provider error in the Dashboard.
    console.error('OpenRouter insight request failed:', {
      status: response.status,
      message: payload?.error?.message,
      code: payload?.error?.code,
      metadata: payload?.error?.metadata,
    });
    const error = new Error(response.status === 429
      ? 'AI insights are temporarily rate-limited. Please try again in a moment.'
      : 'The AI provider is temporarily unavailable. Please try generating insights again shortly.');
    error.statusCode = 503;
    throw error;
  }
  try {
    return parseInsights(payload?.choices?.[0]?.message?.content);
  } catch (error) {
    if (error.message === 'AI_GENERATION_FORMAT_ERROR') {
      const formatError = new Error('AI returned an incomplete response. Please try generating insights again.');
      formatError.statusCode = 502;
      throw formatError;
    }
    throw error;
  }
};
