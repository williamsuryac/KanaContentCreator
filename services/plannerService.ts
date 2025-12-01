
import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, getDocs, collection, deleteDoc, getDoc } from "firebase/firestore";
import { GridItem } from "../types";

// Upload image to Storage and return URL and Path
export const uploadPlannerImage = async (userId: string, file: File): Promise<{ url: string; storagePath: string }> => {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const storagePath = `user_uploads/${userId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, storagePath };
};

// Delete image from Storage
export const deletePlannerImage = async (storagePath: string): Promise<void> => {
  if (!storagePath) return;
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Continue execution even if storage delete fails (e.g. file not found)
  }
};

// Save Grid Item to Firestore
export const saveGridItemToFirestore = async (userId: string, index: number, item: Partial<GridItem>): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'planner', index.toString());
  
  // We don't save the 'file' object or 'isLoading' state to Firestore
  const dataToSave = {
    id: item.id,
    url: item.url,
    caption: item.caption || '',
    storagePath: item.storagePath || null,
    updatedAt: new Date()
  };

  await setDoc(docRef, dataToSave, { merge: true });
};

// Delete Grid Item from Firestore (Reset to empty)
export const deleteGridItemFromFirestore = async (userId: string, index: number): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'planner', index.toString());
  await deleteDoc(docRef);
};

// Fetch all grid items
export const fetchPlannerGrid = async (userId: string): Promise<GridItem[]> => {
  const plannerRef = collection(db, 'users', userId, 'planner');
  const snapshot = await getDocs(plannerRef);
  
  // Initialize with empty slots
  const grid: GridItem[] = Array(12).fill(null).map((_, i) => ({ 
    id: `slot-${i}`, 
    url: null, 
    file: null, 
    caption: '' 
  }));

  snapshot.forEach((doc) => {
    const index = parseInt(doc.id);
    if (!isNaN(index) && index >= 0 && index < 12) {
      const data = doc.data();
      grid[index] = {
        id: data.id || `slot-${index}`,
        url: data.url,
        file: null, // We can't reconstruct the File object from URL
        caption: data.caption,
        storagePath: data.storagePath
      };
    }
  });

  return grid;
};

// Reset Entire Grid (Delete all images and Firestore docs)
export const resetPlannerGrid = async (userId: string, gridItems: GridItem[]): Promise<void> => {
  const promises = gridItems.map(async (item, index) => {
    if (item.url) {
      // 1. Delete from Storage (if path exists)
      if (item.storagePath) {
        await deletePlannerImage(item.storagePath);
      }
      // 2. Delete from Firestore
      await deleteGridItemFromFirestore(userId, index);
    }
  });

  await Promise.all(promises);
};
