import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Initialize Firebase
let app = null;
let db = null;

export function initializeFirebase() {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    // Check if required config exists
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase configuration missing - using local storage fallback');
      return null;
    }
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error('Firebase initialization error', error);
    return null;
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryOperation(operation, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Local storage fallback for when Firebase is unavailable
 */
const LocalStorage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage save error', error);
    }
  },
  
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('LocalStorage get error', error);
      return null;
    }
  },
  
  getAll(prefix) {
    try {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            items.push(JSON.parse(data));
          }
        }
      }
      return items;
    } catch (error) {
      console.error('LocalStorage getAll error', error);
      return [];
    }
  },
};

/**
 * Save user activity and carbon footprint
 */
export async function saveActivityLog(userId, activityLog) {
  if (!db) {
    // Fallback to localStorage
    const key = `activity-${userId}-${Date.now()}`;
    LocalStorage.save(key, { ...activityLog, userId, id: key });
    return;
  }
  
  try {
    await retryOperation(async () => {
      const docRef = doc(collection(db, 'activityLogs'));
      await setDoc(docRef, {
        userId,
        ...activityLog,
        timestamp: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('Error saving activity log', error);
    // Fallback to localStorage
    const key = `activity-${userId}-${Date.now()}`;
    LocalStorage.save(key, { ...activityLog, userId, id: key });
    throw error;
  }
}

/**
 * Retrieve user's historical activity logs
 */
export async function getActivityLogs(userId, limitCount = 10) {
  if (!db) {
    // Fallback to localStorage
    return LocalStorage.getAll(`activity-${userId}`);
  }
  
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting activity logs', error);
    // Fallback to localStorage
    return LocalStorage.getAll(`activity-${userId}`);
  }
}

/**
 * Create or update user profile
 */
export async function updateUserProfile(userId, updates) {
  if (!db) {
    // Fallback to localStorage
    const existing = LocalStorage.get(`profile-${userId}`) || {};
    LocalStorage.save(`profile-${userId}`, { ...existing, ...updates, userId });
    return;
  }
  
  try {
    await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        userId,
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (error) {
    console.error('Error updating user profile', error);
    // Fallback to localStorage
    const existing = LocalStorage.get(`profile-${userId}`) || {};
    LocalStorage.save(`profile-${userId}`, { ...existing, ...updates, userId });
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  if (!db) {
    // Fallback to localStorage
    return LocalStorage.get(`profile-${userId}`) || {
      userId,
      level: 1,
      points: 0,
      levelTitle: 'Green Starter',
      createdAt: new Date(),
    };
  }
  
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      // Create default profile
      const defaultProfile = {
        userId,
        level: 1,
        points: 0,
        levelTitle: 'Green Starter',
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error getting user profile', error);
    // Fallback to localStorage
    return LocalStorage.get(`profile-${userId}`) || {
      userId,
      level: 1,
      points: 0,
      levelTitle: 'Green Starter',
      createdAt: new Date(),
    };
  }
}

/**
 * Save challenge progress
 */
export async function saveChallengeProgress(userId, challengeProgress) {
  if (!db) {
    // Fallback to localStorage
    const key = `challenge-${userId}-${challengeProgress.challengeId}`;
    LocalStorage.save(key, { ...challengeProgress, userId });
    return;
  }
  
  try {
    await retryOperation(async () => {
      const docRef = doc(collection(db, 'challenges'));
      await setDoc(docRef, {
        userId,
        ...challengeProgress,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('Error saving challenge progress', error);
    // Fallback to localStorage
    const key = `challenge-${userId}-${challengeProgress.challengeId}`;
    LocalStorage.save(key, { ...challengeProgress, userId });
    throw error;
  }
}

/**
 * Get user's challenge history
 */
export async function getChallengeHistory(userId) {
  if (!db) {
    // Fallback to localStorage
    return LocalStorage.getAll(`challenge-${userId}`);
  }
  
  try {
    const q = query(
      collection(db, 'challenges'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    
    return challenges;
  } catch (error) {
    console.error('Error getting challenge history', error);
    // Fallback to localStorage
    return LocalStorage.getAll(`challenge-${userId}`);
  }
}

// Initialize Firebase on module load
initializeFirebase();
