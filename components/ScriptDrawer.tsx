import React from 'react';
import { X, FileText, Settings } from 'lucide-react';

interface ScriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  requirements: string;
}

export const ScriptDrawer: React.FC<ScriptDrawerProps> = ({ isOpen, onClose, script, requirements }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <h2 className="text-lg font-bold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-400" />
            原始腳本資料
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
              腳本內容
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-mono">
              {script || "無腳本內容"}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                導演要求 / 風格
              </h3>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {requirements || "無特殊要求"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};