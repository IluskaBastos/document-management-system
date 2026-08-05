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
    mimeType: metadata.mimeType,
    size: metadata.size,
    owner: metadata.owner,
    uploadedAt: metadata.uploadedAt,
  };

  documents.push(document);
  return document;
}

function listDocuments() {
  return documents.map((document) => ({ ...document }));
}

function listDocumentsByOwner(owner) {
  return documents
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

function findDocumentById(id) {
  return documents.find((document) => document.id === id) || null;
}

function clearDocuments() {
  documents.length = 0;
}

module.exports = {
  saveDocument,
  listDocuments,
  listDocumentsByOwner,
  findDocumentById,
  clearDocuments,
};