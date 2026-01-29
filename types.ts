/**
 * TYPES - ACTAGEN
 * Tipos centrales del sistema
 */

export enum SessionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface SessionData {
  id: string;
  name: string;
  date: string;
  status: SessionStatus;
  files: string[];
  transcriptFiles?: string[];
  transcriptContents?: string[];  // Contenido de las transcripciones cargadas
  duration: string;
  youtubeUrl?: string;
  sourceAudio?: File;
  actaType?: 'Literal' | 'Sucinta';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'audit' | 'video_analysis';
  metadata?: any;
}

export interface AuditRecord {
  sessionId: string;
  folios: string;
  status: string;
  observations: string;
}

export interface TerminalLine {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

// ===== TIPOS PARA EL PIPELINE AGÉNTICO =====

export type StepStatus = 'pending' | 'running' | 'success' | 'warning' | 'error';

export interface ThoughtLine {
  id: string;
  timestamp: Date;
  type: 'thought' | 'action' | 'observation' | 'decision' | 'error' | 'info';
  content: string;
  metadata?: {
    tokens?: number;
    duration?: number;
    model?: string;
  };
}

export interface PipelineStep {
  id: number;
  name: string;
  phase: 1 | 2 | 3;
  status: StepStatus;
  description: string;
  thoughts: ThoughtLine[];
  startTime?: Date;
  endTime?: Date;
  result?: string;
}

export interface AgentState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  sessionName: string;
  steps: PipelineStep[];
  globalThoughts: ThoughtLine[];
}

// ===== DEFINICIÓN DEL KERNEL 19 PASOS =====

export const KERNEL_19_STEPS: Omit<PipelineStep, 'status' | 'thoughts'>[] = [
  // FASE 1: INGENIERÍA DE ENTRADA Y FUSIÓN
  { id: 1, name: 'NORMALIZACIÓN DE FUENTES', phase: 1, description: 'Ingesta y limpieza de metadatos de archivos' },
  { id: 2, name: 'FUSIÓN INTELIGENTE', phase: 1, description: 'Deduplicación y merge de fragmentos con overlap' },
  { id: 3, name: 'UNIFICACIÓN DE PAGINACIÓN', phase: 1, description: 'Establecer flujo continuo desde página 1' },
  { id: 4, name: 'VERIFICACIÓN DE QUÓRUM', phase: 1, description: 'Cruzar nombres con lista oficial de 21 concejales' },
  { id: 5, name: 'ESTANDARIZACIÓN ORDEN DEL DÍA', phase: 1, description: 'Formato viñetas numéricas estrictas' },
  
  // FASE 2: AUDITORÍA Y CONTENIDO
  { id: 6, name: 'INTERVENCIONES Y CARGOS', phase: 2, description: 'Verificar formato de cada intervención' },
  { id: 7, name: 'CITAS Y REFERENCIAS', phase: 2, description: 'Convertir menciones a formato estándar de leyes' },
  { id: 8, name: 'AUDITORÍA DE VIDEO', phase: 2, description: 'Cross-check aleatorio contra audio/video' },
  { id: 9, name: 'VALIDACIÓN MATEMÁTICA VOTACIONES', phase: 2, description: 'Sumar votos SÍ + NO, generar tabla' },
  { id: 10, name: 'APLICACIÓN MANUAL DE ESTILO', phase: 2, description: 'Barrido V3_2026: comillas, cifras, mayúsculas' },
  { id: 11, name: 'GESTIÓN DE INAUDIBLES', phase: 2, description: 'Reemplazar marcas por (inaudible) o (sic)' },
  { id: 12, name: 'MARCAS DE TIEMPO', phase: 2, description: 'Insertar [Time: HH:MM:SS] en votaciones nominales' },
  { id: 13, name: 'ANONIMIZACIÓN', phase: 2, description: 'Ocultar datos personales de terceros (Habeas Data)' },
  { id: 14, name: 'CONTROL DE RETÓRICA', phase: 2, description: 'Eliminar muletillas manteniendo sentido' },
  
  // FASE 3: CIERRE Y EXPORTACIÓN
  { id: 15, name: 'VERIFICACIÓN PROPOSICIONES', phase: 3, description: 'Validar texto literal en bloque de cita' },
  { id: 16, name: 'CIERRE DE SESIÓN', phase: 3, description: 'Hora de finalización y convocatoria próxima' },
  { id: 17, name: 'BLOQUE DE FIRMAS', phase: 3, description: 'Generar placeholders para Presidente y Secretario' },
  { id: 18, name: 'REVISIÓN ORTOGRÁFICA FINAL', phase: 3, description: 'Escaneo de tildes y concordancia género/número' },
  { id: 19, name: 'REPORTE DE RELATORÍA', phase: 3, description: 'Log de intervenciones, votaciones, alertas críticas' },
];

// ===== HELPER PARA INICIALIZAR ESTADO =====

export function createInitialAgentState(sessionName: string): AgentState {
  return {
    isRunning: false,
    currentStep: 0,
    totalSteps: 19,
    sessionName,
    steps: KERNEL_19_STEPS.map(step => ({
      ...step,
      status: 'pending' as StepStatus,
      thoughts: []
    })),
    globalThoughts: []
  };
}
