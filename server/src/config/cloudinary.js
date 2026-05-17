// server/src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { ApiError }         from "../utils/ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // always https
});

// ─── Upload a file buffer directly to Cloudinary ─────────────────────────────
// Used internally by upload.js after multer processes the file
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ─── Delete a file from Cloudinary by public_id ───────────────────────────────
// Always call this when replacing or deleting user media
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    // Log but don't crash — deletion failure shouldn't break the main flow
    console.error(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
    return null;
  }
};

// ─── Folder structure on Cloudinary ──────────────────────────────────────────
// Keep media organised — easy to manage per environment
export const CLOUDINARY_FOLDERS = {
  AVATARS:       `bitconnect/${process.env.NODE_ENV}/avatars`,
  POST_IMAGES:   `bitconnect/${process.env.NODE_ENV}/posts`,
  EVENT_BANNERS: `bitconnect/${process.env.NODE_ENV}/events`,
  CLUB_LOGOS:    `bitconnect/${process.env.NODE_ENV}/clubs/logos`,
  CLUB_BANNERS:  `bitconnect/${process.env.NODE_ENV}/clubs/banners`,
};

export default cloudinary;