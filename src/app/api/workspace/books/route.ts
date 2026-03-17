import { NextResponse, NextRequest } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { getBooksByWorkspace } from "@/lib/db/books";
import { audit } from "@/lib/audit/logger";

export async function GET(request: NextRequest) {
    try {
        const workspaceId = request.nextUrl.searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
        }

        const authResult = await getAuthAndAuthorize(workspaceId);
        const userId = authResult.userId;

        // If it's a guest (no userId), just return an empty array gracefully 
        // because Book generation is exclusively for logged-in Members.
        if (!userId) {
            return NextResponse.json({ books: [] });
        }

        if (!authResult.authorized) {
            // Return empty instead of 401 to prevent console pollution during workspace switches
            return NextResponse.json({ books: [] });
        }

        const books = await getBooksByWorkspace(workspaceId);

        return NextResponse.json({ books });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ books: [] });
        }

        console.error("[GET /api/workspace/books] Error:", error);
        await audit.apiError(
            "[GET /api/workspace/books]",
            error instanceof Error ? error : new Error("Internal Server Error"),
            null,
            request as any
        );
        return NextResponse.json(
            { error: "Failed to fetch books" },
            { status: 500 }
        );
    }
}
