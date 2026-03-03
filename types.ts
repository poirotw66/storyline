
export interface ShotVersion {
  id: string; // Unique ID for the version
  timestamp: number;
  imageUrl?: string;
  visual_prompt: string;
  // Editable fields specific to this version
  shot_description: string;
  shot_size: string; // New field for Close-up, Medium, etc.
  camera_angle: string; // Strictly for Angle (Low, High, etc.)
  camera_movement: string;
  lighting: string;
  audio_dialogue: string;
  director_note: string;
}

export interface StoryboardShot {
  id: number;
  // These serve as the "active" display state
  scene_number: string;
  shot_description: string;
  visual_prompt: string; 
  shot_size: string; // New
  camera_angle: string;
  camera_movement: string;
  lighting: string;
  audio_dialogue: string;
  director_note: string;
  imageUrl?: string; 
  
  // State management
  isGeneratingImage?: boolean;
  
  // Version History
  versions: ShotVersion[];
  selectedVersionIndex: number;
}

export interface ScriptAnalysis {
  title: string;
  overview: string;
  style_notes: string;
  historical_context: string; // Added for era/setting details
  character_definitions: string; // Added for character consistency
  shots: StoryboardShot[];
}

export interface ProjectMetadata {
  id: string;
  title: string;
  timestamp: number;
  overview: string;
}

export interface SavedProject extends ProjectMetadata {
  state: AppState;
}

export interface AppState {
  step: 'idle' | 'analyzing' | 'confirming_settings' | 'visualizing' | 'complete' | 'error';
  projectId?: string; // Unique ID for the project
  script: string;
  era: string; // Added for era/setting
  requirements: string;
  concurrencyLimit: number; // Added for concurrency control
  aspectRatio: string; // Added for image aspect ratio
  analysis: ScriptAnalysis | null;
  imageModel: string; // Added for model selection
  error?: string;
  progressMessage?: string;
  savedProjects?: ProjectMetadata[]; // Changed to metadata only
}

export enum ModelType {
  TEXT_ANALYSIS = 'gemini-3-flash-preview',
  IMAGE_2_5_FLASH = 'gemini-2.5-flash-image',
  NANO_BANANA_2 = 'gemini-3.1-flash-image-preview',
  NANO_BANANA_PRO = 'gemini-3-pro-image-preview'
}