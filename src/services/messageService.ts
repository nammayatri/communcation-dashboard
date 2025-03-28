import Papa from 'papaparse';

// Define Message types
export interface MessageTranslation {
  language: string;
  title: string;
  description: string;
  shortDescription: string;
}

export interface MediaFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export type MessageType = 'Action' | 'Read';

export interface MessagePayload {
  _type: MessageType;
  actionLabel?: string; // Required for Action type
  title: string;
  description: string;
  shortDescription: string;
  label?: string;
  alwaysTriggerOnOnboarding?: boolean;
  translations: MessageTranslation[];
  mediaFiles: MediaFile[];
}

interface ProgressUpdate {
  total: number;
  processed: number;
  success: number;
  failed: number;
}

interface SendResult {
  success: number;
  failed: number;
  failedRecipients: { email: string; error: string }[];
}

/**
 * Upload image files and return their IDs
 * 
 * In a real implementation, this would send the files to a server
 * and return the IDs/URLs of the uploaded files
 */
export const uploadImages = async (files: File[]): Promise<MediaFile[]> => {
  // This is a mock implementation 
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const uploadedFiles = files.map(file => ({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file) // In a real app, this would be a remote URL
      }));
      
      resolve(uploadedFiles);
    }, 1500);
  });
};

/**
 * Create a message with the given payload
 */
export const createMessage = async (_payload: MessagePayload): Promise<{ id: string }> => {
  // This is a mock implementation
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve({
        id: Math.random().toString(36).substring(2, 15)
      });
    }, 1000);
  });
};

/**
 * Process CSV file and send messages to the recipients
 */
export const processCSVAndSendMessages = async (
  file: File,
  _messagePayload: MessagePayload,
  onProgress?: (update: ProgressUpdate) => void
): Promise<SendResult> => {
  return new Promise((resolve, reject) => {
    const results: SendResult = {
      success: 0,
      failed: 0,
      failedRecipients: [],
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        try {
          const recipients = parseResults.data;

          if (recipients.length === 0) {
            throw new Error('No valid recipients found in CSV file');
          }

          // Initialize progress
          const totalRecipients = recipients.length;
          let processedCount = 0;
          
          if (onProgress) {
            onProgress({
              total: totalRecipients,
              processed: 0,
              success: 0,
              failed: 0
            });
          }

          // First, create the message (in a real app)
          // const messageResponse = await createMessage(messagePayload);
          
          // Mock sending message to each recipient
          const sendToRecipient = async (recipient: any) => {
            try {
              // Simulate random success/failure
              if (Math.random() > 0.9) {
                throw new Error('Failed to deliver message');
              }
              
              // In a real implementation, this would call an API to send the message to the recipient
              // await axios.post(`${MESSAGE_SEND_ENDPOINT}/${messageResponse.id}`, {
              //   recipientId: recipient.id || recipient.email
              // });
              
              results.success++;
            } catch (error: any) {
              results.failed++;
              results.failedRecipients.push({
                email: recipient.email || recipient.Email || recipient.id || 'unknown',
                error: error.message || 'Unknown error',
              });
            }
            
            // Update processed count and report progress
            processedCount++;
            if (onProgress) {
              onProgress({
                total: totalRecipients,
                processed: processedCount,
                success: results.success,
                failed: results.failed
              });
            }
          };

          // Process recipients in batches
          const batchSize = 20;
          for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            await Promise.all(batch.map(sendToRecipient));
            
            // Log progress
            console.log(`Processed ${Math.min(i + batchSize, recipients.length)} of ${recipients.length} recipients`);
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

/**
 * Validate a message payload before sending
 */
export const validateMessagePayload = (payload: MessagePayload): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!payload.title.trim()) {
    errors.push('Title is required');
  }
  
  if (!payload.description.trim()) {
    errors.push('Description is required');
  }
  
  if (!payload.shortDescription.trim()) {
    errors.push('Push Notification description is required');
  }
  
  if (payload._type === 'Action' && !payload.actionLabel?.trim()) {
    errors.push('Action label is required for Action message type');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}; 