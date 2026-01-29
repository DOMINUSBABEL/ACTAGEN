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
  Brain  // NUEVO
} from 'lucide-react';
import { geminiService, GeminiResponse } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';
import { FileUploader } from './components/FileUploader';
import { PipelineTab } from './components/PipelineTab';  // NUEVO

// Configure PDF.js worker
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
    date: 'Ene 27, 2026',
    status: SessionStatus.PENDING,
    files: ['Anexo_A_Asistencia.pdf', 'Anexo_B_Presupuesto.pdf'],
    duration: '5h 15m',
    youtubeUrl: 'https://youtube.com/watch?v=example',
    transcriptFiles: ['348_parte1.docx', '348_parte2.docx', '348_parte3.docx'],
    actaType: 'Literal'
  },
  {
    id: '347',
    name: 'Sesión Extraordinaria #347',
    date: 'Ene 20, 2026',
    status: SessionStatus.COMPLETED,
    files: ['video_sesion_347.mp4', 'Anexo_Unico.pdf'],
    duration: '45m',
    actaType: 'Sucinta'
  }
];

// Helper to extract text from PDF
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
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

// TIPOS DE TAB ACTUALIZADOS
type TabType = 'dashboard' | 'pipeline' | 'validator' | 'protocol' | 'manual';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States for Validator
  const [validatorFiles, setValidatorFiles] = useState<File[]>([]);
  const [validatorParts, setValidatorParts] = useState<any[]>([]);
  const [xmlResult, setXmlResult] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{current: number, total: number}>({ current: 0, total: 0 });

  useEffect(() => {
    geminiService.initChat();
  }, []);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('pipeline'); // Ir al pipeline cuando se selecciona sesión
    setMobileMenuOpen(false);
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
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
        <div className="flex items-center gap-3"><Icon size={20} />{label}</div>
        {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{badge}</span>}
      </button>
  );

  const Sidebar = () => (
      <div className="flex flex-col h-full bg-white border-r border-slate-200">
          <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="text-white" size={22} />
                </div>
                <div>
                  <span className="font-bold text-lg">ActaGen</span>
                  <span className="text-[10px] ml-1 text-slate-400">v3.0</span>
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
                    icon={Brain} 
                    label="Kernel 19 Pasos" 
                    active={activeTab === 'pipeline'} 
                    onClick={() => setActiveTab('pipeline')} 
                    badge="AI"
                  />
                  <SidebarItem 
                    icon={FileSearch} 
                    label="Auditoría TEI / XML" 
                    active={activeTab === 'validator'} 
                    onClick={() => setActiveTab('validator')} 
                  />
                  <SidebarItem 
                    icon={ShieldCheck} 
                    label="Protocolo (Docs)" 
                    active={activeTab === 'protocol'} 
                    onClick={() => setActiveTab('protocol')} 
                  />
                  <SidebarItem 
                    icon={FileText} 
                    label="Manual de Estilo" 
                    active={activeTab === 'manual'} 
                    onClick={() => setActiveTab('manual')} 
                  />
              </nav>
          </div>
          
          {/* Sessions List */}
          <div className="flex-1 px-6 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sesiones Recientes</h3>
            <div className="space-y-2">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedSessionId === session.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-800">{session.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{session.date} • {session.duration}</div>
                </button>
              ))}
            </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0 border-r border-slate-200 shadow-sm"><Sidebar /></aside>
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-bold">
                {activeTab === 'dashboard' && '📊 Tablero Operativo'}
                {activeTab === 'pipeline' && '🧠 Kernel 19 Pasos'}
                {activeTab === 'validator' && '🔍 Auditoría TEI / XML'}
                {activeTab === 'protocol' && '📋 Protocolo de Revisión'}
                {activeTab === 'manual' && '📖 Manual de Estilo'}
              </h1>
            </div>
            {selectedSession && activeTab === 'pipeline' && (
              <div className="text-sm text-slate-500">
                Sesión activa: <span className="font-medium text-slate-700">{selectedSession.name}</span>
              </div>
            )}
        </header>

        <div className="flex-1 overflow-hidden relative">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
             <div className="h-full overflow-y-auto p-4 md:p-8">
               <div className="max-w-4xl mx-auto">
                 <div className="mb-6">
                   <h2 className="text-2xl font-bold text-slate-900 mb-2">Sesiones Plenarias</h2>
                   <p className="text-slate-500">Selecciona una sesión para procesarla con el Kernel 19 Pasos</p>
                 </div>
                 <div className="grid gap-4">
                   {sessions.map(session => (
                     <SessionCard 
                       key={session.id}
                       session={session} 
                       active={selectedSessionId === session.id} 
                       onClick={handleSessionSelect} 
                     />
                   ))}
                 </div>
               </div>
             </div>
          )}

          {/* PIPELINE TAB - NUEVO */}
          {activeTab === 'pipeline' && (
            <PipelineTab 
              sessionId={selectedSessionId || 'nueva'}
              sessionName={selectedSession?.name || 'Nueva Sesión'}
            />
          )}

          {/* VALIDATOR TAB */}
          {activeTab === 'validator' && (
             <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
                <div className="max-w-6xl mx-auto flex flex-col h-full pb-12">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6 flex-none">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Layers size={32} /></div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">Auditoría + Fusión de Insumos</h2>
                          <p className="text-slate-500">Carga múltiples borradores (Parte 1, Parte 2...). El Agente los fusionará, limpiará y auditará.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                             <FileUploader 
                                accept=".txt,.md,.xml,.docx,.pdf" 
                                multiple={true}
                                onFilesSelected={handleValidatorFileUpload}
                                label="Cargar Múltiples Borradores"
                                subLabel="Soporta PDF (extracción auto), DOCX, TXT"
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
                                {isValidating ? 'Fusionando & Auditando...' : 'FUSIONAR Y AUDITAR'}
                             </button>
                          </div>
                      </div>
                   </div>

                   {/* Output Area */}
                   <div className="flex-1 min-h-[400px] bg-[#1E1E2E] rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col font-mono text-sm relative border border-slate-800">
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                         <div className="flex items-center gap-2 text-slate-400">
                           <Code size={16} />
                           <span className="font-bold">TEI_XML_OUTPUT_CONSOLE</span>
                         </div>
                         <div className="flex gap-4 text-xs items-center">
                            {xmlResult && (
                                <button onClick={handleDownloadXml} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors">
                                    <Download size={12} />
                                    Exportar XML/TEI Completo
                                </button>
                            )}
                            <span className="text-red-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Spelling</span>
                            <span className="text-yellow-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Style</span>
                            <span className="text-blue-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Consistency</span>
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto custom-scrollbar text-slate-300 leading-relaxed whitespace-pre-wrap">
                         {xmlResult ? (
                            xmlResult.split(/(<FLAW[^>]*>.*?<\/FLAW>)/g).map((part, index) => {
                               if (part.startsWith('<FLAW')) {
                                  const typeMatch = part.match(/type="([^"]*)"/);
                                  const suggestionMatch = part.match(/suggestion="([^"]*)"/);
                                  const contentMatch = part.match(/>(.*?)<\/FLAW>/);
                                  
                                  const type = typeMatch ? typeMatch[1] : 'unknown';
                                  const suggestion = suggestionMatch ? suggestionMatch[1] : '';
                                  const content = contentMatch ? contentMatch[1] : '';

                                  let colorClass = 'text-slate-200';
                                  if (type === 'spelling') colorClass = 'text-red-400 border-b border-red-400/50';
                                  if (type === 'style') colorClass = 'text-yellow-400 border-b border-yellow-400/50';
                                  if (type === 'coherence') colorClass = 'text-orange-400 border-b border-orange-400/50';
                                  if (type === 'grammar') colorClass = 'text-blue-400 border-b border-blue-400/50';

                                  return (
                                     <span key={index} className="relative group cursor-help inline-block mx-1">
                                        <span className={`${colorClass} font-bold bg-white/5 px-1 rounded`}>{content}</span>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-white/20">
                                           <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">TYPE: {type}</div>
                                           <div className="text-green-400">SUGGESTION: {suggestion}</div>
                                        </span>
                                     </span>
                                  );
                               }
                               return <span key={index}>{part}</span>;
                            })
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                               {isValidating ? (
                                   <>
                                      <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
                                      {auditProgress.total > 0 && (
                                        <div className="flex flex-col items-center gap-2 mt-2">
                                            <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-purple-500 transition-all duration-300"
                                                    style={{ width: `${(auditProgress.current / auditProgress.total) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold">
                                                PROCESANDO BLOQUE {auditProgress.current} DE {auditProgress.total}
                                            </p>
                                        </div>
                                      )}
                                      <p className="text-slate-400 mt-2">Extrayendo texto y aplicando auditoría secuencial...</p>
                                   </>
                               ) : (
                                   <>
                                      <FileSearch size={48} className="opacity-20" />
                                      <p>Esperando archivos para procesar...</p>
                                   </>
                               )}
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* PROTOCOL TAB */}
          {activeTab === 'protocol' && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">
                <h2 className="text-2xl font-bold mb-6">📋 Protocolo de Revisión y Ensamblaje</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 mb-4">
                    El Kernel de 19 Pasos es el proceso agéntico que garantiza la calidad del acta final.
                    Cada paso se ejecuta secuencialmente con validaciones automáticas.
                  </p>
                  
                  <h3 className="text-lg font-bold mt-6 mb-3 text-blue-600">Fase 1: Ingeniería de Entrada (Pasos 1-5)</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Normalización de fuentes</li>
                    <li>Fusión inteligente con deduplicación</li>
                    <li>Unificación de paginación</li>
                    <li>Verificación de quórum</li>
                    <li>Estandarización del orden del día</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-6 mb-3 text-purple-600">Fase 2: Auditoría de Contenido (Pasos 6-14)</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Intervenciones y cargos</li>
                    <li>Citas y referencias legales</li>
                    <li>Auditoría de video (cross-check)</li>
                    <li>Validación matemática de votaciones</li>
                    <li>Aplicación del Manual de Estilo V3_2026</li>
                    <li>Gestión de inaudibles</li>
                    <li>Marcas de tiempo</li>
                    <li>Anonimización (Habeas Data)</li>
                    <li>Control de retórica</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-6 mb-3 text-emerald-600">Fase 3: Cierre y Exportación (Pasos 15-19)</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Verificación de proposiciones</li>
                    <li>Cierre de sesión</li>
                    <li>Bloque de firmas</li>
                    <li>Revisión ortográfica final</li>
                    <li>Reporte de relatoría</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL TAB */}
          {activeTab === 'manual' && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">
                <h2 className="text-2xl font-bold mb-6">📖 Manual de Estilo V3_2026</h2>
                <div className="prose prose-slate max-w-none space-y-6">
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">1. Puntuación y Comillas</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>Nivel 1:</strong> Comillas inglesas ("...") para citas directas</li>
                      <li>• <strong>Nivel 2:</strong> Comillas españolas («...») dentro de citas</li>
                      <li>• <strong>Regla:</strong> El punto y la coma van DESPUÉS de las comillas</li>
                      <li className="text-red-600">✗ Incorrecto: "La sesión terminó."</li>
                      <li className="text-emerald-600">✓ Correcto: "La sesión terminó".</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-2">2. Cifras y Moneda</h3>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• <strong>Formato:</strong> $ 20.000.000.000 (puntos de mil)</li>
                      <li>• <strong>Alternativa:</strong> $ 20.000 millones</li>
                      <li>• <strong>Porcentajes:</strong> Separados de la cifra (50 %)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <h3 className="text-lg font-bold text-emerald-800 mb-2">3. Cargos y Entidades</h3>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      <li>• <strong>Cargos:</strong> MINÚSCULA (secretario, alcalde, concejal)</li>
                      <li>• <strong>Entidades:</strong> MAYÚSCULA (Concejo de Medellín, Secretaría de Hacienda)</li>
                      <li className="text-emerald-600">✓ "El secretario de Hacienda presentó el informe"</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <h3 className="text-lg font-bold text-amber-800 mb-2">4. Votaciones</h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• <strong>Formato dual:</strong> Número + letras en paréntesis</li>
                      <li>• <strong>Regla:</strong> NO contar ausentes en el total</li>
                      <li className="text-emerald-600">✓ "Aprobado con 21 (veintiún) votos positivos"</li>
                    </ul>
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
