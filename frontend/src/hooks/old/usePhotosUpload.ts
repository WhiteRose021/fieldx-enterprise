import { useState, useCallback } from 'react';

export function usePhotosUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFilesSelected = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setPreviews([]);
  }, []);

  return {
    files,
    previews,
    handleFilesSelected,
    removeFile,
    clearFiles
  };
}

export default usePhotosUpload;