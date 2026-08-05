import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi';

export default function App() {
  const [owner, setOwner] = useState('demo-user');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const refreshDocuments = useCallback(async () => {
    if (!owner.trim()) {
      setDocuments([]);
      setErrorMessage('Informe o identificador do usuario para carregar os documentos.');
      setIsLoading(false);
      return;
    }

    setErrorMessage('');

    try {
      const listedDocuments = await listDocuments(owner);
      setDocuments(listedDocuments);
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível carregar os documentos.');
    } finally {
      setIsLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleUpload = useCallback(async (file) => {
    if (!owner.trim()) {
      const message = 'Informe o identificador do usuario antes de enviar arquivos.';
      setErrorMessage(message);
      throw new Error(message);
    }

    setIsUploading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const uploadedDocument = await uploadDocument(file, owner);
      setDocuments((currentDocuments) => [uploadedDocument, ...currentDocuments]);
      setStatusMessage('Documento enviado com sucesso.');
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível enviar o documento.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [owner]);

  const handleDownload = useCallback(async (documentItem) => {
    if (!owner.trim()) {
      setErrorMessage('Informe o identificador do usuario antes de baixar arquivos.');
      return;
    }

    setDownloadingDocumentId(documentItem.id);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await downloadDocument(documentItem.id, documentItem.originalName, owner);
      setStatusMessage(`Download iniciado para "${documentItem.originalName}".`);
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível baixar o documento.');
    } finally {
      setDownloadingDocumentId('');
    }
  }, [owner]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <section>
        <label htmlFor="owner-input">Identificador do usuario (x-user-id)</label>
        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <input
            id="owner-input"
            type="text"
            value={owner}
            onChange={(event) => {
              setOwner(event.target.value);
              setIsLoading(true);
              setStatusMessage('');
            }}
            placeholder="ex.: demo-user"
            style={{ minWidth: '16rem' }}
          />
        </div>
      </section>

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
