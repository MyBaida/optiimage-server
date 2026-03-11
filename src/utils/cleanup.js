const fs = require("fs");

exports.deleteFiles = (files) => {
  files.forEach(file => {
    fs.unlink(file, (err) => {
      if (err) {
        console.error("Error deleting file:", file);
      }
    });
  });
};