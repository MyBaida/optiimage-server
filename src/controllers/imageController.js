const imageService = require("../services/imageService");
const cleanup = require("../utils/cleanup");

// Detect format from file mimetype
const detectFormat = (mimetype) => {
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  // HEIC/HEIF can't be output — convert to JPEG
  return "jpeg"; // default for image/jpeg, image/heic, image/heif, and fallback
};

exports.compressImages = async (req, res) => {
  try {
    const files = req.files;
    const { quality, width, format, targetSize } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Determine if a specific format was requested
    const explicitFormat = format || null;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📥 Received ${files.length} image(s) for compression`);
    console.log(`   Settings → quality: ${quality || "default (70)"}, format: ${explicitFormat || "original (auto-detect)"}, width: ${width || "original"}, targetSize: ${targetSize ? targetSize + "KB" : "none"}`);
    files.forEach((file, i) => {
      const detected = detectFormat(file.mimetype);
      console.log(`   [${i + 1}] ${file.originalname} (${(file.size / 1024).toFixed(1)} KB) → ${explicitFormat || detected}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const result = await imageService.processImages(files, {
      quality: quality ? parseInt(quality) : 70,
      width: width ? parseInt(width) : null,
      format: explicitFormat || null,
      targetSize: targetSize ? parseInt(targetSize) : null,
      detectFormat
    });

    console.log(`✅ Compression complete — ZIP ready: ${(result.zipSize / 1024).toFixed(1)} KB`);

    res.download(result.zipPath, () => {
      console.log("📤 ZIP downloaded — cleaning up temporary files...");

      // delete uploaded files
      const uploadedPaths = files.map(file => file.path);
      cleanup.deleteFiles(uploadedPaths);

      // delete processed files
      cleanup.deleteFiles(result.processedFiles);

      // delete zip
      cleanup.deleteFiles([result.zipPath]);

      console.log("🧹 Cleanup done\n");
    });

  } catch (error) {
    console.error("\n❌ Compression error:", error.message);
    res.status(500).json({ message: "Compression failed" });
  }
};
