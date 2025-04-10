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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUploader = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const ImageUploader = () => {
    (0, react_1.useEffect)(() => {
        const handleMessage = (event) => {
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
    return (<material_1.Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
      <material_1.Box component="iframe" src="https://github-cdn-five.vercel.app/" allow="clipboard-write" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            bgcolor: 'background.paper',
            flexGrow: 1,
            borderRadius: 1,
            boxShadow: 1
        }} title="GitHub CDN Uploader"/>
    </material_1.Box>);
};
exports.ImageUploader = ImageUploader;
