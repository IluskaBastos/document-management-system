const documentsService = require('../services/documents.service');

function resolveOwner(req) {
  return req.header('x-user-id') || 'anonymous';
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno no servidor.' : error.message;

  return res.status(statusCode).json({ error: message });
}

function uploadDocument(req, res) {
  try {
    const owner = resolveOwner(req);
    const document = documentsService.uploadDocument({ file: req.file, owner });

    return res.status(201).json({ document });
  } catch (error) {
    return sendError(res, error);
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentsService.listDocuments();
    return res.status(200).json({ documents });
  } catch (error) {
    return sendError(res, error);
  }
}

function downloadDocument(req, res) {
  try {
    const { filePath, downloadName } = documentsService.getDocumentForDownload(req.params.id);

    return res.download(filePath, downloadName, (error) => {
      if (error && !res.headersSent) {
        sendError(res, error);
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};