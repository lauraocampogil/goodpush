import { llmsTxt } from '#lib/server/llms.ts';

export const prerender = true;
export const GET = () => new Response(llmsTxt(true), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
