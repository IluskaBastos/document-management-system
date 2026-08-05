const API_PREFIX = '/api';

function getRequiredOwner(owner) {
  if (!owner || !owner.trim()) {
    throw new Error('Informe o identificador do usuario antes de continuar.');
  }

  return owner.trim();
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json();
    return data?.error || 'Erro inesperado na requisição.';
  } catch {
    return 'Erro inesperado na requisição.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message);
  }

  return response;
}

export async function listDocuments(owner) {
  const safeOwner = getRequiredOwner(owner);

  const response = await fetch(`${API_PREFIX}/documents`, {
    headers: {
      'x-user-id': safeOwner,
    },
  });
  await ensureSuccess(response);
  const data = await response.json();

  return data.documents || [];
}

export async function uploadDocument(file, owner) {
  const safeOwner = getRequiredOwner(owner);
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': safeOwner,
    },
    body,
  });

  await ensureSuccess(response);
  const data = await response.json();

  return data.document;
}

export async function downloadDocument(documentId, originalName, owner) {
  const safeOwner = getRequiredOwner(owner);

  const response = await fetch(`${API_PREFIX}/documents/${documentId}/download`, {
    headers: {
      'x-user-id': safeOwner,
    },
  });
  await ensureSuccess(response);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = originalName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
