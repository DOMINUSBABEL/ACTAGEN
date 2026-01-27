import React from 'react';
import { SessionData, SessionStatus } from '../types';
import { FileVideo, MoreVertical, PlayCircle, CheckCircle, Clock, Youtube } from 'lucide-react';

interface SessionCardProps {
  session: SessionData;
  onClick: (id: string) => void;
  active: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, active }) => {
  return (
    <div 
      onClick={() => onClick(session.id)}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
        active 
          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
          : 'bg-white border-gray-200 hover:border-blue-100'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            session.status === SessionStatus.COMPLETED ? 'bg-green-100 text-green-600' : 
            session.status === SessionStatus.PROCESSING ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {session.status === SessionStatus.COMPLETED ? <CheckCircle size={20} /> :
             session.status === SessionStatus.PROCESSING ? <Clock size={20} className="animate-pulse" /> :
             session.youtubeUrl ? <Youtube size={20} className="text-red-600" /> :
             <FileVideo size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{session.name}</h3>
            <p className="text-xs text-gray-500">{session.date}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
          {session.actaType || 'Literal'}
        </span>
        <span>•</span>
        <span>{session.youtubeUrl ? 'Fuente YouTube' : 'Archivo Local'}</span>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
           session.status === SessionStatus.COMPLETED ? 'bg-green-50 text-green-700' :
           'bg-blue-50 text-blue-700'
        }`}>
          {session.status === SessionStatus.COMPLETED ? 'Finalizado' : 'Pendiente'}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-blue-600 text-xs font-medium flex items-center gap-1">
                Abrir Agente <PlayCircle size={14} />
            </span>
        </div>
      </div>
    </div>
  );
};