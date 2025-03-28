import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Divider,
    Snackbar,
    Alert,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContext';

interface Translation {
    language: string;
    title: string;
    shortDescription: string;
    description: string;
}

interface AlertMessage {
    title: string;
    shortDescription: string;
    description: string;
    mediaUrl: string;
    mediaType: 'ImageLink' | 'VideoLink' | '';
    mediaFileId?: string;
    translations: Translation[];
    messageId?: string;
}

const languages = [
    'Hindi',
    'Malayalam',
    'Telugu',
    'Tamil',
    'Odia',
    'Kannada'
];

const AlertCentre: React.FC = () => {
    const { token, selectedMerchant, selectedCity } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [alertMessage, setAlertMessage] = useState<AlertMessage>({
        title: '',
        shortDescription: '',
        description: '',
        mediaUrl: '',
        mediaType: '',
        mediaFileId: '',
        translations: []
    });

    const [showMediaFields, setShowMediaFields] = useState(false);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [showRowCountDialog, setShowRowCountDialog] = useState(false);
    const [rowCount, setRowCount] = useState<number>(0);

    const [showCSVPreview, setShowCSVPreview] = useState(false);

    const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[], rows: string[][] }>({
        headers: [],
        rows: []
    });

    const handleInputChange = (field: keyof AlertMessage) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAlertMessage(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleMediaTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setAlertMessage(prev => ({
            ...prev,
            mediaType: event.target.value as 'ImageLink' | 'VideoLink',
            mediaUrl: '' // Reset URL when type changes
        }));
    };

    const validateMediaUrl = (url: string, type: string): boolean => {
        if (!url) return false;
        
        if (type === 'VideoLink') {
            return url.toLowerCase().includes('youtube');
        }
        
        return true; // For images, accept any URL for now
    };

    const handleMediaUpload = async () => {
        if (!token) {
            setSnackbar({
                open: true,
                message: 'Please login to upload media',
                severity: 'error'
            });
            return false;
        }

        if (!selectedMerchant || !selectedCity) {
            setSnackbar({
                open: true,
                message: 'Please select a merchant and city first',
                severity: 'error'
            });
            return false;
        }

        if (!alertMessage.mediaUrl || !alertMessage.mediaType) {
            setSnackbar({
                open: true,
                message: 'Please provide both media URL and type',
                severity: 'error'
            });
            return false;
        }

        if (!validateMediaUrl(alertMessage.mediaUrl, alertMessage.mediaType)) {
            setSnackbar({
                open: true,
                message: alertMessage.mediaType === 'VideoLink' 
                    ? 'Only YouTube links are supported currently'
                    : 'Please provide a valid URL',
                severity: 'error'
            });
            return false;
        }

        setIsUploading(true);
        try {
            const response = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/addLink`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Accept': 'application/json;charset=utf-8',
                    'token': token || ''
                },
                body: JSON.stringify({
                    url: alertMessage.mediaUrl,
                    fileType: alertMessage.mediaType
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to upload media: ${response.status}`);
            }

            const data = await response.json();
            console.log('Media upload response:', data);
            
            if (data && typeof data === 'object' && 'fileId' in data) {
                console.log('Setting media file ID:', data.fileId);
                setAlertMessage(prev => {
                    const updated = {
                        ...prev,
                        mediaFileId: data.fileId
                    };
                    console.log('Updated alert message:', updated);
                    return updated;
                });

                setSnackbar({
                    open: true,
                    message: 'Media uploaded successfully',
                    severity: 'success'
                });
                return true;
            } else {
                console.error('Invalid response structure:', data);
                throw new Error('No media ID received in response');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            setSnackbar({
                open: true,
                message: 'Failed to upload media: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateMessage = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!token) {
            setSnackbar({
                open: true,
                message: 'Please login to create message',
                severity: 'error'
            });
            return;
        }

        if (!selectedMerchant || !selectedCity) {
            setSnackbar({
                open: true,
                message: 'Please select a merchant and city first',
                severity: 'error'
            });
            return;
        }

        if (!alertMessage.title || !alertMessage.description || !alertMessage.shortDescription) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields (title, description, and Push Notification description)',
                severity: 'error'
            });
            return;
        }

        // If media URL is provided but not uploaded yet, upload it first
        if (alertMessage.mediaUrl && !alertMessage.mediaFileId) {
            const uploadSuccess = await handleMediaUpload();
            if (!uploadSuccess) {
                return; // Stop if media upload failed
            }
        }

        try {
            console.log('Creating message with payload:', {
                title: alertMessage.title,
                description: alertMessage.description,
                shortDescription: alertMessage.shortDescription,
                translations: alertMessage.translations,
                mediaFiles: alertMessage.mediaFileId ? [alertMessage.mediaFileId] : []
            });

            const payload = {
                _type: {
                    tag: "Read",
                    contents: ""
                },
                title: alertMessage.title,
                description: alertMessage.description,
                shortDescription: alertMessage.shortDescription,
                translations: alertMessage.translations.map(trans => ({
                    language: trans.language.toUpperCase(),
                    title: trans.title,
                    description: trans.description,
                    shortDescription: trans.shortDescription
                })),
                mediaFiles: alertMessage.mediaFileId ? [alertMessage.mediaFileId] : []
            };

            const response = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Accept': 'application/json;charset=utf-8',
                    'token': token || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to create message: ${response.status}`);
            }

            const data = await response.json();
            console.log('Create message response:', data);

            if (data && data.messageId) {
                // First set the message ID
                setAlertMessage(prev => ({
                    ...prev,
                    messageId: data.messageId
                }));

                // Then show success message
                setSnackbar({
                    open: true,
                    message: 'Message created successfully',
                    severity: 'success'
                });
            } else {
                throw new Error('No message ID received in response');
            }

        } catch (error) {
            console.error('Error creating message:', error);
            setSnackbar({
                open: true,
                message: 'Failed to create message: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        }
    };

    const handleAddTranslation = () => {
        setAlertMessage(prev => ({
            ...prev,
            translations: [
                ...prev.translations,
                {
                    language: '',
                    title: '',
                    shortDescription: '',
                    description: ''
                }
            ]
        }));
    };

    const handleTranslationChange = (index: number, field: keyof Translation) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        setAlertMessage(prev => ({
            ...prev,
            translations: prev.translations.map((translation, i) => 
                i === index 
                    ? { ...translation, [field]: event.target.value }
                    : translation
            )
        }));
    };

    const handleRemoveTranslation = (index: number) => {
        setAlertMessage(prev => ({
            ...prev,
            translations: prev.translations.filter((_, i) => i !== index)
        }));
    };

    const getYoutubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
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
        fileInputRef.current.value = ""; // Reset value to trigger `onChange`
        fileInputRef.current.click();
        }
    };

    const handleSendMessage = async () => {
        if (!alertMessage.messageId || !selectedFile) {
            setSnackbar({
                open: true,
                message: 'Please create a message and upload CSV file first',
                severity: 'error'
            });
            return;
        }

        if (!token) {
            setSnackbar({
                open: true,
                message: 'Please login to send message',
                severity: 'error'
            });
            return;
        }

        if (!selectedMerchant || !selectedCity) {
            setSnackbar({
                open: true,
                message: 'Please select a merchant and city first',
                severity: 'error'
            });
            return;
        }

        setIsSending(true);
        try {
            // Create a new FormData instance
            const formData = new FormData();
            
            // Match exactly with the curl command structure
            formData.append('type', 'Include');
            formData.append('csvFile', selectedFile);
            formData.append('messageId', alertMessage.messageId);

            // Log request details
            console.log('=== Request Details ===');
            console.log('Endpoint:', `https://dashboard.moving.tech/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/send`);
            console.log('Headers:', {
                'Accept': 'application/json;charset=utf-8',
                'token': token ? '***' : 'missing'
            });
            
            // Log FormData contents
            console.log('=== FormData Contents ===');
            for (const pair of formData.entries()) {
                if (pair[0] === 'csvFile') {
                    const file = pair[1] as File;
                    console.log('csvFile:', {
                        name: file.name,
                        type: file.type,
                        size: file.size
                    });
                } else {
                    console.log(pair[0] + ':', pair[1]);
                }
            }

            console.log('=== Sending Request ===');
            const response = await fetch(`https://dashboard.moving.tech/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/send`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token,
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

            console.log('=== Response Details ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Response Data:', responseData);

            setSnackbar({
                open: true,
                message: 'Message sent successfully',
                severity: 'success'
            });

            // Reset the form
            setAlertMessage({
                title: '',
                shortDescription: '',
                description: '',
                mediaUrl: '',
                mediaType: '',
                mediaFileId: '',
                messageId: '',
                translations: []
            });
            setSelectedFile(null);
            setShowMediaFields(false);
            setRowCount(0);

        } catch (error) {
            console.error('=== Error Details ===');
            console.error('Error:', error);
            
            let errorMessage = 'Failed to send message: ';
            if (error instanceof Error) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Unknown error';
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Box sx={{ 
            p: 3,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <Box 
                component="form" 
                onSubmit={(e) => handleCreateMessage(e)}
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                    <Grid container spacing={3}>
                        {/* Left side - Form */}
                        <Grid item xs={12} md={7}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Main Content
                                    </Typography>
                                    
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Title"
                                                value={alertMessage.title}
                                                onChange={handleInputChange('title')}
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Push Notification description"
                                                value={alertMessage.shortDescription}
                                                onChange={handleInputChange('shortDescription')}
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                label="Description"
                                                value={alertMessage.description}
                                                onChange={handleInputChange('description')}
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                            {!showMediaFields ? (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => setShowMediaFields(true)}
                                                >
                                                    Add Media
                                                </Button>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Media Type</InputLabel>
                                                        <Select
                                                            value={alertMessage.mediaType}
                                                            label="Media Type"
                                                            onChange={(e: any) => handleMediaTypeChange(e)}
                                                        >
                                                            <MenuItem value="ImageLink">Image</MenuItem>
                                                            <MenuItem value="VideoLink">Video (YouTube)</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <TextField
                                                            fullWidth
                                                            label={alertMessage.mediaType === 'VideoLink' ? 'YouTube URL' : 'Image URL'}
                                                            value={alertMessage.mediaUrl}
                                                            onChange={handleInputChange('mediaUrl')}
                                                            placeholder={alertMessage.mediaType === 'VideoLink' ? 'Enter YouTube URL' : 'Enter image URL'}
                                                            error={alertMessage.mediaType === 'VideoLink' && alertMessage.mediaUrl !== '' && !validateMediaUrl(alertMessage.mediaUrl, 'VideoLink')}
                                                            helperText={alertMessage.mediaType === 'VideoLink' && alertMessage.mediaUrl !== '' && !validateMediaUrl(alertMessage.mediaUrl, 'VideoLink') ? 'Only YouTube links are supported' : ''}
                                                        />
                                                        <Button
                                                            variant="contained"
                                                            startIcon={isUploading ? null : <CloudUploadIcon />}
                                                            onClick={handleMediaUpload}
                                                            disabled={isUploading}
                                                            sx={{ minWidth: '150px' }}
                                                        >
                                                            {isUploading ? 'Uploading...' : 'Upload Media'}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6">
                                            Translations
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddTranslation}
                                        >
                                            Add Translation
                                        </Button>
                                    </Box>

                                    {alertMessage.translations.map((translation, index) => (
                                        <Box key={index} sx={{ mb: 3 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                mb: 2 
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        Translation {index + 1}
                                                    </Typography>
                                                    <FormControl sx={{ minWidth: 200 }}>
                                                        <Select
                                                            size="small"
                                                            value={translation.language}
                                                            onChange={(e: any) => handleTranslationChange(index, 'language')(e)}
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="">Select Language</MenuItem>
                                                            {languages.map((lang) => (
                                                                <MenuItem key={lang} value={lang}>
                                                                    {lang}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                <IconButton 
                                                    color="error" 
                                                    onClick={() => handleRemoveTranslation(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        label="Title"
                                                        value={translation.title}
                                                        onChange={(e) => handleTranslationChange(index, 'title')(e)}
                                                    />
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        label="Push Notification description"
                                                        value={translation.shortDescription}
                                                        onChange={(e) => handleTranslationChange(index, 'shortDescription')(e)}
                                                    />
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={4}
                                                        label="Description"
                                                        value={translation.description}
                                                        onChange={(e) => handleTranslationChange(index, 'description')(e)}
                                                    />
                                                </Grid>
                                            </Grid>
                                            {index < alertMessage.translations.length - 1 && <Divider sx={{ my: 2 }} />}
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Message Actions - Moved up */}
                            <Card sx={{ mt: 2 }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom>
                                                Message Actions
                                            </Typography>
                                        </Grid>
                                        <Grid container item xs={12} spacing={2}>
                                            <Grid item xs={4}>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    type="submit"
                                                    disabled={isSending}
                                                >
                                                    Create Message
                                                </Button>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <input
                                                    ref={fileInputRef}
                                                    accept=".csv"
                                                    id="csv-file"
                                                    type="file"
                                                    style={{ display: "none" }}
                                                    onChange={handleFileSelect}
                                                    disabled={!alertMessage?.messageId}
                                                />
                                                <Button
                                                    variant="contained"
                                                    component="span"
                                                    disabled={!alertMessage?.messageId}
                                                    startIcon={selectedFile ? null : <CloudUploadIcon />}
                                                    color={selectedFile ? "success" : "primary"}
                                                    fullWidth
                                                    onClick={handleButtonClick}
                                                >
                                                    {selectedFile ? `Upload "${selectedFile.name}"` : "Upload CSV"}
                                                </Button>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    disabled={!alertMessage.messageId || !selectedFile || isSending}
                                                    onClick={handleSendMessage}
                                                    startIcon={isSending ? null : <SendIcon />}
                                                >
                                                    {isSending ? 'Sending...' : 'Send Message'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right side - Preview */}
                        <Grid item xs={12} md={5}>
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 2,
                                    bgcolor: '#f5f5f5',
                                    height: '100%',
                                    overflow: 'auto'
                                }}
                            >
                                {alertMessage.mediaUrl && (
                                    <>
                                        {alertMessage.mediaType === 'ImageLink' ? (
                                            <Box 
                                                component="img"
                                                src={alertMessage.mediaUrl}
                                                alt="Preview"
                                                sx={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: 1,
                                                    mb: 2
                                                }}
                                                onError={(e: any) => {
                                                    e.target.style.display = 'none';
                                                    setSnackbar({
                                                        open: true,
                                                        message: 'Failed to load image preview',
                                                        severity: 'error'
                                                    });
                                                }}
                                            />
                                        ) : alertMessage.mediaType === 'VideoLink' && getYoutubeVideoId(alertMessage.mediaUrl) ? (
                                            <Box
                                                component="iframe"
                                                src={`https://www.youtube.com/embed/${getYoutubeVideoId(alertMessage.mediaUrl)}`}
                                                sx={{
                                                    width: '100%',
                                                    height: '250px',
                                                    border: 'none',
                                                    borderRadius: 1,
                                                    mb: 2
                                                }}
                                                allowFullScreen
                                            />
                                        ) : null}
                                    </>
                                )}
                                
                                <Typography 
                                    variant="h5" 
                                    gutterBottom 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {alertMessage.title || 'Title'}
                                </Typography>
                                
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        mb: 2,
                                        color: 'text.secondary',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {alertMessage.shortDescription || 'Push Notification description'}
                                </Typography>
                                
                                <Typography 
                                    variant="body1"
                                    sx={{ 
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {alertMessage.description || 'Description'}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

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
                open={showRowCountDialog}
                onClose={() => setShowRowCountDialog(false)}
            >
                <DialogTitle>CSV File Details</DialogTitle>
                <DialogContent>
                    <Typography>
                        Found {rowCount} recipient{rowCount !== 1 ? 's' : ''} in the CSV file.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRowCountDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

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

export default AlertCentre; 