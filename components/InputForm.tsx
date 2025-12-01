
import React, { useState, useRef } from 'react';
import { Platform, UserInput } from '../types';
import { Upload, Instagram, AtSign, Video } from 'lucide-react';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ imageFile, description, platform });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Image Upload Area */}
      <div 
        className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all duration-300 ease-in-out cursor-pointer
          ${previewUrl ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {previewUrl ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium backdrop-blur-sm">
              Change Image
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 group-hover:text-zinc-600">
            <div className="p-4 bg-zinc-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="font-medium text-lg">Drop your visual here</p>
            <p className="text-sm text-zinc-400 mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-1">Platform</label>
        <div className="flex gap-2 p-1 bg-zinc-100/80 rounded-2xl">
          {[Platform.INSTAGRAM, Platform.TIKTOK, Platform.THREADS].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${platform === p 
                  ? 'bg-white text-zinc-900 shadow-sm scale-[1.02]' 
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}
              `}
            >
              {p === Platform.INSTAGRAM && <Instagram size={20} className="mb-1" />}
              {p === Platform.TIKTOK && <Video size={20} className="mb-1" />}
              {p === Platform.THREADS && <AtSign size={20} className="mb-1" />}
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-1">Context</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the vibe, context, or specific details you want to highlight..."
          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all resize-none h-32 text-zinc-700 placeholder:text-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !imageFile || !description}
        className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform
          ${isLoading || !imageFile || !description
            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-[1.01] shadow-lg shadow-zinc-200'}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Crafting Content...
          </span>
        ) : (
          "Generate Content"
        )}
      </button>
    </form>
  );
};

export default InputForm;
