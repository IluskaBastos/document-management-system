const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { test, after } = require('node:test');
const assert = require('node:assert');
const tempStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));

process.env.STORAGE_DIR = tempStorageDir;

const app = require('../src/app');

after(() => {
  fs.rmSync(tempStorageDir, { recursive: true, force: true });
});

async function withServer(callback) {
  const server = app.listen(0);

  await once(server, 'listening');

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function uploadDocument(baseUrl, userId, fileName, content) {
  const body = new FormData();
  body.append('file', new Blob([content], { type: 'text/plain' }), fileName);

  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': userId,
    },
    body,
  });
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload de um documento', async () => {
  await withServer(async (baseUrl) => {
    const response = await uploadDocument(baseUrl, 'user-upload', 'relatorio.txt', 'conteudo do upload');
    const payload = await response.json();

    assert.strictEqual(response.status, 201);
    assert.strictEqual(payload.originalName, 'relatorio.txt');
    assert.strictEqual(payload.size, Buffer.byteLength('conteudo do upload'));
    assert.ok(payload.id, 'o documento deve retornar um id');
    assert.ok(payload.uploadedAt, 'o documento deve retornar a data de upload');
  });
});

test('lista os documentos do usuário', async () => {
  await withServer(async (baseUrl) => {
    const uploadResponse = await uploadDocument(baseUrl, 'user-list', 'lista.txt', 'arquivo para listagem');
    const uploadPayload = await uploadResponse.json();

    assert.strictEqual(uploadResponse.status, 201);

    const response = await fetch(`${baseUrl}/documents`, {
      headers: {
        'x-user-id': 'user-list',
      },
    });

    const payload = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(payload), 'a resposta deve ser uma lista');
    assert.deepStrictEqual(payload[0].id, uploadPayload.id);
    assert.deepStrictEqual(payload[0].originalName, 'lista.txt');
  });
});

test('faz download de um documento', async () => {
  await withServer(async (baseUrl) => {
    const content = 'conteudo para download';
    const uploadResponse = await uploadDocument(baseUrl, 'user-download', 'download.txt', content);
    const uploadPayload = await uploadResponse.json();

    assert.strictEqual(uploadResponse.status, 201);

    const response = await fetch(`${baseUrl}/documents/${uploadPayload.id}/download`, {
      headers: {
        'x-user-id': 'user-download',
      },
    });

    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-disposition') || '', /attachment/);
    assert.match(response.headers.get('content-disposition') || '', /download\.txt/);
    assert.strictEqual(await response.text(), content);
  });
});
