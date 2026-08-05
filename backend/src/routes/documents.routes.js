const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const maxUploadSizeInBytes = Number.parseInt(process.env.UPLOAD_MAX_SIZE_BYTES || '', 10) || 5 * 1024 * 1024;
const allowedMimeTypes = (process.env.UPLOAD_ALLOWED_MIME_TYPES || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, path.resolve(__dirname, '../../storage'));
  },
  filename: (_req, file, callback) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    callback(null, `${uniquePrefix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSizeInBytes,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error('Tipo de arquivo nao permitido para upload.');
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;