
import { db, storage, auth } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { UserProfile } from "../types";
import { User, deleteUser, updateProfile } from "firebase/auth";

export const createUserDocument = async (user: User, additionalData?: { displayName?: string; photoURL?: string }) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { email, photoURL, displayName } = user;
    const createdAt = new Date();

    const newProfile: UserProfile = {
      uid: user.uid,
      email: email || null,
      displayName: additionalData?.displayName || displayName || null,
      photoURL: additionalData?.photoURL || photoURL || null,
      createdAt,
    };

    try {
      await setDoc(userRef, newProfile);
    } catch (error) {
      console.error("Error creating user document", error);
    }
  } else {
    // Sync basic info if needed, e.g. on login
    // We generally trust Firestore as source of truth, but if photoURL changed in Auth, we might want to update?
    // For now, we only create if not exists.
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>, photoFile?: File) => {
  const userRef = doc(db, "users", uid);
  let updatedData = { ...data };

  if (photoFile) {
    const storageRef = ref(storage, `user_uploads/${uid}/profile_photo.jpg`);
    await uploadBytes(storageRef, photoFile);
    const photoURL = await getDownloadURL(storageRef);
    updatedData.photoURL = photoURL;
    updatedData.storagePath = storageRef.fullPath;
    
    // Also update Auth profile
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
    }
  }

  if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
  }

  await updateDoc(userRef, updatedData);
  return updatedData;
};

export const deleteUserAccount = async (uid: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  // 1. Delete User Document
  await deleteDoc(doc(db, "users", uid));

  // 2. Delete Profile Photo (if known path, or just try generic)
  // We'd ideally store storagePath in profile to delete it cleanly.
  // Attempting to delete common path:
  const profilePicRef = ref(storage, `user_uploads/${uid}/profile_photo.jpg`);
  try {
      await deleteObject(profilePicRef);
  } catch (e) {
      // Ignore if not found
  }

  // 3. Delete Planner Images (Ideally we delete the folder, but client SDK can't delete folders easily without listing)
  // For this MVP, we might skip full storage cleanup or rely on Firebase Functions. 
  // We can try to delete the planner collection if we had a list.
  
  // 4. Delete Auth User
  await deleteUser(user);
};
