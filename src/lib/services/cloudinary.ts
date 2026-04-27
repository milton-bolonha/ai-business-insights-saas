/**
 * Cloudinary Upload Helper
 * Handles image uploads to Cloudinary using the provided credentials.
 */

export async function uploadToCloudinary(file: File): Promise<string> {
    // Convert file to base64
    const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    try {
        console.log(`[Cloudinary] Uploading via API route...`);
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileData,
                folder: "ade/products",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Cloudinary] Server responded with error:", errorData);
            throw new Error(errorData.error || "Failed to upload image to Cloudinary via API");
        }

        const data = await response.json();
        return data.url;
    } catch (error: unknown) {
        console.error("[Cloudinary] Upload error:", error);
        throw error;
    }
}

