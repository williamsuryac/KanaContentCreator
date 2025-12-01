
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

export type Language = 'en' | 'id';

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
  language: Language;
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

export interface GridItem {
  id: string;
  url: string | null;
  file: File | null;
  caption?: string;
  storagePath?: string; // Path in Firebase Storage
  isLoading?: boolean; // UI state for upload progress
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  storagePath?: string; // For the profile photo in storage
  createdAt: Date;
}
