
import React, { useState, useRef } from 'react';
import { Grid, Trash2, Plus, Image as ImageIcon, Download, Share, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, Home, Search, Clapperboard, User, ChevronDown, Menu, PlusSquare, X, Sparkles } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { translations } from '../translations';
import { Language, GridItem, Platform } from '../types';
import { generateSocialContent } from '../services/geminiService';

interface PlannerProps {
  language?: Language;
}

const Planner: React.FC<PlannerProps> = ({ language = 'en' }) => {
  // Initialize 12 grid slots (4 rows)
  const [gridItems, setGridItems] = useState<GridItem[]>(
    Array(12).fill(null).map((_, i) => ({ id: `slot-${i}`, url: null, file: null, caption: '' }))
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);
  
  // Modal State
  const [editingItem, setEditingItem] = useState<{ index: number; item: GridItem } | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIndexRef = useRef<number | null>(null);
  const plannerRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeSlotIndexRef.current !== null) {
      handleFileUpload(e.target.files[0], activeSlotIndexRef.current);
    }
  };

  const handleFileUpload = (file: File, index: number) => {
    const url = URL.createObjectURL(file);
    setGridItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], url, file };
      return newItems;
    });
  };

  const triggerFileInput = (index: number) => {
    activeSlotIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const removeItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setGridItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], url: null, file: null, caption: '' };
      return newItems;
    });
    if (hoveredUrl === gridItems[index].url) {
      setHoveredUrl(null);
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    // Case 1: Dropping a file from desktop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0], targetIndex);
      setIsDraggingFile(false);
      return;
    }

    // Case 2: Swapping grid items
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      setGridItems(prev => {
        const newItems = [...prev];
        const temp = newItems[draggedIndex];
        newItems[draggedIndex] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        return newItems;
      });
    }
    setDraggedIndex(null);
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleSaveImage = async () => {
    if (!plannerRef.current) return;
    
    setIsSaving(true);
    try {
      const dataUrl = await toJpeg(plannerRef.current, { 
        quality: 0.95, 
        backgroundColor: '#ffffff',
        pixelRatio: 2 // Higher resolution for better quality
      });
      
      const link = document.createElement('a');
      link.download = 'kana-grid-planner.jpeg';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert('Could not generate the image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Caption Modal Functions
  const openCaptionModal = (index: number, item: GridItem) => {
    setEditingItem({ index, item });
    setCaptionText(item.caption || '');
  };

  const closeCaptionModal = () => {
    setEditingItem(null);
    setCaptionText('');
  };

  const handleSaveCaption = () => {
    if (editingItem) {
      setGridItems(prev => {
        const newItems = [...prev];
        newItems[editingItem.index] = { ...newItems[editingItem.index], caption: captionText };
        return newItems;
      });
      closeCaptionModal();
    }
  };

  const handleGenerateCaption = async () => {
    if (!editingItem || !editingItem.item.file) return;
    
    setIsGeneratingCaption(true);
    try {
      // Use existing text as context if provided, otherwise generic
      const context = captionText || "Write an engaging, aesthetic caption for this photo.";
      
      const result = await generateSocialContent(
        editingItem.item.file,
        context,
        Platform.INSTAGRAM,
        language as Language
      );
      
      setCaptionText(result.caption);
    } catch (error) {
      console.error("Failed to generate caption", error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Find caption for hovered item
  const hoveredItem = hoveredUrl ? gridItems.find(item => item.url === hoveredUrl) : null;
  const currentHoverCaption = hoveredItem?.caption || "Essential minimalism for your daily life. Discover our new collection designed for modern living. #SimpleLiving #Kanagara";

  return (
    <div className="flex flex-col lg:flex-row justify-center items-start gap-8 xl:gap-24 animate-fade-in max-w-[1600px] mx-auto pb-12 relative">
      
      {/* Left Column: Mockup Editor */}
      <div className="flex flex-col items-center gap-6 flex-shrink-0">
        <div className="flex justify-between items-center w-full max-w-md">
          <h3 className="text-xl font-bold text-zinc-900">{t.gridPreview}</h3>
          <button 
            onClick={handleSaveImage}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-95 duration-200"
          >
            {isSaving ? (
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {t.saveMockup}
          </button>
        </div>

        <div 
          ref={plannerRef}
          className="w-full max-w-md bg-white min-h-[850px] border border-zinc-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col"
          onDragEnter={handleContainerDragEnter}
          onDragLeave={handleContainerDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Mock Status Bar */}
          <div className="px-6 pt-4 pb-2 flex justify-between items-center text-xs font-semibold text-zinc-900">
            <span>9:41</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-2.5 bg-zinc-900 rounded-[1px]"/>
              <div className="w-0.5 h-1.5 bg-zinc-900/30 rounded-[1px]"/>
            </div>
          </div>

          {/* App Bar */}
          <div className="px-5 h-11 flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="font-bold text-xl text-zinc-900 tracking-tight">KanagaraStore</span>
              <div className="relative">
                 <ChevronDown size={18} strokeWidth={2.5} className="text-zinc-900 mt-0.5" />
                 <div className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </div>
            </div>
            <div className="flex items-center gap-5 text-zinc-900">
               <PlusSquare size={26} strokeWidth={1.5} />
               <Menu size={26} strokeWidth={1.5} />
            </div>
          </div>

          {/* Profile Header */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px] cursor-pointer">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                   <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                     <img 
                       src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
                       alt="Profile" 
                       className="w-full h-full object-cover"
                     />
                   </div>
                </div>
              </div>
              <div className="flex-1 flex justify-around ml-4">
                <div className="flex flex-col items-center cursor-pointer">
                  <span className="font-bold text-lg leading-tight">12</span>
                  <span className="text-[13px] text-zinc-900">{t.posts}</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer">
                  <span className="font-bold text-lg leading-tight">12.5k</span>
                  <span className="text-[13px] text-zinc-900">{t.followers}</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer">
                  <span className="font-bold text-lg leading-tight">402</span>
                  <span className="text-[13px] text-zinc-900">{t.following}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-0.5 mb-5">
              <h1 className="font-semibold text-sm">KanagaraStore</h1>
              <span className="text-xs text-zinc-500 bg-zinc-50 px-0 rounded-full inline-block mb-1">Shopping & retail</span>
              <p className="text-sm text-zinc-900 whitespace-pre-line leading-snug">
                Your Essentials for Simple Living 🌿{'\n'}
                Sustainable • Minimalist • Timeless{'\n'}
                👇 Shop the collection
              </p>
              <div className="flex items-center gap-1 mt-1">
                 <LinkIcon size={12} className="text-zinc-400 -rotate-45" />
                 <span className="text-sm font-semibold text-blue-900">kanagarastore.com</span>
              </div>
            </div>

            {/* Professional Dashboard */}
            <div className="mb-3">
               <div className="bg-zinc-50 rounded-lg p-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-100 border border-zinc-100 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-zinc-900">Professional dashboard</span>
                    <span className="text-[11px] text-zinc-500">2.4k accounts reached in the last 30 days.</span>
                  </div>
               </div>
            </div>

            <div className="flex gap-1.5 mb-6">
              <button className="flex-1 bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded-lg text-sm font-semibold text-zinc-900 transition-colors">{t.editProfile}</button>
              <button className="flex-1 bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded-lg text-sm font-semibold text-zinc-900 transition-colors">{t.shareProfile}</button>
              <button className="flex-1 bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded-lg text-sm font-semibold text-zinc-900 transition-colors">Contact</button>
            </div>

            {/* Highlights */}
            <div className="flex gap-4 mb-2 overflow-x-auto no-scrollbar pb-2">
              {[
                { name: 'New In', color: 'bg-zinc-100' },
                { name: 'Reviews', color: 'bg-zinc-100' },
                { name: 'Sale', color: 'bg-zinc-100' },
                { name: 'Events', color: 'bg-zinc-100' },
                { name: 'About', color: 'bg-zinc-100' }
              ].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                    <div className="w-16 h-16 rounded-full border border-zinc-200 p-[2px] group-hover:border-zinc-300 transition-colors">
                        <div className={`w-full h-full rounded-full ${h.color} flex items-center justify-center text-zinc-300`}>
                          <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-dashed opacity-50"></div>
                        </div>
                    </div>
                    <span className="text-[11px] text-zinc-900 font-medium tracking-tight">{h.name}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-zinc-100 mt-2">
            <div className="flex-1 py-2.5 border-b-[1.5px] border-zinc-900 flex justify-center cursor-pointer">
              <Grid size={22} className="text-zinc-900" />
            </div>
            <div className="flex-1 py-2.5 border-b-[1.5px] border-transparent flex justify-center text-zinc-400 cursor-pointer hover:text-zinc-600">
              <Clapperboard size={22} />
            </div>
            <div className="flex-1 py-2.5 border-b-[1.5px] border-transparent flex justify-center text-zinc-400 cursor-pointer hover:text-zinc-600">
               <User size={22} className="border-2 border-transparent rounded-sm" />
            </div>
          </div>

          {/* Grid */}
          <div className={`grid grid-cols-3 gap-0.5 bg-white flex-1 relative ${isDraggingFile ? 'after:absolute after:inset-0 after:bg-blue-500/10 after:z-20' : ''}`}>
            {gridItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => item.url ? openCaptionModal(index, item) : triggerFileInput(index)}
                onMouseEnter={() => item.url && setHoveredUrl(item.url)}
                onMouseLeave={() => setHoveredUrl(null)}
                className={`aspect-[4/5] relative group transition-all duration-200 
                  ${!item.url ? 'bg-zinc-50 hover:bg-zinc-100 cursor-pointer' : 'cursor-pointer'}
                  ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
                `}
              >
                {item.url ? (
                  <>
                    <img 
                      src={item.url} 
                      alt="Planned post" 
                      className="w-full h-full object-cover"
                    />
                    {item.caption && (
                       <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm" title="Has caption"></div>
                    )}
                    <button 
                      onClick={(e) => removeItem(e, index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-1">
                    <Plus size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer Mock */}
          <div className="h-12 border-t border-zinc-100 flex justify-around items-start px-6 bg-white">
            <Home size={24} strokeWidth={2} className="text-zinc-900" />
            <Search size={24} strokeWidth={2} className="text-zinc-900" />
            <PlusSquare size={24} strokeWidth={2} className="text-zinc-900" />
            <Clapperboard size={24} strokeWidth={2} className="text-zinc-900" />
            <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-200">
                <img 
                  src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Live Preview Panel (Desktop) */}
      <div className="hidden lg:flex flex-col items-center gap-6 sticky top-8 shrink-0">
         <div className="h-9 w-full"></div> {/* Spacer to align with button */}
         
         {/* iPhone 17 Pro Max aspect ratio (430x932) */}
         <div className="w-[430px] h-[932px] bg-white rounded-[4rem] border-[6px] border-zinc-100 shadow-2xl flex items-center justify-center overflow-hidden relative shrink-0">
             {hoveredUrl ? (
               <div className="w-full h-full flex flex-col animate-fade-in bg-white">
                  {/* Status Bar */}
                  <div className="px-6 pt-5 pb-2 flex justify-between items-center text-xs font-semibold text-zinc-900">
                    <span>9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-4 h-2.5 bg-zinc-900 rounded-[1px]"/>
                      <div className="w-0.5 h-1.5 bg-zinc-900/30 rounded-[1px]"/>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-100/50">
                    <div className="flex items-center gap-2 -ml-2 text-zinc-900">
                      <ChevronLeft size={28} strokeWidth={1.5} />
                      <span className="font-bold text-lg">Posts</span>
                    </div>
                  </div>

                  {/* Feed Post Content */}
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* User Row */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
                              <img 
                                src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                         </div>
                         <span className="text-sm font-semibold text-zinc-900">KanagaraStore</span>
                      </div>
                      <MoreHorizontal size={20} className="text-zinc-600" />
                    </div>

                    {/* Image */}
                    <div className="w-full bg-zinc-100">
                      <img 
                         src={hoveredUrl} 
                         alt="Post" 
                         className="w-full h-auto object-cover max-h-[535px] min-h-[300px]" // Limit height to keep looking like a 4:5 post
                      />
                    </div>

                    {/* Action Row */}
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div className="flex gap-4">
                        <Heart size={26} strokeWidth={1.5} className="text-zinc-900 hover:text-red-500 cursor-pointer" />
                        <MessageCircle size={26} strokeWidth={1.5} className="text-zinc-900 -rotate-90" />
                        <Send size={26} strokeWidth={1.5} className="text-zinc-900" />
                      </div>
                      <Bookmark size={26} strokeWidth={1.5} className="text-zinc-900" />
                    </div>

                    {/* Likes & Caption */}
                    <div className="px-4 pb-6 space-y-1.5">
                       <p className="text-sm font-semibold text-zinc-900">2,492 likes</p>
                       <p className="text-sm text-zinc-900 leading-snug whitespace-pre-line">
                         <span className="font-semibold mr-1.5">KanagaraStore</span>
                         {currentHoverCaption}
                       </p>
                       <p className="text-xs text-zinc-500 mt-1 uppercase tracking-tight">2 hours ago</p>
                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="h-20 border-t border-zinc-100 flex justify-around items-start pt-4 px-2 bg-white/95 backdrop-blur-sm">
                    <Home size={26} strokeWidth={1.5} className="text-zinc-900" />
                    <Search size={26} strokeWidth={1.5} className="text-zinc-400" />
                    <PlusSquare size={26} strokeWidth={1.5} className="text-zinc-400" />
                    <Clapperboard size={26} strokeWidth={1.5} className="text-zinc-400" />
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-200">
                      <img 
                        src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  
                  {/* Home Indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-900 rounded-full" />
               </div>
             ) : (
               <div className="flex flex-col items-center text-zinc-300 p-8 text-center">
                  <ImageIcon size={64} strokeWidth={1} className="mb-4" />
                  <p className="font-medium text-lg text-zinc-400">{t.hoverPreview}</p>
               </div>
             )}
         </div>
      </div>

      {/* Caption Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
                 <h3 className="font-bold text-lg">{t.editCaption}</h3>
                 <button onClick={closeCaptionModal} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100">
                       {editingItem.item.url && (
                          <img src={editingItem.item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                       )}
                    </div>
                    <div className="flex-1">
                       <textarea 
                          value={captionText}
                          onChange={(e) => setCaptionText(e.target.value)}
                          placeholder={t.captionPlaceholder}
                          className="w-full h-32 p-3 bg-zinc-50 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-sm"
                       />
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleGenerateCaption}
                   disabled={isGeneratingCaption}
                   className="w-full py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
                 >
                   {isGeneratingCaption ? (
                      <>
                        <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                        {t.generating}
                      </>
                   ) : (
                      <>
                        <Sparkles size={16} />
                        {t.generateCaption}
                      </>
                   )}
                 </button>
              </div>

              <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                 <button 
                   onClick={closeCaptionModal}
                   className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                 >
                   {t.cancel}
                 </button>
                 <button 
                   onClick={handleSaveCaption}
                   className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 shadow-sm"
                 >
                   {t.save}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

const LinkIcon = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

export default Planner;
