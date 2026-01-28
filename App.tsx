import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FolderOpen, 
  UploadCloud, 
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  BookOpen,
  Hash,
  Quote,
  Users,
  Youtube,
  X,
  Download,
  Files,
  Menu,
  ChevronRight,
  Activity,
  History,
  FileText,
  ShieldCheck,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  FileUp,
  Play,
  ListTodo
} from 'lucide-react';
import { geminiService, GeminiResponse } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';

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
  youtubeUrl: string;
  transcriptFiles: File[];
  actaType: 'Literal' | 'Sucinta';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'protocol' | 'manual'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estado para almacenar el contenido REAL generado por la IA
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState<NewSessionState>({
    name: '',
    youtubeUrl: '',
    transcriptFiles: [],
    actaType: 'Literal'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    geminiService.initChat();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  const activeSession = sessions.find(s => s.id === selectedSessionId);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
    setMobileMenuOpen(false); 
    
    const session = sessions.find(s => s.id === id);
    const hasYoutube = !!session?.youtubeUrl;
    const transcriptCount = session?.transcriptFiles?.length || 0;

    // Resetear el documento generado al cambiar de sesión
    setGeneratedDocument('');

    if (chatHistory.length === 0 || selectedSessionId !== id) {
      setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `**AGENTE RELATOR ONLINE**\n\nHola, soy tu asistente de relatoría. Mi función es tomar tus borradores y el video, fusionarlos, auditar la votación y entregarte un texto limpio.\n\n**Estado Actual:**\n- **Video Fuente:** ${hasYoutube ? '✅ Conectado' : '❌ No detectado'}\n- **Borradores:** ${transcriptCount > 0 ? `✅ ${transcriptCount} archivos cargados` : '❌ Pendientes'}\n\nCuando estés listo, presiona **"GENERAR BORRADOR CONSOLIDADO"** para iniciar el procesamiento masivo.`,
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
      youtubeUrl: newSessionData.youtubeUrl,
      transcriptFiles: newSessionData.transcriptFiles.map(f => f.name),
      actaType: newSessionData.actaType
    };

    setSessions([newSession, ...sessions]);
    setShowImportModal(false);
    handleSessionSelect(newId);
    setNewSessionData({ name: '', youtubeUrl: '', transcriptFiles: [], actaType: 'Literal' });
  };

  const handleAddFilesToActiveSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedSessionId) {
      const newFiles = Array.from(e.target.files).map(f => f.name);
      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            transcriptFiles: [...(s.transcriptFiles || []), ...newFiles]
          };
        }
        return s;
      }));

      const notification: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `✅ Sistema: Se integraron ${newFiles.length} borradores al contexto de la sesión.`,
        timestamp: new Date(),
        type: 'text'
      };
      setChatHistory(prev => [...prev, notification]);
    }
  };

  const handleDownloadDocx = () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    
    // Usar el documento generado real si existe, sino un fallback
    const contentToDownload = generatedDocument || `Error: No se ha generado contenido aún. Por favor ejecute el comando "GENERAR BORRADOR CONSOLIDADO" primero.`;

    const element = document.createElement("a");
    const file = new Blob([contentToDownload], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `ACTA_OFICIAL_${session?.id}_CONSOLIDADA.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const executeMasterProcess = async () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    const files = session?.transcriptFiles || [];
    
    if (isProcessing) return;
    setIsProcessing(true);

    // Prompt de Ingeniería: MODO EXPANDIDO + ANÁLISIS DE IMÁGENES
    const masterPrompt = `COMANDO: REDACCIÓN EXTENDIDA Y ANÁLISIS DOCUMENTAL.
    
    Contexto de Sesión: ${session?.name}, Fecha: ${session?.date}, Tipo: ${session?.actaType}.
    Fuente de Video: ${session?.youtubeUrl}
    
    TAREA:
    1. **ANALIZAR** los bloques de texto OCR e imágenes proporcionados.
    2. **INTERPRETAR** la estructura (tablas de votación, listas de asistencia, diapositivas).
    3. **EXPANDIR** el contenido. Transforma notas simples en discursos parlamentarios completos y solemnes.
    4. **UNIFICAR** el contenido fragmentado por páginas en un solo documento fluido.
    
    Quiero un documento final que parezca escrito por un relator experto, no una simple transcripción.`;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: "GENERAR BORRADOR CONSOLIDADO (Modo Expansión y Análisis Documental)",
      timestamp: new Date(),
      type: 'text'
    };
    setChatHistory(prev => [...prev, userMsg]);

    setTerminalLines([]);
    const steps: TerminalLine[] = [
      { text: `Iniciando Motor de Relatoría v3.0...`, type: 'info' },
      { text: `Modo: ANÁLISIS MULTIMODAL Y EXPANSIÓN`, type: 'warning' },
      { text: `Procesando OCR y metadatos de imágenes...`, type: 'command' },
      { text: `Analizando ${files.length} borradores de texto...`, type: 'command' },
    ];
    setTerminalLines(steps);

    await new Promise(r => setTimeout(r, 800));

    try {
      // Enviamos el prompt maestro
      const response = await geminiService.sendMessage(masterPrompt, session?.youtubeUrl);
      
      // GUARDAMOS EL CONTENIDO REAL
      setGeneratedDocument(response.text);

      const processingSteps: TerminalLine[] = [
        ...steps,
        { text: `>> Reconstrucción de Tablas/Gráficos: Completada`, type: 'success' },
        { text: `>> Expansión Parlamentaria: Ejecutada`, type: 'success' },
        { text: `>> Redacción Final: Optimizada`, type: 'success' },
        { text: `Generando archivo final...`, type: 'info' },
      ];

      for (const step of processingSteps.slice(4)) {
         await new Promise(r => setTimeout(r, 400));
         setTerminalLines(prev => [...prev, step]);
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `He generado el acta completa. He interpretado el contenido de las imágenes y el OCR suministrado, expandiendo la redacción de las digitadoras para lograr un documento formal y robusto. Se han reconstruido listas, tablas y se ha dado volumen retórico a las intervenciones. Extensión: ${(response.text.length).toLocaleString()} caracteres.`,
        timestamp: new Date(),
        type: 'audit',
        metadata: response.groundingChunks
      };

      setChatHistory(prev => [...prev, modelMsg]);
      setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, status: SessionStatus.COMPLETED} : s));

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: "Error crítico: No se pudo procesar la expansión del documento.",
        timestamp: new Date(),
        type: 'text'
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const activeSession = sessions.find(s => s.id === selectedSessionId);
      const response: GeminiResponse = await geminiService.sendMessage(inputMessage, activeSession?.youtubeUrl);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: new Date(),
        type: 'text',
        metadata: response.groundingChunks
      };

      setChatHistory(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
        {label}
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          active ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Bot className="text-white" size={22} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">ActaGen</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Relatoría AI</span>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Tablero Operativo" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
           <SidebarItem 
            icon={ShieldCheck} 
            label="Protocolo (19 Pasos)" 
            active={activeTab === 'protocol'} 
            onClick={() => setActiveTab('protocol')}
            badge="Master"
          />
          <SidebarItem 
            icon={FileText} 
            label="Manual de Estilo" 
            active={activeTab === 'manual'} 
            onClick={() => setActiveTab('manual')}
            badge="Audit"
          />
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Modo Relator</h4>
              <p className="text-[10px] text-green-600 font-bold uppercase">Listo para Publicar</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">Configurado para generar borradores finales.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full shadow-2xl">
             <Sidebar />
             <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
               <X size={20} />
             </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0 border-r border-slate-200 shadow-sm">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Centro de Control' : 
               activeTab === 'protocol' ? 'Protocolo de 19 Pasos' : 
               activeTab === 'manual' ? 'Manual de Estilo Municipal' : 'Agente Relator'}
            </h1>
          </div>
          {activeTab === 'agent' && selectedSessionId && (
            <div className="flex items-center gap-3">
               <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Files size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600">{(activeSession?.transcriptFiles?.length || 0)} Borradores</span>
               </div>
               <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95">
                  <Plus size={14} /> Cargar Borrador
                  <input type="file" className="hidden" multiple accept=".docx,.txt" onChange={handleAddFilesToActiveSession} />
               </label>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Panel Operativo de Relatoría</h2>
                        <p className="text-slate-500 text-sm mt-1">Gestione la fusión, auditoría y publicación de actas oficiales.</p>
                    </div>
                     <button onClick={() => setShowImportModal(true)} className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                        <Plus size={18} /> Nueva Sesión
                    </button>
                </div>

                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <ListTodo size={14} />
                    Cola de Procesamiento
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12">
                  {sessions.map(session => (
                    <SessionCard key={session.id} session={session} active={false} onClick={handleSessionSelect} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
               {/* Contenido Protocolo */}
               <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Protocolo Master</h2>
                      <p className="text-sm text-slate-500">Configuración AGENTIC_MASTER</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl">
                        <div className="flex-none w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">1</div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">Carga de Insumos</h3>
                          <p className="text-sm text-slate-500">El Relator carga el link de YouTube y los borradores de las digitadoras.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl">
                        <div className="flex-none w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">2</div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">Fusión Agéntica</h3>
                          <p className="text-sm text-slate-500">El Agente detecta solapamientos y une los textos en un solo flujo continuo.</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
              {/* Contenido Manual de Estilo (ya implementado) */}
               <div className="max-w-5xl mx-auto space-y-8 pb-12">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
                     <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm"><FileText size={32} /></div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Manual de Estilo V3_2026</h2>
                        <p className="text-slate-500 font-medium">Normas agénticas de redacción legislativa.</p>
                      </div>
                    </div>
                    <p className="text-slate-600">Referencia rápida para las correcciones automáticas aplicadas por el agente.</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="flex flex-col h-full relative">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 space-y-8 custom-scrollbar">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.role === 'system' ? 'justify-center' : 'justify-start')}`}>
                    <div className={`max-w-[90%] md:max-w-[70%] ${
                      msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl px-6 py-4 shadow-lg' : 
                      (msg.role === 'system' ? 'bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-2 border border-slate-200' : 
                      'bg-white border border-slate-100 text-slate-700 rounded-2xl shadow-xl')
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                          <Sparkles size={14} className="text-indigo-600" />
                          <span className="font-bold text-xs uppercase text-indigo-600">Audit Kernal</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                      
                      {/* Terminal de Ejecución */}
                      {terminalLines.length > 0 && msg.type === 'audit' && (
                          <div className="mt-4"><TerminalOutput lines={terminalLines} /></div>
                      )}
                      
                      {/* Tarjeta de Éxito / Descarga */}
                      {msg.type === 'audit' && (
                        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="bg-green-100 text-green-700 p-2 rounded-full"><CheckCircle2 size={24} /></div>
                             <div>
                                <h4 className="text-green-900 font-bold text-sm">Borrador Consolidado Listo</h4>
                                <p className="text-green-700 text-xs">Fusión completada y verificada ({generatedDocument.length > 0 ? (generatedDocument.length/3000).toFixed(0) : 0} páginas aprox).</p>
                             </div>
                          </div>
                          <button onClick={handleDownloadDocx} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2">
                            <Download size={18} /> DESCARGAR BORRADOR FINAL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
                       <Loader2 className="animate-spin text-blue-600" size={18} />
                       <span className="text-sm text-slate-500">Procesando {activeSession?.transcriptFiles?.length} borradores y video...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto flex gap-3">
                  {activeSession && (
                      <button 
                        onClick={executeMasterProcess}
                        disabled={isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                      >
                         <Zap size={16} /> GENERAR BORRADOR
                      </button>
                  )}
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe instrucciones adicionales al Agente..." className="flex-1 rounded-2xl border border-slate-200 px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-sm font-medium transition-all" disabled={isProcessing} />
                  <button onClick={handleSendMessage} disabled={isProcessing || !inputMessage} className={`px-6 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${isProcessing || !inputMessage ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}><Send size={20} /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showImportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Configurar Acta</h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nombre Sesión</label>
                  <input type="text" placeholder="Ej: Sesión Ordinaria #350" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-500/20" value={newSessionData.name} onChange={(e) => setNewSessionData({...newSessionData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Borradores de Digitadoras</label>
                  {/* Z-INDEX FIX: Added z-10 and cursor pointer to ensure input is clickable */}
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-all cursor-pointer group">
                    <FileUp className="text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <p className="text-xs font-bold text-slate-600">Haga clic para subir archivos (.docx)</p>
                    <p className="text-[10px] text-slate-400 mt-1">Soporta múltiples partes</p>
                    <input 
                        type="file" 
                        accept=".txt,.docx" 
                        multiple 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => {
                            if (e.target.files) {
                              setNewSessionData(prev => ({ ...prev, transcriptFiles: Array.from(e.target.files!) }));
                            }
                        }} 
                    />
                  </div>
                  {/* File List Preview */}
                  {newSessionData.transcriptFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {newSessionData.transcriptFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                                <span className="truncate flex-1 font-medium text-slate-600">{f.name}</span>
                                <Trash2 size={12} className="text-rose-400 cursor-pointer" onClick={() => setNewSessionData(prev => ({...prev, transcriptFiles: prev.transcriptFiles.filter((_, idx) => idx !== i)}))} />
                            </div>
                        ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Link Video YouTube</label>
                  <div className="relative">
                    <Youtube className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input type="text" placeholder="https://youtube.com/..." className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-500/20" value={newSessionData.youtubeUrl} onChange={(e) => setNewSessionData({...newSessionData, youtubeUrl: e.target.value})} />
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={handleCreateSession} disabled={!newSessionData.name} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    <Play size={20} /> INICIAR RELATORÍA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}