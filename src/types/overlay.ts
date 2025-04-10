export type OverlayAction = 'OPEN_LINK' | 'OPEN_APP' | 'SET_DRIVER_ONLINE';

export interface OverlayTrigger {
  triggeredAt: string;
  triggeredBy: string;
  successCount: number;
  failedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

export interface OverlayConfig {
    id: string;  // Unique identifier for each overlay
    title: string;
    description: string;
    imageUrl: string;
    okButtonText: string;
    cancelButtonText: string;
    actions: OverlayAction[];
    link?: string;
    method?: 'GET' | 'POST';
    reqBody?: Record<string, unknown>;
    titleVisibility: boolean;
    descriptionVisibility: boolean;
    buttonOkVisibility: boolean;
    buttonCancelVisibility: boolean;
    buttonLayoutVisibility: boolean;
    imageVisibility: boolean;
    triggers: OverlayTrigger[];  // Array of trigger events
}

export interface FCMPayload {
    message: {
        token: string;
        android: {
            data: {
                notification_type: string;
                show_notification: string;
                entity_type: string;
                entity_ids: string;
                notification_json: string;
                driver_notification_payload: string;
            }
        }
    }
}

export interface ProgressUpdate {
    total: number;
    processed: number;
    success: number;
    failed: number;
    failedTokens: { token: string; error: string }[];
} 