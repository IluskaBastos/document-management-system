const fs = require('node:fs');
const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

const storageDirectory = path.resolve(__dirname, '../../storage');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function uploadDocument({ file, owner }) {
  if (!file) {
    throw createHttpError(400, 'Arquivo não enviado. Use o campo "file" no upload.');
  }

  const uploadedAt = new Date().toISOString();
  const savedDocument = documentsRepository.saveDocument({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    owner,
    uploadedAt,
  });

  return {
    id: savedDocument.id,
    originalName: savedDocument.originalName,
    size: savedDocument.size,
    owner: savedDocument.owner,
    uploadedAt: savedDocument.uploadedAt,
    createdAt: savedDocument.uploadedAt,
  };
}

function listDocuments(owner) {
  return documentsRepository
    .listDocumentsByOwner(owner)
    .sort((firstDocument, secondDocument) => {
      const firstTimestamp = Date.parse(firstDocument.uploadedAt || firstDocument.createdAt || '');
      const secondTimestamp = Date.parse(secondDocument.uploadedAt || secondDocument.createdAt || '');

      if (!Number.isFinite(firstTimestamp) || !Number.isFinite(secondTimestamp)) {
        return 0;
      }

      return secondTimestamp - firstTimestamp;
    })
    .map((document) => ({
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    owner: document.owner,
    uploadedAt: document.uploadedAt,
    createdAt: document.uploadedAt,
    }));
}

function getDocumentForDownload(documentId, owner) {
  const document = documentsRepository.findDocumentById(documentId);

  if (!document) {
    throw createHttpError(404, 'Documento nao encontrado.');
  }

  if (document.owner !== owner) {
    throw createHttpError(403, 'Acesso negado para download deste documento.');
  }

  if (!document.storedName || path.basename(document.storedName) !== document.storedName) {
    throw createHttpError(500, 'Metadados invalidos do documento para download.');
  }

  const resolvedPath = path.resolve(storageDirectory, document.storedName);
  if (!resolvedPath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw createHttpError(400, 'Caminho de download invalido.');
  }

  if (!fs.existsSync(resolvedPath)) {
    throw createHttpError(404, 'Arquivo do documento nao encontrado no armazenamento local.');
  }

  return {
    filePath: resolvedPath,
    downloadName: document.originalName,
  };
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentForDownload,
};