# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para upload, listagem e download de documentos por usuário, com armazenamento local de arquivos e arquitetura backend em camadas.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via HTTP.
- Listagem de documentos por usuário.
- Download de documento por identificador.
- Gestão simples por usuário com identificação por cabeçalho HTTP.
- Persistência de arquivos no filesystem local.

### Fora do escopo

- Armazenamento externo (S3, GCS, etc.).
- Versionamento de documentos.
- Banco de dados persistente nesta fase.
- Autenticação/autorização avançada (JWT, OAuth, RBAC).

## 3. Requisitos funcionais

| ID    | Requisito |
| ----- | --------- |
| RF-01 | O sistema deve permitir enviar um documento via multipart/form-data. |
| RF-02 | O sistema deve registrar metadados do documento em memória no momento do upload. |
| RF-03 | O sistema deve listar documentos pertencentes ao usuário solicitante. |
| RF-04 | O sistema deve permitir download de um documento pelo id, respeitando o dono do documento. |
| RF-05 | O sistema deve retornar erros claros para entrada inválida, documento inexistente e falhas de I/O. |
| RF-06 | O sistema deve expor endpoint de saúde para suporte operacional. |

## 4. Requisitos não funcionais

| ID     | Requisito |
| ------ | --------- |
| RNF-01 | Upload deve usar multer com diskStorage, gravando em backend/storage local. |
| RNF-02 | Metadados devem permanecer em memória nesta fase (sem banco). |
| RNF-03 | Configuração por variáveis de ambiente (12-Factor), incluindo porta e limites de upload. |
| RNF-04 | Backend deve seguir Clean Architecture simples: routes -> controllers -> services -> repositories. |
| RNF-05 | Código JavaScript legível e modular, sem overengineering. |
| RNF-06 | Tratamento de erro nos limites HTTP e de filesystem com respostas consistentes. |

## 5. Modelo de dados (metadados do documento)

### Entidade principal: DocumentMetadata

| Campo        | Tipo               | Obrigatório | Descrição |
| ------------ | ------------------ | ----------- | --------- |
| id           | string             | Sim         | Identificador único do documento (UUID ou equivalente). |
| originalName | string             | Sim         | Nome original enviado pelo usuário. |
| size         | number             | Sim         | Tamanho em bytes. |
| uploadedAt   | string (ISO 8601)  | Sim         | Data/hora do upload. |
| owner        | string             | Sim         | Identificador do usuário dono (via x-user-id). |

### Campos internos recomendados (não obrigatórios no payload público)

| Campo       | Tipo   | Descrição |
| ----------- | ------ | --------- |
| storedName  | string | Nome físico salvo no disco para evitar colisões. |
| mimeType    | string | Tipo MIME para resposta de download. |
| storagePath | string | Caminho absoluto/relativo do arquivo salvo. |

## 6. Contratos de API

### GET /health

- Objetivo: verificação de saúde da aplicação.
- Respostas:
- 200 OK: status operacional.

Exemplo de resposta:

```json
{
  "status": "ok"
}
```

### POST /upload

- Objetivo: enviar um arquivo e criar metadados.
- Headers:
- x-user-id: string obrigatório.
- Content-Type: multipart/form-data.
- Body:
- file: arquivo obrigatório.
- Respostas:
- 201 Created: metadados do documento criado.
- 400 Bad Request: ausência de arquivo, ausência de x-user-id, ou input inválido.
- 413 Payload Too Large: arquivo acima do limite configurado.
- 500 Internal Server Error: falha inesperada na escrita ou processamento.

Exemplo de resposta 201:

```json
{
  "id": "4df54e8f-4f4e-42e5-bfd9-f98245513602",
  "originalName": "contrato.pdf",
  "size": 235661,
  "uploadedAt": "2026-08-05T10:30:21.000Z",
  "owner": "demo-user"
}
```

### GET /documents

- Objetivo: listar documentos do usuário.
- Headers:
- x-user-id: string obrigatório.
- Respostas:
- 200 OK: lista de metadados (ordenada por uploadedAt desc).
- 400 Bad Request: ausência de x-user-id.
- 500 Internal Server Error: falha inesperada.

Exemplo de resposta 200:

```json
[
  {
    "id": "4df54e8f-4f4e-42e5-bfd9-f98245513602",
    "originalName": "contrato.pdf",
    "size": 235661,
    "uploadedAt": "2026-08-05T10:30:21.000Z",
    "owner": "demo-user"
  }
]
```

### GET /documents/:id/download

- Objetivo: baixar arquivo binário de um documento.
- Headers:
- x-user-id: string obrigatório.
- Path params:
- id: string obrigatório.
- Respostas:
- 200 OK: stream/binário do arquivo com Content-Disposition de anexo.
- 403 Forbidden: documento não pertence ao usuário.
- 404 Not Found: documento inexistente ou arquivo físico ausente.
- 400 Bad Request: id inválido ou ausência de x-user-id.
- 500 Internal Server Error: falha inesperada de leitura.

## 7. Decisões arquiteturais

- Backend organizado em camadas com fluxo de dependência estrito:
- routes: define endpoints e middleware HTTP.
- controllers: valida entrada/saída e mapeia erros de serviço para status HTTP.
- services: regras de negócio (ownership, validação de fluxo, orquestração).
- repositories: persistência (filesystem para binário + memória para metadados).
- Frontend em React com componentes funcionais e consumo de API via fetch com prefixo /api.
- Armazenamento estritamente local: sem provedores externos.

## 8. Plano de execução

1. Estruturar backend em camadas com módulos iniciais de route, controller, service e repository.
2. Implementar upload com multer diskStorage em backend/storage e geração de metadados em memória.
3. Implementar listagem por usuário usando x-user-id e ordenação por data de upload.
4. Implementar download por id com validação de ownership e streaming de arquivo.
5. Padronizar erros HTTP em formato consistente para o frontend.
6. Implementar serviço frontend para upload, listagem e download via /api.
7. Criar componentes UploadComponent, DocumentList e DownloadButton com estado e feedback de erro/sucesso.
8. Expandir testes backend com node:test para fluxos felizes e cenários de erro.
9. Validar execução ponta a ponta (manual e automatizada) e revisar aderência à Clean Architecture.
10. Atualizar documentação operacional com variáveis de ambiente e limitações da fase inicial.

## 9. Critérios de aceite

- Upload grava arquivo no diretório backend/storage usando multer diskStorage.
- Metadados ficam exclusivamente em memória no backend nesta fase.
- GET /documents retorna apenas documentos do usuário informado em x-user-id.
- GET /documents/:id/download bloqueia acesso de usuário não dono.
- Testes automatizados backend cobrem sucesso e falha dos endpoints principais.
- Frontend permite executar o fluxo completo de upload, listagem e download.
