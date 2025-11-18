const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

type GenParams = { path: 'Indie' | 'Medium' | 'Corporation'; count: number };

export async function generateStudioNames({ path, count }: GenParams): Promise<string[]> {
  const key = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  const model = 'meta-llama/llama-3.3-8b-instruct:free';
  const referer = typeof window !== 'undefined' ? window.location.origin : 'https://screenscape.space';
  const prompt = `Generate exactly ${count} unique, evocative studio names for a Hollywood media tycoon game.\nPath: ${path} (Indie: gritty, bootstrapped vibe; Medium: balanced, versatile feel; Corporation: sleek, corporate edge).\nNames should be 2-4 words, professional yet cinematic. Output as a JSON array.`;
  try {
    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': 'ChoiceForReels Studio Mogul',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) throw new Error(String(resp.status));
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : parsed?.names || [];
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string').slice(0, count) : [];
  } catch (_) {
    const indie = ['Neon Flicker Garage', 'Shadow Reel Productions', 'Midnight Cut Studio', 'Rust Lantern Films', 'Grit Frame Collective'];
    const medium = ['Echo Stage Collective', 'Velvet Script House', 'Silver Arc Media', 'North Star Pictures', 'Blue Ember Studios'];
    const corp = ['Apex Vision Network', 'Titan Reel Holdings', 'Primeline Entertainment Group', 'Summit Frame Intl', 'Crestwave Media'];
    return (path === 'Indie' ? indie : path === 'Medium' ? medium : corp).slice(0, count);
  }
}

