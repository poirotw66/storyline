import React from 'react';
import { AppState, StoryboardShot } from '../types';

interface UseShotEditorProps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const useShotEditor = ({ setState }: UseShotEditorProps) => {
  const handleAddShot = (index: number) => {
    setState(prev => {
      if (!prev.analysis) return prev;
      
      const newId = Date.now();
      const newShot: StoryboardShot = {
        id: newId,
        scene_number: '新場景',
        shot_description: '',
        visual_prompt: '',
        shot_size: '中景 (Medium Shot)',
        camera_angle: '平視 (Eye Level)',
        camera_movement: '固定鏡頭 (Static)',
        lighting: '自然光',
        audio_dialogue: '',
        director_note: '',
        versions: [{
          id: `${newId}-v1`,
          timestamp: Date.now(),
          visual_prompt: '',
          shot_description: '',
          shot_size: '中景 (Medium Shot)',
          camera_angle: '平視 (Eye Level)',
          camera_movement: '固定鏡頭 (Static)',
          lighting: '自然光',
          audio_dialogue: '',
          director_note: ''
        }],
        selectedVersionIndex: 0
      };

      const newShots = [...prev.analysis.shots];
      newShots.splice(index, 0, newShot);

      return {
        ...prev,
        analysis: { ...prev.analysis, shots: newShots }
      };
    });
  };

  const handleTitleUpdate = (newTitle: string) => {
    setState(prev => {
       if (!prev.analysis) return prev;
       return { ...prev, analysis: { ...prev.analysis, title: newTitle } };
    });
  };

  const handleFieldChange = (shotId: number, field: keyof StoryboardShot, value: string) => {
    setState(prev => {
      if (!prev.analysis) return prev;
      const newShots = prev.analysis.shots.map(shot => {
        if (shot.id !== shotId) return shot;
        return { ...shot, [field]: value };
      });
      return { ...prev, analysis: { ...prev.analysis, shots: newShots } };
    });
  };

  const handleVersionChange = (shotId: number, direction: 'prev' | 'next') => {
    setState(prev => {
      if (!prev.analysis) return prev;
      const newShots = prev.analysis.shots.map(shot => {
        if (shot.id !== shotId) return shot;
        
        let newIndex = direction === 'next' 
          ? shot.selectedVersionIndex + 1 
          : shot.selectedVersionIndex - 1;
        
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= shot.versions.length) newIndex = shot.versions.length - 1;

        const targetVersion = shot.versions[newIndex];

        return {
          ...shot,
          selectedVersionIndex: newIndex,
          imageUrl: targetVersion.imageUrl,
          shot_description: targetVersion.shot_description,
          shot_size: targetVersion.shot_size,
          camera_angle: targetVersion.camera_angle,
          camera_movement: targetVersion.camera_movement,
          lighting: targetVersion.lighting,
          audio_dialogue: targetVersion.audio_dialogue,
          director_note: targetVersion.director_note
        };
      });
      return { ...prev, analysis: { ...prev.analysis, shots: newShots } };
    });
  };

  return {
    handleAddShot,
    handleTitleUpdate,
    handleFieldChange,
    handleVersionChange
  };
};
