import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  LayoutDashboard, 
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Youtube,
  X,
  Download,
  Files,
  Menu,
  FileText,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  ListTodo,
  Music,
  Headphones,
  FileSearch,
  Code,
  FileUp,
  Play,
  Layers,
  Eye,
  Check,
  AlertTriangle,
  PenTool,
  Type,
  Search,
  ExternalLink,
  Ear,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ArrowRight
} from 'lucide-react';
import { geminiService, GeminiResponse } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';
import { FileUploader } from './components/FileUploader';

// Configure PDF.js worker
// Fix for ESM/CJS interop with pdfjs-dist: resolve the correct object
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
} else {
  console.warn("PDF.js GlobalWorkerOptions not found. PDF extraction may fail.");
}

const INITIAL_SESSIONS: SessionData[] = [
  {
    id: '348',
    name: 'Sesión Ordinaria #348',
    date: 'Oct 24, 2026',
    status: SessionStatus.PENDING,
    files: ['Anexo_A_Asistencia.pdf', 'Anexo_B_Presupuesto.pdf'],
    duration: '2h 14m',
    youtubeUrl: 'https://youtube.com/watch?v=example',
    transcriptFiles: ['348_parte1.docx', '348_parte2.docx', '348_parte3.docx'],
    actaType: 'Literal'
  },
  {
    id: '347',
    name: 'Sesión Extraordinaria #347',
    date: 'Oct 10, 2026',
    status: SessionStatus.COMPLETED,
    files: ['video_sesion_347.mp4', 'Anexo_Unico.pdf'],
    duration: '45m',
    actaType: 'Sucinta'
  }
];

interface NewSessionState {
  name: string;
  sourceType: 'youtube' | 'audio';
  youtubeUrl: string;
  sourceAudio: File | null;
  transcriptFiles: File[];
  actaType: 'Literal' | 'Sucinta';
}

interface FlawDetail {
    original: string;
    suggestion: string;
    type: string;
    reason?: string;
    id: string; // Unique ID for key mapping
    fullTag?: string; // To replace in string
    index?: number;
}

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
};

// Helper to extract text from PDF
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the resolved pdfjs object instead of the import namespace directly
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    // Iterate over all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n[PÁGINA ${i}]\n${pageText}\n`;
    }
    return fullText;
  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    throw error;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'protocol' | 'manual' | 'validator'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<string>(''); // For progress bar
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States for Validator
  const [validatorFiles, setValidatorFiles] = useState<File[]>([]);
  const [validatorParts, setValidatorParts] = useState<any[]>([]); // Array of API parts
  const [xmlResult, setXmlResult] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{current: number, total: number}>({ current: 0, total: 0 });
  
  // New State for Visual Editor & Navigation
  const [viewMode, setViewMode] = useState<'code' | 'visual'>('visual');
  const [selectedFlaw, setSelectedFlaw] = useState<FlawDetail | null>(null);
  const [currentFlawIndex, setCurrentFlawIndex] = useState<number>(-1);
  const [totalFlaws, setTotalFlaws] = useState<number>(0);
  
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState<NewSessionState>({
    name: '',
    sourceType: 'youtube',
    youtubeUrl: '',
    sourceAudio: null,
    transcriptFiles: [],
    actaType: 'Literal'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    geminiService.initChat();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing, terminalLines]);

  // Effect to count flaws when xmlResult changes
  useEffect(() => {
      if (xmlResult) {
          const matches = xmlResult.match(/<FLAW[^>]*>.*?<\/FLAW>/g);
          setTotalFlaws(matches ? matches.length : 0);
          // If we have flaws but none selected, select first? No, let user drive.
      } else {
          setTotalFlaws(0);
          setCurrentFlawIndex(-1);
          setSelectedFlaw(null);
      }
  }, [xmlResult]);

  const activeSession = sessions.find(s => s.id === selectedSessionId);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
    setMobileMenuOpen(false); 
    setGeneratedDocument('');
    if (chatHistory.length === 0 || selectedSessionId !== id) {
       setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `**AGENTE RELATOR ONLINE**\n\nHola, soy tu asistente de relatoría.`,
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  };

  const handleCreateSession = () => {
      const newId = (Math.floor(Math.random() * 1000) + 350).toString();
      const newSession: SessionData = {
        id: newId,
        name: newSessionData.name || `Sesión Nueva #${newId}`,
        date: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: SessionStatus.PENDING,
        files: [],
        duration: '0h 0m',
        youtubeUrl: newSessionData.sourceType === 'youtube' ? newSessionData.youtubeUrl : undefined,
        sourceAudio: newSessionData.sourceType === 'audio' ? newSessionData.sourceAudio! : undefined,
        transcriptFiles: newSessionData.transcriptFiles.map(f => f.name),
        actaType: newSessionData.actaType
      };
  
      setSessions([newSession, ...sessions]);
      setShowImportModal(false);
      handleSessionSelect(newId);
      setNewSessionData({ name: '', sourceType: 'youtube', youtubeUrl: '', sourceAudio: null, transcriptFiles: [], actaType: 'Literal' });
  };
  
  const handleAddFilesToActiveSession = (files: File[]) => {
      if (files && selectedSessionId) {
        const newFiles = files.map((f: File) => f.name);
        setSessions(prev => prev.map(s => {
          if (s.id === selectedSessionId) {
            return {
              ...s,
              transcriptFiles: [...(s.transcriptFiles || []), ...newFiles]
            };
          }
          return s;
        }));
      }
  };

  const handleTeiAudit = async () => {
    if (validatorParts.length === 0) return;
    
    setIsValidating(true);
    setXmlResult(''); 
    setAuditProgress({ current: 0, total: 0 });
    
    try {
      await new Promise(r => setTimeout(r, 500));
      const result = await geminiService.auditTextWithTEI(validatorParts, (current, total) => {
          setAuditProgress({ current, total });
      });
      setXmlResult(result);
    } catch (error) {
      console.error(error);
      setXmlResult("Error crítico al ejecutar auditoría TEI/Fusión.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadXml = () => {
    if (!xmlResult) return;
    const blob = new Blob([xmlResult], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AUDITORIA_TEI_${new Date().getTime()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadCleanVersion = () => {
      if (!xmlResult) return;
      // Primitive logic to apply all changes:
      // Replace <FLAW ... suggestion="X">Y</FLAW> with X
      const cleanText = xmlResult.replace(/<FLAW[^>]*suggestion="([^"]*)"[^>]*>.*?<\/FLAW>/g, '$1');
      const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BORRADOR_FINAL_REVISADO_${new Date().getTime()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  // NEW: Download Review Doc (Word-like HTML for visual diffs)
  const handleDownloadReviewDoc = () => {
      if (!xmlResult) return;
      
      // We'll create a simple HTML that Word interprets as track changes (visual only)
      // <strike>Original</strike> <u>Suggestion</u>
      let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Revisión ActaGen</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
        .flaw-original { background-color: #ffe6e6; text-decoration: line-through; color: #cc0000; }
        .flaw-suggestion { background-color: #e6ffe6; text-decoration: underline; color: #006600; font-weight: bold; }
        .flaw-reason { font-size: 9pt; color: #666; font-style: italic; }
      </style>
      </head><body>
      `;
      
      let processed = xmlResult;
      // Replace FLAW tags with HTML spans
      processed = processed.replace(/<FLAW[^>]*suggestion="([^"]*)"[^>]*reason="([^"]*)"[^>]*>(.*?)<\/FLAW>/g, 
        (match, suggestion, reason, original) => {
           return `<span class="flaw-original">${original}</span> <span class="flaw-suggestion">${suggestion}</span> <span class="flaw-reason">[${reason}]</span>`;
        });
      // Handle cases with no reason or different attrib order (simplified regex for demo, ideally parse properly)
      // Fallback for simpler tags
      processed = processed.replace(/<FLAW[^>]*suggestion="([^"]*)"[^>]*>(.*?)<\/FLAW>/g, 
          (match, suggestion, original) => {
             // Avoid double replace if previous regex caught it
             if(match.includes('class="flaw-')) return match; 
             return `<span class="flaw-original">${original}</span> <span class="flaw-suggestion">${suggestion}</span>`;
          });
          
      // Convert newlines to breaks
      processed = processed.replace(/\n/g, '<br/>');
      
      htmlContent += processed + "</body></html>";
      
      const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `REVISION_CON_CAMBIOS_${new Date().getTime()}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleValidatorFileUpload = async (files: File[]) => {
    if (files && files.length > 0) {
        const updatedFiles = [...validatorFiles, ...files];
        setValidatorFiles(updatedFiles);
        setXmlResult(''); 
        
        const newParts: any[] = [];
        for (const file of files) {
             if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                 try {
                     const extractedText = await extractTextFromPDF(file);
                     newParts.push({ text: `[ARCHIVO PDF EXTRAÍDO: ${file.name}]\n${extractedText}` });
                 } catch (e) { 
                     console.error("PDF Text Extraction Error", e);
                     const base64Data = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(file);
                     });
                     newParts.push({
                        inlineData: { data: base64Data, mimeType: 'application/pdf' }
                     });
                 }
            } else {
                const text = await new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = (e) => resolve(e.target?.result as string);
                     reader.readAsText(file);
                });
                newParts.push({ text: `[ARCHIVO: ${file.name}]\n${text}` });
            }
        }
        setValidatorParts(prev => [...prev, ...newParts]);
    }
  };

  const clearValidator = () => {
      setValidatorFiles([]);
      setValidatorParts([]);
      setXmlResult('');
      setAuditProgress({ current: 0, total: 0 });
      setSelectedFlaw(null);
      setCurrentFlawIndex(-1);
      setTotalFlaws(0);
  };

  const handleDownloadDocx = () => {
      const session = sessions.find(s => s.id === selectedSessionId);
      const contentToDownload = generatedDocument || `Error: No se ha generado contenido aún.`;
      const element = document.createElement("a");
      const file = new Blob([contentToDownload], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = `ACTA_OFICIAL_${session?.id}_CONSOLIDADA.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };
  
  // NAVIGATION LOGIC
  const selectFlawByIndex = (index: number) => {
      if (!xmlResult) return;
      
      const regex = /<FLAW[^>]*>.*?<\/FLAW>/g;
      let match;
      let i = 0;
      
      while ((match = regex.exec(xmlResult)) !== null) {
          if (i === index) {
              const fullTag = match[0];
              const typeMatch = fullTag.match(/type="([^"]*)"/);
              const suggestionMatch = fullTag.match(/suggestion="([^"]*)"/);
              const reasonMatch = fullTag.match(/reason="([^"]*)"/);
              const contentMatch = fullTag.match(/>(.*?)<\/FLAW>/);
              
              const type = typeMatch ? typeMatch[1] : 'unknown';
              const suggestion = suggestionMatch ? suggestionMatch[1] : '';
              const reason = reasonMatch ? reasonMatch[1] : '';
              const content = contentMatch ? contentMatch[1] : '';
              const id = `flaw-${index}`; // Note: index changes if we modify text, but for view mode it's ok-ish
              
              setSelectedFlaw({
                  id,
                  original: content,
                  suggestion,
                  type,
                  reason,
                  fullTag,
                  index
              });
              setCurrentFlawIndex(index);
              
              // Scroll to element
              const el = document.getElementById(id); // We need to set ID in render
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
          }
          i++;
      }
  };
  
  const handleNextFlaw = () => {
      if (totalFlaws === 0) return;
      const nextIndex = (currentFlawIndex + 1) % totalFlaws;
      selectFlawByIndex(nextIndex);
  };
  
  const handlePrevFlaw = () => {
      if (totalFlaws === 0) return;
      const prevIndex = (currentFlawIndex - 1 + totalFlaws) % totalFlaws;
      selectFlawByIndex(prevIndex);
  };
  
  // ACTION LOGIC
  const handleAcceptFlaw = () => {
      if (!selectedFlaw || !xmlResult || !selectedFlaw.fullTag) return;
      
      // Replace the full tag with the suggestion
      const newXml = xmlResult.replace(selectedFlaw.fullTag, selectedFlaw.suggestion);
      setXmlResult(newXml);
      
      // Auto advance after short delay (state needs to update first)
      setTimeout(() => {
         // Logic to stay near current index or move next
         // Since we removed one, current index now points to the next one
         // unless we were at the end
         if (totalFlaws > 1) {
             const nextIdx = currentFlawIndex >= totalFlaws - 1 ? 0 : currentFlawIndex;
             // We need to re-find because content changed. 
             // Actually, the useEffect will trigger count update.
             // But we need to manually trigger selection of the "new" flaw at this index
             // This is tricky in async React. 
             // Simplified: Reset selection, user clicks next. Or try to auto-select.
             setSelectedFlaw(null); // Clear for now
         } else {
             setSelectedFlaw(null);
         }
      }, 100);
  };
  
  const handleRejectFlaw = () => {
      if (!selectedFlaw || !xmlResult || !selectedFlaw.fullTag) return;
      
      // Replace the full tag with the ORIGINAL content (remove tag)
      const newXml = xmlResult.replace(selectedFlaw.fullTag, selectedFlaw.original);
      setXmlResult(newXml);
      
       setTimeout(() => {
         if (totalFlaws > 1) {
             setSelectedFlaw(null); 
         } else {
             setSelectedFlaw(null);
         }
      }, 100);
  };

  const executeMasterProcess = async () => {
     // ... (Existing implementation preserved)
     const session = sessions.find(s => s.id === selectedSessionId);
     if (isProcessing) return;
     setIsProcessing(true);
     const isAudioSession = !!session?.sourceAudio;
     
     setTerminalLines([]);
     try {
       if (isAudioSession && session?.sourceAudio) {
         setTerminalLines(prev => [...prev, { text: `Inicializando Kernel...`, type: 'info' }]);
         const audioPart = await fileToGenerativePart(session.sourceAudio);
         const contextInfo = `Sesión: ${session.name}`;
         let fullDocumentAccumulator = "";
         let phaseCounter = 1;
         for await (const chunk of geminiService.generateLongAudioActa(audioPart, contextInfo)) {
           fullDocumentAccumulator += `\n\n## ${chunk.step}\n\n${chunk.text}`;
           setProcessingPhase(`${phaseCounter}/5: ${chunk.step}`);
           phaseCounter++;
         }
         setGeneratedDocument(fullDocumentAccumulator);
       } else {
         const response = await geminiService.sendMessage(`Generar acta para ${session?.name}`, session?.youtubeUrl);
         setGeneratedDocument(response.text);
       }
     } catch (e) { console.error(e); } 
     finally { setIsProcessing(false); }
  };

  const handleSendMessage = async () => {
      if (!inputMessage.trim() || isProcessing) return;
      setInputMessage('');
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
        <div className="flex items-center gap-3"><Icon size={20} />{label}</div>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{badge}</span>}
      </button>
  );

  const Sidebar = () => (
      <div className="flex flex-col h-full bg-white border-r border-slate-200">
          <div className="p-6">
              <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Bot className="text-white" size={22} /></div><span className="font-bold text-lg">ActaGen</span></div>
              <nav className="space-y-1.5">
                  <SidebarItem icon={LayoutDashboard} label="Tablero Operativo" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <SidebarItem icon={ShieldCheck} label="Protocolo (19 Pasos)" active={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} badge="Master" />
                  <SidebarItem icon={FileSearch} label="Asistente de Revisión" active={activeTab === 'validator'} onClick={() => setActiveTab('validator')} badge="New" />
                  <SidebarItem icon={FileText} label="Manual de Estilo" active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
              </nav>
          </div>
      </div>
  );
  
  const getLabelForType = (type: string) => {
      if (type.includes('basura')) return { label: 'Basura Editorial / Typo', color: 'bg-slate-200 text-slate-600' };
      if (type.includes('coherencia')) return { label: 'Duda Semántica (¿Audio?)', color: 'bg-orange-100 text-orange-700' };
      if (type.includes('entidad') || type.includes('entity')) return { label: 'Entidad Faltante', color: 'bg-purple-100 text-purple-700' };
      if (type.includes('estilo') || type.includes('style')) return { label: 'Estilo / Convención', color: 'bg-yellow-100 text-yellow-700' };
      if (type.includes('ortografia') || type.includes('spelling')) return { label: 'Ortografía', color: 'bg-red-100 text-red-700' };
      if (type.includes('puntuacion') || type.includes('punctuation')) return { label: 'Puntuación', color: 'bg-orange-100 text-orange-700' };
      if (type.includes('formato') || type.includes('format')) return { label: 'Formato Cifras', color: 'bg-blue-100 text-blue-700' };
      return { label: 'Corrección General', color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0 border-r border-slate-200 shadow-sm"><Sidebar /></aside>
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <h1 className="text-lg font-bold">ActaGen AI - Asistente de Relatoría</h1>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
             <div className="h-full overflow-y-auto p-4 md:p-8"><SessionCard session={sessions[0]} active={false} onClick={handleSessionSelect} /></div>
          )}

          {activeTab === 'validator' && (
             <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
                <div className="max-w-6xl mx-auto flex flex-col h-full pb-12">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6 flex-none">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Layers size={32} /></div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">Revisión y Ensamble de Borradores</h2>
                          <p className="text-slate-500">Carga las partes del acta (Part 1, 2, 3) y el asistente las unirá, verificando coherencia semántica, residuos y formato.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                             <FileUploader 
                                accept=".txt,.md,.xml,.docx,.pdf" 
                                multiple={true} 
                                onFilesSelected={handleValidatorFileUpload}
                                label="Cargar Documentos (Partes)"
                                subLabel="Soporta múltiples archivos. Se unirán en orden."
                                icon={FileSearch}
                             />
                             {validatorFiles.length > 0 && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                   <div className="flex gap-2 items-center">
                                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-md">{validatorFiles.length} archivos</span>
                                      <span className="text-xs text-slate-500 truncate max-w-[200px]">{validatorFiles.map(f => f.name).join(', ')}</span>
                                   </div>
                                   <button onClick={clearValidator} className="text-xs text-red-500 hover:underline">Limpiar</button>
                                </div>
                             )}
                          </div>
                          <div className="flex flex-col justify-center gap-2">
                             <button 
                                onClick={handleTeiAudit} 
                                disabled={validatorFiles.length === 0 || isValidating}
                                className={`h-full px-8 rounded-2xl font-bold text-sm shadow-lg flex flex-col items-center justify-center gap-2 transition-all ${validatorFiles.length === 0 || isValidating ? 'bg-slate-100 text-slate-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                             >
                                {isValidating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                                {isValidating ? 'ANALIZANDO...' : 'INICIAR REVISIÓN'}
                             </button>
                          </div>
                      </div>
                   </div>

                   {/* Editor Area */}
                   <div className="flex-1 min-h-[500px] flex gap-6 overflow-hidden">
                       <div className="flex-1 bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
                           {/* HEADER WITH NAVIGATOR */}
                           <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                               <div className="flex items-center gap-4">
                                   <div className="flex bg-slate-200 rounded-lg p-1">
                                       <button 
                                           onClick={() => setViewMode('visual')}
                                           className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'visual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                       >
                                           <Eye size={14} /> Vista
                                       </button>
                                       <button 
                                           onClick={() => setViewMode('code')}
                                           className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'code' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                       >
                                           <Code size={14} /> Código
                                       </button>
                                   </div>
                                   
                                   {/* CAMBIOS NAVIGATOR */}
                                   {totalFlaws > 0 && viewMode === 'visual' && (
                                       <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 px-2 ml-4 shadow-sm">
                                           <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wide">Navegador de Cambios</span>
                                           <button onClick={handlePrevFlaw} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronLeft size={16}/></button>
                                           <span className="text-xs font-mono text-slate-700 w-12 text-center">
                                               {currentFlawIndex !== -1 ? currentFlawIndex + 1 : '-'} / {totalFlaws}
                                           </span>
                                           <button onClick={handleNextFlaw} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronRight size={16}/></button>
                                       </div>
                                   )}

                                   {isValidating && (
                                       <span className="text-xs text-purple-600 flex items-center gap-2 animate-pulse">
                                           <Loader2 size={12} className="animate-spin" />
                                           Procesando...
                                       </span>
                                   )}
                               </div>
                               <div className="flex gap-2">
                                  {xmlResult && (
                                    <>
                                      <button onClick={handleDownloadReviewDoc} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all" title="Descargar documento con cambios visibles para Word">
                                          <FileEdit size={16} />
                                          EXPORTAR REVISIÓN (DOC)
                                      </button>
                                      <button onClick={handleDownloadCleanVersion} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all" title="Descargar texto limpio aceptando todas las sugerencias">
                                          <CheckCircle2 size={16} />
                                          LIMPIO
                                      </button>
                                    </>
                                  )}
                               </div>
                           </div>

                           <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
                               {xmlResult ? (
                                   viewMode === 'code' ? (
                                       <pre className="font-mono text-xs text-slate-600 whitespace-pre-wrap">{xmlResult}</pre>
                                   ) : (
                                       <div className="prose max-w-none text-slate-700 leading-relaxed font-serif text-lg">
                                           {xmlResult.split(/(<FLAW[^>]*>.*?<\/FLAW>)/g).map((part, index) => {
                                               if (part.startsWith('<FLAW')) {
                                                   const fullTag = part;
                                                   const typeMatch = part.match(/type="([^"]*)"/);
                                                   const suggestionMatch = part.match(/suggestion="([^"]*)"/);
                                                   const reasonMatch = part.match(/reason="([^"]*)"/); 
                                                   const contentMatch = part.match(/>(.*?)<\/FLAW>/);
                                                   
                                                   const type = typeMatch ? typeMatch[1] : 'unknown';
                                                   const suggestion = suggestionMatch ? suggestionMatch[1] : '';
                                                   const reason = reasonMatch ? reasonMatch[1] : '';
                                                   const content = contentMatch ? contentMatch[1] : '';
                                                   
                                                   // We calculate a pseudo-index based on rendering order
                                                   // This is slightly flaky if map doesn't run sequentially but usually fine
                                                   // Better approach: count flaws in map logic or regex before render
                                                   // For UI purposes, we just need a unique ID for scroll
                                                   
                                                   // Lets find the 'nth' flaw this is
                                                   const flawIndex = xmlResult.substring(0, xmlResult.indexOf(part)).match(/<FLAW/g)?.length || 0;
                                                   const id = `flaw-${flawIndex}`;

                                                   let highlightClass = 'bg-slate-200 decoration-slate-400';
                                                   if (type.includes('estilo') || type.includes('style')) highlightClass = 'bg-yellow-100 decoration-yellow-400 text-yellow-900';
                                                   if (type.includes('puntuacion')) highlightClass = 'bg-orange-100 decoration-orange-400 text-orange-900';
                                                   if (type.includes('ortografia')) highlightClass = 'bg-red-100 decoration-red-400 text-red-900';
                                                   if (type.includes('formato')) highlightClass = 'bg-blue-100 decoration-blue-400 text-blue-900';
                                                   if (type.includes('entidad')) highlightClass = 'bg-purple-100 decoration-purple-400 text-purple-900';
                                                   
                                                   if (type.includes('basura')) highlightClass = 'bg-slate-300 decoration-slate-500 text-slate-500 line-through opacity-60';
                                                   if (type.includes('coherencia')) highlightClass = 'bg-orange-100 decoration-orange-400 text-orange-900 border-orange-200';

                                                   const isSelected = selectedFlaw?.id === id;

                                                   return (
                                                       <span 
                                                           id={id}
                                                           key={index} 
                                                           onClick={() => {
                                                               setSelectedFlaw({ id, original: content, suggestion, type, reason, fullTag, index: flawIndex });
                                                               setCurrentFlawIndex(flawIndex);
                                                           }}
                                                           className={`cursor-pointer px-1 rounded mx-0.5 border-b-2 transition-all ${highlightClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 shadow-md' : ''} border-dashed inline-block`}
                                                           title="Clic para revisar"
                                                       >
                                                           {content}
                                                       </span>
                                                   );
                                               }
                                               return <span key={index}>{part}</span>;
                                           })}
                                       </div>
                                   )
                               ) : (
                                   <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                       <FileText size={64} className="mb-4" />
                                       <p>Los documentos procesados aparecerán aquí.</p>
                                   </div>
                               )}
                           </div>
                       </div>

                       {/* Sidebar Assistant */}
                       <div className="w-[340px] bg-white rounded-3xl shadow-xl flex flex-col border border-slate-200 overflow-hidden">
                           <div className="bg-slate-50 p-4 border-b border-slate-100">
                               <div className="flex items-center gap-2 text-slate-700 font-bold">
                                   <Sparkles size={18} className="text-purple-600" />
                                   <span>Asistente de Corrección</span>
                               </div>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto">
                               {selectedFlaw ? (
                                   <div className="space-y-6 animate-pulse-glow" style={{ animationDuration: '0.3s' }}>
                                       <div>
                                           <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getLabelForType(selectedFlaw.type).color}`}>
                                                    {getLabelForType(selectedFlaw.type).label}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">#{currentFlawIndex + 1}</span>
                                           </div>
                                           <h3 className="text-lg font-bold text-slate-800 mt-3 mb-1 leading-tight">Observación del Asistente</h3>
                                       </div>

                                       <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                           <div className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center gap-1"><X size={12}/> Texto Original</div>
                                           <div className="text-red-900 font-medium line-through decoration-red-300 break-words">{selectedFlaw.original}</div>
                                       </div>

                                       <div className="flex justify-center">
                                            <ArrowRight className="text-slate-300 transform rotate-90 md:rotate-0" />
                                       </div>

                                       <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                                           <div className="text-xs text-green-600 font-bold uppercase mb-1 flex items-center gap-1"><Check size={12}/> Sugerencia de Cambio</div>
                                           <div className="text-green-900 font-bold text-lg break-words">{selectedFlaw.suggestion || '(Eliminar)'}</div>
                                       </div>

                                       {selectedFlaw.reason && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 leading-snug">
                                                <span className="font-bold block mb-1">Por qué:</span> {selectedFlaw.reason}
                                            </div>
                                       )}

                                       {(selectedFlaw.type.includes('entidad') || selectedFlaw.type.includes('coherencia')) && activeSession?.youtubeUrl && (
                                            <a 
                                                href={activeSession.youtubeUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all mb-2"
                                            >
                                                <Youtube size={18} />
                                                Verificar Audio en YouTube
                                            </a>
                                       )}
                                       
                                       <div className="grid grid-cols-2 gap-2 mt-4">
                                            <button 
                                                onClick={handleRejectFlaw}
                                                className="py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                            >
                                                <X size={18} />
                                                Rechazar
                                            </button>
                                            <button 
                                                onClick={handleAcceptFlaw}
                                                className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Check size={18} />
                                                Aceptar
                                            </button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="text-center text-slate-400 mt-20">
                                       <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                                       <p className="font-medium text-slate-600 mb-2">Selecciona un error</p>
                                       <p className="text-sm">Utiliza el navegador superior o haz clic en los textos subrayados.</p>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}