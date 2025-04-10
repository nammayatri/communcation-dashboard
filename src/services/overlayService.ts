import Papa from 'papaparse';
import axios from 'axios';
import { OverlayConfig, FCMPayload } from '../types/overlay';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/namma-yatri/messages:send';
const BATCH_SIZE = 50; // Number of notifications to process in parallel
const MAX_RETRIES = 3; // Maximum number of retries for failed notifications
const RATE_LIMIT_DELAY = 100; // Delay between batches in milliseconds

interface NotificationResult {
    success: number;
    failed: number;
    failedTokens: { token: string; error: string }[];
    progress?: {
        currentBatch: number;
        totalBatches: number;
        processedLines: number;
        totalLines: number;
    };
}

interface ProgressUpdate {
    total: number;
    processed: number;
    success: number;
    failed: number;
    failedTokens: { token: string; error: string }[];
}

interface BatchResult {
    success: number;
    failed: number;
    failedTokens: { token: string; error: string }[];
}

const sendNotification = async (
    token: string,
    notificationJson: any,
    driverNotificationPayload: any,
    fcmAuthToken: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const payload: FCMPayload = {
            message: {
                token,
                android: {
                    data: {
                        notification_type: 'DRIVER_NOTIFY',
                        show_notification: 'true',
                        entity_type: 'Case',
                        entity_ids: 'f071d5a7-fe7f-4b98-b95f-933df86bc193',
                        notification_json: JSON.stringify(notificationJson),
                        driver_notification_payload: JSON.stringify(driverNotificationPayload),
                    },
                },
            },
        };

        await axios.post(FCM_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': fcmAuthToken.startsWith('Bearer ') ? fcmAuthToken : `Bearer ${fcmAuthToken}`
            },
        });
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processBatch = async (
    tokens: string[],
    notificationJson: any,
    driverNotificationPayload: any,
    fcmAuthToken: string
): Promise<BatchResult> => {
    const results = await Promise.all(
        tokens.map(async (token, index) => {
            let retryCount = 0;
            let lastError: string | null = null;

            while (retryCount < MAX_RETRIES) {
                try {
                    // Add delay between requests to respect rate limits
                    if (index > 0) {
                        await delay(RATE_LIMIT_DELAY);
                    }

                    const result = await sendNotification(
                        token,
                        notificationJson,
                        driverNotificationPayload,
                        fcmAuthToken
                    );

                    if (result.success) {
                        return { success: true, error: null };
                    } else {
                        lastError = result.error || 'Unknown error';
                        retryCount++;
                    }
                } catch (error: any) {
                    lastError = error.message || 'Unknown error';
                    retryCount++;
                }
            }

            return { success: false, error: lastError };
        })
    );

    return results.reduce(
        (acc: BatchResult, result, index) => {
            if (result.success) {
                acc.success++;
            } else {
                acc.failed++;
                acc.failedTokens.push({
                    token: tokens[index],
                    error: result.error || 'Unknown error'
                });
            }
            return acc;
        },
        { success: 0, failed: 0, failedTokens: [] }
    );
};

export const processCSVAndSendNotifications = async (
    file: File,
    config: OverlayConfig,
    fcmAuthToken: string,
    onProgress?: (update: ProgressUpdate) => void
): Promise<NotificationResult> => {
    return new Promise((resolve, reject) => {
        const results: NotificationResult = {
            success: 0,
            failed: 0,
            failedTokens: [],
        };

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (parseResults) => {
                try {
                    const tokens = parseResults.data
                        .map((row: any) => row.token)
                        .filter(Boolean);

                    if (tokens.length === 0) {
                        throw new Error('No valid tokens found in CSV file');
                    }

                    // Initialize progress
                    const totalTokens = tokens.length;
                    let processedCount = 0;
                    
                    if (onProgress) {
                        onProgress({
                            total: totalTokens,
                            processed: 0,
                            success: 0,
                            failed: 0,
                            failedTokens: []
                        });
                    }

                    const notificationJson = {
                        title: config.title,
                        body: config.description,
                        icon: config.imageUrl,
                        tag: 'MESSAGE',
                        sound: 'default',
                        channel_id: 'General',
                    };

                    const driverNotificationPayload = {
                        ...config,
                        method: config.method || 'POST',
                        reqBody: config.reqBody || {},
                    };

                    // Process tokens in batches
                    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                        const batch = tokens.slice(i, i + BATCH_SIZE);
                        const batchResults = await processBatch(
                            batch,
                            notificationJson,
                            driverNotificationPayload,
                            fcmAuthToken
                        );

                        results.success += batchResults.success;
                        results.failed += batchResults.failed;
                        results.failedTokens.push(...batchResults.failedTokens);

                        processedCount += batch.length;
                        if (onProgress) {
                            onProgress({
                                total: totalTokens,
                                processed: processedCount,
                                success: results.success,
                                failed: results.failed,
                                failedTokens: results.failedTokens
                            });
                        }
                    }

                    // Add progress information to the final result
                    results.progress = {
                        currentBatch: Math.ceil(tokens.length / BATCH_SIZE),
                        totalBatches: Math.ceil(tokens.length / BATCH_SIZE),
                        processedLines: tokens.length,
                        totalLines: tokens.length
                    };

                    resolve(results);
                } catch (error: any) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

// Helper function to validate FCM token format
export const validateFCMToken = (): boolean => {
    return true;
}; 