
import React, { useState, useRef } from 'react';
import { UserProfile, Language } from '../types';
import { X, Camera, User, Mail, Save, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { translations } from '../translations';
import { updateUserProfile, deleteUserAccount } from '../services/userService';

interface ProfileModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  language: Language;
  onUpdate: (profile: UserProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, onClose, language, onUpdate }) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photoURL);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = { displayName };
      const updatedData = await updateUserProfile(userProfile.uid, updates, photoFile || undefined);
      onUpdate({ ...userProfile, ...updatedData } as UserProfile);
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteUserAccount(userProfile.uid);
        onClose();
        // Auth state listener in App.tsx will handle redirect
      } catch (error) {
        console.error("Failed to delete account", error);
        alert("Failed to delete account. You may need to sign in again recently.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-zinc-100">
        
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-xl font-bold text-zinc-900">{t.editProfile}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Photo */}
          <div className="flex justify-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full bg-zinc-100 cursor-pointer group border-4 border-white shadow-lg overflow-hidden"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <User size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t.fullName}</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t.email}</label>
              <div className="relative opacity-60">
                <Mail className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                <input 
                  type="email" 
                  value={userProfile.email || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-bold shadow-lg shadow-zinc-200 hover:bg-zinc-800 transform hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} /> {t.save}
              </>
            )}
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 size={18} /> Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
