import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const clientId = process.env.ML_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_FUNCTIONS_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/ml/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "ML_CLIENT_ID not configured" }, { status: 500 });
  }

  // Mercado Livre Authorization URL
  // Site: MLB (Brazil)
  const authUrl = new URL("https://auth.mercadolibre.com.br/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  
  // Optional but recommended: state to prevent CSRF
  authUrl.searchParams.set("state", "admin_setup");

  console.log(`[ML Auth] Redirecting to: ${authUrl.toString()}`);
  return NextResponse.redirect(authUrl.toString());
}
