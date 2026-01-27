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
  transcriptFiles?: string[]; // Changed to array to support multiple parts (Part 1, Part 2, etc.)
  duration: string;
  youtubeUrl?: string;
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