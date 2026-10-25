// Vercel serverless function: POST /api/chat
// Set ANTHROPIC_API_KEY in Vercel -> Project -> Settings -> Environment Variables to switch Tulpar to Claude.
import { handleChat } from '../shared/tulpar-core.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const out = await handleChat(body);
    return res.status(out.status).json(out.json);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
