import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setError('');

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      event.target.reset();
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível enviar o arquivo.');
    }
  }

  return (
    <section>
      <h2>Upload de documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          disabled={isUploading}
        />
        <button type="submit" disabled={isUploading || !selectedFile}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {error ? <p>{error}</p> : null}
    </section>
  );
}
