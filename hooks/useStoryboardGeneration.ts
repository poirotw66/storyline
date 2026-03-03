import React, { useEffect } from 'react';
import { AppState, StoryboardShot, ShotVersion } from '../types';
import { analyzeScript, generateShotImage } from '../services/geminiService';

interface UseStoryboardGenerationProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isGeneratingImages: React.MutableRefObject<boolean>;
}

export const useStoryboardGeneration = ({
  state,
  setState,
  isGeneratingImages
}: UseStoryboardGenerationProps) => {

  const handleAnalyze = async () => {
    if (!state.script.trim()) return;

    const newProjectId = `project-${Date.now()}`;

    setState(prev => ({ 
      ...prev, 
      step: 'analyzing', 
      projectId: newProjectId,
      error: undefined,
      progressMessage: "導演正在閱讀你的劇本..." 
    }));

    try {
      const analysis = await analyzeScript(state.script, state.requirements, state.era);
      
      const shotsWithVersions = analysis.shots.map(s => {
        const initialVersion: ShotVersion = {
          id: `${s.id}-v1`,
          timestamp: Date.now(),
          imageUrl: undefined, 
          visual_prompt: s.visual_prompt,
          shot_description: s.shot_description,
          shot_size: s.shot_size,
          camera_angle: s.camera_angle,
          camera_movement: s.camera_movement,
          lighting: s.lighting,
          audio_dialogue: s.audio_dialogue,
          director_note: s.director_note
        };

        return {
          ...s,
          isGeneratingImage: true,
          versions: [initialVersion],
          selectedVersionIndex: 0
        };
      });

      setState(prev => ({
        ...prev,
        step: 'confirming_settings',
        analysis: { ...analysis, shots: shotsWithVersions },
        progressMessage: undefined
      }));

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: err.message || "分析腳本失敗，請檢查API Key或重試。"
      }));
    }
  };

  // Image Generation Effect
  useEffect(() => {
    if (state.step === 'visualizing' && state.analysis && !isGeneratingImages.current) {
      const generateAllImages = async () => {
        isGeneratingImages.current = true;
        const shots = state.analysis?.shots || [];
        
        for (let i = 0; i < shots.length; i++) {
          const shot = shots[i];
          const currentV = shot.versions[shot.selectedVersionIndex];
          
          if (currentV.imageUrl || !currentV.visual_prompt) {
            if (shot.isGeneratingImage) {
              setState(prev => {
                if (!prev.analysis) return prev;
                const newShots = [...prev.analysis.shots];
                newShots[i] = { ...newShots[i], isGeneratingImage: false };
                return { ...prev, analysis: { ...prev.analysis, shots: newShots } };
              });
            }
            continue;
          }

          setState(prev => ({
            ...prev,
            progressMessage: `正在繪製分鏡 ${shot.id}: ${shot.shot_description.substring(0, 15)}...`
          }));

          try {
            const fullPrompt = `
              Historical Context: ${state.analysis.historical_context || 'None specified'}
              Character Definitions: ${state.analysis.character_definitions || 'None specified'}
              Shot Details: ${currentV.visual_prompt}
            `;
            const base64Image = await generateShotImage(fullPrompt, state.imageModel);
            
            setState(prev => {
              if (!prev.analysis) return prev;
              const newShots = [...prev.analysis.shots];
              const updatedVersions = [...newShots[i].versions];
              
              updatedVersions[newShots[i].selectedVersionIndex] = {
                ...updatedVersions[newShots[i].selectedVersionIndex],
                imageUrl: base64Image || undefined
              };

              newShots[i] = {
                ...newShots[i],
                imageUrl: base64Image || undefined,
                versions: updatedVersions,
                isGeneratingImage: false
              };
              return {
                 ...prev,
                 analysis: { ...prev.analysis, shots: newShots }
              };
            });
          } catch (e: any) {
            console.error(`Failed to generate image for shot ${shot.id}`, e);
            
            setState(prev => {
              if (!prev.analysis) return prev;
              const newShots = [...prev.analysis.shots];
              newShots[i] = { ...newShots[i], isGeneratingImage: false };
              return { ...prev, analysis: { ...prev.analysis, shots: newShots } };
            });

            if (e.message === 'API_KEY_REQUIRED') {
              setState(prev => ({
                ...prev,
                step: 'error',
                error: "使用此模型需要付費 API Key。請在首頁重新選擇模型並完成授權。"
              }));
              isGeneratingImages.current = false;
              return; // Stop the loop
            }
          }
        }
        
        setState(prev => ({ ...prev, step: 'complete', progressMessage: undefined }));
        isGeneratingImages.current = false;
      };

      generateAllImages();
    }
  }, [state.step, state.analysis, state.imageModel, setState, isGeneratingImages]);

  const handleRegenerateShot = async (shotId: number) => {
    const shot = state.analysis?.shots.find(s => s.id === shotId);
    if (!shot) return;

    setState(prev => {
      if (!prev.analysis) return prev;
      return {
        ...prev,
        analysis: {
          ...prev.analysis,
          shots: prev.analysis.shots.map(s => s.id === shotId ? { ...s, isGeneratingImage: true } : s)
        }
      };
    });

    try {
      const combinedPrompt = `
        Historical Context: ${state.analysis?.historical_context || 'None specified'}
        Character Definitions: ${state.analysis?.character_definitions || 'None specified'}
        Shot Details: ${shot.shot_description}. Shot Size: ${shot.shot_size}. Angle: ${shot.camera_angle}. Movement: ${shot.camera_movement}. Lighting: ${shot.lighting}. Style: Film Storyboard Sketch.
      `;
      
      const base64Image = await generateShotImage(combinedPrompt, state.imageModel);

      const newVersion: ShotVersion = {
        id: `${shotId}-v${shot.versions.length + 1}`,
        timestamp: Date.now(),
        imageUrl: base64Image || undefined,
        visual_prompt: combinedPrompt,
        shot_description: shot.shot_description,
        shot_size: shot.shot_size,
        camera_angle: shot.camera_angle,
        camera_movement: shot.camera_movement,
        lighting: shot.lighting,
        audio_dialogue: shot.audio_dialogue,
        director_note: shot.director_note
      };

      setState(prev => {
        if (!prev.analysis) return prev;
        const newShots = prev.analysis.shots.map(s => {
          if (s.id !== shotId) return s;
          const newVersions = [...s.versions, newVersion];
          return {
            ...s,
            isGeneratingImage: false,
            versions: newVersions,
            selectedVersionIndex: newVersions.length - 1,
            imageUrl: newVersion.imageUrl
          };
        });
        return { ...prev, analysis: { ...prev.analysis, shots: newShots } };
      });

    } catch (e: any) {
      console.error("Regeneration failed", e);
      
      setState(prev => {
        if (!prev.analysis) return prev;
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            shots: prev.analysis.shots.map(s => s.id === shotId ? { ...s, isGeneratingImage: false } : s)
          }
        };
      });

      if (e.message === 'API_KEY_REQUIRED') {
        try {
          // @ts-ignore
          if (window.aistudio && window.aistudio.openSelectKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
          }
        } catch (err) {
          console.error("Failed to open select key dialog", err);
        }
      }
    }
  };

  return {
    handleAnalyze,
    handleRegenerateShot
  };
};
