import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MessageInfo {
    title: string;
    description: string;
    shortDescription: string;
    translations: Array<{
        language: string;
        title: string;
        description: string;
        shortDescription: string;
    }>;
    mediaFiles: Array<{
        _type: string;
        link: string;
    }>;
    messageId: string;
    shareable: boolean;
}

interface DeliveryInfo {
    success: number;
    queued: number;
    seen: number;
    liked: number;
    messageId: string;
}

const MessageDetails: React.FC = () => {
    const { messageId } = useParams<{ messageId: string }>();
    const location = useLocation();
    const { token: contextToken, selectedMerchant: contextMerchant, selectedCity: contextCity } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use token from navigation state or fallback to context
    const token = location.state?.token || contextToken;
    const selectedMerchant = location.state?.selectedMerchant || contextMerchant;
    const selectedCity = location.state?.selectedCity || contextCity;

    const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);
    const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [showCSVPreview, setShowCSVPreview] = useState(false);
    const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[], rows: string[][] }>({
        headers: [],
        rows: []
    });

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        console.log('MessageDetails mounted/updated with:', {
            messageId,
            token: token ? 'present' : 'missing',
            selectedMerchant: selectedMerchant ? 'present' : 'missing',
            selectedCity: selectedCity ? 'present' : 'missing'
        });
        
        if (!messageId || !token || !selectedMerchant) {
            console.error('Missing required data:', {
                messageId: !!messageId,
                token: !!token,
                selectedMerchant: !!selectedMerchant
            });
            setSnackbar({
                open: true,
                message: 'Missing required information for fetching message details',
                severity: 'error'
            });
            setLoading(false);
            return;
        }

        fetchMessageDetails();
    }, [messageId, token, selectedMerchant]);

    const fetchMessageDetails = async () => {
        if (!token || !messageId || !selectedMerchant) {
            console.error('Cannot fetch message details - missing required data');
            return;
        }

        setLoading(true);
        try {
            console.log('Fetching message info for:', { messageId, selectedMerchant });
            
            // Fetch message info
            const infoResponse = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/${messageId}/info`, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token
                }
            });

            console.log('Message info response status:', infoResponse.status);
            if (!infoResponse.ok) {
                const errorText = await infoResponse.text();
                throw new Error(`Failed to fetch message info: ${infoResponse.status} - ${errorText}`);
            }

            const messageInfoData = await infoResponse.json();
            console.log('Message info data:', messageInfoData);
            
            if (!messageInfoData) {
                throw new Error('No message info data received');
            }
            
            setMessageInfo(messageInfoData);

            // Fetch delivery info
            console.log('Fetching delivery info');
            const deliveryResponse = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/${messageId}/deliveryInfo`, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token
                }
            });

            console.log('Delivery info response status:', deliveryResponse.status);
            if (!deliveryResponse.ok) {
                const errorText = await deliveryResponse.text();
                throw new Error(`Failed to fetch delivery info: ${deliveryResponse.status} - ${errorText}`);
            }

            const deliveryInfoData = await deliveryResponse.json();
            console.log('Delivery info data:', deliveryInfoData);
            
            if (!deliveryInfoData) {
                throw new Error('No delivery info data received');
            }
            
            setDeliveryInfo(deliveryInfoData);

        } catch (error) {
            console.error('Error fetching message details:', error);
            setSnackbar({
                open: true,
                message: 'Failed to fetch message details: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
            // Reset state on error
            setMessageInfo(null);
            setDeliveryInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);

            // Read the CSV file
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1, 4).map(line => 
                        line.split(',').map(cell => cell.trim())
                    );
                    
                    setCsvPreviewData({
                        headers,
                        rows
                    });
                    setShowCSVPreview(true);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset value to trigger onChange
            fileInputRef.current.click();
        }
    };

    const handleSendAgain = async () => {
        if (!selectedFile || !messageInfo) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file first',
                severity: 'error'
            });
            return;
        }

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('type', 'Include');
            formData.append('csvFile', selectedFile);
            formData.append('messageId', messageInfo.messageId);

            const response = await fetch(`https://dashboard.moving.tech/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/send`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token || '',
                    'Referer': 'https://dashboard.moving.tech',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
                },
                mode: 'cors',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            setSnackbar({
                open: true,
                message: 'Message sent successfully',
                severity: 'success'
            });

            setSelectedFile(null);
            await fetchMessageDetails(); // Refresh delivery info

        } catch (error) {
            console.error('Error sending message:', error);
            setSnackbar({
                open: true,
                message: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 'calc(100vh - 64px)', // Account for the header height
                width: '100%',
                bgcolor: 'background.default'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!messageInfo || !deliveryInfo) {
        return (
            <Box sx={{ 
                p: 3,
                minHeight: 'calc(100vh - 64px)', // Account for the header height
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Error Loading Message Details
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={() => fetchMessageDetails()}
                    sx={{ mt: 2 }}
                >
                    Retry Loading
                </Button>
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
    }

    return (
        <Box sx={{ 
            p: 3,
            minHeight: 'calc(100vh - 64px)', // Account for the header height
            bgcolor: 'background.default',
            overflow: 'auto'
        }}>
            {/* Delivery Info Section - Now at the top */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Delivery Information</Typography>
                    {deliveryInfo && (
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                    <Typography variant="h6">{deliveryInfo.success || 0}</Typography>
                                    <Typography color="textSecondary">Success</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                                    <Typography variant="h6">{deliveryInfo.queued || 0}</Typography>
                                    <Typography color="textSecondary">Queued</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                                    <Typography variant="h6">{deliveryInfo.seen || 0}</Typography>
                                    <Typography color="textSecondary">Seen</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                                    <Typography variant="h6">{deliveryInfo.liked || 0}</Typography>
                                    <Typography color="textSecondary">Liked</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>

            {/* Send Again Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                            <input
                                ref={fileInputRef}
                                accept=".csv"
                                id="csv-file"
                                type="file"
                                style={{ display: "none" }}
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={selectedFile ? null : <CloudUploadIcon />}
                                color={selectedFile ? "success" : "primary"}
                                onClick={handleButtonClick}
                                fullWidth
                            >
                                {selectedFile ? `Selected: ${selectedFile.name}` : "Upload CSV to Send Again"}
                            </Button>
                        </Grid>
                        <Grid item xs={4}>
                            <Button
                                variant="contained"
                                fullWidth
                                disabled={!selectedFile || isSending}
                                onClick={handleSendAgain}
                                startIcon={isSending ? null : <SendIcon />}
                            >
                                {isSending ? 'Sending...' : 'Send Again'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Two-column layout for Message Info and Media Preview */}
            <Grid container spacing={3}>
                {/* Left column - Message Details */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', overflow: 'auto' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Message Information</Typography>
                            {messageInfo && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" color="primary">Title</Typography>
                                        <Typography paragraph>{messageInfo.title || 'No title'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" color="primary">Push Notification description</Typography>
                                        <Typography paragraph>{messageInfo.shortDescription || 'No Push Notification description'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" color="primary">Description</Typography>
                                        <Typography paragraph>{messageInfo.description || 'No description'}</Typography>
                                    </Grid>
                                    {messageInfo.translations && messageInfo.translations.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle1" color="primary" gutterBottom>Translations</Typography>
                                            {messageInfo.translations.map((translation, index) => (
                                                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                    <Typography variant="subtitle2" color="primary">{translation.language || 'Unknown Language'}</Typography>
                                                    <Typography variant="body2" gutterBottom>Title: {translation.title || 'No title'}</Typography>
                                                    <Typography variant="body2" gutterBottom>Push Notification description: {translation.shortDescription || 'No Push Notification description'}</Typography>
                                                    <Typography variant="body2">Description: {translation.description || 'No description'}</Typography>
                                                </Paper>
                                            ))}
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right column - Media Preview */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', overflow: 'auto' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Media Preview</Typography>
                            {messageInfo?.mediaFiles && messageInfo.mediaFiles.length > 0 ? (
                                messageInfo.mediaFiles.map((media, index) => {
                                    if (media._type === 'VideoLink') {
                                        // Extract video ID from YouTube URL
                                        const videoId = media.link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                                        return (
                                            <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                                    <iframe
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%'
                                                        }}
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </Box>
                                            </Paper>
                                        );
                                    } else if (media._type === 'ImageLink') {
                                        return (
                                            <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                <img 
                                                    src={media.link} 
                                                    alt="Message media" 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: 'auto',
                                                        borderRadius: '4px',
                                                        maxHeight: '400px',
                                                        objectFit: 'contain'
                                                    }} 
                                                />
                                            </Paper>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <Typography color="textSecondary">No media content available</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Snackbar and Dialog remain unchanged */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={showCSVPreview}
                onClose={() => setShowCSVPreview(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>CSV Data Preview</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {csvPreviewData.headers.map((header, index) => (
                                        <th key={index} style={{ 
                                            padding: '8px', 
                                            textAlign: 'left', 
                                            borderBottom: '1px solid #ddd',
                                            backgroundColor: '#f5f5f5'
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreviewData.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} style={{ 
                                                padding: '8px', 
                                                borderBottom: '1px solid #ddd'
                                            }}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {csvPreviewData.rows.length === 3 && (
                            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                Showing first 3 rows of the CSV file
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCSVPreview(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageDetails; 