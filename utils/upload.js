const multer = require("multer");
const path = require("path");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = file.originalname;
    cb(null, fileName);
  }
});

const uploads = multer({
  storage: diskStorage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only .png, .jpg, and .jpeg formats allowed"));
    }
    cb(null, true);
  }
});

module.exports = uploads;
