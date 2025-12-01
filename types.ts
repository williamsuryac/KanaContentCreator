
export enum Platform {
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  THREADS = 'Threads',
}

export enum VisualStyle {
  MICROBLOG = 'Microblog',
  TYPOGRAPHY = 'Typography',
  SHOWCASE = 'Showcase',
  AESTHETIC = 'Aesthetic',
  COLLAGE = 'Collage',
  INFOGRAPHIC = 'Data Infographic',
  MEME = 'Meme',
}

export interface VideoIdea {
  title: string;
  script: string;
  storyboard: string;
}

export interface GeneratedContent {
  headline: string;
  hook: string;
  caption: string;
  callToAction: string;
  videoIdeas: VideoIdea[];
}

export interface UserInput {
  imageFile: File | null;
  description: string;
  platform: Platform;
}

export interface EnhanceSettings {
  aspectRatio: string;
  backgroundColor: string;
  customBackgroundColor: string;
  objectColor: string;
  frameFile: File | null;
}

export interface EnhanceJob {
  id: string;
  originalFile: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  error?: string;
}
