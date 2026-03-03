import React, { useEffect } from 'react';
import { AppState, ProjectMetadata } from '../types';
import { getProjects, saveProject, deleteProject, getProjectData } from '../services/storageService';
import { del } from 'idb-keyval';

interface UseProjectStorageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isGeneratingImages: React.MutableRefObject<boolean>;
  setActiveShotId: (id: number | null) => void;
  setIsScriptDrawerOpen: (isOpen: boolean) => void;
}

export const useProjectStorage = ({
  state,
  setState,
  isGeneratingImages,
  setActiveShotId,
  setIsScriptDrawerOpen
}: UseProjectStorageProps) => {
  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      // Cleanup old localStorage data to free up space
      localStorage.removeItem('storyboard_pro_projects');
      localStorage.removeItem('storyboard_pro_current');
      
      // Cleanup old large IndexedDB key if it exists
      try {
        await del('storyboard_pro_projects');
      } catch (e) {}
      
      const projects = await getProjects();
      setState(prev => ({ ...prev, savedProjects: projects }));
    };
    loadHistory();
  }, [setState]);

  // Auto-save effect
  useEffect(() => {
    if ((state.step === 'visualizing' || state.step === 'complete') && state.analysis) {
      const timeoutId = setTimeout(async () => {
        await saveProject(state);
        // Refresh local list
        const projects = await getProjects();
        setState(prev => ({ ...prev, savedProjects: projects }));
      }, 2000); // Debounce save
      return () => clearTimeout(timeoutId);
    }
  }, [state.analysis, state.step, state, setState]);

  const handleLoadProject = async (metadata: ProjectMetadata) => {
    // Stop any ongoing generation
    isGeneratingImages.current = false;
    setActiveShotId(null);
    setIsScriptDrawerOpen(false);
    
    setState(prev => ({ ...prev, progressMessage: "正在加載項目..." }));
    
    const project = await getProjectData(metadata.id);
    if (!project) {
      setState(prev => ({ ...prev, error: "無法加載項目數據", progressMessage: undefined }));
      return;
    }

    const projects = await getProjects();
    setState({
      ...project.state,
      step: 'complete', // Restore as complete/viewable
      progressMessage: undefined, // Clear any stale progress messages
      savedProjects: projects // Ensure list is current
    });
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = await deleteProject(id);
    setState(prev => ({ ...prev, savedProjects: updated }));
  };

  return {
    handleLoadProject,
    handleDeleteProject
  };
};
