// Types for message creation and management based on the provided AddMessageRequest

/**
 * Message translation - provides localized versions of the message content.
 */
export interface MessageTranslation {
  language: string;
  title: string;
  description: string;
  shortDescription: string;
}

/**
 * Represents a media file attached to a message
 */
export interface MediaFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

/**
 * Message type - either Action (with a required action label) or Read (informational)
 */
export type MessageType = 'Action' | 'Read';

/**
 * Message request payload based on the provided AddMessageRequest
 */
export interface MessageRequest {
  _type: MessageType;
  actionLabel?: string;  // Required for Action type
  title: string;
  description: string;
  shortDescription: string;
  label?: string;
  alwaysTriggerOnOnboarding?: boolean;
  translations: MessageTranslation[];
  mediaFiles: string[];  // Array of media file IDs
}

/**
 * Message payload for sending
 */
export interface MessagePayload {
  _type: MessageType;
  actionLabel?: string;
  title: string;
  description: string;
  shortDescription: string;
  label?: string;
  alwaysTriggerOnOnboarding?: boolean;
  translations: MessageTranslation[];
  mediaFiles: MediaFile[];
}

/**
 * Message object for internal use in the application
 */
export interface Message {
  id: string;
  _type: MessageType;
  actionLabel?: string;
  title: string;
  description: string;
  shortDescription: string;
  label?: string;
  alwaysTriggerOnOnboarding: boolean;
  translations: MessageTranslation[];
  mediaFiles: MediaFile[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Recipient for a message
 */
export interface MessageRecipient {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  failureReason?: string;
}

/**
 * Message sending job status
 */
export interface MessageSendingJob {
  id: string;
  messageId: string;
  totalRecipients: number;
  processedRecipients: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  progress: number;
}

/**
 * Progress update for message sending
 */
export interface MessageSendProgressUpdate {
  total: number;
  processed: number;
  success: number;
  failed: number;
}

/**
 * Result of sending messages
 */
export interface MessageSendResult {
  success: number;
  failed: number;
  failedRecipients: { recipient: string; error: string }[];
} 