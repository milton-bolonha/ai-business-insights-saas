import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

export const maxDuration = 60; // 1 minute timeout

export async function POST(req: NextRequest) {
    try {
        await getAuth();
        // We allow guests to upload as well, similar to the rest of the app logic
        
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
