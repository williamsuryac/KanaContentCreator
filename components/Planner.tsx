import React, { useState, useRef } from 'react';
import { Grid, Trash2, Plus, Image as ImageIcon, Download, Share } from 'lucide-react';
import { toJpeg } from 'html-to-image';

interface GridItem {
  id: string;
  url: string | null;
  file: File | null;
}

const Planner: React.FC = () => {
  // Initialize 12 grid slots (4 rows)
  const [gridItems, setGridItems] = useState<GridItem[]>(
    Array(12).fill(null).map((_, i) => ({ id: `slot-${i}`, url: null, file: null }))
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIndexRef = useRef<number | null>(null);
  const plannerRef = useRef<HTMLDivElement>(null);

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
      newItems[index] = { ...newItems[index], url: null, file: null };
      return newItems;
    });
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

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="flex justify-between items-center w-full max-w-md">
        <h3 className="text-xl font-bold text-zinc-900">Grid Preview</h3>
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
          Save Mockup
        </button>
      </div>

      <div 
        ref={plannerRef}
        className="w-full max-w-md bg-white min-h-[800px] border border-zinc-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col"
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

        {/* Header */}
        <div className="px-5 pt-2 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                 <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                   <ImageIcon className="text-zinc-300" size={32} />
                 </div>
              </div>
            </div>
            <div className="flex-1 flex justify-around ml-4">
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg leading-tight">12</span>
                <span className="text-xs text-zinc-500">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg leading-tight">12.5k</span>
                <span className="text-xs text-zinc-500">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg leading-tight">402</span>
                <span className="text-xs text-zinc-500">Following</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <h1 className="font-bold text-sm">Kana Creator</h1>
            <p className="text-sm text-zinc-600">Digital Creator</p>
            <p className="text-sm text-zinc-800">Visualizing the future of aesthetic content. 🌿<br/>Minimalist • Tech • Lifestyle</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-zinc-100 py-1.5 rounded-lg text-sm font-semibold text-zinc-900">Edit Profile</button>
            <button className="flex-1 bg-zinc-100 py-1.5 rounded-lg text-sm font-semibold text-zinc-900">Share Profile</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-zinc-100">
          <div className="flex-1 py-2.5 border-b-2 border-zinc-900 flex justify-center cursor-pointer">
            <Grid size={22} className="text-zinc-900" />
          </div>
          <div className="flex-1 py-2.5 border-b border-transparent flex justify-center text-zinc-400 cursor-pointer">
            <div className="w-6 h-6 border-2 border-zinc-300 rounded-md" />
          </div>
          <div className="flex-1 py-2.5 border-b border-transparent flex justify-center text-zinc-400 cursor-pointer">
             <div className="w-6 h-6 bg-zinc-200 rounded-full" />
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
              onClick={() => !item.url && triggerFileInput(index)}
              className={`aspect-square relative group transition-all duration-200 
                ${!item.url ? 'bg-zinc-50 hover:bg-zinc-100 cursor-pointer' : 'cursor-move'}
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
        <div className="h-12 border-t border-zinc-100 flex justify-around items-center px-6">
          <div className="w-6 h-6 bg-zinc-900 rounded-full" />
          <div className="w-6 h-6 bg-zinc-200 rounded-full" />
          <div className="w-8 h-8 bg-zinc-200 rounded-full border-2 border-white ring-1 ring-zinc-900" />
          <div className="w-6 h-6 bg-zinc-200 rounded-full" />
          <div className="w-6 h-6 bg-zinc-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Planner;