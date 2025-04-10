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
const styled_components_1 = __importDefault(require("styled-components"));
const DashboardContainer = styled_components_1.default.div `
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(500px, 1fr) 400px;
  gap: 2rem;
  min-height: calc(100vh - 4rem);
`;
const Card = styled_components_1.default.div `
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;
const FormSection = (0, styled_components_1.default)(Card) `
  padding: 2rem;
`;
const FormTitle = styled_components_1.default.h1 `
  font-size: 1.75rem;
  color: #1a1a1a;
  margin: 0 0 2rem;
  font-weight: 600;
`;
const FormGroup = styled_components_1.default.div `
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
`;
const InputGroup = styled_components_1.default.div `
  flex: 1;
  max-width: 320px;
`;
const Label = styled_components_1.default.label `
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a4a4a;
  font-size: 0.9rem;
`;
const inputStyles = `
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fafafa;

  &:focus {
    outline: none;
    border-color: #1a73e8;
    background: white;
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
  }
`;
const Input = styled_components_1.default.input `
  ${inputStyles}
  &[type="text"] {
    min-height: 42px;
    height: auto;
  }
`;
const TextArea = styled_components_1.default.textarea `
  ${inputStyles}
  min-height: 42px;
  resize: vertical;
  max-height: 150px;
`;
const ColorInputGroup = styled_components_1.default.div `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 130px;
`;
const ColorPickerWrapper = styled_components_1.default.div `
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
const ColorInput = (0, styled_components_1.default)(Input) `
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  &::-webkit-color-swatch {
    border: none;
  }

  &:hover {
    border-color: #1a73e8;
  }

  &:focus {
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }
`;
const HexInput = (0, styled_components_1.default)(Input) `
  width: 85px;
  text-transform: uppercase;
  font-family: monospace;
  font-size: 0.9rem;
  text-align: center;
  height: 32px;
  padding: 0 0.5rem;
  background: white;
  border: 1px solid #e0e0e0;

  &:hover {
    border-color: #1a73e8;
  }
`;
const PreviewSection = (0, styled_components_1.default)(Card) `
  padding: 1rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
`;
const PreviewTitle = styled_components_1.default.h2 `
  font-size: 1.25rem;
  color: #1a1a1a;
  margin: 0 0 1rem;
  font-weight: 600;
`;
const MobilePreview = styled_components_1.default.div `
  width: 360px;
  height: 780px;
  background: url('/Online.png') no-repeat center center;
  background-size: cover;
  border-radius: 40px;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  border: 12px solid #333;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 28px;
    background: #333;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }

  /* Status bar */
  &:after {
    content: '12:30 78%';
    position: absolute;
    top: 6px;
    right: 16px;
    color: #000;
    font-size: 14px;
    font-weight: 500;
  }
`;
const BannerPreview = styled_components_1.default.div `
  position: absolute;
  bottom: 90px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background-color: ${(props) => props.config.backgroundColor};
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;
const BannerContent = styled_components_1.default.div `
  flex: 1;
  margin-right: 20px;
`;
const BannerText = styled_components_1.default.p `
  font-size: 0.9375rem;
  margin: 0;
  color: ${(props) => props.color};
  font-weight: 500;
`;
const CTAButton = styled_components_1.default.button `
  background-color: ${(props) => props.bgColor};
  color: ${(props) => props.textColor};
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-top: 8px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  height: 32px;
`;
const BannerImage = styled_components_1.default.img `
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 8px;
`;
const GenerateButton = styled_components_1.default.button `
  background: linear-gradient(45deg, #1a73e8, #0d47a1);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(45deg, #1557b0, #0a3880);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
const CodeSection = styled_components_1.default.div `
  position: relative;
  margin-top: 1.5rem;
`;
const CodeOutput = styled_components_1.default.pre `
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  border: 1px solid #e0e0e0;
`;
const CopyButton = styled_components_1.default.button `
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
    border-color: #d0d0d0;
  }
`;
const Divider = styled_components_1.default.hr `
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 2rem 0;
`;
const BannerDashboard = () => {
    const [config, setConfig] = (0, react_1.useState)({
        text: 'Setup Autopay to get special discounts!',
        bannerImage: '/limited-offer.png',
        ctaText: 'Setup Now',
        ctaLink: '#',
        backgroundColor: '#0D904F',
        ctaButtonColor: '#AAAAAA',
        textColor: '#ffffff',
        ctaTextColor: '#ffffff'
    });
    const [showCode, setShowCode] = (0, react_1.useState)(false);
    const [copySuccess, setCopySuccess] = (0, react_1.useState)(false);
    const codeRef = (0, react_1.useRef)(null);
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name.endsWith('Hex')) {
            const colorName = name.replace('Hex', '');
            finalValue = value.startsWith('#') ? value : `#${value}`;
            setConfig(prev => ({
                ...prev,
                [colorName]: finalValue
            }));
            return;
        }
        setConfig(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };
    const handleCopy = async () => {
        if (codeRef.current) {
            try {
                await navigator.clipboard.writeText(codeRef.current.textContent || '');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }
            catch (err) {
                console.error('Failed to copy text: ', err);
            }
        }
    };
    const generateCode = () => {
        const codeOutput = {
            text_color: config.textColor,
            text: config.text,
            cta_text: config.ctaText,
            cta_action: "",
            cta_link: config.ctaLink,
            cta_icon: "",
            cta_background_color: config.ctaButtonColor,
            cta_corner_radius: "",
            cta_text_color: config.ctaTextColor,
            cta_image_url: "",
            banner_color: config.backgroundColor,
            banner_image: config.bannerImage,
            start: "",
            end: ""
        };
        return JSON.stringify(codeOutput, null, 2);
    };
    return (<DashboardContainer>
      <FormSection>
        <FormTitle>Banner Configuration</FormTitle>
        
        <FormGroup>
          <InputGroup>
            <Label>Banner Text</Label>
            <TextArea name="text" value={config.text} onChange={handleChange} placeholder="Enter banner text..."/>
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Text Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput type="color" name="textColor" value={config.textColor} onChange={handleChange}/>
                <HexInput type="text" name="textColorHex" value={config.textColor} onChange={handleChange}/>
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>Banner Image URL</Label>
            <Input type="text" name="bannerImage" value={config.bannerImage} onChange={handleChange} placeholder="Enter image URL..."/>
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Background</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput type="color" name="backgroundColor" value={config.backgroundColor} onChange={handleChange}/>
                <HexInput type="text" name="backgroundColorHex" value={config.backgroundColor} onChange={handleChange}/>
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>CTA Text</Label>
            <Input type="text" name="ctaText" value={config.ctaText} onChange={handleChange} placeholder="Enter CTA text..."/>
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Button Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput type="color" name="ctaButtonColor" value={config.ctaButtonColor} onChange={handleChange}/>
                <HexInput type="text" name="ctaButtonColorHex" value={config.ctaButtonColor} onChange={handleChange}/>
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Text Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput type="color" name="ctaTextColor" value={config.ctaTextColor} onChange={handleChange}/>
                <HexInput type="text" name="ctaTextColorHex" value={config.ctaTextColor} onChange={handleChange}/>
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>CTA Link</Label>
            <Input type="text" name="ctaLink" value={config.ctaLink} onChange={handleChange} placeholder="Enter CTA link..."/>
          </InputGroup>
        </FormGroup>

        <Divider />

        <GenerateButton onClick={() => setShowCode(!showCode)}>
          {showCode ? 'Hide Code' : 'Generate Code'}
        </GenerateButton>

        {showCode && (<CodeSection>
            <CodeOutput ref={codeRef}>
              {generateCode()}
            </CodeOutput>
            <CopyButton onClick={handleCopy}>
              {copySuccess ? '✓ Copied!' : 'Copy Code'}
            </CopyButton>
          </CodeSection>)}
      </FormSection>

      <PreviewSection>
        <PreviewTitle>Mobile Preview</PreviewTitle>
        <MobilePreview>
          <BannerPreview config={config} onClick={() => window.open(config.ctaLink, '_blank')}>
            <BannerContent>
              <BannerText color={config.textColor}>
                {config.text}
              </BannerText>
              <CTAButton bgColor={config.ctaButtonColor} textColor={config.ctaTextColor}>
                {config.ctaText}
              </CTAButton>
            </BannerContent>
            <BannerImage src={config.bannerImage} alt="Banner"/>
          </BannerPreview>
        </MobilePreview>
      </PreviewSection>
    </DashboardContainer>);
};
exports.default = BannerDashboard;
