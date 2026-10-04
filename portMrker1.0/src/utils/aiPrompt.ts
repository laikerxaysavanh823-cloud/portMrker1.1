/** Prompt for the AI Advisor — shared by the Gemini server route and Claude on claude.ai. */

const LANGUAGE_NAMES: Record<string, string> = {
  lo: 'Lao (ພາສາລາວ)',
  th: 'Thai (ภาษาไทย)',
  en: 'English',
};

const FOCUS_INSTRUCTIONS: Record<string, string> = {
  overall: 'Give a balanced overview of budget, spending, portfolio allocation and savings goals.',
  budget: 'Focus on the monthly budget: spending vs plan, over-budget categories, savings rate, and concrete ways to cut costs.',
  portfolio: 'Focus on the investment portfolio: allocation across US stocks, ETFs, Bitcoin, gold and cash, concentration risk, unrealized P/L, and the emergency fund coverage.',
  goals: 'Focus on the savings goals: whether each goal is on track for its deadline, how much to save monthly, and how to prioritise them against investing.',
};

export function buildAdvisorPrompt(language: string, focus: string, question: string, snapshot: unknown): string {
  const langName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.lo;
  const focusText = FOCUS_INSTRUCTIONS[focus] || FOCUS_INSTRUCTIONS.overall;
  return [
    `You are a friendly personal-finance coach for a user in Laos who earns in Lao Kip (LAK) and invests in USD assets.`,
    `Reply ONLY in ${langName}. Use short Markdown: "## " headings, "- " bullet points and **bold** for key numbers. No tables. Keep it under about 350 words.`,
    `Task: ${focusText}`,
    `Structure: 1) a 2–3 sentence summary, 2) what is going well, 3) risks / problems, 4) 3–5 concrete, numbered next steps with amounts in LAK (and USD where useful).`,
    `Be specific to the numbers given. Do not invent data. If data is missing (e.g. income is 0), say what the user should fill in.`,
    `This is educational information, not licensed financial advice — say so in one short line at the end.`,
    question ? `The user also asks: "${question}"` : '',
    ``,
    `Financial snapshot (JSON, amounts in LAK unless the key ends in Usd):`,
    JSON.stringify(snapshot, null, 1),
  ]
    .filter(Boolean)
    .join('\n');
}
