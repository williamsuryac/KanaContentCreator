
import React, { useState, useRef } from 'react';
import { VisualStyle, Language } from '../types';
import { Upload, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import { generateVisualContent } from '../services/geminiService';
import { translations } from '../translations';

interface ImageGeneratorProps {
  language?: Language;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ language = 'en' }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [style, setStyle] = useState<VisualStyle>(VisualStyle.SHOWCASE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedImage(null); // Reset previous result
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateVisualContent(imageFile, context, style, language as Language);
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `kana-visual-${style.toLowerCase().replace(' ', '-')}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          {t.visTitle}
        </h2>
        <p className="text-zinc-500">
          {t.visDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          
          {/* Image Upload */}
          <div 
            className={`relative group border-2 border-dashed rounded-3xl aspect-[3/4] flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
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
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium backdrop-blur-sm">
                  {t.changeImage}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-zinc-400 group-hover:text-zinc-600 text-center">
                <div className="p-4 bg-zinc-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <p className="font-medium text-lg">{t.uploadProduct}</p>
                <p className="text-sm text-zinc-400 mt-1">4:5 vertical optimization</p>
              </div>
            )}
          </div>

          {/* Context Input */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-1">{t.context}</label>
             <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={t.visContextPlaceholder}
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all resize-none h-24 text-sm text-zinc-700 placeholder:text-zinc-400"
             />
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-1">{t.visualStyle}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(VisualStyle).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border
                    ${style === s 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !imageFile}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform shadow-lg
              ${isLoading || !imageFile
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-zinc-900 to-zinc-800 text-white hover:scale-[1.02] shadow-zinc-200'}
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.generatingVisual}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={20} />
                {t.generateDesign}
              </span>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-zinc-100/50 rounded-3xl border border-zinc-200 flex flex-col items-center justify-center min-h-[500px] p-8">
          {generatedImage ? (
             <div className="relative group w-full max-w-[400px] shadow-2xl rounded-lg overflow-hidden animate-fade-in-up">
               <img 
                 src={generatedImage} 
                 alt="Generated Visual" 
                 className="w-full h-auto block"
               />
               <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                 <button 
                   onClick={handleDownload}
                   className="flex items-center gap-2 bg-white text-zinc-900 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-zinc-100 transition-colors"
                 >
                   <Download size={18} />
                   {t.downloadImage}
                 </button>
               </div>
             </div>
          ) : (
            <div className="text-center text-zinc-400">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                 <ImageIcon size={32} />
               </div>
               <p className="font-medium">{t.artworkPlaceholder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
