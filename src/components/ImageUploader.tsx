import React, { useEffect } from 'react';
import { Box } from '@mui/material';

export const ImageUploader: React.FC = () => {
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data); // Debug log
      
      // Only accept messages from our CDN URL
      if (event.origin !== 'https://github-cdn-five.vercel.app') {
        console.log('Origin mismatch:', event.origin); // Debug log
        return;
      }

      // Handle copy request
      if (event.data?.type === 'COPY_URL' && event.data?.url) {
        console.log('Attempting to copy URL:', event.data.url); // Debug log
        navigator.clipboard.writeText(event.data.url)
          .then(() => {
            console.log('Copy successful'); // Debug log
            // Send success message back to iframe
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({ type: 'COPY_SUCCESS' }, 'https://github-cdn-five.vercel.app');
          })
          .catch((error) => {
            console.error('Failed to copy:', error);
            // Send error message back to iframe
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({ type: 'COPY_ERROR' }, 'https://github-cdn-five.vercel.app');
          });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box 
        component="iframe"
        src="https://github-cdn-five.vercel.app/"
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
          bgcolor: 'background.paper',
          flexGrow: 1,
          borderRadius: 1,
          boxShadow: 1
        }}
        title="GitHub CDN Uploader"
      />
    </Box>
  );
}; 