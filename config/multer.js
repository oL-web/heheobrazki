const multer  = require('multer');
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdir(`./public/pictures/${req.user.id}`, err => {
            cb(null, `./public/pictures/${req.user.id}`);
        });    
    },
    filename: function (req, file, cb) {
      cb(null,  `${Date.now()}__${file.originalname}`);
    }
  });

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif"){
        cb(null,true);
    } else{
        cb(null,false);
    }
};

const limits = {
    fileSize: 1024 * 1024 * 10
};

module.exports = multer({limits, fileFilter, storage});