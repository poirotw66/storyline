import React, { useState, useEffect } from 'react';
import { X, Key, Save, Moon, Sunset, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'dusk';
  setTheme: (theme: 'dark' | 'dusk') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, setTheme }) => {
  const [apiKey, setApiKey] = useState('');
  const [localTheme, setLocalTheme] = useState<'dark' | 'dusk'>(theme);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('storyboard_pro_custom_api_key') || '';
      setApiKey(savedKey);
      setLocalTheme(theme);
    }
  }, [isOpen, theme]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('storyboard_pro_custom_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('storyboard_pro_custom_api_key');
    }
    setTheme(localTheme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-400" />
            系統設定
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center">
              <Moon className="w-4 h-4 mr-2 text-indigo-400" />
              介面主題
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLocalTheme('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  localTheme === 'dark' 
                    ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                }`}
              >
                <Moon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">黑夜 (Night)</span>
              </button>
              <button
                onClick={() => setLocalTheme('dusk')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  localTheme === 'dusk' 
                    ? 'border-amber-500 bg-amber-500/10 text-white' 
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                }`}
              >
                <Sunset className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">黃昏 (Dusk)</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <Key className="w-4 h-4 mr-2 text-indigo-400" />
              自訂 API Key (選填)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <p className="mt-2 text-xs text-slate-500">
              若留空，將使用系統預設的 API Key。自訂 Key 僅儲存於您的瀏覽器本地端 (localStorage)。
            </p>
          </div>
        </div>
        
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4 mr-1.5" />
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
