import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";
import { enforceAssetLimit } from "@/lib/saas/usage-service";

export const maxDuration = 60; // 1 minute timeout

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth();
        
        // Enforce credit limit for assets
        if (userId) {
            const limit = await enforceAssetLimit(userId);
            if (!limit.allowed) {
                return NextResponse.json({ error: limit.reason }, { status: 402 });
            }
        }
        
        const body = await req.json();
        const { fileData, folder = "ade/products" } = body;


        if (!fileData) {
            return NextResponse.json({ error: "fileData is required" }, { status: 400 });
        }

        console.log("[POST /api/upload] Uploading image to Cloudinary...");
        const imageUrl = await uploadToCloudinary(fileData, folder);
        console.log("[POST /api/upload] Cloudinary upload success:", imageUrl);

        return NextResponse.json({ url: imageUrl, success: true });
    } catch (error: unknown) {
        console.error("[POST /api/upload] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to upload image" },
            { status: 500 }
        );
    }
}
