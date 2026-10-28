// Netlify function: POST /api/chat (mapped in netlify.toml)
// Set GEMINI_API_KEY in Netlify -> Site configuration -> Environment variables to switch Tulpar to Gemini (never commit the key).
import { handleChat } from '../../shared/tulpar-core.mjs';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Use POST' }, { status: 405 });
  try {
    const out = await handleChat(await req.json());
    return Response.json(out.json, { status: out.status });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
};
