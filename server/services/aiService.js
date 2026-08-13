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
              {
              role: 'system',
              content: `
                You are a personal-finance assistant for everyday users. Interpret only the supplied aggregate financial summary. Do not use or invent information that is not provided. Do not perform basic calculations from raw transactions. Generate practical, easy-to-understand financial guidance.

                Return ONLY valid JSON with exactly two array keys:
                "suggestions" and "improvements".

                Each array may contain zero or more items. Do not create an item just to fill the section.

                Each object must contain exactly:
                "title" and "reason"

                Generate two different types of insights:

                1. SUGGESTIONS

                Suggestions should identify areas where the user can improve and provide a practical action they can take.

                Use the financial data to identify:
                - Unusually high spending
                - Spending increases
                - Categories exceeding their budgets
                - Categories close to their budget limits
                - Declining savings
                - Declining income
                - Goals that are falling behind
                - Other meaningful areas that need attention

                The suggestion should tell the user what they can do about the issue.

                Example:

                Title:
                "Shopping spending increased significantly this month"

                Reason:
                "Spent ₹8,000 on shopping this month compared with ₹300 last month. Setting a spending limit could help you keep this category under control."

                Title:
                "Try cutting food expenses by ₹1000 next month"

                Reason:
                "40% of your spending was on food, which is significantly higher than the average."

                Title:
                "Save at least ₹3000 per month."

                Reason:
                "Savings this month were only ₹1000, which is just 6.6% of your income."

                2. IMPROVEMENTS

                Improvements should identify things the user has actually done better in the selected month compared with previous months.

                Do NOT give recommendations in this section.

                Look for positive changes such as:
                - Higher savings
                - Higher savings rate
                - Lower expenses
                - Reduced spending in a category
                - Spending staying within budget
                - Staying below a planned budget
                - Income increasing
                - A previously high-spending category decreasing
                - Progress toward financial goals
                - Consistent positive trends over multiple months

                Only report an improvement when the supplied data clearly supports it. Do not invent or assume improvements.

                Example:

                Title:
                "Savings rate improved compared with last month"

                Reason:
                "Saved 32% of your income this month, up from 25% last month."

                Another example:

                Title:
                "Food spending stayed within its budget this month"

                Reason:
                "₹3,200 was spent on food, which is below the ₹4,000 budget limit."
                
                Another example:

                Title:
                "You reduced your entertainment spending for the second month in a row"

                Reason:
                "Entertainment spending decreased from ₹4,000 last month to ₹2,500 this month, continuing the improvement from the previous month."
                
                IMPORTANT:
                Suggestions = "What should I improve?"
                Improvements = "What have I already improved?"

                Do not mix these two categories.

                TITLE RULES:
                - Each title must be a complete, meaningful statement.
                - The title should communicate the actual insight by itself.
                - Do not use short topic-like titles such as:
                  "Track Shopping Expenses"
                  "Increase Fuel Budget"
                  "Review Budget Allocation"
                - Prefer clear statements such as:
                  "Your shopping spending increased significantly this month."
                  "Your savings rate improved compared with last month."
                - The user should understand the main point without reading the reason.

                REASON RULES:
                - Write the reason as a natural explanation of the title.
                - Do NOT start the reason with "Because".
                - Use simple everyday language that an average person can understand immediately.
                - Mention relevant amounts, percentages, or month-to-month comparisons when available.
                - Do not invent data.

                Bad:
                "Because the changeFromPreviousMonth data shows large swings, establishing a variance threshold could alert you to unexpected spikes."

                Good:
                "Spending has changed a lot from month to month, so keeping an eye on large increases can help you avoid unexpected spending."

                Bad:
                "Because Entertainment spending exceeded the budget by 1895.8% utilization..."

                Good:
                "You spent ₹9,479 on entertainment while your budget was ₹500, so this category is taking much more money than planned."

                LANGUAGE:
                - Use simple, conversational English.
                - Avoid technical terms such as "variance", "utilization", "allocation", "volatility", "cash flow", and "threshold" unless absolutely necessary.
                - Prefer words such as "increase", "decrease", "spent", "saved", "budget", "more", "less", "higher", and "lower".
                - Write as if explaining the user's finances to someone with no financial background.
                - Be helpful and non-judgmental.
                - Keep each title and reason concise.
                - Use "you" or "your" only when necessary to make the insight clear and natural.
                - Prefer neutral wording when the insight can be expressed clearly without directly addressing the user.
                - Do not unnecessarily start titles or reasons with "You" or "Your".

                SUGGESTION RULES:
                - Give suggestions only when the data supports them.
                - Do not create suggestions just to fill space.
                - Suggestions should focus on areas that need attention and include a practical action when appropriate.

                IMPROVEMENT RULES:
                - Give improvements only when the data shows a genuine positive change.
                - Do not give advice or recommendations in this section.
                - Do not describe a neutral or unchanged situation as an improvement.

                Do not provide investment, tax, legal, or debt advice.

                Return ONLY the JSON object. Do not include markdown, explanations, or any text outside the JSON.
                `
        },
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
