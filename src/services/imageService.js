const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// Thread management for stable performance on small VPS/Cloud instances
sharp.concurrency(2);
sharp.cache(false);

/**
 * Binary search algorithm to find the best quality setting to hit a target file size.
 */
const compressToTarget = async (inputPath, outputPath, options) => {
  const targetBytes = options.targetSize * 1024;
  let minQuality = 10;
  let maxQuality = 95;
  let bestPath = outputPath;

  console.log(`   🎯 Target size mode: ${options.targetSize} KB (${targetBytes} bytes)`);

  // 8 iterations is usually enough to get within 5KB of the target
  for (let i = 0; i < 8; i++) {
    const quality = Math.floor((minQuality + maxQuality) / 2);

    let transformer = sharp(inputPath)
      .rotate() // Handle EXIF orientation
      .resize({
        width: options.width || null,
        withoutEnlargement: true
      });

    if (options.format === "jpeg") {
      transformer = transformer.jpeg({ quality, mozjpeg: true });
    } else if (options.format === "png") {
      // PNG uses compressionLevel (0-9) rather than quality
      transformer = transformer.png({ compressionLevel: 9, palette: true });
    } else if (options.format === "webp") {
      transformer = transformer.webp({ quality, effort: 6 });
    }

    await transformer.toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const size = stats.size;
    console.log(`      Iteration ${i + 1}: quality=${quality}, output=${(size / 1024).toFixed(1)} KB`);

    if (Math.abs(size - targetBytes) < 5000) {
      console.log(`   ✅ Target reached within tolerance`);
      break;
    }

    if (size > targetBytes) {
      maxQuality = quality - 1;
    } else {
      minQuality = quality + 1;
    }
  }
};

const generateFileName = (originalName, format) => {
  const baseName = path.parse(originalName).name;
  const cleanedName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-"); // Prevent double hyphens

  return `${cleanedName}-${Date.now()}.${format}`;
};

const processBatch = async (batch, options) => {
  // We use Promise.all inside the batch to process the 2 images in parallel
  return Promise.all(batch.map(async (file) => {
    // Determine format: use explicit format or detect from mimetype
    const fileFormat = options.format || options.detectFormat(file.mimetype);
    const outputFileName = generateFileName(file.originalname, fileFormat);
    const outputPath = path.join("processed", outputFileName);

    // Build per-file options with the resolved format
    const fileOptions = { ...options, format: fileFormat };

    if (options.targetSize) {
      await compressToTarget(file.path, outputPath, fileOptions);
    } else {
      let transformer = sharp(file.path).rotate();

      if (options.width) {
        transformer = transformer.resize({
          width: options.width,
          withoutEnlargement: true
        });
      }

      if (fileFormat === "jpeg") {
        transformer = transformer.jpeg({ quality: options.quality, mozjpeg: true });
      } else if (fileFormat === "png") {
        transformer = transformer.png({ compressionLevel: 9, palette: true });
      } else if (fileFormat === "webp") {
        transformer = transformer.webp({ quality: options.quality, effort: 6 });
      }

      await transformer.toFile(outputPath);
    }

    return outputPath;
  }));
};

exports.processImages = async (files, options) => {
  const outputFiles = [];
  const BATCH_SIZE = 2;
  const totalBatches = Math.ceil(files.length / BATCH_SIZE);

  console.log(`   Processing ${files.length} image(s) in ${totalBatches} batch(es) of ${BATCH_SIZE}...`);

  // Process in chunks to prevent memory exhaustion
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = files.slice(i, i + BATCH_SIZE);
    console.log(`   📦 Batch ${batchNum}/${totalBatches}: processing ${batch.length} image(s)...`);
    const processed = await processBatch(batch, options);
    outputFiles.push(...processed);
    console.log(`   ✅ Batch ${batchNum}/${totalBatches} complete`);
  }

  const zipPath = path.join("processed", `compressed-${Date.now()}.zip`);
  console.log(`   📁 Creating ZIP archive...`);
  await createZip(outputFiles, zipPath);

  const zipSize = fs.statSync(zipPath).size;
  console.log(`   📦 ZIP size: ${(zipSize / 1024).toFixed(1)} KB`);

  return { 
    zipPath,
    zipSize,
    processedFiles: outputFiles
  };
};

const createZip = (files, zipPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    files.forEach(file => {
      // Safety check: only zip if file exists
      if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
      }
    });

    archive.finalize();
  });
};
