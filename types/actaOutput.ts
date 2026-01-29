/**
 * ACTA OUTPUT TYPES - ACTAGEN
 * Tipos para la estructura de salida del acta final
 * Basado en el análisis de Actas 257, 349, 350 del Concejo de Medellín
 */

// ===== ESTRUCTURA PRINCIPAL DEL ACTA =====

export interface ActaFinal {
  metadata: ActaMetadata;
  portada: ActaPortada;
  encabezado: ActaEncabezado;
  ordenDelDia: OrdenDelDiaItem[];
  desarrollo: ActaDesarrollo;
  comunicaciones: Comunicacion[];
  proposiciones: Proposicion[];
  asuntosVarios: Intervencion[];
  cierre: ActaCierre;
  anexos: Anexo[];
  transcripcion: TranscripcionMeta;
}

// ===== COMPONENTES =====

export interface ActaMetadata {
  numero: number;
  tipo: 'Ordinaria' | 'Extraordinaria' | 'Especial';
  fecha: string;           // ISO 8601
  fechaFormateada: string; // "10 de noviembre de 2025"
  youtubeUrl?: string;
  simiUrl?: string;
}

export interface ActaPortada {
  tipoSesion: string;      // "Sesión Plenaria"
  modalidad: string;       // "Ordinaria"
  numeroActa: number;
  fechaCompleta: string;   // "10 de noviembre de 2025"
}

export interface ActaEncabezado {
  fecha: string;
  horaInicio: string;      // "14:33"
  horaFin: string;         // "18:07"
  lugar: string;
  asistentes: Concejal[];
  ausentes: AusenteInfo[];
  quorumConfirmado: boolean;
  horaApertura: string;
}

export interface Concejal {
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  bancada?: string;
  cargo?: string;          // "presidente", "vicepresidente", etc.
  modalidadAsistencia?: 'presencial' | 'virtual';
}

export interface AusenteInfo {
  concejal: Concejal;
  justificada: boolean;
  motivo?: string;         // "licencia de maternidad", etc.
}

export interface OrdenDelDiaItem {
  numero: number;
  titulo: string;
  descripcion?: string;
}

// ===== DESARROLLO =====

export interface ActaDesarrollo {
  aprobacionOrdenDia: AprobacionInfo;
  excusasCitados?: ExcusasCitados;
  debatePrincipal?: DebatePrincipal;
  otrosPuntos: PuntoDesarrollo[];
}

export interface AprobacionInfo {
  tipoVotacion: 'ordinaria' | 'nominal';
  excepciones?: string[];  // concejales con votación especial
  intervenciones: boolean;
  resultado: 'aprobado' | 'rechazado' | 'modificado';
}

export interface ExcusasCitados {
  hayExcusas: boolean;
  excusas: ExcusaFuncionario[];
  funcionariosPresentes: FuncionarioCitado[];
  funcionariosAusentes: FuncionarioCitado[];
}

export interface ExcusaFuncionario {
  nombre: string;
  cargo: string;
  dependencia: string;
  motivo: string;
}

export interface FuncionarioCitado {
  nombre: string;
  cargo: string;
  dependencia: string;
  presente: boolean;
}

export interface DebatePrincipal {
  titulo: string;
  tipo: 'control_politico' | 'proyecto_acuerdo' | 'eleccion' | 'otro';
  bancadasCitantes: BancadaCitante[];
  intervenciones: IntervencionAgrupada;
  conclusiones?: Intervencion[];
  votacionFinal?: VotacionInfo;
}

export interface BancadaCitante {
  concejal: string;
  partido: string;
}

export interface IntervencionAgrupada {
  expertos: Intervencion[];
  ciudadania: Intervencion[];
  administracion: Intervencion[];
  concejales: Intervencion[];
  otros: Intervencion[];
}

export interface Intervencion {
  id: string;
  orador: OradoInfo;
  contenido: string;
  timestampVideo?: string;   // "HH:MM:SS"
  tipoContenido: 'discurso' | 'pregunta' | 'respuesta' | 'conclusion';
  referencias?: ReferenciaLegal[];
  materialAudiovisual?: boolean;  // si proyectó video/presentación
}

export interface OradoInfo {
  nombre: string;
  cargo: string;
  dependencia?: string;
  organizacion?: string;
  esConcejal: boolean;
  esFuncionario: boolean;
  esInvitado: boolean;
}

export interface ReferenciaLegal {
  tipo: 'ley' | 'decreto' | 'acuerdo' | 'resolucion' | 'constitucion' | 'otro';
  numero: string;
  año?: string;
  articulo?: string;
  descripcion?: string;
}

export interface PuntoDesarrollo {
  numero: number;
  titulo: string;
  contenido: string;
  intervenciones: Intervencion[];
}

// ===== VOTACIONES =====

export interface VotacionInfo {
  tipo: 'ordinaria' | 'nominal' | 'secreta';
  asunto: string;
  resultado: 'aprobado' | 'rechazado' | 'empate';
  votosSi?: number;
  votosNo?: number;
  abstenciones?: number;
  votosNominales?: VotoNominal[];
  timestampVideo?: string;
}

export interface VotoNominal {
  concejal: string;
  voto: 'si' | 'no' | 'abstencion';
  modalidad?: 'presencial' | 'virtual';
}

// ===== COMUNICACIONES Y PROPOSICIONES =====

export interface Comunicacion {
  numero: string;          // "4.1"
  radicado: string;
  fecha: string;
  remitente: string;
  destinatario: string;
  asunto: string;
}

export interface Proposicion {
  numero: string;          // "5.1"
  tipo: TipoProposicion;
  titulo: string;
  iniciativa: {
    concejal: string;
    bancada: string;
  };
  suscriptores?: string[];
  resultado: 'aprobada' | 'rechazada' | 'retirada' | 'aplazada';
}

export type TipoProposicion = 
  | 'distincion_oro'
  | 'distincion_plata'
  | 'nota_estilo'
  | 'prorroga_sesiones'
  | 'desistimiento'
  | 'otro';

// ===== CIERRE =====

export interface ActaCierre {
  formulaCierre: string;   // "Agotado el orden del día..."
  horaLevantamiento: string;
  convocatoria: ConvocatoriaProxima;
  firmas: FirmaInfo[];
  nota?: string;
  enlaces: EnlaceInfo[];
}

export interface ConvocatoriaProxima {
  dia: string;             // "martes"
  fecha: string;           // "11 de noviembre de 2025"
  hora: string;            // "09:00"
  lugar: string;
}

export interface FirmaInfo {
  cargo: 'Presidente' | 'Secretario General';
  nombre: string;
}

export interface EnlaceInfo {
  tipo: 'youtube' | 'simi' | 'otro';
  url: string;
  descripcion?: string;
}

// ===== ANEXOS =====

export interface Anexo {
  numero: number;
  descripcion: string;
  folios?: number;
  radicado?: string;
  tipo: 'registro' | 'citacion' | 'respuesta' | 'proposicion' | 'audio' | 'otro';
}

// ===== METADATOS DE TRANSCRIPCIÓN =====

export interface TranscripcionMeta {
  transcriptores: string[];
  revisor: string;
  fechaProcesamiento?: string;
  herramienta?: string;    // "ACTAGEN v1.0"
}

// ===== VALIDACIÓN =====

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness: number;    // 0-100%
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'major';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ===== FUNCIONES DE VALIDACIÓN =====

export function validateActaMinimum(acta: Partial<ActaFinal>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Campos obligatorios
  if (!acta.metadata?.numero) {
    errors.push({ field: 'metadata.numero', message: 'Número de acta requerido', severity: 'critical' });
  }
  if (!acta.metadata?.fecha) {
    errors.push({ field: 'metadata.fecha', message: 'Fecha requerida', severity: 'critical' });
  }
  if (!acta.encabezado?.horaInicio) {
    errors.push({ field: 'encabezado.horaInicio', message: 'Hora de inicio requerida', severity: 'critical' });
  }
  if (!acta.encabezado?.horaFin) {
    errors.push({ field: 'encabezado.horaFin', message: 'Hora de fin requerida', severity: 'major' });
  }
  if (!acta.encabezado?.asistentes?.length) {
    errors.push({ field: 'encabezado.asistentes', message: 'Lista de asistentes requerida', severity: 'critical' });
  }
  if (!acta.ordenDelDia?.length) {
    errors.push({ field: 'ordenDelDia', message: 'Orden del día requerido', severity: 'critical' });
  }
  if (!acta.cierre?.horaLevantamiento) {
    warnings.push({ field: 'cierre.horaLevantamiento', message: 'Hora de levantamiento no especificada' });
  }
  if (!acta.cierre?.firmas?.length) {
    warnings.push({ field: 'cierre.firmas', message: 'Firmas no incluidas', suggestion: 'Agregar placeholders de firma' });
  }
  
  // Calcular completitud
  const requiredFields = 10;
  const presentFields = [
    acta.metadata?.numero,
    acta.metadata?.fecha,
    acta.encabezado?.horaInicio,
    acta.encabezado?.asistentes?.length,
    acta.ordenDelDia?.length,
    acta.desarrollo,
    acta.cierre?.horaLevantamiento,
    acta.cierre?.convocatoria,
    acta.cierre?.firmas?.length,
    acta.transcripcion
  ].filter(Boolean).length;
  
  const completeness = Math.round((presentFields / requiredFields) * 100);
  
  return {
    isValid: errors.filter(e => e.severity === 'critical').length === 0,
    errors,
    warnings,
    completeness
  };
}

// ===== LISTA OFICIAL DE CONCEJALES (2024-2027) =====

export const CONCEJALES_MEDELLIN_2024_2027: Concejal[] = [
  { nombre: 'Sebastián', apellidos: 'López Valencia', nombreCompleto: 'Sebastián López Valencia', bancada: 'Centro Democrático' },
  { nombre: 'Santiago', apellidos: 'Perdomo Montoya', nombreCompleto: 'Santiago Perdomo Montoya', bancada: 'Creemos' },
  { nombre: 'Carlos Alberto', apellidos: 'Gutiérrez Bustamante', nombreCompleto: 'Carlos Alberto Gutiérrez Bustamante', bancada: 'Conservador' },
  { nombre: 'Andrés Felipe', apellidos: 'Tobón Villada', nombreCompleto: 'Andrés Felipe Tobón Villada', bancada: 'Centro Democrático' },
  { nombre: 'María Paulina', apellidos: 'Suárez Roldán', nombreCompleto: 'María Paulina Suárez Roldán', bancada: 'Creemos' },
  { nombre: 'Alejandro', apellidos: 'De Bedout Arango', nombreCompleto: 'Alejandro De Bedout Arango', bancada: 'Creemos' },
  { nombre: 'Juan Carlos', apellidos: 'de la Cuesta Galvis', nombreCompleto: 'Juan Carlos de la Cuesta Galvis', bancada: 'Creemos' },
  { nombre: 'Santiago', apellidos: 'Narváez Lombana', nombreCompleto: 'Santiago Narváez Lombana', bancada: 'Creemos' },
  { nombre: 'Damián', apellidos: 'Pérez Arroyave', nombreCompleto: 'Damián Pérez Arroyave', bancada: 'Creemos' },
  { nombre: 'Camila', apellidos: 'Gaviria Barreneche', nombreCompleto: 'Camila Gaviria Barreneche', bancada: 'Creemos' },
  { nombre: 'Janeth', apellidos: 'Hurtado Betancur', nombreCompleto: 'Janeth Hurtado Betancur', bancada: 'Creemos' },
  { nombre: 'Farley Jhaír', apellidos: 'Macías Betancur', nombreCompleto: 'Farley Jhaír Macías Betancur', bancada: 'Liberal' },
  { nombre: 'José Luis', apellidos: 'Marín Mora', nombreCompleto: 'José Luis Marín Mora', bancada: 'Polo Democrático' },
  { nombre: 'Alejandro', apellidos: 'Arias García', nombreCompleto: 'Alejandro Arias García', bancada: 'Alianza Verde' },
  { nombre: 'Miguel Ángel', apellidos: 'Iguarán Osorio', nombreCompleto: 'Miguel Ángel Iguarán Osorio', bancada: 'Coalición Juntos' },
  { nombre: 'Juan Ramón', apellidos: 'Jiménez Lara', nombreCompleto: 'Juan Ramón Jiménez Lara', bancada: 'ASI' },
  { nombre: 'Brisvani Alexis', apellidos: 'Arenas Suaza', nombreCompleto: 'Brisvani Alexis Arenas Suaza', bancada: 'Conservador' },
  { nombre: 'Leticia', apellidos: 'Orrego Pérez', nombreCompleto: 'Leticia Orrego Pérez', bancada: 'Centro Democrático' },
  { nombre: 'Andrés Felipe', apellidos: 'Rodríguez Puerta', nombreCompleto: 'Andrés Felipe Rodríguez Puerta', bancada: 'Independiente' },
  { nombre: 'Claudia Victoria', apellidos: 'Carrasquilla Minami', nombreCompleto: 'Claudia Victoria Carrasquilla Minami', bancada: 'Creemos' },
  { nombre: 'Luis Guillermo de Jesús', apellidos: 'Vélez Álvarez', nombreCompleto: 'Luis Guillermo de Jesús Vélez Álvarez', bancada: 'Centro Democrático' },
];

export const TOTAL_CONCEJALES = 21;
export const QUORUM_DELIBERATORIO = 11;  // Mayoría simple
export const QUORUM_DECISORIO = 11;      // Mayoría simple
