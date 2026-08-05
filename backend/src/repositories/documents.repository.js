const crypto = require('node:crypto');

const documents = [];

function generateDocumentId() {
  return crypto.randomUUID();
}

function saveDocument(metadata) {
  const document = {
    id: generateDocumentId(),
    originalName: metadata.originalName,
    storedName: metadata.storedName,
    storedPath: metadata.storedPath,
    mimeType: metadata.mimeType,
    size: metadata.size,
    owner: metadata.owner,
    createdAt: metadata.createdAt,
  };

  documents.push(document);
  return document;
}

function listDocuments() {
  return documents.map((document) => ({ ...document }));
}

function findDocumentById(id) {
  return documents.find((document) => document.id === id) || null;
}

module.exports = {
  saveDocument,
  listDocuments,
  findDocumentById,
};