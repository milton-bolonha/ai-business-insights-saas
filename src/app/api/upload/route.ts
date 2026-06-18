import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";
import { enforceAssetLimit } from "@/lib/saas/usage-service";

export const maxDuration = 60; // 1 minute timeout

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth();
        const body = await req.json();
        const { fileData, folder = "ade/products", workspaceId, resourceType = "auto" } = body;
        
        // Enforce credit limit for assets, unless it's a profile avatar upload!
        if (userId && folder !== "ade/avatars") {
            const limit = await enforceAssetLimit(userId);
            if (!limit.allowed) {
                return NextResponse.json({ error: limit.reason }, { status: 402 });
            }
        }

        // Dynamically build a premium organized Cloudinary folder hierarchy!
        let targetFolder = folder;
        if (folder === "ade/avatars" && userId) {
            targetFolder = `ai-saas/users/${userId}/avatar`;
        } else if (workspaceId) {
            const sub = folder.replace("ade/", "");
            targetFolder = `ai-saas/workspaces/${workspaceId}/${sub}`;
        } else if (userId) {
            const sub = folder.replace("ade/", "");
            targetFolder = `ai-saas/users/${userId}/${sub}`;
        } else {
            targetFolder = `ai-saas/${folder}`;
        }

        if (!fileData) {
            return NextResponse.json({ error: "fileData is required" }, { status: 400 });
        }

        console.log(`[POST /api/upload] Uploading file to Cloudinary folder: ${targetFolder} with type ${resourceType}`);
        const fileUrl = await uploadToCloudinary(fileData, targetFolder, resourceType as any);
        console.log("[POST /api/upload] Cloudinary upload success:", fileUrl);

        return NextResponse.json({ url: fileUrl, success: true });
    } catch (error: unknown) {
        console.error("[POST /api/upload] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to upload image" },
            { status: 500 }
        );
    }
}
