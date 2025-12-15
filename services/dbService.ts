
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, arrayUnion } from 'firebase/firestore';
import { UserProfile, MoodEntry, JournalEntry, Task, ChatMessage, BreathingSession, SleepEntry, ThoughtRecord } from '../types';

// Collections structure:
// users/{uid} (Profile)
// users/{uid}/moods/{id}
// users/{uid}/journals/{id}
// users/{uid}/tasks/{id}
// users/{uid}/daily_chats/{YYYY-MM-DD} (Grouped Messages)
// users/{uid}/breathing/{id}
// users/{uid}/sleep/{id}
// users/{uid}/cbt_thoughts/{id}

const checkDb = () => {
  if (!db) throw new Error("Firebase Firestore is not initialized. Check your configuration.");
};

export const dbService = {
  // --- USER PROFILE ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) return null;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch (e: any) {
      if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
        throw e; // Re-throw to be caught by UI
      }
      console.warn("DB Error", e);
    }
    return null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    checkDb();
    // This calls setDoc directly, if it fails due to permissions, the caller must handle it.
    await setDoc(doc(db, 'users', profile.uid), profile);
  },

  // --- GENERIC GET ALL ---
  async getCollection<T>(uid: string, collectionName: string): Promise<T[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'users', uid, collectionName));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as T);
    } catch (e: any) {
      if (e.code === 'permission-denied') throw e;
      console.warn(`Failed to fetch ${collectionName}`, e);
      return [];
    }
  },

  // --- SPECIALIZED CHAT HISTORY GETTER ---
  async getChatHistory(uid: string): Promise<ChatMessage[]> {
    if (!db) return [];
    try {
      // Fetch daily chat documents
      const q = query(collection(db, 'users', uid, 'daily_chats'));
      const querySnapshot = await getDocs(q);

      // Flatten the 'messages' array from each daily document into a single list
      const allMessages: ChatMessage[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          allMessages.push(...data.messages);
        }
      });

      return allMessages;
    } catch (e: any) {
      if (e.code === 'permission-denied') throw e;
      console.warn("Failed to fetch chat history", e);
      return [];
    }
  },

  // --- SPECIFIC SAVERS ---
  async saveMood(uid: string, mood: MoodEntry): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'moods', mood.id), mood);
  },

  async saveJournal(uid: string, journal: JournalEntry): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'journals', journal.id), journal);
  },

  async saveTask(uid: string, task: Task): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'tasks', task.id), task);
  },

  async deleteTask(uid: string, taskId: string): Promise<void> {
    checkDb();
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  },

  async saveChatMessage(uid: string, message: ChatMessage): Promise<void> {
    checkDb();

    // Group messages by local date (YYYY-MM-DD)
    const date = new Date(message.timestamp);
    const dateKey = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');

    // Reference a document for THIS DAY
    const dayDocRef = doc(db, 'users', uid, 'daily_chats', dateKey);

    // Use setDoc with merge:true and arrayUnion to append the message
    // This creates the doc if it doesn't exist, or updates it if it does.
    await setDoc(dayDocRef, {
      date: dateKey,
      messages: arrayUnion(message),
      lastUpdated: Date.now()
    }, { merge: true });
  },

  async saveBreathingSession(uid: string, session: BreathingSession): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'breathing', session.id), session);
  },

  async saveSleepEntry(uid: string, entry: SleepEntry): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'sleep', entry.id), entry);
  },

  async saveThoughtRecord(uid: string, record: ThoughtRecord): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'cbt_thoughts', record.id), record);
  },

  // --- CATEGORIES ---
  async getCategories(uid: string): Promise<string[]> {
    if (!db) return ['Personal', 'Work', 'Wellness'];
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'categories');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().list || ['Personal', 'Work', 'Wellness'];
      }
    } catch (e: any) {
      if (e.code === 'permission-denied') throw e;
      console.warn("Failed to fetch categories", e);
    }
    return ['Personal', 'Work', 'Wellness'];
  },

  async saveCategories(uid: string, categories: string[]): Promise<void> {
    checkDb();
    await setDoc(doc(db, 'users', uid, 'settings', 'categories'), { list: categories });
  }
};
