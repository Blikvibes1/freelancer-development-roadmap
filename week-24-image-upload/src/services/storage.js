/**
 * Image storage + resize service.
 * Local disk by default. Swap processImage / save for S3 or Cloudinary later.
 */

const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const MAX_WIDTH = 1200;
const THUMB_WIDTH = 320;

function ensureDirs() {
  for (const sub of ["original", "resized", "thumbs"]) {
    const dir = path.join(UPLOAD_ROOT, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function publicUrl(req, relativePath) {
  const host = req.get("host") || "localhost:3000";
  const proto = req.protocol || "http";
  return `${proto}://${host}/uploads/${relativePath.replace(/\\/g, "/")}`;
}

/**
 * Process a multer file: save original, resized, and thumbnail.
 * @returns metadata object for the DB
 */
async function processAndStore(file, req) {
  ensureDirs();

  const id = randomUUID();
  const ext = ".jpg"; // normalize output to jpeg after sharp
  const base = id;

  const originalName = `${base}_original${path.extname(file.originalname) || ext}`;
  const resizedName = `${base}${ext}`;
  const thumbName = `${base}_thumb${ext}`;

  const originalPath = path.join(UPLOAD_ROOT, "original", originalName);
  const resizedPath = path.join(UPLOAD_ROOT, "resized", resizedName);
  const thumbPath = path.join(UPLOAD_ROOT, "thumbs", thumbName);

  // Keep original bytes
  fs.writeFileSync(originalPath, file.buffer);

  // Resized (max width)
  const resizedInfo = await sharp(file.buffer)
    .rotate() // honor EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(resizedPath);

  // Thumbnail
  await sharp(file.buffer)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);

  return {
    id,
    originalName: file.originalname,
    mimeType: "image/jpeg",
    size: resizedInfo.size,
    width: resizedInfo.width,
    height: resizedInfo.height,
    paths: {
      original: `original/${originalName}`,
      resized: `resized/${resizedName}`,
      thumb: `thumbs/${thumbName}`,
    },
    urls: {
      original: publicUrl(req, `original/${originalName}`),
      resized: publicUrl(req, `resized/${resizedName}`),
      thumb: publicUrl(req, `thumbs/${thumbName}`),
    },
    createdAt: new Date().toISOString(),
  };
}

function deleteFiles(pathsObj) {
  if (!pathsObj) return;
  for (const key of ["original", "resized", "thumb"]) {
    const rel = pathsObj[key];
    if (!rel) continue;
    const full = path.join(UPLOAD_ROOT, rel);
    if (fs.existsSync(full)) {
      try {
        fs.unlinkSync(full);
      } catch (_) {}
    }
  }
}

module.exports = {
  UPLOAD_ROOT,
  processAndStore,
  deleteFiles,
  ensureDirs,
};
