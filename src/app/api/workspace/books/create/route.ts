import { NextResponse, NextRequest } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { createBook } from "@/lib/db/books";
import { bookToDocument } from "@/lib/db/models/Book";
import { audit } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            dashboardId, 
            title, 
            pages, 
            workspaceId,
            authorship,
            publisher,
            isbn,
            isPublic,
            adultContent,
            restrictPublicity,
            pagesCountGoal,
            inspiration,
            removeCoAuthorship
        } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
        }

        const authResult = await getAuthAndAuthorize(workspaceId);
        const userId = authResult.userId;

        if (!userId || !authResult.authorized) {
            console.error("[POST /api/workspace/books/create] Auth failed:", { userId, authResult });
            return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
        }

        const bookDoc = bookToDocument(
            {
                userId,
                workspaceId,
                dashboardId,
                title,
                status: "draft",
                pages: pages || [],
                authorship: authorship || "independent",
                publisher: publisher || "Autores Apaixonados",
                isbn,
                isPublic: isPublic || false,
                adultContent: adultContent || false,
                restrictPublicity: restrictPublicity || false,
                pagesCountGoal,
                inspiration: inspiration || "Original",
                removeCoAuthorship: removeCoAuthorship || false,
            },
            userId,
            workspaceId,
            dashboardId
        );

        const insertedId = await createBook({
            ...bookDoc,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({ bookId: insertedId, success: true });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.error("[POST /api/workspace/books] Error:", error);
        await audit.apiError(
            "[POST /api/workspace/books]",
            error instanceof Error ? error : new Error("Internal Server Error"),
            null,
            request as any
        );
        return NextResponse.json(
            { error: "Failed to create book" },
            { status: 500 }
        );
    }
}
