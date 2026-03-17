import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { updateBook, getBookById } from "@/lib/db/books";
import { audit } from "@/lib/audit/logger";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const book = await getBookById(id);

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        const auth = await authorizeWorkspaceAccess(book.workspaceId, userId);

        if (!auth.authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const updates = await request.json();

        await updateBook(id, {
            ...updates,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.error(`[PATCH /api/workspace/books/${id}] Error:`, error);
        await audit.apiError(
            `[PATCH /api/workspace/books/${id}]`,
            error instanceof Error ? error : new Error("Internal Server Error"),
            null,
            request as any
        );
        return NextResponse.json(
            { error: "Failed to update book" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const book = await getBookById(id);

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        const auth = await authorizeWorkspaceAccess(book.workspaceId, userId);

        if (!auth.authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { deleteBook } = await import("@/lib/db/books");
        await deleteBook(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`[DELETE /api/workspace/books/${id}] Error:`, error);
        return NextResponse.json(
            { error: "Failed to delete book" },
            { status: 500 }
        );
    }
}
