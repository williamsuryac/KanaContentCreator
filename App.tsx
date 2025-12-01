import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import Planner from './components/Planner';
import ImageGenerator from './components/ImageGenerator';
import Enhance from './components/Enhance';
import Auth from './components/Auth';
import { UserInput, GeneratedContent, Language } from './types';
import { generateSocialContent } from './services/geminiService';
import { LayoutGrid, PenTool, Image as ImageIcon, Sparkles, Globe, LogOut } from 'lucide-react';
import { translations } from './translations';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'captions' | 'visuals' | 'planner' | 'enhance'>('captions');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (input: UserInput) => {
    if (!input.imageFile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateSocialContent(
        input.imageFile,
        input.description,
        input.platform,
        input.language
      );
      setContent(generated);
    } catch (err) {
      setError("Failed to generate content. Please ensure your API key is valid and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setContent(null);
    setError(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'id' : 'en');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth language={language} />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col relative">
      <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('captions'); handleReset(); }}>
            <img 
              src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
              alt="Kana Creator Logo" 
              className="w-8 h-8 object-contain" 
            />
            <h1 className="text-lg font-bold tracking-tight">Kana Creator</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'EN' : 'ID'}</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white border border-zinc-900 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full pb-32">
        {activeTab === 'captions' && (
          <>
            {error && (
              <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>
                {error}
              </div>
            )}

            {!content ? (
              <div className="flex flex-col items-center animate-fade-in pt-8 md:pt-16">
                <div className="text-center mb-12 max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight">
                    {t.heroTitle} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-900">
                      {t.heroSubtitle}
                    </span>
                  </h2>
                  <p className="text-lg text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                    {t.heroDesc}
                  </p>
                </div>
                <InputForm onSubmit={handleGenerate} isLoading={isLoading} language={language} />
              </div>
            ) : (
              <ResultDisplay content={content} onReset={handleReset} language={language} />
            )}
          </>
        )}
        
        {activeTab === 'visuals' && (
          <ImageGenerator language={language} />
        )}

        {activeTab === 'planner' && (
          <Planner language={language} />
        )}

        {activeTab === 'enhance' && (
          <Enhance language={language} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
        <nav className="flex items-center justify-between p-1.5 bg-white/90 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-200">
          <button
            onClick={() => setActiveTab('captions')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 gap-1
              ${activeTab === 'captions' 
                ? 'bg-zinc-900 text-white shadow-md transform scale-105' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}
            `}
          >
            <PenTool size={18} strokeWidth={2.5} />
            <span>{t.navCaptions}</span>
          </button>

          <button
            onClick={() => setActiveTab('enhance')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 gap-1
              ${activeTab === 'enhance' 
                ? 'bg-zinc-900 text-white shadow-md transform scale-105' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}
            `}
          >
            <Sparkles size={18} strokeWidth={2.5} />
            <span>{t.navEnhance}</span>
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 gap-1
              ${activeTab === 'visuals' 
                ? 'bg-zinc-900 text-white shadow-md transform scale-105' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}
            `}
          >
            <ImageIcon size={18} strokeWidth={2.5} />
            <span>{t.navVisuals}</span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 gap-1
              ${activeTab === 'planner' 
                ? 'bg-zinc-900 text-white shadow-md transform scale-105' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}
            `}
          >
            <LayoutGrid size={18} strokeWidth={2.5} />
            <span>{t.navPlanner}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
