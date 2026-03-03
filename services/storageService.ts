import { get, set, del } from 'idb-keyval';
import { ScriptAnalysis, AppState, ProjectMetadata, SavedProject } from '../types';

const INDEX_KEY = 'storyboard_pro_index';
const PROJECT_DATA_PREFIX = 'sb_project_';
const CURRENT_PROJECT_KEY = 'storyboard_pro_current';

export const saveProject = async (state: AppState): Promise<void> => {
  if (!state.analysis) return;

  const index = await getProjects();
  const projectId = state.projectId || state.analysis.title || 'untitled-' + Date.now();
  
  // 1. Save metadata to index
  const metadata: ProjectMetadata = {
    id: projectId,
    title: state.analysis.title || '未命名項目',
    timestamp: Date.now(),
    overview: state.analysis.overview || '',
  };

  const existingIndex = index.findIndex(p => p.id === projectId);
  if (existingIndex >= 0) {
    index[existingIndex] = metadata;
  } else {
    index.unshift(metadata);
  }

  // Limit index to 50 items
  if (index.length > 50) {
    const removed = index.pop();
    if (removed) {
      await del(`${PROJECT_DATA_PREFIX}${removed.id}`);
    }
  }

  try {
    // 2. Save full project data separately
    const projectData: SavedProject = {
      ...metadata,
      state: {
        ...state,
        projectId
      }
    };
    
    await set(`${PROJECT_DATA_PREFIX}${projectId}`, projectData);
    await set(INDEX_KEY, index);
    
    // 3. Also save as "current working draft"
    await set(CURRENT_PROJECT_KEY, { ...state, projectId });
  } catch (e) {
    console.error("Failed to save to IndexedDB", e);
    throw e; // Re-throw to handle in UI if needed
  }
};

export const getProjects = async (): Promise<ProjectMetadata[]> => {
  try {
    const index = await get(INDEX_KEY);
    return index || [];
  } catch (e) {
    console.error("Failed to load project index from IndexedDB", e);
    return [];
  }
};

export const getProjectData = async (id: string): Promise<SavedProject | null> => {
  try {
    return await get(`${PROJECT_DATA_PREFIX}${id}`) || null;
  } catch (e) {
    console.error(`Failed to load project data for ${id}`, e);
    return null;
  }
};

export const loadLastSession = async (): Promise<AppState | null> => {
  try {
    const session = await get(CURRENT_PROJECT_KEY);
    return session || null;
  } catch (e) {
    return null;
  }
};

export const deleteProject = async (id: string): Promise<ProjectMetadata[]> => {
  const index = (await getProjects()).filter(p => p.id !== id);
  await set(INDEX_KEY, index);
  await del(`${PROJECT_DATA_PREFIX}${id}`);
  return index;
};