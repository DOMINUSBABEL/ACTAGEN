import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FolderOpen, 
  UploadCloud, 
  FileText,
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
  FileUp,
  Download,
  Files
} from 'lucide-react';
import { geminiService } from './services/geminiService';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'rules'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  
  // Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    name: '',
    youtubeUrl: '',
    transcriptFiles: [] as File[],
    actaType: 'Literal' as 'Literal' | 'Sucinta'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize service
  useEffect(() => {
    geminiService.initChat();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
    
    const session = sessions.find(s => s.id === id);
    const hasYoutube = !!session?.youtubeUrl;
    const transcriptCount = session?.transcriptFiles?.length || 0;

    // Reset chat if selecting a new session for demo purposes
    if (chatHistory.length === 0 || selectedSessionId !== id) {
      setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `Hola. Soy ActaGen (v3.0). He cargado el **Protocolo de 19 Pasos** y el **Manual de Estilo Completo**.\n\n` +
                 (transcriptCount > 0 ? `📚 **Entrada**: ${transcriptCount} borradores de digitadoras detectados.\n` : '') +
                 (hasYoutube ? `🎥 **Contraste**: URL de YouTube activa. Generaré una propuesta interna basada en el video para contrastar con los borradores.\n` : '') +
                 `\nMi objetivo es construir una **Propuesta de Acta Literal** lo más completa posible y generar el reporte de observaciones (Paso 19).\n\n¿Inicio el protocolo de revisión y ensamblaje?`,
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

  const handleDownloadDocx = () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    // Simulating the construction of a REAL document structure based on the 19 steps
    const generatedContent = `
ACTA No. ${session?.id || '000'}
SESIÓN ${session?.name.toUpperCase() || 'ORDINARIA'}
FECHA: ${session?.date}
HORA INICIO: 09:00 | HORA FIN: ${session?.duration}

[PROPUESTA DE ACTA LITERAL - GENERADA POR AGENTE GEMINI 3]

1. LLAMADO A LISTA Y VERIFICACIÓN DEL QUÓRUM
El secretario procedió a llamar a lista. Contestaron SÍ los concejales: (Verificación contra video: OK)
...

[...CONTENIDO LITERAL EXTENSO DE LA SESIÓN...]

-----------------------------------------------------------
ANEXO: REPORTE DE OBSERVACIONES PARA DIGITADORAS (PASO 19)
-----------------------------------------------------------
Este reporte contrasta los borradores entregados con la evidencia en video.

1. PAGINACIÓN: Se detectó error en consecutivo en el empalme Parte 2 -> Parte 3. Corregido en esta versión.
2. ESTILO: Se encontraron comillas simples en pág 5 (Prohibido según Regla 1).
3. CIFRAS: En la pág. 12, borrador dice "$2.5 millones", video (min 45:20) confirma "$2.5 billones".
4. NOMBRES: Corregir apellido "Muñoz" por "Muñetón" en intervención pág 18.

Por favor revisar estas observaciones sobre el documento maestro adjunto.
    `;

    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'application/msword'});
    element.href = URL.createObjectURL(file);
    element.download = `PROPUESTA_ACTA_${session?.id}_CON_OBSERVACIONES.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const simulateCodeExecution = async () => {
    setTerminalLines([]);
    const session = sessions.find(s => s.id === selectedSessionId);
    const files = session?.transcriptFiles || [];
    const hasYoutube = !!session?.youtubeUrl;

    // Mapping steps to the 19-step protocol
    const steps: TerminalLine[] = [
      { text: `iniciando Protocolo de Revisión de 19 Pasos...`, type: 'info' },
    ];

    if (files.length > 0) {
        steps.push({ text: `[PASO 1] Fusión de ${files.length} borradores. Eliminando info digitadoras y empalmes...`, type: 'command' });
        files.forEach((f, i) => {
            if (i > 0) {
                 steps.push({ text: `   >> Empalme Parte ${i}-${i+1}: Eliminado párrafo repetido (Overlap Detection).`, type: 'success' });
            }
        });
    }

    steps.push({ text: `[PASO 2-6] Verificando Metadatos (Portada, Fecha, Horas)...`, type: 'info' });
    
    if (hasYoutube) {
        steps.push({ text: `[CONTRASTE] Analizando Video Fuente (${session?.youtubeUrl})...`, type: 'command' });
        steps.push({ text: `[PASO 7] Asistencia: Cruzando video vs archivo ausentismo.`, type: 'info' });
        steps.push({ text: `[PASO 9] Votaciones: Auditando audio de Secretaría vs Video.`, type: 'warning' });
        steps.push({ text: `   >> Alerta: Borrador cuenta 17 votos, Video cuenta 18. Marcado para observación.`, type: 'error' });
    }

    steps.push({ text: `[PASO 10] Auditoría de Estilo: Revisando Reglas 1-5 (Cifras, Cargos, Puntuación)...`, type: 'command' });
    steps.push({ text: `   >> Regla 2 (Cifras): Corrigiendo "$2.500" a "$ 2500" en folio 12.`, type: 'success' });

    steps.push({ text: `[PASO 12] Formato Imágenes: Ajustando "Detrás del texto" y centrado.`, type: 'info' });
    steps.push({ text: `[PASO 17] Anexos: Listando proposiciones y folios.`, type: 'info' });
    steps.push({ text: `[PASO 19] Generando Reporte de Observaciones para Digitadoras...`, type: 'command' });
    steps.push({ text: `PROPUESTA DE ACTA LITERAL + FEEDBACK LISTO.`, type: 'success' });

    for (const step of steps) {
        await new Promise(r => setTimeout(r, 800)); // Slower to let user read steps
        setTerminalLines(prev => [...prev, step]);
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
      const responseText = await geminiService.sendMessage(inputMessage);
      const isProcessingRequest = inputMessage.toLowerCase().includes('proce') || inputMessage.toLowerCase().includes('sí') || inputMessage.toLowerCase().includes('ok') || inputMessage.toLowerCase().includes('fusion') || inputMessage.toLowerCase().includes('generar') || inputMessage.toLowerCase().includes('inicio');

      if (isProcessingRequest) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          simulateCodeExecution();
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date(),
        type: isProcessingRequest ? 'audit' : 'text'
      };

      setChatHistory(prev => [...prev, modelMsg]);

      if (isProcessingRequest && selectedSessionId) {
          setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, status: SessionStatus.COMPLETED} : s));
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setNewSessionData(prev => ({
            ...prev,
            transcriptFiles: Array.from(e.target.files || [])
        }));
    }
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">ActaGen</span>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Tablero" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
             <SidebarItem 
              icon={BookOpen} 
              label="Protocolo (19 Pasos)" 
              active={activeTab === 'rules'} 
              onClick={() => setActiveTab('rules')} 
            />
            <SidebarItem 
              icon={FolderOpen} 
              label="Mis Archivos" 
              active={false} 
            />
            <SidebarItem 
              icon={Settings} 
              label="Configuración" 
              active={false} 
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Gemini 3 Powered</h4>
            <p className="text-xs text-blue-700">Reglas Municipales Activas.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-lg font-semibold text-gray-800">
            {activeTab === 'dashboard' ? 'Resumen de Sesiones' : 
             activeTab === 'rules' ? 'Protocolo de Revisión' :
             `Agente de Actas / Sesión #${selectedSessionId || '...'}`}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Operativo
            </div>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Actas Procesadas</div>
                <div className="text-3xl font-bold text-gray-900">142</div>
                <div className="text-green-600 text-xs mt-2 flex items-center gap-1">
                  <Sparkles size={12} /> +12% este mes
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Tiempo Ahorrado</div>
                <div className="text-3xl font-bold text-gray-900">320h</div>
                <div className="text-blue-600 text-xs mt-2">Equivalente a 2 FTEs</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Precisión IA</div>
                <div className="text-3xl font-bold text-gray-900">99.4%</div>
                <div className="text-gray-400 text-xs mt-2">Basado en auditorías</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Sesiones Recientes</h2>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                <UploadCloud size={18} />
                Nueva Importación
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessions.map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  active={false}
                  onClick={handleSessionSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Base / Rules View */}
        {activeTab === 'rules' && (
          <div className="p-8 overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Protocolo de 19 Pasos (Concejo de Medellín)</h2>
                    <p className="text-gray-500 text-sm">Flujo estricto para revisión y ensamblaje de Actas Literales.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">1. Fusión y Limpieza</h3>
                    <p className="text-sm text-gray-600">Unificar Partes 1, 2, 3... eliminando info digitadoras y empalmes redundantes.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">2-6. Metadatos y Estructura</h3>
                    <p className="text-sm text-gray-600">Validar Portada, Títulos, Número de Acta, Fecha y Horarios Militares.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">9. Auditoría de Votaciones</h3>
                    <p className="text-sm text-gray-600">Conteo estricto (SÍ + NO == Total) y contraste con Video.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-2">19. Observaciones para Digitadoras</h3>
                    <p className="text-sm text-blue-700">Generar tabla de correcciones detectadas durante el contraste (Agente vs Humano).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent View */}
        {activeTab === 'agent' && (
          <div className="flex-1 flex flex-col relative bg-white">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] lg:max-w-[70%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-md' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-lg'
                  }`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                        <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Sparkles size={14} className="text-white" />
                        </div>
                        <span className="font-semibold text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                          Gemini 3 Agent
                        </span>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-normal p-2">
                      {msg.content}
                    </div>

                    {/* Rich UI Elements within Chat */}
                    {terminalLines.length > 0 && msg.type === 'audit' && (
                        <TerminalOutput lines={terminalLines} />
                    )}

                    {msg.type === 'audit' && (
                      <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-semibold text-sm mb-2">
                          <CheckCircle2 size={16} /> Propuesta de Acta Generada
                        </div>
                        <div className="space-y-2 text-xs text-green-700">
                          <div className="flex justify-between border-b border-green-200 pb-1">
                            <span>Tipo:</span>
                            <span className="font-bold">Acta Literal (Propuesta)</span>
                          </div>
                          <div className="flex justify-between border-b border-green-200 pb-1">
                             <span>Contraste:</span>
                             <span className="font-mono text-gray-600">
                                {sessions.find(s => s.id === selectedSessionId)?.youtubeUrl ? 'Video vs Texto' : 'Solo Texto'}
                             </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Paso 19:</span>
                            <span className="font-bold text-red-600">Observaciones Incluidas</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleDownloadDocx}
                          className="mt-3 w-full bg-green-600 text-white py-2 rounded text-xs font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <Download size={14} /> Descargar Propuesta + Feedback
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-3">
                     <Loader2 className="animate-spin text-blue-500" size={20} />
                     <span className="text-sm text-gray-500 animate-pulse">Ejecutando protocolo de 19 pasos (Fusión, Auditoría, Feedback)...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="max-w-4xl mx-auto flex gap-3">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe instrucciones (ej: 'Inicia el protocolo', 'Verifica votación min 45')..."
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                  disabled={isProcessing}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isProcessing || !inputMessage}
                  className={`px-6 rounded-xl font-medium transition-all shadow-md flex items-center gap-2 ${
                    isProcessing || !inputMessage 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="max-w-4xl mx-auto mt-2 text-center">
                 <p className="text-[10px] text-gray-400">Gemini 3 contrasta los borradores de las digitadoras con el video oficial.</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nueva Importación */}
        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Nueva Importación de Sesión</h3>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sesión</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sesión Ordinaria #350"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSessionData.name}
                    onChange={(e) => setNewSessionData({...newSessionData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Borradores de Transcripción (Partes)</label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <Files className="mx-auto text-gray-400 mb-2" size={24} />
                    {newSessionData.transcriptFiles.length > 0 ? (
                       <div className="text-left">
                         <p className="text-xs font-semibold text-green-600 mb-1">Archivos seleccionados:</p>
                         <ul className="text-xs text-gray-600 list-disc list-inside">
                            {newSessionData.transcriptFiles.map((f, i) => (
                                <li key={i}>{f.name}</li>
                            ))}
                         </ul>
                         <p className="text-[10px] text-blue-500 mt-2 text-center">El agente fusionará estos archivos en orden (Paso 1).</p>
                       </div>
                    ) : (
                       <p className="text-xs text-gray-500">Arrastra las partes (Parte 1, Parte 2...) aquí para unificarlas.</p>
                    )}
                    <input 
                      type="file" 
                      accept=".txt,.docx"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de YouTube (Fuente Verdad)</label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="https://youtube.com/..."
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newSessionData.youtubeUrl}
                      onChange={(e) => setNewSessionData({...newSessionData, youtubeUrl: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Permite al agente contrastar los borradores con el video (Pasos 9, 19).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acta a Generar</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setNewSessionData({...newSessionData, actaType: 'Literal'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        newSessionData.actaType === 'Literal' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Literal (Recomendado)
                    </button>
                    <button 
                      onClick={() => setNewSessionData({...newSessionData, actaType: 'Sucinta'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        newSessionData.actaType === 'Sucinta' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Sucinta (Resumen)
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleCreateSession}
                    disabled={!newSessionData.name}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    <Bot size={18} />
                    Crear Agente e Iniciar
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