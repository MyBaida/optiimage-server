const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

const compressToTarget = async (inputPath, outputPath, options) => {

  const targetBytes = options.targetSize * 1024;

  let minQuality = 10;
  let maxQuality = 95;
  let bestQuality = options.quality || 80;

  for (let i = 0; i < 8; i++) {

    const quality = Math.floor((minQuality + maxQuality) / 2);

    let transformer = sharp(inputPath).resize({
      width: options.width || null,
      withoutEnlargement: true
    });

    if (options.format === "jpeg") {
      transformer = transformer.jpeg({ quality });
    }
    else if (options.format === "png") {
      transformer = transformer.png({ quality });
    }
    else if (options.format === "webp") {
      transformer = transformer.webp({ quality });
    }

    await transformer.toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const size = stats.size;

    if (Math.abs(size - targetBytes) < 5000) {
      break;
    }

    if (size > targetBytes) {
      maxQuality = quality - 1;
    } else {
      minQuality = quality + 1;
      bestQuality = quality;
    }

  }

};

const generateFileName = (originalName, format) => {
  const baseName = path.parse(originalName).name;

  const cleanedName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  return `${cleanedName}-${Date.now()}.${format}`;
};

exports.processImages = async (files, options) => {
  const outputFiles = [];

  for (const file of files) {
    const outputFileName = generateFileName(file.originalname, options.format);
    const outputPath = path.join("processed", outputFileName);

    let transformer = sharp(file.path);

    if (options.width) {
      transformer = transformer.resize({
        width: options.width,
        withoutEnlargement: true
      });
    }

    // Convert based on format
    if (options.format === "jpeg") {
      transformer = transformer.jpeg({ quality: options.quality });
    } else if (options.format === "png") {
      transformer = transformer.png({ quality: options.quality });
    } else if (options.format === "webp") {
      transformer = transformer.webp({ quality: options.quality });
    }

    if (options.targetSize) {

      await compressToTarget(
        file.path,
        outputPath,
        options
      );

    } else {

      await transformer.toFile(outputPath);

    }

    outputFiles.push(outputPath);
  }

  const zipPath = path.join("processed", `compressed-${Date.now()}.zip`);
  await createZip(outputFiles, zipPath);

  return { 
    zipPath,
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
      archive.file(file, { name: path.basename(file) });
    });

    archive.finalize();
  });
};