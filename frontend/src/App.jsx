import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const refreshDocuments = useCallback(async () => {
    setErrorMessage('');

    try {
      const listedDocuments = await listDocuments();
      setDocuments(listedDocuments);
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível carregar os documentos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleUpload = useCallback(async (file) => {
    setIsUploading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const uploadedDocument = await uploadDocument(file);
      setDocuments((currentDocuments) => [uploadedDocument, ...currentDocuments]);
      setStatusMessage('Documento enviado com sucesso.');
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível enviar o documento.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDownload = useCallback(async (documentItem) => {
    setDownloadingDocumentId(documentItem.id);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await downloadDocument(documentItem.id, documentItem.originalName);
      setStatusMessage(`Download iniciado para "${documentItem.originalName}".`);
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível baixar o documento.');
    } finally {
      setDownloadingDocumentId('');
    }
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <UploadComponent onUpload={handleUpload} isUploading={isUploading} />

      <hr style={{ margin: '1.5rem 0' }} />

      {isLoading ? (
        <p>Carregando documentos...</p>
      ) : (
        <DocumentList
          documents={documents}
          onDownload={handleDownload}
          downloadingDocumentId={downloadingDocumentId}
        />
      )}

      {statusMessage ? <p>{statusMessage}</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
    </main>
  );
}
