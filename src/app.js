const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const imageRoutes = require("./routes/imageRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create folders if not exist
["uploads", "processed"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

app.get("/", (req, res) => res.json({ message: "OptiImage API is running" }));

app.use("/api/images", imageRoutes);

app.use((err, req, res, next) => {

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      message: err.message
    });
  }

  next();

});

module.exports = app;