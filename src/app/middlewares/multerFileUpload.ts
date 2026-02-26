import multer from "multer";
import path from "path";
import fs from "fs";

// Multer storage configuration
const uploadPath = path.join(process.cwd(), "public", "uploads");

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb(null, path.join(process.cwd(), "public", "uploads"));
    cb(null, process.cwd() + '/public/uploads');
  },
  // filename: function (req, file, cb) {
  //   cb(null, file.originalname);
  // },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb(null, path.join(process.cwd(), "public", "uploads"));
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);

  },
  // filename: function (req, file, cb) {
  //   const uniqueSuffix = `${Date.now()}`;
  //   const ext = path.extname(file.originalname);
  //   const baseName = path.basename(file.originalname, ext);
  //   cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  // },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});


const upload = multer({ 
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB file size limit
    fieldSize: 20 * 1024 * 1024, // 20MB field size limit
    files: 10, // Maximum 10 files per request
    fields: 50, // Maximum 50 fields per request
    parts: 60, // Maximum 60 parts (files + fields)
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});


const uploadVehicleDoc = upload.fields([
  { name: "insuranceCard", maxCount: 1 },
  { name: "vehicleImage", maxCount: 1 },
]);

const sendMsg = upload.single("fileImage");
const profileImage = upload.single("profileImage");
const auditPdf = upload.single("auditPdf");
const uploadCategoryIcon = upload.single("categoryIcon");
const uploadProductImage = upload.array("productImage", 5);


// Export file uploader methods
export const fileUploader = {
  upload,
  auditPdf,
  profileImage,
  uploadVehicleDoc, uploadCategoryIcon,
  uploadProductImage,
  sendMsg,
  csvUpload: upload.single("csv")
};
