const multer = require("multer");
const { createError } = require("./errorHandler");

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(
        createError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPEG, PNG, WebP, and GIF images are allowed"
        )
      );
    }
    cb(null, true);
  },
});

module.exports = { upload };
