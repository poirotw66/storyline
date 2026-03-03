import React from 'react';
import { StoryboardShot } from '../types';
import { Camera, Music, Lightbulb, Loader2, ImageOff, ChevronLeft, ChevronRight, RefreshCw, Scan, Eye } from 'lucide-react';

interface ShotCardProps {
  shot: StoryboardShot;
  onFieldChange: (id: number, field: keyof StoryboardShot, value: string) => void;
  onVersionChange: (id: number, direction: 'prev' | 'next') => void;
  onRegenerate: (id: number) => void;
}

// Dropdown Options
const SHOT_SIZES = [
  "極特寫 (Extreme Close-Up)", "特寫 (Close-Up)", "中近景 (Medium Close-Up)",
  "中景 (Medium Shot)", "全景 (Full Shot)", "遠景 (Long Shot)", 
  "大遠景 (Extreme Long Shot)"
];

const CAMERA_ANGLES = [
  "平視 (Eye Level)", "仰拍 (Low Angle)", "俯拍 (High Angle)", 
  "上帝視角/頂拍 (Overhead)", "荷蘭角 (Dutch Angle)", 
  "過肩 (Over-the-Shoulder)", "主觀視角 (POV)"
];

const CAMERA_MOVEMENTS = [
  "固定鏡頭 (Static)", "搖攝 (Pan)", "傾斜 (Tilt)", "推鏡頭 (Dolly In)", 
  "拉鏡頭 (Dolly Out)", "跟拍 (Tracking)", "手持 (Handheld)", 
  "升降 (Crane)", "甩鏡頭 (Whip Pan)", "變焦 (Zoom)"
];

export const ShotCard: React.FC<ShotCardProps> = ({ shot, onFieldChange, onVersionChange, onRegenerate }) => {
  const currentVersion = shot.selectedVersionIndex + 1;
  const totalVersions = shot.versions.length;

  return (
    <div id={`shot-${shot.id}`} className="shot-card bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col lg:flex-row transition-all hover:border-indigo-500/30 group mb-6">
      
      {/* Image Section - STRICT 16:9 Aspect Ratio Container - Compact Width (5/12) */}
      <div className="w-full lg:w-5/12 flex-shrink-0 bg-black aspect-video relative group border-b lg:border-b-0 lg:border-r border-slate-700/50">
        
        {/* Image Display */}
        {shot.imageUrl ? (
          <img 
            src={shot.imageUrl} 
            alt={`Shot ${shot.id} sketch`} 
            className="w-full h-full object-cover"
          />
        ) : shot.isGeneratingImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-900/80 backdrop-blur-sm z-10">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">AI 正在繪圖...</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-900">
             <ImageOff className="w-10 h-10 mb-2" />
             <span className="text-sm">暫無圖像</span>
          </div>
        )}
        
        {/* Scene Badge */}
        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded backdrop-blur-sm border border-white/10 shadow-sm z-20 print:border-black print:text-black print:bg-white/80">
          {shot.scene_number} - 鏡頭 {shot.id}
        </div>

        {/* Version Counter - Hide in Print */}
        <div className="absolute top-3 right-3 bg-indigo-900/80 text-indigo-100 text-xs font-bold px-2.5 py-1 rounded backdrop-blur-sm border border-indigo-500/30 z-20 no-print">
          v {currentVersion} / {totalVersions}
        </div>

        {/* Navigation Arrows (Visible on Hover or if multiple versions exist) - Hide in Print */}
        {totalVersions > 1 && (
          <>
            <button 
              onClick={() => onVersionChange(shot.id, 'prev')}
              disabled={shot.selectedVersionIndex === 0 || shot.isGeneratingImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-indigo-600/80 text-white rounded-full backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none z-20 no-print"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onVersionChange(shot.id, 'next')}
              disabled={shot.selectedVersionIndex === totalVersions - 1 || shot.isGeneratingImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-indigo-600/80 text-white rounded-full backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none z-20 no-print"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Editable Details Section - Tighter Padding */}
      <div className="flex-1 p-5 flex flex-col space-y-4 bg-slate-800 print:bg-white print:p-4">
        
        {/* Header: Description & Regenerate Button */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
             <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block print-text-gray">鏡頭描述 (Prompt)</label>
             <textarea 
               className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none leading-relaxed print-text-dark"
               rows={3}
               value={shot.shot_description}
               onChange={(e) => onFieldChange(shot.id, 'shot_description', e.target.value)}
             />
          </div>
          <button
            onClick={() => onRegenerate(shot.id)}
            disabled={shot.isGeneratingImage}
            className="flex flex-col items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 w-16 h-full flex-shrink-0 no-print"
            title="根據當前參數重新生成圖像"
          >
            {shot.isGeneratingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mb-1" />
            )}
            <span className="text-[10px] font-bold mt-0.5">重繪</span>
          </button>
        </div>

        {/* Audio / Dialogue Input */}
        <div className="relative">
          <div className="absolute top-3 left-3 text-emerald-400 print-text-gray">
            <Music className="w-3.5 h-3.5" />
          </div>
          <input 
            type="text"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-serif italic print-text-dark"
            placeholder="人物台詞或旁白..."
            value={shot.audio_dialogue}
            onChange={(e) => onFieldChange(shot.id, 'audio_dialogue', e.target.value)}
          />
        </div>

        {/* Parameters Grid - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
           
           {/* Shot Size */}
           <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-400 print-text-gray">
                <Scan className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">景別</span>
              </div>
              <div className="relative">
                <select 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-2 py-1.5 text-slate-200 text-xs focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-colors print-text-dark"
                  value={SHOT_SIZES.includes(shot.shot_size) ? shot.shot_size : 'custom'}
                  onChange={(e) => {
                     if (e.target.value !== 'custom') onFieldChange(shot.id, 'shot_size', e.target.value)
                  }}
                >
                  {SHOT_SIZES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  {!SHOT_SIZES.includes(shot.shot_size) && <option value="custom">{shot.shot_size}</option>}
                </select>
              </div>
           </div>
           
           {/* Camera Angle */}
           <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-400 print-text-gray">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">角度</span>
              </div>
              <select 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-2 py-1.5 text-slate-200 text-xs focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-colors print-text-dark"
                value={CAMERA_ANGLES.includes(shot.camera_angle) ? shot.camera_angle : 'custom'}
                onChange={(e) => {
                   if (e.target.value !== 'custom') onFieldChange(shot.id, 'camera_angle', e.target.value)
                }}
              >
                {CAMERA_ANGLES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {!CAMERA_ANGLES.includes(shot.camera_angle) && <option value="custom">{shot.camera_angle}</option>}
              </select>
           </div>
           
           {/* Camera Movement */}
           <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-400 print-text-gray">
                <Camera className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">運鏡</span>
              </div>
              <select 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-2 py-1.5 text-slate-200 text-xs focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-colors print-text-dark"
                value={CAMERA_MOVEMENTS.includes(shot.camera_movement) ? shot.camera_movement : 'custom'}
                onChange={(e) => {
                   if (e.target.value !== 'custom') onFieldChange(shot.id, 'camera_movement', e.target.value)
                }}
              >
                {CAMERA_MOVEMENTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {!CAMERA_MOVEMENTS.includes(shot.camera_movement) && <option value="custom">{shot.camera_movement}</option>}
              </select>
           </div>

           {/* Lighting (Text Input) */}
           <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 print-text-gray">
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">光影</span>
              </div>
              <input 
                type="text"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-2 py-1.5 text-slate-200 text-xs focus:border-amber-500 outline-none print-text-dark"
                value={shot.lighting}
                onChange={(e) => onFieldChange(shot.id, 'lighting', e.target.value)}
              />
           </div>
        </div>

        {/* Director Note */}
        <div className="mt-auto pt-3 border-t border-slate-700">
           <div className="flex items-start space-x-2.5">
             <div className="mt-0.5 min-w-[20px]">
               <div className="bg-indigo-600/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center print:border print:border-indigo-400">
                 <span className="text-[10px] font-bold">i</span>
               </div>
             </div>
             <div className="w-full">
               <textarea 
                  className="w-full bg-transparent border-none p-0 text-slate-400 text-xs focus:ring-0 resize-none leading-relaxed print-text-dark"
                  rows={2}
                  value={shot.director_note}
                  onChange={(e) => onFieldChange(shot.id, 'director_note', e.target.value)}
                  placeholder="導演批註..."
               />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};