// Offline detection and queue management hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  queueSubmission,
  getQueuedSubmissions,
  removeFromQueue,
  updateSubmission,
  QueuedSubmission,
  isIndexedDBAvailable
} from '@/lib/offlineQueue';

interface UseOfflineReturn {
  isOnline: boolean;
  isProcessingQueue: boolean;
  queuedCount: number;
  queuedSubmissions: QueuedSubmission[];
  queueFormSubmission: (
    type: QueuedSubmission['type'],
    payload: Record<string, any>
  ) => Promise<QueuedSubmission>;
  processQueue: () => Promise<void>;
  removeQueuedItem: (id: string) => Promise<void>;
  retrySubmission: (submission: QueuedSubmission) => Promise<boolean>;
}

// Toast notification callback type
type ToastCallback = (message: string, type: 'success' | 'error' | 'info') => void;

// Global toast callback (set by the app)
let globalToast: ToastCallback | null = null;

export function setOfflineToastCallback(callback: ToastCallback) {
  globalToast = callback;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queuedSubmissions, setQueuedSubmissions] = useState<QueuedSubmission[]>([]);

  // Load queued submissions on mount
  const loadQueuedSubmissions = useCallback(async () => {
    if (!isIndexedDBAvailable()) return;
    try {
      const submissions = await getQueuedSubmissions();
      setQueuedSubmissions(submissions);
    } catch (error) {
      console.error('[Offline] Failed to load queued submissions:', error);
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (globalToast) {
        globalToast('Back online.', 'success');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load queued submissions on mount
    loadQueuedSubmissions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadQueuedSubmissions]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queuedSubmissions.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [isOnline]);

  // Queue a form submission
  const queueFormSubmission = useCallback(async (
    type: QueuedSubmission['type'],
    payload: Record<string, any>
  ): Promise<QueuedSubmission> => {
    const submission = await queueSubmission(type, payload);
    setQueuedSubmissions(prev => [...prev, submission]);
    return submission;
  }, []);

  // Send a single submission
  const sendSubmission = useCallback(async (
    submission: QueuedSubmission
  ): Promise<boolean> => {
    try {
      let functionName: string;
      let body: Record<string, any>;

      switch (submission.type) {
        case 'join':
          functionName = 'swor-contact';
          body = {
            action: 'submit_join_request',
            ...submission.payload
          };
          break;
        case 'contribute':
          functionName = 'swor-contact';
          body = {
            action: 'submit_contribution',
            ...submission.payload
          };
          break;
        case 'contact':
          functionName = 'swor-contact';
          body = {
            action: 'submit_message',
            ...submission.payload
          };
          break;
        default:
          throw new Error(`Unknown submission type: ${submission.type}`);
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Submission failed');
      }

      return true;
    } catch (error: any) {
      console.error('[Offline] Failed to send submission:', error);
      await updateSubmission(submission.id, {
        retryCount: submission.retryCount + 1,
        lastError: error.message
      });
      return false;
    }
  }, []);

  // Process all queued submissions
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessingQueue) return;

    const submissions = await getQueuedSubmissions();
    if (submissions.length === 0) return;

    setIsProcessingQueue(true);

    let successCount = 0;
    let failCount = 0;

    for (const submission of submissions) {
      // Skip if too many retries
      if (submission.retryCount >= 3) {
        failCount++;
        continue;
      }

      const success = await sendSubmission(submission);
      
      if (success) {
        await removeFromQueue(submission.id);
        successCount++;
      } else {
        failCount++;
      }
    }

    // Reload queue state
    await loadQueuedSubmissions();
    setIsProcessingQueue(false);

    // Show toast notification
    if (globalToast) {
      if (successCount > 0 && failCount === 0) {
        globalToast(
          successCount === 1 
            ? 'Your message has been sent.' 
            : `${successCount} messages have been sent.`,
          'success'
        );
      } else if (successCount > 0 && failCount > 0) {
        globalToast(
          `${successCount} sent, ${failCount} failed. You can retry failed items.`,
          'info'
        );
      } else if (failCount > 0) {
        globalToast(
          'Some messages could not be sent. Please try again later.',
          'error'
        );
      }
    }
  }, [isOnline, isProcessingQueue, sendSubmission, loadQueuedSubmissions]);

  // Remove a queued item
  const removeQueuedItem = useCallback(async (id: string) => {
    await removeFromQueue(id);
    setQueuedSubmissions(prev => prev.filter(s => s.id !== id));
  }, []);

  // Retry a single submission
  const retrySubmission = useCallback(async (
    submission: QueuedSubmission
  ): Promise<boolean> => {
    if (!isOnline) return false;

    const success = await sendSubmission(submission);
    
    if (success) {
      await removeFromQueue(submission.id);
      setQueuedSubmissions(prev => prev.filter(s => s.id !== submission.id));
      
      if (globalToast) {
        globalToast('Your message has been sent.', 'success');
      }
    }
    
    return success;
  }, [isOnline, sendSubmission]);

  return {
    isOnline,
    isProcessingQueue,
    queuedCount: queuedSubmissions.length,
    queuedSubmissions,
    queueFormSubmission,
    processQueue,
    removeQueuedItem,
    retrySubmission
  };
}

export default useOffline;
