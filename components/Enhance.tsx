
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, RefreshCw, Download, Settings, Image as ImageIcon, Check, Maximize2, Trash2, Sparkles, Copy, CheckSquare, Square } from 'lucide-react';
import { EnhanceJob, EnhanceSettings, Language } from '../types';
import { enhanceProductImage } from '../services/geminiService';
import { translations } from '../translations';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const BACKGROUND_OPTIONS = ['White', 'Black', 'Gray', 'Green Screen', 'Custom'];
const RATIO_OPTIONS = ['1:1', '3:4', '4:5', '16:9', '9:16'];

interface EnhanceProps {
  language?: Language;
}

const Enhance: React.FC<EnhanceProps> = ({ language = 'en' }) => {
  const [jobs, setJobs] = useState<EnhanceJob[]>([]);
  const [settings, setSettings] = useState<EnhanceSettings>({
    aspectRatio: '1:1',
    backgroundColor: 'White',
    customBackgroundColor: '#ffffff',
    objectColor: '',
    frameFile: null
  });
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonJob, setComparisonJob] = useState<EnhanceJob | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Helper to create initial job
  const createJob = (file: File): EnhanceJob => ({
    id: Math.random().toString(36).substr(2, 9),
    originalFile: file,
    previewUrl: URL.createObjectURL(file),
    status: 'idle'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newJobs = Array.from(e.target.files).map(createJob);
      setJobs(prev => [...prev, ...newJobs]);
      // Auto-select new jobs? No, let user decide.
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSettings(prev => ({ ...prev, frameFile: file }));
      setFramePreview(URL.createObjectURL(file));
    }
  };

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const duplicateJob = (job: EnhanceJob) => {
    const newJob = createJob(job.originalFile);
    setJobs(prev => [...prev, newJob]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === jobs.length && jobs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobs.map(j => j.id)));
    }
  };

  const processJob = async (job: EnhanceJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));
    
    try {
      const resultUrl = await enhanceProductImage(job.originalFile, settings);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed', resultUrl } : j));
    } catch (error) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: 'Generation failed' } : j));
    }
  };

  const handleEnhanceAll = async () => {
    setIsProcessing(true);
    const pendingJobs = jobs.filter(j => j.status === 'idle' || j.status === 'error');
    
    // Process one by one to avoid rate limits
    for (const job of pendingJobs) {
      await processJob(job);
    }
    setIsProcessing(false);
  };

  const handleRegenerate = (job: EnhanceJob) => {
    processJob(job);
  };

  // Canvas composition for frame overlay
  const composeImage = async (imageUrl: string): Promise<Blob | null> => {
    if (!settings.frameFile || !framePreview) {
      const response = await fetch(imageUrl);
      return await response.blob();
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const frame = new Image();
      
      img.crossOrigin = "anonymous";
      frame.crossOrigin = "anonymous";

      let imagesLoaded = 0;
      const onLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 2 && ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          ctx.drawImage(frame, 0, 0, img.width, img.height);
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        }
      };

      img.onload = onLoad;
      frame.onload = onLoad;
      img.src = imageUrl;
      frame.src = framePreview;
    });
  };

  const handleDownload = async () => {
    // Determine targets: Selected items OR All Completed items if nothing selected
    let targets = jobs.filter(j => selectedIds.has(j.id) && j.status === 'completed' && j.resultUrl);
    
    if (targets.length === 0) {
      // Fallback: Download all completed if nothing selected
      targets = jobs.filter(j => j.status === 'completed' && j.resultUrl);
    }

    if (targets.length === 0) return;

    // Single file download
    if (targets.length === 1) {
      const job = targets[0];
      if (job.resultUrl) {
        const blob = await composeImage(job.resultUrl);
        if (blob) {
          saveAs(blob, `kana-enhanced-${job.id}.png`);
        }
      }
      return;
    }

    // Batch download (Zip)
    const zip = new JSZip();
    const folder = zip.folder("kana-enhanced");

    for (let i = 0; i < targets.length; i++) {
      const job = targets[i];
      if (job.resultUrl) {
        const blob = await composeImage(job.resultUrl);
        if (blob) {
          folder?.file(`enhanced_${i + 1}_${job.id}.png`, blob);
        }
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "kana_enhanced_images.zip");
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const pendingCount = jobs.filter(j => j.status === 'idle' || j.status === 'error').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const selectionCount = selectedIds.size;

  return (
    <div className="flex gap-8 h-[calc(100vh-180px)] animate-fade-in">
      {/* Sidebar Controls */}
      <div className="w-80 flex-shrink-0 bg-white rounded-3xl border border-zinc-200 p-6 overflow-y-auto shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings size={20} /> {t.settings}
        </h2>

        {/* Add Images Button (Moved to Sidebar) */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-sm font-bold transition-colors border border-zinc-200"
        >
          <Upload size={18} /> {t.addImages}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />

        <div className="space-y-6">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.aspectRatio}</label>
            <div className="grid grid-cols-3 gap-2">
              {RATIO_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSettings(s => ({ ...s, aspectRatio: r }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors
                    ${settings.aspectRatio === r 
                      ? 'bg-zinc-900 text-white border-zinc-900' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.background}</label>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSettings(s => ({ ...s, backgroundColor: opt }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${settings.backgroundColor === opt 
                      ? 'bg-zinc-900 text-white border-zinc-900' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>
            {settings.backgroundColor === 'Custom' && (
              <div className="flex items-center gap-2 mt-2">
                 <input 
                   type="color" 
                   value={settings.customBackgroundColor}
                   onChange={(e) => setSettings(s => ({ ...s, customBackgroundColor: e.target.value }))}
                   className="h-8 w-8 rounded cursor-pointer border-0"
                 />
                 <span className="text-xs text-zinc-500 font-mono">{settings.customBackgroundColor}</span>
              </div>
            )}
          </div>

          {/* Object Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.objectColor}</label>
             <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Red, #FF0000 (Optional)"
                  value={settings.objectColor}
                  onChange={(e) => setSettings(s => ({ ...s, objectColor: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-400"
                />
                <input 
                   type="color" 
                   onChange={(e) => setSettings(s => ({ ...s, objectColor: e.target.value }))}
                   className="h-9 w-9 rounded cursor-pointer border-0 shrink-0"
                   title="Pick a color"
                 />
             </div>
          </div>

          {/* Frame Overlay */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.frameOverlay}</label>
            <div 
              onClick={() => frameInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center cursor-pointer hover:bg-zinc-50 transition-colors relative overflow-hidden"
            >
              <input type="file" ref={frameInputRef} onChange={handleFrameUpload} accept="image/png" className="hidden" />
              {framePreview ? (
                <img src={framePreview} alt="Frame" className="w-full h-20 object-contain" />
              ) : (
                <div className="text-zinc-400 text-xs">
                  <Upload size={16} className="mx-auto mb-1" />
                  {t.uploadFrame}
                </div>
              )}
               {framePreview && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setSettings(s => ({ ...s, frameFile: null })); setFramePreview(null); }}
                  className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:text-red-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <button
              onClick={handleEnhanceAll}
              disabled={isProcessing || pendingCount === 0}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${isProcessing || pendingCount === 0
                  ? 'bg-zinc-100 text-zinc-400'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg'}
              `}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> {pendingCount <= 1 ? t.enhance : t.enhanceAll}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header / Actions */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Select All Toggle - Now First Item */}
            <button 
              onClick={toggleSelectAll}
              disabled={jobs.length === 0}
              className="flex items-center gap-2 px-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
            >
              {jobs.length > 0 && selectedIds.size === jobs.length ? (
                <CheckSquare size={18} className="text-zinc-900" />
              ) : (
                <Square size={18} />
              )}
              {jobs.length > 0 && selectedIds.size === jobs.length ? t.deselectAll : t.selectAll}
            </button>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={completedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:bg-zinc-300"
          >
            <Download size={16} /> 
            {selectionCount > 0 
              ? `${t.downloadSelected} (${selectionCount})` 
              : `${t.downloadAll} (${completedCount})`
            }
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {jobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ImageIcon size={32} />
              </div>
              <p className="font-medium">{t.noImages}</p>
              <p className="text-sm mt-1">{t.uploadToEnhance}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {jobs.map(job => {
                const isSelected = selectedIds.has(job.id);
                return (
                  <div 
                    key={job.id} 
                    className={`group relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all
                      ${isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'}
                    `}
                    onClick={() => toggleSelection(job.id)}
                  >
                     {/* Selection Checkbox Overlay */}
                     <div className="absolute top-2 left-2 z-20 cursor-pointer">
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border
                          ${isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white/80 border-zinc-300 text-transparent hover:border-zinc-400'}
                        `}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                     </div>

                     {/* Status Badge - Moved slightly */}
                     <div className="absolute top-2 left-9 z-10">
                        {job.status === 'completed' && <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Check size={10} /> DONE</div>}
                        {job.status === 'processing' && <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">PROCESSING</div>}
                        {job.status === 'error' && <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">ERROR</div>}
                     </div>
                     
                     {/* Delete Button */}
                     <button 
                        onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                        className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 backdrop-blur-sm"
                     >
                       <Trash2 size={12} />
                     </button>

                     {/* Image Area */}
                     <div className="aspect-square relative bg-zinc-100 cursor-pointer">
                        <img 
                          src={job.resultUrl || job.previewUrl} 
                          alt="Product" 
                          className={`w-full h-full object-cover transition-opacity duration-500 ${job.status === 'processing' ? 'opacity-50' : 'opacity-100'}`}
                        />
                        {job.status === 'processing' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-8 h-8 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                          </div>
                        )}
                        {job.resultUrl && (
                           <div 
                             onClick={(e) => { e.stopPropagation(); setComparisonJob(job); }}
                             className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                           >
                              <Maximize2 className="text-white drop-shadow-md" />
                           </div>
                        )}
                        
                        {/* Frame Overlay Preview */}
                        {job.resultUrl && settings.frameFile && framePreview && (
                           <img src={framePreview} className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" alt="Frame" />
                        )}
                     </div>

                     {/* Controls */}
                     <div className="p-3 border-t border-zinc-100 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-mono text-zinc-400 truncate w-16">{job.originalFile.name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => duplicateJob(job)} 
                            className="text-zinc-400 hover:text-zinc-900 transition-colors"
                            title={t.duplicate}
                          >
                            <Copy size={14} />
                          </button>

                          {job.status === 'completed' ? (
                             <button 
                               onClick={() => handleRegenerate(job)} 
                               className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                             >
                               <RefreshCw size={12} /> {t.retry}
                             </button>
                          ) : job.status === 'idle' ? (
                             <button 
                               onClick={() => processJob(job)}
                               className="text-xs font-bold text-blue-600 hover:text-blue-700"
                             >
                               {t.enhance}
                             </button>
                          ) : null}
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal (Before/After Slider) */}
      {comparisonJob && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in">
          <div className="h-16 flex items-center justify-between px-6 text-white bg-black">
            <h3 className="font-bold">{t.comparison}</h3>
            <button onClick={() => setComparisonJob(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div 
            className="flex-1 overflow-hidden relative select-none touch-none flex items-center justify-center p-8"
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
            ref={comparisonRef}
          >
             {/* Container for images - Maximize size while keeping aspect ratio */}
             <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center">
                
                {/* Image Wrapper to constrain aspect ratio */}
                <div className="relative h-full w-full flex items-center justify-center">
                  {/* AFTER Image (Background Layer) */}
                  <img 
                    src={comparisonJob.resultUrl} 
                    className="absolute max-w-full max-h-full object-contain pointer-events-none" 
                    alt="Enhanced" 
                  />
                  {settings.frameFile && framePreview && (
                    <img src={framePreview} className="absolute max-w-full max-h-full object-contain pointer-events-none z-0" alt="Frame" />
                  )}

                  {/* BEFORE Image (Foreground Layer - Clipped) */}
                  <img 
                    src={comparisonJob.previewUrl} 
                    className="absolute max-w-full max-h-full object-contain pointer-events-none" 
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    alt="Original" 
                  />

                  {/* Slider Handle (Visual Guide only, calculated based on container width) */}
                  {/* Note: This is a simplified handle. For a perfect fit on object-contain images, 
                      we'd need to measure the actual image dimensions rendered. 
                      For now, we place it relative to the screen/container width which is good enough for UX. */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-zinc-900">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-zinc-300"></div>
                        <div className="w-0.5 h-3 bg-zinc-300"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
                   <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">{t.original}</span>
                </div>
                <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
                   <span className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1 border border-white/10">
                     <Sparkles size={12} /> {t.enhanced}
                   </span>
                </div>
             </div>
          </div>
          
          <div className="h-20 flex justify-center items-center gap-4 border-t border-white/10 bg-zinc-900">
             <button 
               onClick={() => { handleRegenerate(comparisonJob); setComparisonJob(null); }}
               className="px-6 py-2 bg-zinc-800 text-white rounded-full font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
             >
               {t.regenerate}
             </button>
             <button 
               onClick={async () => {
                 if (comparisonJob.resultUrl) {
                    const blob = await composeImage(comparisonJob.resultUrl);
                    if (blob) saveAs(blob, `enhanced-${comparisonJob.id}.png`);
                 }
               }}
               className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
             >
               <Download size={16} /> {t.download}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enhance;
