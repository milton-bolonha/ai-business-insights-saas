import { v2 as cloudinary } from "cloudinary";

/**
 * Uploads an image from a URL or base64 string to Cloudinary
 * @param fileData URL or base64 string or buffer
 * @param folder Folder name in Cloudinary
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: string = "books/covers"
): Promise<string> {
  // Configure dynamically at run-time to bypass environment variable load delays
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Failed to upload image to Cloudinary: ${msg}`);
  }
}

export default cloudinary;
