export default function DownloadButton({ documentItem, onDownload, isDownloading }) {
  return (
    <button type="button" onClick={() => onDownload(documentItem)} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
