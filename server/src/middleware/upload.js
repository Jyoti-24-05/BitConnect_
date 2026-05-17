// server/src/middleware/upload.js
import multer                                     from "multer";
import sharp                                      from "sharp";
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from "../config/cloudinary.js";
import { ApiError }                               from "../utils/ApiError.js";
import { catchAsync }                             from "../utils/catchAsync.js";

// ─── Multer config — store in memory, not disk ────────────────────────────────
// We compress with sharp before sending to Cloudinary, so disk storage is wasteful
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

// ─── Multer instances — different size limits per upload type ─────────────────
const createUploader = (maxSizeMB = 5) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });

// Single file uploaders
export const avatarUpload    = createUploader(2);   // 2MB max for avatars
export const bannerUpload    = createUploader(5);   // 5MB for event/club banners
export const postImageUpload = createUploader(5);   // 5MB per post image

// Multi-image uploader (max 4 images per post)
export const multiImageUpload = createUploader(5).array("images", 4);

// ─── Sharp compression helper ─────────────────────────────────────────────────
// Resize + compress before Cloudinary — saves storage + bandwidth
const compressImage = async (buffer, options = {}) => {
  const {
    width   = 1200,
    height  = 1200,
    quality = 80,
    fit     = "inside", // maintain aspect ratio, never upscale
  } = options;

  return sharp(buffer)
    .resize(width, height, { fit, withoutEnlargement: true })
    .webp({ quality }) // convert everything to webp — best compression
    .toBuffer();
};

// ─── Process + upload single image ───────────────────────────────────────────
const processAndUpload = async (file, folder, options = {}) => {
  const compressed = await compressImage(file.buffer, options);
  return uploadToCloudinary(compressed, { folder });
};

// ─── Upload middleware factories ──────────────────────────────────────────────
// Each returns an Express middleware — call after the multer middleware

// Avatar: square crop, 400x400
export const handleAvatarUpload = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); // optional — profile update may not include photo

  const result = await processAndUpload(
    req.file,
    CLOUDINARY_FOLDERS.AVATARS,
    { width: 400, height: 400, fit: "cover" } // square crop for avatars
  );

  req.uploadedFile = {
    url:      result.secure_url,
    publicId: result.public_id,
  };
  next();
});

// Event / club banner: wide aspect, 1200x630 (Open Graph standard)
export const handleBannerUpload = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const result = await processAndUpload(
    req.file,
    req.uploadFolder ?? CLOUDINARY_FOLDERS.EVENT_BANNERS,
    { width: 1200, height: 630, fit: "cover" }
  );

  req.uploadedFile = {
    url:      result.secure_url,
    publicId: result.public_id,
  };
  next();
});

// Post images: up to 4, max 1200px wide
export const handlePostImagesUpload = catchAsync(async (req, res, next) => {
  if (!req.files?.length) return next();

  const uploads = await Promise.all(
    req.files.map((file) =>
      processAndUpload(file, CLOUDINARY_FOLDERS.POST_IMAGES, { width: 1200 })
    )
  );

  req.uploadedFiles = uploads.map((result) => ({
    url:      result.secure_url,
    publicId: result.public_id,
  }));
  next();
});

// ─── Multer error handler — catches file size / type errors ───────────────────
// Wrap multer calls in routes with this to get clean ApiError responses
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return next(new ApiError(400, "File too large — maximum size exceeded"));
    if (err.code === "LIMIT_FILE_COUNT")
      return next(new ApiError(400, "Too many files — maximum 4 images allowed"));
    return next(new ApiError(400, `Upload error: ${err.message}`));
  }
  next(err);
};