const documentsService = require('../services/documents.service');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function resolveOwner(req) {
  const owner = req.header('x-user-id');
  if (!owner || !owner.trim()) {
    throw createHttpError(400, 'Cabecalho x-user-id e obrigatorio.');
  }

  return owner.trim();
}

function uploadDocument(req, res, next) {
  try {
    const owner = resolveOwner(req);
    const document = documentsService.uploadDocument({ file: req.file, owner });

    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    const owner = resolveOwner(req);
    const documents = documentsService.listDocuments(owner);
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

function downloadDocument(req, res, next) {
  try {
    const owner = resolveOwner(req);
    const { filePath, downloadName } = documentsService.getDocumentForDownload(req.params.id, owner);

    return res.download(filePath, downloadName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};