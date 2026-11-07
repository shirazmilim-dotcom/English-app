// במקום ה-SDK של Anthropic: אותה קריאה עוברת דרך יכולת ה-sample של claude.ai,
// כלומר Claude עונה על חשבון ה-Claude של מי שצופה בעמוד. אין מפתחות בעמוד.
let samplePromise = null;
const getSample = () => (samplePromise ??= window.claude?.use ? window.claude.use('sample') : Promise.resolve(null));

class BadRequestError extends Error {}

async function create(params) {
  const sample = await getSample();
  if (!sample) throw new Error('AI לא זמין בתצוגה הזו');
  const schema = params.output_config?.format?.schema;
  const userText = params.messages.map((m) => m.content).join('\n\n');
  const input = `${params.system}\n\n---\n\n${userText}\n\n---\nRespond with ONLY a JSON object (no markdown fences, no extra text) that matches this JSON Schema exactly:\n${JSON.stringify(schema)}`;
  try {
    const value = await sample.json(input, { modelTier: 'quick', cache: false });
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(value) }] };
  } catch (e) {
    const err = new Error(e?.code === 'not_granted' ? 'כדי לקבל משוב AI צריך לאשר לעמוד להשתמש ב-Claude' : e?.message || 'AI error');
    err.code = e?.code;
    // הצופה סירב או שאין גישה: ממשיכים במצב הדגמה במקום להיתקע
    if (e?.code === 'not_granted' || e?.code === 'unavailable') process.env.ANTHROPIC_API_KEY = '';
    throw err;
  }
}
export default class Anthropic {
  static BadRequestError = BadRequestError;
  constructor() {
    this.messages = { create };
    this.beta = { messages: { create: ({ betas, fallbacks, ...rest }) => create(rest) } };
  }
}
export { getSample };
