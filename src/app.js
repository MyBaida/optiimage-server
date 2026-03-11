const express = require("express");
const cors = require("cors");
const multer = require("multer");
const imageRoutes = require("./routes/imageRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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