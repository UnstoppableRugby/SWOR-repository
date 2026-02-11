// Offline Queue System using IndexedDB
// Handles queuing form submissions when offline and sending when back online

const DB_NAME = 'swor-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'queued-submissions';

export interface QueuedSubmission {
  id: string;
  type: 'join' | 'contribute' | 'contact';
  payload: Record<string, any>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add submission to queue
export async function queueSubmission(
  type: QueuedSubmission['type'],
  payload: Record<string, any>
): Promise<QueuedSubmission> {
  const db = await openDB();
  
  const submission: QueuedSubmission = {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(submission);
    
    request.onsuccess = () => resolve(submission);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get all queued submissions
export async function getQueuedSubmissions(): Promise<QueuedSubmission[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get queued submissions by type
export async function getQueuedSubmissionsByType(
  type: QueuedSubmission['type']
): Promise<QueuedSubmission[]> {
  const all = await getQueuedSubmissions();
  return all.filter(s => s.type === type);
}

// Remove submission from queue
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Update submission (e.g., increment retry count)
export async function updateSubmission(
  id: string,
  updates: Partial<QueuedSubmission>
): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const submission = getRequest.result;
      if (submission) {
        const updated = { ...submission, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
    transaction.oncomplete = () => db.close();
  });
}

// Clear all queued submissions
export async function clearQueue(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get queue count
export async function getQueueCount(): Promise<number> {
  const submissions = await getQueuedSubmissions();
  return submissions.length;
}

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
