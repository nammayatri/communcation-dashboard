import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface MessageSenderProps {
    messageId: string;
}

const MessageSender: React.FC<MessageSenderProps> = ({ messageId }) => {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv') {
                setSnackbar({
                    open: true,
                    message: 'Please upload a CSV file',
                    severity: 'error'
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSendMessage = async () => {
        if (!token) {
            setSnackbar({
                open: true,
                message: 'Please login to send message',
                severity: 'error'
            });
            return;
        }

        if (!selectedFile) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file first',
                severity: 'error'
            });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('type', 'Include');
            formData.append('csvFile', selectedFile);
            formData.append('messageId', messageId);

            await axios.post('/api/bpp/driver-offer/NAMMA_YATRI_PARTNER/message/send',
                formData,
                {
                    headers: {
                        'Accept': 'application/json;charset=utf-8',
                        'token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setSnackbar({
                open: true,
                message: 'Message sent successfully',
                severity: 'success'
            });

            // Reset file selection
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Send Message
            </Typography>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Whom to Send
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box 
                                sx={{ 
                                    border: '2px dashed #ccc',
                                    borderRadius: 2,
                                    p: 3,
                                    textAlign: 'center',
                                    bgcolor: '#fafafa',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: '#f0f0f0'
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                />
                                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Upload CSV File
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedFile ? selectedFile.name : 'Click or drag and drop CSV file here'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                onClick={handleSendMessage}
                                disabled={!selectedFile || loading}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MessageSender; 