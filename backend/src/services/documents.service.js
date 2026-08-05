const fs = require('node:fs');
const documentsRepository = require('../repositories/documents.repository');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function uploadDocument({ file, owner }) {
  if (!file) {
    throw createHttpError(400, 'Arquivo não enviado. Use o campo "file" no upload.');
  }

  const createdAt = new Date().toISOString();
  const savedDocument = documentsRepository.saveDocument({
    originalName: file.originalname,
    storedName: file.filename,
    storedPath: file.path,
    mimeType: file.mimetype,
    size: file.size,
    owner,
    createdAt,
  });

  return {
    id: savedDocument.id,
    originalName: savedDocument.originalName,
    size: savedDocument.size,
    owner: savedDocument.owner,
    createdAt: savedDocument.createdAt,
  };
}

function listDocuments() {
  return documentsRepository.listDocuments().map((document) => ({
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    owner: document.owner,
    createdAt: document.createdAt,
  }));
}

function getDocumentForDownload(documentId) {
  const document = documentsRepository.findDocumentById(documentId);

  if (!document) {
    throw createHttpError(404, 'Documento não encontrado.');
  }

  if (!fs.existsSync(document.storedPath)) {
    throw createHttpError(404, 'Arquivo do documento não encontrado no armazenamento local.');
  }

  return {
    filePath: document.storedPath,
    downloadName: document.originalName,
  };
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentForDownload,
};