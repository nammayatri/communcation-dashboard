"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const OverlayPreview = ({ config }) => {
    return (<material_1.Paper sx={{
            width: '100%',
            maxWidth: 320,
            mx: 'auto',
            overflow: 'hidden',
            borderRadius: 4,
            padding: 2,
            bgcolor: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}>
            {/* Main Content */}
            <material_1.Box sx={{ p: 2, bgcolor: 'white' }}>
                {config.imageVisibility && config.imageUrl && (<material_1.Box component="img" src={config.imageUrl} alt="Overlay" sx={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                borderRadius: 2,
                mb: 2,
            }}/>)}
                {config.titleVisibility && config.title && (<material_1.Typography variant="h6" align="center" sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#333',
            }}>
                        {config.title}
                    </material_1.Typography>)}
                {config.descriptionVisibility && config.description && (<material_1.Typography align="center" sx={{
                mt: 1,
                color: '#666',
                fontSize: '0.9rem',
            }}>
                        {config.description}
                    </material_1.Typography>)}
            </material_1.Box>

            {/* Action Buttons */}
            {(config.buttonOkVisibility || config.buttonCancelVisibility) && (<material_1.Box>
                    {config.buttonOkVisibility && (<material_1.Button fullWidth sx={{
                    py: 1.5,
                    bgcolor: '#2F2F3A',
                    color: '#FFB800',
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover': {
                        bgcolor: '#23232B',
                    },
                }}>
                            {config.okButtonText}
                        </material_1.Button>)}
                    {config.buttonCancelVisibility && (<material_1.Typography align="center" sx={{
                    py: 1,
                    color: '#999',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    '&:hover': {
                        color: '#666',
                    },
                }}>
                            {config.cancelButtonText}
                        </material_1.Typography>)}
                </material_1.Box>)}
        </material_1.Paper>);
};
exports.default = OverlayPreview;
