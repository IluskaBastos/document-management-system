process.env.UPLOAD_MAX_SIZE_BYTES = '10';

const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

beforeEach(() => {
  documentsRepository.clearDocuments();
});

async function uploadDocumentForOwner(owner, contents = '12345', filename = 'doc.txt') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), filename);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': owner,
    },
    body: form,
  });

  return response;
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload exige cabecalho x-user-id', async () => {
  const form = new FormData();
  form.append('file', new Blob(['12345'], { type: 'text/plain' }), 'doc.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /x-user-id/i);
});

test('POST /upload retorna 413 quando tamanho excede limite', async () => {
  const response = await uploadDocumentForOwner('alice', '12345678901', 'big.txt');

  assert.strictEqual(response.status, 413);
  const body = await response.json();
  assert.match(body.error, /limite/i);
});

test('GET /documents retorna apenas documentos do dono', async () => {
  const uploadAlice = await uploadDocumentForOwner('alice', '12345', 'alice.txt');
  assert.strictEqual(uploadAlice.status, 201);

  const uploadBob = await uploadDocumentForOwner('bob', '67890', 'bob.txt');
  assert.strictEqual(uploadBob.status, 201);

  const response = await fetch(`${baseUrl}/documents`, {
    headers: {
      'x-user-id': 'alice',
    },
  });

  assert.strictEqual(response.status, 200);
  const body = await response.json();
  assert.strictEqual(Array.isArray(body.documents), true);
  assert.strictEqual(body.documents.length, 1);
  assert.strictEqual(body.documents[0].owner, 'alice');
  assert.ok(body.documents[0].uploadedAt);
});

test('GET /documents exige cabecalho x-user-id', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 400);
});

test('GET /documents/:id/download bloqueia dono incorreto', async () => {
  const uploadResponse = await uploadDocumentForOwner('alice', '12345', 'private.txt');
  assert.strictEqual(uploadResponse.status, 201);
  const uploadBody = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${uploadBody.document.id}/download`, {
    headers: {
      'x-user-id': 'bob',
    },
  });

  assert.strictEqual(response.status, 403);
  const body = await response.json();
  assert.match(body.error, /acesso negado/i);
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`, {
    headers: {
      'x-user-id': 'alice',
    },
  });

  assert.strictEqual(response.status, 404);
});

test('GET /documents/:id/download retorna binario para dono correto', async () => {
  const uploadResponse = await uploadDocumentForOwner('alice', 'abcde', 'arquivo.txt');
  assert.strictEqual(uploadResponse.status, 201);
  const uploadBody = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${uploadBody.document.id}/download`, {
    headers: {
      'x-user-id': 'alice',
    },
  });

  assert.strictEqual(response.status, 200);
  const contentDisposition = response.headers.get('content-disposition') || '';
  assert.match(contentDisposition, /attachment/i);
  const downloaded = Buffer.from(await response.arrayBuffer()).toString('utf8');
  assert.strictEqual(downloaded, 'abcde');
});
