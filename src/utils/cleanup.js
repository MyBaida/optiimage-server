const fs = require("fs");
const path = require("path");

exports.deleteFiles = (files) => {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlink(file, (err) => {
        if (err) console.error("Error deleting file:", file);
      });
    }
  });
};

/**
 * Periodically removes files older than 'maxAgeMs' from specified directories.
 */
exports.autoCleanup = (dirs, maxAgeMs = 60 * 60 * 1000) => {
  const now = Date.now();

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    fs.readdir(dir, (err, files) => {
      if (err) return console.error("Cleanup error:", err);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          // If file is older than the max age, delete it
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
};