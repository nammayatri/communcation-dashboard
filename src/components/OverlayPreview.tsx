import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { OverlayConfig } from '../types/overlay';

interface OverlayPreviewProps {
    config: OverlayConfig;
}

const OverlayPreview: React.FC<OverlayPreviewProps> = ({ config }) => {
    return (
        <Paper
            sx={{
                width: '100%',
                maxWidth: 320,
                mx: 'auto',
                overflow: 'hidden',
                borderRadius: 4,
                padding: 2,
                bgcolor: 'white',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Main Content */}
            <Box sx={{ p: 2, bgcolor: 'white' }}>
                {config.imageVisibility && config.imageUrl && (
                    <Box
                        component="img"
                        src={config.imageUrl}
                        alt="Overlay"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover',
                            borderRadius: 2,
                            mb: 2,
                        }}
                    />
                )}
                {config.titleVisibility && config.title && (
                    <Typography
                        variant="h6"
                        align="center"
                        sx={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#333',
                        }}
                    >
                        {config.title}
                    </Typography>
                )}
                {config.descriptionVisibility && config.description && (
                    <Typography
                        align="center"
                        sx={{
                            mt: 1,
                            color: '#666',
                            fontSize: '0.9rem',
                        }}
                    >
                        {config.description}
                    </Typography>
                )}
            </Box>

            {/* Action Buttons */}
            {(config.buttonOkVisibility || config.buttonCancelVisibility) && (
                <Box>
                    {config.buttonOkVisibility && (
                        <Button
                            fullWidth
                            sx={{
                                py: 1.5,
                                bgcolor: '#2F2F3A',
                                color: '#FFB800',
                                borderRadius: 2,
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: '#23232B',
                                },
                            }}
                        >
                            {config.okButtonText}
                        </Button>
                    )}
                    {config.buttonCancelVisibility && (
                        <Typography
                            align="center"
                            sx={{
                                py: 1,
                                color: '#999',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                '&:hover': {
                                    color: '#666',
                                },
                            }}
                        >
                            {config.cancelButtonText}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default OverlayPreview; 