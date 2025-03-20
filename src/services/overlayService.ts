import Papa from 'papaparse';
import axios from 'axios';
import { OverlayConfig, FCMPayload } from '../types/overlay';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/namma-yatri/messages:send';

interface NotificationResult {
    success: number;
    failed: number;
    failedTokens: { token: string; error: string }[];
}

export const processCSVAndSendNotifications = async (
    file: File,
    config: OverlayConfig,
    fcmAuthToken: string
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

                    const sendNotification = async (token: string) => {
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
                                    Authorization: `Bearer ${fcmAuthToken}`,
                                },
                            });
                            results.success++;
                        } catch (error: any) {
                            results.failed++;
                            results.failedTokens.push({
                                token,
                                error: error.response?.data?.error?.message || error.message,
                            });
                        }
                    };

                    // Process notifications in batches
                    const batchSize = 50;
                    for (let i = 0; i < tokens.length; i += batchSize) {
                        const batch = tokens.slice(i, i + batchSize);
                        await Promise.all(batch.map(sendNotification));
                        
                        // Log progress
                        console.log(`Processed ${Math.min(i + batchSize, tokens.length)} of ${tokens.length} notifications`);
                        console.log(`Success: ${results.success}, Failed: ${results.failed}`);
                    }

                    resolve(results);
                } catch (error: any) {
                    reject(error);
                }
            },
            error: (error: Error) => {
                reject(error);
            },
        });
    });
};

// Helper function to validate FCM token format
export const validateFCMToken = (token: string): boolean => {
    // FCM tokens are typically around 140-200 characters long and contain only alphanumeric characters and colons
    // const FCM_TOKEN_REGEX = /^[a-zA-Z0-9:_-]{120,200}$/;
    // return FCM_TOKEN_REGEX.test(token);
    return true;
}; 