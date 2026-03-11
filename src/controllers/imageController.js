const imageService = require("../services/imageService");
const cleanup = require("../utils/cleanup");

exports.compressImages = async (req, res) => {
  try {
    const files = req.files;
    const { quality = 70, width, format = "jpeg", targetSize } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const result = await imageService.processImages(files, {
      quality: parseInt(quality),
      width: width ? parseInt(width) : null,
      format,
      targetSize: targetSize ? parseInt(targetSize) : null
    });

    // temp testing version
    // res.json({
    //   message: "Images processed successfully",
    //   zipPath: result.zipPath,
    //   processedFiles: result.processedFiles
    // });

    res.download(result.zipPath, () => {

      // delete uploaded files
      const uploadedPaths = files.map(file => file.path);
      cleanup.deleteFiles(uploadedPaths);

      // delete processed files
      cleanup.deleteFiles(result.processedFiles);

      // delete zip
      cleanup.deleteFiles([result.zipPath]);

    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Compression failed" });
  }
};