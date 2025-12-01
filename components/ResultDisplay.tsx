import React from 'react';
import { GeneratedContent, VideoIdea } from '../types';
import { Copy, Check, Clapperboard, Hash, Sparkles, MessageCircle, Type } from 'lucide-react';

interface ResultDisplayProps {
  content: GeneratedContent;
  onReset: () => void;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 text-zinc-400 hover:text-zinc-800 transition-colors rounded-full hover:bg-zinc-100"
      title="Copy to clipboard"
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
    </button>
  );
};

const Card: React.FC<{ title: string; icon: React.ReactNode; content: string; className?: string }> = ({ title, icon, content, className = "" }) => (
  <div className={`bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <CopyButton text={content} />
    </div>
    <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">{content}</p>
  </div>
);

const VideoIdeaCard: React.FC<{ idea: VideoIdea; index: number }> = ({ idea, index }) => (
  <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/60">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-sm">
          {index + 1}
        </span>
        <h4 className="font-bold text-zinc-900">{idea.title}</h4>
      </div>
    </div>
    
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Storyboard</h5>
        <p className="text-sm text-zinc-700 bg-white p-3 rounded-xl border border-zinc-100 italic">
          {idea.storyboard}
        </p>
      </div>
      <div>
        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Script</h5>
        <p className="text-sm text-zinc-700 leading-relaxed font-mono bg-white p-3 rounded-xl border border-zinc-100">
          {idea.script}
        </p>
      </div>
    </div>
  </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content, onReset }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Generated Content</h2>
        <button 
          onClick={onReset}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          title="Headline" 
          icon={<Type size={16} />} 
          content={content.headline} 
          className="md:col-span-2 bg-gradient-to-br from-zinc-50 to-white"
        />
        <Card 
          title="Hook" 
          icon={<Sparkles size={16} />} 
          content={content.hook} 
        />
        <Card 
          title="Call to Action" 
          icon={<MessageCircle size={16} />} 
          content={content.callToAction} 
        />
        <Card 
          title="Caption" 
          icon={<Hash size={16} />} 
          content={content.caption} 
          className="md:col-span-2"
        />
      </div>

      {content.videoIdeas && content.videoIdeas.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-4">
            <Clapperboard className="text-zinc-900" size={24} />
            <h3 className="text-xl font-bold text-zinc-900">Video Concepts</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {content.videoIdeas.map((idea, idx) => (
              <VideoIdeaCard key={idx} idea={idea} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;