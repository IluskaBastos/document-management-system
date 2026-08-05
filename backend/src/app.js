const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(__dirname, '..', 'storage');
const MAX_UPLOAD_SIZE_BYTES = Number.parseInt(process.env.UPLOAD_MAX_SIZE_BYTES || '', 10);
const UPLOAD_LIMIT = Number.isFinite(MAX_UPLOAD_SIZE_BYTES) && MAX_UPLOAD_SIZE_BYTES > 0
  ? MAX_UPLOAD_SIZE_BYTES
  : 10 * 1024 * 1024;

fs.mkdirSync(STORAGE_DIR, { recursive: true });

const documents = [];

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, STORAGE_DIR),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      callback(null, `${uniqueName}${extension}`);
    },
  }),
  limits: {
    fileSize: UPLOAD_LIMIT,
  },
});

app.use(express.json());

function getUserId(req, res) {
  const userId = String(req.get('x-user-id') || '').trim();

  if (!userId) {
    res.status(400).json({ error: 'O header x-user-id é obrigatório.' });
    return null;
  }

  return userId;
}

function serializeDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
  };
}

function findDocumentById(userId, documentId) {
  return documents.find((document) => document.ownerId === userId && document.id === documentId);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/upload', (req, res, next) => {
  const userId = getUserId(req, res);

  if (!userId) {
    return;
  }

  upload.single('file')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'O arquivo enviado excede o limite permitido.' });
        return;
      }

      next(error);
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Envie um arquivo no campo file.' });
      return;
    }

    const document = {
      id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      ownerId: userId,
    };

    documents.push(document);

    res.status(201).json(serializeDocument(document));
  });
});

app.get('/documents', (req, res) => {
  const userId = getUserId(req, res);

  if (!userId) {
    return;
  }

  const userDocuments = documents
    .filter((document) => document.ownerId === userId)
    .map(serializeDocument);

  res.json(userDocuments);
});

app.get('/documents/:id/download', (req, res) => {
  const userId = getUserId(req, res);

  if (!userId) {
    return;
  }

  const document = findDocumentById(userId, req.params.id);

  if (!document) {
    res.status(404).json({ error: 'Documento não encontrado.' });
    return;
  }

  res.download(path.join(STORAGE_DIR, document.storedName), document.originalName);
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.documents = documents;
module.exports.storageDir = STORAGE_DIR;
