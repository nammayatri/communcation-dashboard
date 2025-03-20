export type OverlayAction = 'OPEN_LINK' | 'OPEN_APP' | 'SET_DRIVER_ONLINE';

export interface OverlayConfig {
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