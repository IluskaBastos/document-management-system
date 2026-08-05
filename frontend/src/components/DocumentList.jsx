import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (!Number.isFinite(size)) {
    return 'Tamanho desconhecido';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const sizeInKb = size / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  const sizeInMb = sizeInKb / 1024;
  return `${sizeInMb.toFixed(2)} MB`;
}

function formatDate(dateAsString) {
  if (!dateAsString) {
    return 'Data não informada';
  }

  return new Date(dateAsString).toLocaleString('pt-BR');
}

export default function DocumentList({ documents, onDownload, downloadingDocumentId }) {
  return (
    <section>
      <h2>Documentos</h2>

      {documents.length === 0 ? <p>Nenhum documento enviado até agora.</p> : null}

      <ul>
        {documents.map((documentItem) => (
          <li key={documentItem.id}>
            <p>
              <strong>{documentItem.originalName}</strong>
            </p>
            <p>{formatFileSize(documentItem.size)}</p>
            <p>Dono: {documentItem.owner}</p>
            <p>Enviado em: {formatDate(documentItem.createdAt)}</p>
            <DownloadButton
              documentItem={documentItem}
              onDownload={onDownload}
              isDownloading={downloadingDocumentId === documentItem.id}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
