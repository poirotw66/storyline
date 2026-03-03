import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ShotCard } from './components/ShotCard';
import { ScriptDrawer } from './components/ScriptDrawer';
import { SidebarNav } from './components/SidebarNav';
import { AppState, ModelType } from './types';
import { PenTool, AlertCircle, RefreshCw, Sparkles, FileText, Settings, CloudUpload, Eye, Plus, Pencil, Check, Download, History, Trash2, ChevronRight, Clock, Printer, Archive, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useProjectStorage } from './hooks/useProjectStorage';
import { useStoryboardGeneration } from './hooks/useStoryboardGeneration';
import { useShotEditor } from './hooks/useShotEditor';

const INITIAL_STATE: AppState = {
  step: 'idle',
  script: '',
  era: '',
  requirements: '',
  concurrencyLimit: 5,
  aspectRatio: '16:9',
  analysis: null,
  imageModel: ModelType.IMAGE_2_5_FLASH,
  savedProjects: []
};

const SCOTT_STYLE_PROMPT = `1. 核心敘事策略：偽紀錄片視角 (Mockumentary)
- 視角：採用“上帝視角”的旁白（第三人稱），將主角作為“被觀察的對象”，彷彿在拍《動物世界》。
- 語調：自信、英式幽默、調侃。
- 衝突：構建“起承轉合”，解決問題的過程充滿困難與樂趣。

2. 分鏡與視覺美學：
- 關鍵鏡頭：第一視角 (POV) 手持鏡頭 + 垂直頂拍視角 (Top-Down Shot) 展示細節。
- 構圖：極簡主義，背景乾淨，留白。
- 互動：打破第四面牆，主角無聲地看向鏡頭（無奈/思考/翻白眼）。
- 光影：偏暖色調，低飽和度 (Teal & Orange)，使用暖色氛圍燈 (Practical Lights)。

3. 節奏與剪輯：
- 核心：動作卡點 (Cut on Action)，乾淨利落。
- 節奏：繁瑣過程用延時/蒙太奇(快)，關鍵步驟（如撕膜、咔噠聲）放慢或停頓(慢)。
- B-Roll：高質感的产品特寫，而非博主大臉。

4. 聲音設計 (ASMR級)：
- BGM：Lo-fi Hip Hop, Jazz Hop，隨劇情情緒變化。
- 音效：極度誇張的擬音 (Foley)，如擰螺絲、撕膠帶聲。
- 留白：關鍵笑點或反轉時突然靜音。`;

const STYLE_PRESETS = [
  "Scott 風格 (DIY/Mockumentary)",
  "快節奏剪輯 (Fast-paced)",
  "賽博朋克 (Cyberpunk)",
  "日系小清新 (Japanese Fresh)",
  "王家衛風格 (Wong Kar-wai)",
  "黑白膠片 (Film Noir)",
  "韋斯·安德森 (Wes Anderson)",
  "極簡主義 (Minimalist)",
  "懸疑驚悚 (Thriller)"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isScriptDrawerOpen, setIsScriptDrawerOpen] = useState(false);
  const [activeShotId, setActiveShotId] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  // Ref to handle concurrent image generation without infinite loops
  const isGeneratingImages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to lock intersection observer updates during manual scrolling
  const isManualScrolling = useRef(false);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const { handleLoadProject, handleDeleteProject } = useProjectStorage({
    state,
    setState,
    isGeneratingImages,
    setActiveShotId,
    setIsScriptDrawerOpen
  });

  const { handleAnalyze, handleRegenerateShot } = useStoryboardGeneration({
    state,
    setState,
    isGeneratingImages
  });

  const { handleAddShot, handleTitleUpdate, handleFieldChange, handleVersionChange } = useShotEditor({
    setState
  });

  // Intersection Observer for Sidebar highlighting
  useEffect(() => {
    if (state.step !== 'visualizing' && state.step !== 'complete') return;
    if (!state.analysis?.shots.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrolling.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const shotId = Number(entry.target.id.replace('shot-', ''));
            setActiveShotId(shotId);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    state.analysis.shots.forEach((shot) => {
      const element = document.getElementById(`shot-${shot.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [state.step, state.analysis?.shots]);

  const handleScrollToShot = (id: number) => {
    const element = document.getElementById(`shot-${id}`);
    if (element) {
      isManualScrolling.current = true;
      setActiveShotId(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isManualScrolling.current = false; }, 1000);
    }
  };

  const handleExportZip = async () => {
    if (!state.analysis) return;
    
    setState(prev => ({ ...prev, progressMessage: "正在準備 ZIP 壓縮檔..." }));
    
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("images");
      
      let mdContent = `# ${state.analysis.title}\n\n`;
      mdContent += `## 導演總述\n${state.analysis.overview}\n\n`;
      mdContent += `## 視覺風格建議\n${state.analysis.style_notes}\n\n`;
      mdContent += `## 時代背景特徵\n${state.analysis.historical_context}\n\n`;
      mdContent += `## 角色一致性定義\n${state.analysis.character_definitions}\n\n`;
      mdContent += `## 分鏡列表\n\n`;
      
      for (let i = 0; i < state.analysis.shots.length; i++) {
        const shot = state.analysis.shots[i];
        mdContent += `### 鏡頭 ${shot.id} - ${shot.scene_number}\n\n`;
        mdContent += `- **描述:** ${shot.shot_description}\n`;
        mdContent += `- **景別:** ${shot.shot_size}\n`;
        mdContent += `- **角度:** ${shot.camera_angle}\n`;
        mdContent += `- **運鏡:** ${shot.camera_movement}\n`;
        mdContent += `- **光影:** ${shot.lighting}\n`;
        mdContent += `- **台詞/旁白:** ${shot.audio_dialogue || '無'}\n`;
        mdContent += `- **導演批註:** ${shot.director_note}\n`;
        mdContent += `- **提示詞:** ${shot.visual_prompt}\n\n`;
        
        if (shot.imageUrl) {
          // Extract base64 data
          const base64Data = shot.imageUrl.split(',')[1];
          const extension = shot.imageUrl.split(';')[0].split('/')[1] || 'jpg';
          const filename = `shot_${shot.id}.${extension}`;
          
          if (imgFolder && base64Data) {
            imgFolder.file(filename, base64Data, { base64: true });
            mdContent += `![鏡頭 ${shot.id}](./images/${filename})\n\n`;
          }
        } else {
          mdContent += `*(暫無圖像)*\n\n`;
        }
        
        mdContent += `---\n\n`;
      }
      
      zip.file(`${state.analysis.title || 'storyboard'}.md`, mdContent);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${state.analysis.title || 'storyboard'}.zip`);
      
      setState(prev => ({ ...prev, progressMessage: undefined }));
    } catch (error) {
      console.error("ZIP Export failed", error);
      setState(prev => ({ ...prev, error: "導出 ZIP 失敗，請重試。", progressMessage: undefined }));
    }
  };

  const resetApp = () => {
    setState(prev => ({
      ...INITIAL_STATE,
      projectId: undefined,
      savedProjects: prev.savedProjects // Keep history
    }));
    isGeneratingImages.current = false;
    setIsScriptDrawerOpen(false);
    setActiveShotId(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setState(prev => ({ ...prev, script: content }));
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleStyleSelect = (style: string) => {
    if (style.includes("Scott")) {
      setState(prev => ({ ...prev, requirements: SCOTT_STYLE_PROMPT }));
    } else {
      setState(prev => ({ ...prev, requirements: style }));
    }
  };

  const InsertButton = ({ index }: { index: number }) => (
    <div className="InsertButton flex justify-center py-4 relative group no-print">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-800 group-hover:border-indigo-900/50 transition-colors"></div>
      </div>
      <button 
        onClick={() => handleAddShot(index)}
        className="relative z-10 rounded-full p-2 bg-slate-900 border border-slate-700 text-slate-500 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-lg transform hover:scale-110"
        title="在此處添加新鏡頭"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative">
      <Header />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center px-4 py-3 rounded-xl shadow-2xl border animate-fade-in-up max-w-md w-[90%] ${
          toast.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' : 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <Check className="w-5 h-5 mr-3 flex-shrink-0" />}
          <p className="text-sm font-medium leading-relaxed flex-1">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-3 p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 w-[92%] max-w-[1600px] mx-auto py-8">
        
        {/* INPUT SECTION */}
        {(state.step === 'idle' || state.step === 'error') && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
             <div className="text-center space-y-5 mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                將你的劇本轉化為 <br/>
                <span className="text-indigo-500 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  電影級分鏡大片
                </span>
              </h2>
              <p className="text-slate-400 text-xl max-w-2xl mx-auto">
                粘貼您的故事，我會幫您將其拆解為電影級分鏡，
                並繪製草圖、提供專業的導演指導。
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-medium text-slate-300 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      你的劇本 / 故事創意
                    </label>
                    
                    <div className="flex items-center">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".txt,.md,.json,.csv" 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm flex items-center text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/50 px-3 py-1.5 rounded border border-indigo-900/50"
                      >
                        <CloudUpload className="w-4 h-4 mr-1.5" />
                        上傳文件 (.txt, .md)
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="w-full h-64 bg-slate-800 border border-slate-700 rounded-xl p-5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-base leading-relaxed"
                    placeholder="例如：視頻以一條繁忙的賽博朋克街道的全景鏡頭開始。我們的主角Kai，一邊看著全息地圖，一邊在雨中行走..."
                    value={state.script}
                    onChange={(e) => setState(prev => ({ ...prev, script: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-300 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    生圖模型選擇
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: ModelType.IMAGE_2_5_FLASH, name: "Image 2.5 Flash" },
                      { id: ModelType.NANO_BANANA_2, name: "Nano Banana 2 (3.1 Flash)" },
                      { id: ModelType.NANO_BANANA_PRO, name: "Nano Banana Pro (3 Pro)" }
                    ].map((model) => (
                      <button
                        key={model.id}
                        onClick={async () => {
                          if (model.id === ModelType.NANO_BANANA_2 || model.id === ModelType.NANO_BANANA_PRO) {
                            // @ts-ignore
                            const hasKey = await window.aistudio.hasSelectedApiKey();
                            if (!hasKey) {
                              // @ts-ignore
                              await window.aistudio.openSelectKey();
                            }
                          }
                          setState(prev => ({ ...prev, imageModel: model.id }));
                        }}
                        className={`text-sm px-4 py-2 rounded-full border transition-all ${
                          state.imageModel === model.id
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                  {(state.imageModel === ModelType.NANO_BANANA_2 || state.imageModel === ModelType.NANO_BANANA_PRO) && (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      提示：使用 Nano Banana 系列模型需要您在彈窗中選擇自己的付費 API Key。
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline ml-1">
                        了解計費詳情
                      </a>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-300 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    畫面比例 (Aspect Ratio)
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: '16:9', name: '16:9 (YouTube/電影)' },
                      { id: '9:16', name: '9:16 (Reels/Shorts)' },
                      { id: '1:1', name: '1:1 (IG 貼文)' }
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => setState(prev => ({ ...prev, aspectRatio: ratio.id }))}
                        className={`text-sm px-4 py-2 rounded-full border transition-all ${
                          state.aspectRatio === ratio.id
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {ratio.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-300 mb-3 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    並行生成數量 (Concurrency Limit)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={state.concurrencyLimit}
                      onChange={(e) => setState(prev => ({ ...prev, concurrencyLimit: parseInt(e.target.value, 10) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-white font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 min-w-[3rem] text-center">
                      {state.concurrencyLimit}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    設定同時生成圖片的數量。預設為 5，數值越高速度越快，但可能較容易觸發 API 頻率限制。
                  </p>
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-300 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    時代背景 / 環境設定 (可選)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    placeholder="例如：清末民初、1920年代上海、未來賽博朋克..."
                    value={state.era}
                    onChange={(e) => setState(prev => ({ ...prev, era: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-300 mb-3 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    導演要求 / 風格 (可選)
                  </label>
                  
                  <textarea
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                    placeholder="例如：快節奏、韋斯·安德森風格、高對比度黑色電影..."
                    value={state.requirements}
                    onChange={(e) => setState(prev => ({ ...prev, requirements: e.target.value }))}
                  />
                  
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style}
                        onClick={() => handleStyleSelect(style)}
                        className={`text-sm px-4 py-2 rounded-full border transition-all ${
                          (style.includes("Scott") && state.requirements.includes("偽紀錄片")) || state.requirements === style 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={!state.script.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span className="text-lg">生成分鏡腳本</span>
                  </button>
                </div>
              </div>
            </div>

            {state.step === 'error' && (
              <div className="bg-red-900/20 border border-red-800/50 p-5 rounded-xl flex items-start space-x-3 text-red-200">
                <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                <p className="text-base">{state.error}</p>
              </div>
            )}

            {/* Recent Projects Section */}
            {state.savedProjects && state.savedProjects.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-slate-300 mb-6 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  最近的項目
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.savedProjects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => handleLoadProject(project)}
                      className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-800 group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white truncate pr-6">{project.title}</h4>
                        <button 
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors absolute top-4 right-4 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 h-10 mb-4">
                        {project.overview}
                      </p>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(project.timestamp).toLocaleDateString()}
                        </span>
                        <span className="flex items-center text-indigo-400 group-hover:translate-x-1 transition-transform">
                          打開
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE */}
        {state.step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <PenTool className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl text-slate-300 font-medium animate-pulse">
              {state.progressMessage}
            </p>
          </div>
        )}

        {/* CONFIRM SETTINGS SECTION */}
        {state.step === 'confirming_settings' && state.analysis && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-white">確認角色與背景設定</h2>
              <p className="text-slate-400">
                AI 已經提取了以下設定。這些設定將會套用到每一個分鏡的生成提示詞中，以保持畫面的一致性。
                您可以手動修改這些設定，確認無誤後再開始繪製分鏡。
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
              <div>
                <label className="block text-base font-medium text-indigo-400 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  時代背景特徵 (Historical Context)
                </label>
                <textarea
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed"
                  value={state.analysis.historical_context}
                  onChange={(e) => setState(prev => prev.analysis ? { ...prev, analysis: { ...prev.analysis, historical_context: e.target.value } } : prev)}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-indigo-400 mb-3 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  角色一致性定義 (Character Definitions)
                </label>
                <textarea
                  className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed"
                  value={state.analysis.character_definitions}
                  onChange={(e) => setState(prev => prev.analysis ? { ...prev, analysis: { ...prev.analysis, character_definitions: e.target.value } } : prev)}
                />
              </div>

              <div className="pt-6 flex justify-end space-x-4">
                <button
                  onClick={resetApp}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors border border-slate-700"
                >
                  取消並返回
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 'visualizing', progressMessage: "設定已確認，正在繪製分鏡草圖..." }))}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  確認無誤，開始繪製分鏡
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        {(state.step === 'visualizing' || state.step === 'complete') && state.analysis && (
          <div className="space-y-10 animate-fade-in-up">
            
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8 sticky top-16 bg-slate-950/95 backdrop-blur z-40 py-5 -mx-4 px-4 md:mx-0 md:px-0 shadow-sm no-print">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                   {isEditingTitle ? (
                     <div className="flex items-center w-full md:w-2/3">
                        <input 
                           type="text"
                           className="bg-slate-800 text-white text-3xl md:text-4xl font-bold border border-indigo-500 rounded px-3 py-1 w-full focus:outline-none"
                           value={state.analysis.title}
                           onChange={(e) => handleTitleUpdate(e.target.value)}
                           autoFocus
                        />
                        <button 
                          onClick={() => setIsEditingTitle(false)}
                          className="ml-2 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                     </div>
                   ) : (
                    <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                       <h2 className="text-4xl font-bold text-white truncate tracking-tight group-hover:text-indigo-200 transition-colors">
                         {state.analysis.title}
                       </h2>
                       <Pencil className="w-5 h-5 text-slate-600 ml-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                   )}
                </div>
                <p className="text-slate-400 mt-2 flex items-center text-base">
                   {state.step === 'visualizing' && <RefreshCw className="w-4 h-4 animate-spin mr-2.5 text-indigo-400" />}
                   {state.progressMessage || "分鏡繪製完成 - 已自動保存"}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleExportZip}
                  className="flex items-center space-x-2.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Archive className="w-5 h-5" />
                  <span>導出 ZIP</span>
                </button>
                 <button
                  onClick={() => setIsScriptDrawerOpen(true)}
                  className="flex items-center space-x-2.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-900/30 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Eye className="w-5 h-5" />
                  <span>查看原腳本</span>
                </button>
                <button
                  onClick={resetApp}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-700 shadow-sm"
                >
                  返回首頁 / 新項目
                </button>
              </div>
            </div>

            {/* Print Header (Visible only in print) */}
            <div className="hidden print:block mb-8">
               <h1 className="text-3xl font-bold text-black mb-2">{state.analysis.title}</h1>
               <p className="text-gray-600">Generated by StoryBoard Pro AI</p>
            </div>

            {/* Layout Container: Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
               
               {/* Left Sidebar Navigation */}
               <SidebarNav 
                  shots={state.analysis.shots}
                  activeShotId={activeShotId}
                  onScrollToShot={handleScrollToShot}
               />

               {/* Right Content Area */}
               <div id="storyboard-content" className="flex-1 w-full min-w-0">
                  
                  {/* Overview Card */}
                  <div className="overview-card bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-lg mb-10 print:bg-white print:border-none print:shadow-none print:p-0">
                    <h3 className="text-indigo-400 uppercase tracking-widest text-sm font-bold mb-5 print-text-gray">導演總述</h3>
                    <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-serif print-text-dark">
                      "{state.analysis.overview}"
                    </p>
                    <div className="mt-8 p-5 bg-slate-900/50 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-3 print-text-gray">視覺風格建議</span>
                      <p className="text-slate-300 text-base leading-relaxed print-text-dark">{state.analysis.style_notes}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                        <span className="text-xs text-indigo-400 uppercase font-bold block mb-2 print-text-gray">時代背景特徵 (AI 提取)</span>
                        <p className="text-slate-400 text-sm italic leading-relaxed print-text-dark">{state.analysis.historical_context}</p>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                        <span className="text-xs text-indigo-400 uppercase font-bold block mb-2 print-text-gray">角色一致性定義 (AI 提取)</span>
                        <p className="text-slate-400 text-sm italic leading-relaxed print-text-dark">{state.analysis.character_definitions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shots List */}
                  <div className="space-y-4">
                    <InsertButton index={0} />
                    
                    {state.analysis.shots.map((shot, index) => (
                      <React.Fragment key={shot.id}>
                        <ShotCard 
                          shot={shot} 
                          aspectRatio={state.aspectRatio}
                          onFieldChange={handleFieldChange}
                          onVersionChange={handleVersionChange}
                          onRegenerate={handleRegenerateShot}
                        />
                        <InsertButton index={index + 1} />
                      </React.Fragment>
                    ))}
                  </div>

               </div>
            </div>

          </div>
        )}
      </main>

      <ScriptDrawer 
        isOpen={isScriptDrawerOpen}
        onClose={() => setIsScriptDrawerOpen(false)}
        script={state.script}
        requirements={state.requirements}
      />
      
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900 mt-12 no-print">
         <p>Powered by Google Gemini 3 Flash & {state.imageModel.includes('3.1') ? 'Nano Banana 2' : state.imageModel.includes('3-pro') ? 'Nano Banana Pro' : 'Image 2.5 Flash'}</p>
      </footer>
    </div>
  );
};

export default App;