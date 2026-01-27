import React from 'react';
import { SessionData, SessionStatus } from '../types';
import { FileVideo, MoreVertical, PlayCircle, CheckCircle, Clock, Youtube, Calendar } from 'lucide-react';

interface SessionCardProps {
  session: SessionData;
  onClick: (id: string) => void;
  active: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, active }) => {
  return (
    <div 
      onClick={() => onClick(session.id)}
      className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        active 
          ? 'bg-blue-50/50 border-blue-300 shadow-md ring-1 ring-blue-200' 
          : 'bg-white border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            session.status === SessionStatus.COMPLETED ? 'bg-green-50 text-green-600' : 
            session.status === SessionStatus.PROCESSING ? 'bg-blue-50 text-blue-600' :
            'bg-slate-50 text-slate-500'
          }`}>
            {session.status === SessionStatus.COMPLETED ? <CheckCircle size={20} /> :
             session.status === SessionStatus.PROCESSING ? <Clock size={20} className="animate-pulse" /> :
             session.youtubeUrl ? <Youtube size={20} className="text-red-500" /> :
             <FileVideo size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{session.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                <Calendar size={12} />
                <span>{session.date}</span>
            </div>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-600 text-xs font-semibold">
          {session.actaType || 'Literal'}
        </span>
        <span className="text-slate-300 text-xs">•</span>
        <span className="text-xs text-slate-500 font-medium">{session.youtubeUrl ? 'Fuente YouTube' : 'Archivo Local'}</span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
           session.status === SessionStatus.COMPLETED ? 'bg-green-100/50 text-green-700' :
           'bg-blue-50 text-blue-700'
        }`}>
          {session.status === SessionStatus.COMPLETED ? 'Finalizado' : 'Pendiente'}
        </span>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <span>Abrir Agente</span>
            <PlayCircle size={16} />
        </div>
      </div>
    </div>
  );
};