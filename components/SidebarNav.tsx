import React from 'react';
import { StoryboardShot } from '../types';

interface SidebarNavProps {
  shots: StoryboardShot[];
  activeShotId: number | null;
  onScrollToShot: (id: number) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ shots, activeShotId, onScrollToShot }) => {
  return (
    <nav className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar no-print">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">
        分鏡目錄 ({shots.length})
      </h3>
      <div className="space-y-1">
        {shots.map((shot, index) => {
          // Generate a summary: Scene Number + truncated description
          const summary = shot.shot_description.length > 15 
            ? shot.shot_description.substring(0, 15) + "..." 
            : shot.shot_description || "新鏡頭";
            
          const isActive = activeShotId === shot.id;

          return (
            <button
              key={shot.id}
              onClick={() => onScrollToShot(shot.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start group ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
              }`}
            >
              <span className={`mr-2.5 font-mono text-xs mt-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-600 group-hover:text-slate-500'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="truncate leading-tight">{summary}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};