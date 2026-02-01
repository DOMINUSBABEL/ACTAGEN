import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, FileAudio, FileText, FileSpreadsheet, Presentation, RefreshCw } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label?: string;
  subLabel?: string;
  icon?: React.ElementType;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  accept, 
  multiple = false, 
  label = "Haga clic para subir archivos", 
  subLabel = "Soporta MP3, DOCX, PDF, TXT",
  icon: Icon = UploadCloud
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.mp3') || name.endsWith('.wav')) return FileAudio;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return FileSpreadsheet;
    if (name.endsWith('.pptx') || name.endsWith('.ppt')) return Presentation;
    if (name.endsWith('.pdf')) return FileText;
    return FileIcon;
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setFileName(files.length === 1 ? files[0].name : `${files.length} archivos seleccionados`);

    // Simulación de carga basada en el tamaño total para UX
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const simulationDuration = Math.min(Math.max(totalSize / 100000, 800), 2000); 
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      const increment = Math.max(1, (100 - currentProgress) / 5);
      setUploadProgress(prev => Math.min(prev + increment, 99));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          onFilesSelected(files);
        }, 300);
      }
    }, simulationDuration / 10);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const CurrentIcon = fileName ? CheckCircle : Icon;

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer group overflow-hidden ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300'
        } ${fileName ? 'py-4' : 'py-8'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2 px-6">
            <div className="flex items-center gap-3 text-sm font-bold text-blue-600 mb-2">
               <Loader2 size={18} className="animate-spin" />
               <span>Procesando archivos...</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            {fileName ? (
                <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle size={28} />
                    <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{fileName}</p>
                        <p className="text-xs text-slate-500">Clic para cambiar</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={`p-3 rounded-full bg-blue-50 text-blue-600 mb-3 group-hover:scale-110 transition-transform`}>
                        <CurrentIcon size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">
                    {label}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {subLabel}
                    </p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};