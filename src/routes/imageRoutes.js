const express = require("express");
const multer = require("multer");
const imageController = require("../controllers/imageController");
const path = require("path");

const router = express.Router();

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
    }

  }
});

router.post(
  "/compress",
  upload.array("images", 10),
  imageController.compressImages
);

module.exports = router;