"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const Add_1 = __importDefault(require("@mui/icons-material/Add"));
const Delete_1 = __importDefault(require("@mui/icons-material/Delete"));
const CloudUpload_1 = __importDefault(require("@mui/icons-material/CloudUpload"));
const Send_1 = __importDefault(require("@mui/icons-material/Send"));
const AuthContext_1 = require("../contexts/AuthContext");
const languages = [
    'Hindi',
    'Malayalam',
    'Telugu',
    'Tamil',
    'Odia',
    'Kannada'
];
const AlertCentre = () => {
    const { token, selectedMerchant, selectedCity } = (0, AuthContext_1.useAuth)();
    const fileInputRef = (0, react_1.useRef)(null);
    const [alertMessage, setAlertMessage] = (0, react_1.useState)({
        title: '',
        shortDescription: '',
        description: '',
        mediaUrl: '',
        mediaType: '',
        mediaFileId: '',
        translations: []
    });
    const [showMediaFields, setShowMediaFields] = (0, react_1.useState)(false);
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success',
    });
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [isSending, setIsSending] = (0, react_1.useState)(false);
    const [showRowCountDialog, setShowRowCountDialog] = (0, react_1.useState)(false);
    const [rowCount, setRowCount] = (0, react_1.useState)(0);
    const [showCSVPreview, setShowCSVPreview] = (0, react_1.useState)(false);
    const [csvPreviewData, setCsvPreviewData] = (0, react_1.useState)({
        headers: [],
        rows: []
    });
    const handleInputChange = (field) => (event) => {
        setAlertMessage(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };
    const handleMediaTypeChange = (event) => {
        setAlertMessage(prev => ({
            ...prev,
            mediaType: event.target.value,
            mediaUrl: '' // Reset URL when type changes
        }));
    };
    const validateMediaUrl = (url, type) => {
        if (!url)
            return false;
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
            }
            else {
                console.error('Invalid response structure:', data);
                throw new Error('No media ID received in response');
            }
        }
        catch (error) {
            console.error('Error uploading media:', error);
            setSnackbar({
                open: true,
                message: 'Failed to upload media: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
            return false;
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleCreateMessage = async (event) => {
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
            }
            else {
                throw new Error('No message ID received in response');
            }
        }
        catch (error) {
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
    const handleTranslationChange = (index, field) => (event) => {
        setAlertMessage(prev => ({
            ...prev,
            translations: prev.translations.map((translation, i) => i === index
                ? { ...translation, [field]: event.target.value }
                : translation)
        }));
    };
    const handleRemoveTranslation = (index) => {
        setAlertMessage(prev => ({
            ...prev,
            translations: prev.translations.filter((_, i) => i !== index)
        }));
    };
    const getYoutubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    const handleFileSelect = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            // Read the CSV file
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                const lines = text.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1, 4).map(line => line.split(',').map(cell => cell.trim()));
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
                    const file = pair[1];
                    console.log('csvFile:', {
                        name: file.name,
                        type: file.type,
                        size: file.size
                    });
                }
                else {
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
        }
        catch (error) {
            console.error('=== Error Details ===');
            console.error('Error:', error);
            let errorMessage = 'Failed to send message: ';
            if (error instanceof Error) {
                errorMessage += error.message;
            }
            else {
                errorMessage += 'Unknown error';
            }
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
        finally {
            setIsSending(false);
        }
    };
    return (<material_1.Box sx={{
            p: 3,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <material_1.Box component="form" onSubmit={(e) => handleCreateMessage(e)} sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
                <material_1.Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                    <material_1.Grid container spacing={3}>
                        {/* Left side - Form */}
                        <material_1.Grid item xs={12} md={7}>
                            <material_1.Card sx={{ mb: 3 }}>
                                <material_1.CardContent>
                                    <material_1.Typography variant="h6" gutterBottom>
                                        Main Content
                                    </material_1.Typography>
                                    
                                    <material_1.Grid container spacing={3}>
                                        <material_1.Grid item xs={12}>
                                            <material_1.TextField fullWidth label="Title" value={alertMessage.title} onChange={handleInputChange('title')}/>
                                        </material_1.Grid>
                                        
                                        <material_1.Grid item xs={12}>
                                            <material_1.TextField fullWidth label="Push Notification description" value={alertMessage.shortDescription} onChange={handleInputChange('shortDescription')}/>
                                        </material_1.Grid>
                                        
                                        <material_1.Grid item xs={12}>
                                            <material_1.TextField fullWidth multiline rows={4} label="Description" value={alertMessage.description} onChange={handleInputChange('description')}/>
                                        </material_1.Grid>
                                        
                                        <material_1.Grid item xs={12}>
                                            {!showMediaFields ? (<material_1.Button variant="outlined" startIcon={<Add_1.default />} onClick={() => setShowMediaFields(true)}>
                                                    Add Media
                                                </material_1.Button>) : (<material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <material_1.FormControl fullWidth>
                                                        <material_1.InputLabel>Media Type</material_1.InputLabel>
                                                        <material_1.Select value={alertMessage.mediaType} label="Media Type" onChange={(e) => handleMediaTypeChange(e)}>
                                                            <material_1.MenuItem value="ImageLink">Image</material_1.MenuItem>
                                                            <material_1.MenuItem value="VideoLink">Video (YouTube)</material_1.MenuItem>
                                                        </material_1.Select>
                                                    </material_1.FormControl>
                                                    
                                                    <material_1.Box sx={{ display: 'flex', gap: 2 }}>
                                                        <material_1.TextField fullWidth label={alertMessage.mediaType === 'VideoLink' ? 'YouTube URL' : 'Image URL'} value={alertMessage.mediaUrl} onChange={handleInputChange('mediaUrl')} placeholder={alertMessage.mediaType === 'VideoLink' ? 'Enter YouTube URL' : 'Enter image URL'} error={alertMessage.mediaType === 'VideoLink' && alertMessage.mediaUrl !== '' && !validateMediaUrl(alertMessage.mediaUrl, 'VideoLink')} helperText={alertMessage.mediaType === 'VideoLink' && alertMessage.mediaUrl !== '' && !validateMediaUrl(alertMessage.mediaUrl, 'VideoLink') ? 'Only YouTube links are supported' : ''}/>
                                                        <material_1.Button variant="contained" startIcon={isUploading ? null : <CloudUpload_1.default />} onClick={handleMediaUpload} disabled={isUploading} sx={{ minWidth: '150px' }}>
                                                            {isUploading ? 'Uploading...' : 'Upload Media'}
                                                        </material_1.Button>
                                                    </material_1.Box>
                                                </material_1.Box>)}
                                        </material_1.Grid>
                                    </material_1.Grid>
                                </material_1.CardContent>
                            </material_1.Card>

                            <material_1.Card>
                                <material_1.CardContent>
                                    <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <material_1.Typography variant="h6">
                                            Translations
                                        </material_1.Typography>
                                        <material_1.Button variant="outlined" startIcon={<Add_1.default />} onClick={handleAddTranslation}>
                                            Add Translation
                                        </material_1.Button>
                                    </material_1.Box>

                                    {alertMessage.translations.map((translation, index) => (<material_1.Box key={index} sx={{ mb: 3 }}>
                                            <material_1.Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                                                <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                    <material_1.Typography variant="subtitle1">
                                                        Translation {index + 1}
                                                    </material_1.Typography>
                                                    <material_1.FormControl sx={{ minWidth: 200 }}>
                                                        <material_1.Select size="small" value={translation.language} onChange={(e) => handleTranslationChange(index, 'language')(e)} displayEmpty>
                                                            <material_1.MenuItem value="">Select Language</material_1.MenuItem>
                                                            {languages.map((lang) => (<material_1.MenuItem key={lang} value={lang}>
                                                                    {lang}
                                                                </material_1.MenuItem>))}
                                                        </material_1.Select>
                                                    </material_1.FormControl>
                                                </material_1.Box>
                                                <material_1.IconButton color="error" onClick={() => handleRemoveTranslation(index)}>
                                                    <Delete_1.default />
                                                </material_1.IconButton>
                                            </material_1.Box>

                                            <material_1.Grid container spacing={2}>
                                                <material_1.Grid item xs={12}>
                                                    <material_1.TextField fullWidth label="Title" value={translation.title} onChange={(e) => handleTranslationChange(index, 'title')(e)}/>
                                                </material_1.Grid>

                                                <material_1.Grid item xs={12}>
                                                    <material_1.TextField fullWidth label="Push Notification description" value={translation.shortDescription} onChange={(e) => handleTranslationChange(index, 'shortDescription')(e)}/>
                                                </material_1.Grid>

                                                <material_1.Grid item xs={12}>
                                                    <material_1.TextField fullWidth multiline rows={4} label="Description" value={translation.description} onChange={(e) => handleTranslationChange(index, 'description')(e)}/>
                                                </material_1.Grid>
                                            </material_1.Grid>
                                            {index < alertMessage.translations.length - 1 && <material_1.Divider sx={{ my: 2 }}/>}
                                        </material_1.Box>))}
                                </material_1.CardContent>
                            </material_1.Card>

                            {/* Message Actions - Moved up */}
                            <material_1.Card sx={{ mt: 2 }}>
                                <material_1.CardContent sx={{ py: 2 }}>
                                    <material_1.Grid container spacing={2} alignItems="center">
                                        <material_1.Grid item xs={12}>
                                            <material_1.Typography variant="h6" gutterBottom>
                                                Message Actions
                                            </material_1.Typography>
                                        </material_1.Grid>
                                        <material_1.Grid container item xs={12} spacing={2}>
                                            <material_1.Grid item xs={4}>
                                                <material_1.Button variant="contained" color="primary" fullWidth type="submit" disabled={isSending}>
                                                    Create Message
                                                </material_1.Button>
                                            </material_1.Grid>
                                            <material_1.Grid item xs={4}>
                                                <input ref={fileInputRef} accept=".csv" id="csv-file" type="file" style={{ display: "none" }} onChange={handleFileSelect} disabled={!alertMessage?.messageId}/>
                                                <material_1.Button variant="contained" component="span" disabled={!alertMessage?.messageId} startIcon={selectedFile ? null : <CloudUpload_1.default />} color={selectedFile ? "success" : "primary"} fullWidth onClick={handleButtonClick}>
                                                    {selectedFile ? `Upload "${selectedFile.name}"` : "Upload CSV"}
                                                </material_1.Button>
                                            </material_1.Grid>
                                            <material_1.Grid item xs={4}>
                                                <material_1.Button variant="contained" fullWidth disabled={!alertMessage.messageId || !selectedFile || isSending} onClick={handleSendMessage} startIcon={isSending ? null : <Send_1.default />}>
                                                    {isSending ? 'Sending...' : 'Send Message'}
                                                </material_1.Button>
                                            </material_1.Grid>
                                        </material_1.Grid>
                                    </material_1.Grid>
                                </material_1.CardContent>
                            </material_1.Card>
                        </material_1.Grid>

                        {/* Right side - Preview */}
                        <material_1.Grid item xs={12} md={5}>
                            <material_1.Paper elevation={3} sx={{
            p: 2,
            bgcolor: '#f5f5f5',
            height: '100%',
            overflow: 'auto'
        }}>
                                {alertMessage.mediaUrl && (<>
                                        {alertMessage.mediaType === 'ImageLink' ? (<material_1.Box component="img" src={alertMessage.mediaUrl} alt="Preview" sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    mb: 2
                }} onError={(e) => {
                    e.target.style.display = 'none';
                    setSnackbar({
                        open: true,
                        message: 'Failed to load image preview',
                        severity: 'error'
                    });
                }}/>) : alertMessage.mediaType === 'VideoLink' && getYoutubeVideoId(alertMessage.mediaUrl) ? (<material_1.Box component="iframe" src={`https://www.youtube.com/embed/${getYoutubeVideoId(alertMessage.mediaUrl)}`} sx={{
                    width: '100%',
                    height: '250px',
                    border: 'none',
                    borderRadius: 1,
                    mb: 2
                }} allowFullScreen/>) : null}
                                    </>)}
                                
                                <material_1.Typography variant="h5" gutterBottom sx={{
            fontWeight: 'bold',
            wordBreak: 'break-word'
        }}>
                                    {alertMessage.title || 'Title'}
                                </material_1.Typography>
                                
                                <material_1.Typography variant="body1" sx={{
            mb: 2,
            color: 'text.secondary',
            wordBreak: 'break-word'
        }}>
                                    {alertMessage.shortDescription || 'Push Notification description'}
                                </material_1.Typography>
                                
                                <material_1.Typography variant="body1" sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        }}>
                                    {alertMessage.description || 'Description'}
                                </material_1.Typography>
                            </material_1.Paper>
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.Box>
            </material_1.Box>

            <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </material_1.Alert>
            </material_1.Snackbar>

            <material_1.Dialog open={showRowCountDialog} onClose={() => setShowRowCountDialog(false)}>
                <material_1.DialogTitle>CSV File Details</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Typography>
                        Found {rowCount} recipient{rowCount !== 1 ? 's' : ''} in the CSV file.
                    </material_1.Typography>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowRowCountDialog(false)}>
                        Close
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={showCSVPreview} onClose={() => setShowCSVPreview(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle>CSV Data Preview</material_1.DialogTitle>
                <material_1.DialogContent dividers>
                    <material_1.Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {csvPreviewData.headers.map((header, index) => (<th key={index} style={{
                padding: '8px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f5f5f5'
            }}>
                                            {header}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreviewData.rows.map((row, rowIndex) => (<tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (<td key={cellIndex} style={{
                    padding: '8px',
                    borderBottom: '1px solid #ddd'
                }}>
                                                {cell}
                                            </td>))}
                                    </tr>))}
                            </tbody>
                        </table>
                        {csvPreviewData.rows.length === 3 && (<material_1.Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                Showing first 3 rows of the CSV file
                            </material_1.Typography>)}
                    </material_1.Box>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowCSVPreview(false)}>Close</material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>
        </material_1.Box>);
};
exports.default = AlertCentre;
