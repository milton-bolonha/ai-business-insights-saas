import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const runtime = "nodejs";

const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    console.error("[ML Callback] Auth Error:", error);
    return NextResponse.json({ error: "Authorization denied", details: error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_FUNCTIONS_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/ml/callback`;

  try {
    console.log("[ML Callback] Exchanging code for tokens...");
    
    const resp = await fetch(ML_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId || "",
        client_secret: clientSecret || "",
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("[ML Callback] Token Exchange FAILED:", data);
      return NextResponse.json({ error: "Failed to exchange token", details: data }, { status: resp.status });
    }

    // Prepare token data for MongoDB
    const tokenData = {
      provider: "mercadolivre",
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
      userId: data.user_id,
      updatedAt: new Date(),
    };

    // Save to MongoDB (Upsert)
    await db.updateOne(
      "integrations",
      { provider: "mercadolivre" },
      { $set: tokenData },
      { upsert: true }
    );

    console.log("[ML Callback] ✅ Master Token saved successfully in MongoDB");

    // Success UI - Redirect back to admin with a success param
    return new NextResponse(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">✅ Conexão Mercado Livre Ativa!</h1>
        <p>O seu SaaS agora está autorizado a realizar buscas em seu nome.</p>
        <p>Você pode fechar esta janela ou voltar para o dashboard.</p>
        <script>
          setTimeout(() => { window.location.href = "/admin?ml_success=true"; }, 3000);
        </script>
      </div>
    `, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (err) {
    console.error("[ML Callback] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
