import { OverlayConfig } from '../types/overlay';
import { processCSVAndSendNotifications } from './overlayService';

export interface ScheduledOverlay {
    id: string;
    overlayConfig: OverlayConfig;
    fcmToken: string;
    scheduledTime: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    result?: {
        success: number;
        failed: number;
        failedTokens: { token: string; error: string }[];
        progress?: {
            currentBatch: number;
            totalBatches: number;
            processedLines: number;
            totalLines: number;
        };
    };
    error?: string;
    retryCount?: number;
}

export const STORAGE_KEY = 'scheduled_overlays';
const SCHEDULER_INTERVAL = 30000; // Check every 30 seconds
const MAX_RETRIES = 3;
const MAX_STORED_OVERLAYS = 50;
const BATCH_SIZE = 5000;
const MAX_PARALLEL_BATCHES = 4; // Maximum number of batches to process in parallel

let schedulerInterval: NodeJS.Timeout | null = null;

// IndexedDB setup
const DB_NAME = 'overlaySchedulerDB';
const DB_VERSION = 1;
const CSV_STORE = 'csvFiles';

let db: IDBDatabase | null = null;

const initDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error opening IndexedDB');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(CSV_STORE)) {
                db.createObjectStore(CSV_STORE, { keyPath: 'id' });
            }
        };
    });
};

const saveCSVToIndexedDB = async (id: string, csvContent: string): Promise<void> => {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(CSV_STORE, 'readwrite');
        const store = transaction.objectStore(CSV_STORE);
        const request = store.put({ id, content: csvContent });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const getCSVFromIndexedDB = async (id: string): Promise<string> => {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(CSV_STORE, 'readonly');
        const store = transaction.objectStore(CSV_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
            const data = request.result;
            resolve(data ? data.content : '');
        };
        request.onerror = () => reject(request.error);
    });
};

const deleteCSVFromIndexedDB = async (id: string): Promise<void> => {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(CSV_STORE, 'readwrite');
        const store = transaction.objectStore(CSV_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Helper function to clean up old data
const cleanupOldData = () => {
    try {
        const schedules = getScheduledOverlays();
        if (schedules.length > MAX_STORED_OVERLAYS) {
            // Sort by creation date and keep only the newest ones
            const sortedSchedules = schedules.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const schedulesToKeep = sortedSchedules.slice(0, MAX_STORED_OVERLAYS);
            
            // Remove old data from IndexedDB
            schedules.forEach(schedule => {
                if (!schedulesToKeep.find(s => s.id === schedule.id)) {
                    deleteCSVFromIndexedDB(schedule.id).catch(console.error);
                }
            });
            
            // Update storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(schedulesToKeep));
        }
    } catch (error) {
        console.error('Error cleaning up old data:', error);
    }
};

const processBatch = async (
    csvContent: string,
    overlayConfig: OverlayConfig,
    fcmToken: string,
    batchStart: number,
    batchEnd: number
): Promise<{ success: number; failed: number; failedTokens: { token: string; error: string }[] }> => {
    const lines = csvContent.split('\n');
    const batchLines = lines.slice(batchStart, batchEnd);
    const batchContent = batchLines.join('\n');
    const batchFile = new File([batchContent], 'batch.csv', { type: 'text/csv' });

    try {
        const result = await processCSVAndSendNotifications(
            batchFile,
            overlayConfig,
            fcmToken
        );
        return result;
    } catch (error: any) {
        console.error(`Error processing batch ${batchStart}-${batchEnd}:`, error);
        return {
            success: 0,
            failed: batchLines.length,
            failedTokens: batchLines.map(line => ({
                token: line.trim(),
                error: error.message || 'Unknown error occurred'
            }))
        };
    }
};

const processScheduledOverlay = async (schedule: ScheduledOverlay): Promise<void> => {
    try {
        // Check if the overlay has been terminated
        const currentSchedules = getScheduledOverlays();
        const currentSchedule = currentSchedules.find(s => s.id === schedule.id);
        if (!currentSchedule || currentSchedule.status === 'failed' && currentSchedule.error === 'Terminated by user') {
            console.log('Overlay has been terminated, stopping processing');
            return;
        }

        // Get CSV content from IndexedDB
        const csvContent = await getCSVFromIndexedDB(schedule.id);
        
        if (!csvContent) {
            throw new Error('CSV content not found for scheduled overlay');
        }

        const lines = csvContent.split('\n');
        const totalLines = lines.length;
        const batches: number[][] = [];
        
        // Create batches of 5000 lines each
        for (let i = 0; i < totalLines; i += BATCH_SIZE) {
            batches.push([i, Math.min(i + BATCH_SIZE, totalLines)]);
        }

        let totalSuccess = 0;
        let totalFailed = 0;
        const allFailedTokens: { token: string; error: string }[] = [];
        let currentBatch = 0;

        // Process batches in parallel with a maximum of MAX_PARALLEL_BATCHES at a time
        for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
            currentBatch = i / MAX_PARALLEL_BATCHES + 1;
            const totalBatches = Math.ceil(batches.length / MAX_PARALLEL_BATCHES);
            
            const currentBatches = batches.slice(i, i + MAX_PARALLEL_BATCHES);
            const batchPromises = currentBatches.map(([start, end]) => 
                processBatch(csvContent, schedule.overlayConfig, schedule.fcmToken, start, end)
            );

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                totalSuccess += result.success;
                totalFailed += result.failed;
                allFailedTokens.push(...result.failedTokens);
            });

            // Update progress in storage with more detailed information
            const schedules = getScheduledOverlays();
            const updatedSchedules = schedules.map(s => 
                s.id === schedule.id 
                    ? { 
                        ...s, 
                        status: 'processing',
                        result: {
                            success: totalSuccess,
                            failed: totalFailed,
                            failedTokens: allFailedTokens,
                            progress: {
                                currentBatch,
                                totalBatches,
                                processedLines: Math.min((i + MAX_PARALLEL_BATCHES) * BATCH_SIZE, totalLines),
                                totalLines
                            }
                        }
                    } 
                    : s
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
        }

        // Update final status to completed with detailed results
        const schedules = getScheduledOverlays();
        const updatedSchedules = schedules.map(s => 
            s.id === schedule.id 
                ? { 
                    ...s, 
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    result: {
                        success: totalSuccess,
                        failed: totalFailed,
                        failedTokens: allFailedTokens,
                        progress: {
                            currentBatch: Math.ceil(batches.length / MAX_PARALLEL_BATCHES),
                            totalBatches: Math.ceil(batches.length / MAX_PARALLEL_BATCHES),
                            processedLines: totalLines,
                            totalLines
                        }
                    }
                } 
                : s
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));

        // Update the main overlay config with the results
        const overlayConfigs = localStorage.getItem('overlay_configs');
        if (overlayConfigs) {
            const overlays = JSON.parse(overlayConfigs);
            const updatedOverlays = overlays.map((overlay: any) => {
                if (overlay.id === schedule.overlayConfig.id) {
                    return {
                        ...overlay,
                        triggers: [
                            ...(overlay.triggers || []),
                            {
                                triggeredAt: new Date().toISOString(),
                                triggeredBy: 'Scheduler',
                                successCount: totalSuccess,
                                failedCount: totalFailed,
                                failedTokens: allFailedTokens
                            }
                        ]
                    };
                }
                return overlay;
            });
            localStorage.setItem('overlay_configs', JSON.stringify(updatedOverlays));
        }

        // Clean up CSV data after successful processing
        await deleteCSVFromIndexedDB(schedule.id);
    } catch (error: any) {
        console.error('Error processing scheduled overlay:', error);
        
        // Get current schedules
        const schedules = getScheduledOverlays();
        const currentSchedule = schedules.find(s => s.id === schedule.id);
        
        if (!currentSchedule) {
            console.error('Schedule not found:', schedule.id);
            return;
        }
        
        // Check if we should retry
        const retryCount = currentSchedule.retryCount || 0;
        const shouldRetry = retryCount < MAX_RETRIES;
        
        if (shouldRetry) {
            // Update retry count and keep as pending
            const updatedSchedules = schedules.map(s => 
                s.id === schedule.id 
                    ? { 
                        ...s, 
                        status: 'pending',
                        retryCount: retryCount + 1,
                        error: `Retry attempt ${retryCount + 1}/${MAX_RETRIES}: ${error.message || 'Unknown error'}`,
                        result: {
                            success: 0,
                            failed: 0,
                            failedTokens: [{
                                token: 'unknown',
                                error: error.message || 'Unknown error'
                            }]
                        }
                    } 
                    : s
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
            console.log(`Retrying overlay ${schedule.id} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        } else {
            // Update status to failed after max retries
            const updatedSchedules = schedules.map(s => 
                s.id === schedule.id 
                    ? { 
                        ...s, 
                        status: 'failed',
                        completedAt: new Date().toISOString(),
                        error: `Failed after ${MAX_RETRIES} attempts: ${error.message || 'Unknown error occurred'}`,
                        result: {
                            success: 0,
                            failed: 0,
                            failedTokens: [{
                                token: 'unknown',
                                error: error.message || 'Unknown error occurred'
                            }]
                        }
                    } 
                    : s
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));

            // Clean up CSV data after max retries
            await deleteCSVFromIndexedDB(schedule.id);
        }
    }
};

const startScheduler = () => {
    if (schedulerInterval) return;

    // Process any pending overlays immediately
    const schedules = getScheduledOverlays();
    const now = new Date();
    schedules.forEach(schedule => {
        if (schedule.status === 'pending' && new Date(schedule.scheduledTime) <= now) {
            processScheduledOverlay(schedule);
        }
    });

    // Set up interval for future checks
    schedulerInterval = setInterval(() => {
        const schedules = getScheduledOverlays();
        const now = new Date();
        
        schedules.forEach(schedule => {
            if (schedule.status === 'pending' && new Date(schedule.scheduledTime) <= now) {
                // Update status to processing
                const updatedSchedules = schedules.map(s => 
                    s.id === schedule.id ? { ...s, status: 'processing' } : s
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));

                // Process the overlay
                processScheduledOverlay(schedule);
            }
        });
    }, SCHEDULER_INTERVAL);
};

// Initialize IndexedDB and start scheduler
initDB().then(() => {
    startScheduler();
}).catch(console.error);

export const stopScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
};

export const scheduleOverlay = async (
    overlayConfig: OverlayConfig,
    csvFile: File,
    fcmToken: string,
    scheduledTime: string
): Promise<ScheduledOverlay> => {
    try {
        // Validate inputs
        if (!csvFile || !fcmToken || !scheduledTime) {
            throw new Error('Missing required parameters');
        }

        // Validate scheduled time is in the future
        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate <= new Date()) {
            throw new Error('Scheduled time must be in the future');
        }

        // Read CSV file content
        const csvContent = await csvFile.text();
        if (!csvContent.trim()) {
            throw new Error('CSV file is empty');
        }

        const id = new Date().toISOString();
        const scheduledOverlay: ScheduledOverlay = {
            id,
            overlayConfig,
            fcmToken,
            scheduledTime,
            status: 'pending',
            createdAt: new Date().toISOString(),
            retryCount: 0
        };

        // Store CSV content in IndexedDB
        await saveCSVToIndexedDB(id, csvContent);

        // Save overlay data
        const storedSchedules = localStorage.getItem(STORAGE_KEY);
        const schedules = storedSchedules ? JSON.parse(storedSchedules) : [];
        schedules.push(scheduledOverlay);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));

        // Clean up old data if necessary
        cleanupOldData();

        // Start the scheduler if not already running
        startScheduler();

        return scheduledOverlay;
    } catch (error: any) {
        console.error('Error scheduling overlay:', error);
        throw error;
    }
};

export const getScheduledOverlays = (): ScheduledOverlay[] => {
    try {
        const storedSchedules = localStorage.getItem(STORAGE_KEY);
        return storedSchedules ? JSON.parse(storedSchedules) : [];
    } catch (error) {
        console.error('Error getting scheduled overlays:', error);
        return [];
    }
};

export const cancelScheduledOverlay = async (id: string): Promise<void> => {
    try {
        const schedules = getScheduledOverlays();
        const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));

        // Remove CSV data from IndexedDB
        await deleteCSVFromIndexedDB(id);
    } catch (error) {
        console.error('Error canceling scheduled overlay:', error);
        throw error;
    }
}; 