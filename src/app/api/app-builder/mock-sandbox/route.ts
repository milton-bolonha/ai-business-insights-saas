import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Sandbox';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mock Sandbox</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
          .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; text-align: center; max-width: 400px; }
          h2 { color: #0f172a; margin-top: 0; font-size: 1.25rem; font-weight: 600; }
          p { font-size: 0.875rem; line-height: 1.5; color: #64748b; margin-bottom: 0; }
          .badge { display: inline-block; background: #e0f2fe; color: #0284c7; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Local Dev Mode</div>
          <h2>Mock Sandbox: ${name}</h2>
          <p>O Vercel Sandbox falhou ao iniciar (ou faltam credenciais na sua máquina local). Estamos mostrando este Mock seguro para evitar crash do Iframe enquanto você desenvolve localmente.</p>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
