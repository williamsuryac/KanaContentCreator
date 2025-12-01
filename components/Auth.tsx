
import React, { useState, useRef } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { translations } from '../translations';
import { Language } from '../types';
import { User, Lock, Mail, Upload, AlertCircle } from 'lucide-react';
import { createUserDocument } from '../services/userService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface AuthProps {
  language: Language;
}

const Auth: React.FC<AuthProps> = ({ language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Ensure Firestore doc exists
      await createUserDocument(result.user);
    } catch (err: any) {
      console.error("Google Sign In Error", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // Ensure Firestore doc exists on login (sync)
          await createUserDocument(userCredential.user);
        } catch (err: any) {
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
             throw new Error(t.authErrorParams);
          }
          throw err;
        }
      } else {
        // SIGN UP
        if (password !== confirmPassword) {
          throw new Error(t.passwordsDoNotMatch);
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          let photoURL = null;

          // Upload Photo if exists
          if (photo) {
             const storageRef = ref(storage, `user_uploads/${user.uid}/profile_photo.jpg`);
             await uploadBytes(storageRef, photo);
             photoURL = await getDownloadURL(storageRef);
          }

          // Update Auth Profile
          await updateProfile(user, {
             displayName: fullName,
             photoURL: photoURL
          });

          // Create Firestore Document
          await createUserDocument(user, {
             displayName: fullName,
             photoURL: photoURL || undefined
          });

        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
             throw new Error(t.authErrorExists);
          }
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD] px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-zinc-100">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
           <img 
              src="https://storage.googleapis.com/kanagaraappsbucket/Main%20Logo%20Kanagara%202025.png" 
              alt="Kana Creator" 
              className="w-16 h-16 object-contain mb-4" 
            />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kana Creator</h1>
            <p className="text-zinc-500 text-sm mt-1">{isLogin ? t.welcomeBack : t.createAccount}</p>
        </div>

        <div className="space-y-4">
           {/* Google Sign In Button */}
           <button
             type="button"
             onClick={handleGoogleSignIn}
             disabled={isLoading}
             className="w-full py-3.5 bg-white text-zinc-700 border border-zinc-200 rounded-2xl font-bold shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transform hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
           >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t.signInGoogle}
           </button>

           <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-200 w-full absolute"></div>
              <span className="bg-white px-3 text-xs font-bold text-zinc-400 relative z-10">{t.or}</span>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
             {/* Sign Up Specific Fields */}
             {!isLogin && (
               <>
                 {/* Photo Upload */}
                 <div className="flex justify-center mb-6">
                   <div 
                     onClick={() => photoInputRef.current?.click()}
                     className="relative w-24 h-24 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors overflow-hidden group"
                   >
                     <input 
                       type="file" 
                       ref={photoInputRef} 
                       onChange={handlePhotoChange} 
                       accept="image/*" 
                       className="hidden" 
                     />
                     {photoPreview ? (
                       <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <Upload className="text-zinc-400 group-hover:text-zinc-600" size={24} />
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{t.uploadPhoto}</span>
                     </div>
                   </div>
                 </div>

                 <div className="relative">
                   <User className="absolute left-4 top-3.5 text-zinc-400" size={20} />
                   <input 
                     type="text" 
                     placeholder={t.fullName}
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900"
                     required
                   />
                 </div>
               </>
             )}

             <div className="relative">
               <Mail className="absolute left-4 top-3.5 text-zinc-400" size={20} />
               <input 
                 type="email" 
                 placeholder={t.email}
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900"
                 required
               />
             </div>

             <div className="relative">
               <Lock className="absolute left-4 top-3.5 text-zinc-400" size={20} />
               <input 
                 type="password" 
                 placeholder={t.password}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900"
                 required
               />
             </div>

             {!isLogin && (
               <div className="relative">
                 <Lock className="absolute left-4 top-3.5 text-zinc-400" size={20} />
                 <input 
                   type="password" 
                   placeholder={t.confirmPassword}
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900"
                   required
                 />
               </div>
             )}

             {error && (
               <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                 <AlertCircle size={16} />
                 {error}
               </div>
             )}

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-bold shadow-lg shadow-zinc-200 hover:bg-zinc-800 transform hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isLoading 
                 ? (isLogin ? t.signIn : t.signUp) + "..." 
                 : (isLogin ? t.signInBtn : t.signUpBtn)
               }
             </button>
           </form>

           <div className="mt-8 text-center">
             <p className="text-zinc-500 text-sm">
               {isLogin ? t.noAccount : t.haveAccount}{" "}
               <button 
                 onClick={() => { setIsLogin(!isLogin); setError(null); }}
                 className="font-bold text-zinc-900 hover:underline"
               >
                 {isLogin ? t.signUp : t.signIn}
               </button>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
