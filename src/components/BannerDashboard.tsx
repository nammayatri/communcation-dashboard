import React, { useState, useRef } from 'react';
import styled from 'styled-components';

interface BannerConfig {
  text: string;
  bannerImage: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor: string;
  ctaButtonColor: string;
  textColor: string;
  ctaTextColor: string;
}

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(500px, 1fr) 400px;
  gap: 2rem;
  min-height: calc(100vh - 4rem);
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FormSection = styled(Card)`
  padding: 2rem;
`;

const FormTitle = styled.h1`
  font-size: 1.75rem;
  color: #1a1a1a;
  margin: 0 0 2rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  flex: 1;
  max-width: 320px;
`;

const Label = styled.label`
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

const Input = styled.input`
  ${inputStyles}
  &[type="text"] {
    min-height: 42px;
    height: auto;
  }
`;

const TextArea = styled.textarea`
  ${inputStyles}
  min-height: 42px;
  resize: vertical;
  max-height: 150px;
`;

const ColorInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 130px;
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ColorInput = styled(Input)`
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

const HexInput = styled(Input)`
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

const PreviewSection = styled(Card)`
  padding: 2rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
`;

const PreviewTitle = styled.h2`
  font-size: 1.25rem;
  color: #1a1a1a;
  margin: 0 0 1.5rem;
  font-weight: 600;
`;

const BannerPreview = styled.div<{ config: BannerConfig }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  border-radius: 12px;
  background-color: ${(props: any) => props.config.backgroundColor};
  transition: all 0.3s ease;
`;

const BannerContent = styled.div`
  flex: 1;
  margin-right: 2rem;
`;

const BannerText = styled.p<{ color: string }>`
  font-size: 1.25rem;
  margin: 0;
  color: ${(props: any) => props.color};
  word-wrap: break-word;
  line-height: 1.5;
`;

const CTAButton = styled.button<{ bgColor: string; textColor: string }>`
  background: ${(props: any) => props.bgColor};
  color: ${(props: any) => props.textColor};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const BannerImage = styled.div<{ imageUrl: string }>`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  background-image: url(${(props: any) => props.imageUrl});
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const GenerateButton = styled.button`
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

const CodeSection = styled.div`
  position: relative;
  margin-top: 1.5rem;
`;

const CodeOutput = styled.pre`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  border: 1px solid #e0e0e0;
`;

const CopyButton = styled.button`
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

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 2rem 0;
`;

const BannerDashboard: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig>({
    text: 'Enter your banner text here',
    bannerImage: 'https://via.placeholder.com/200',
    ctaText: 'Join Now',
    ctaLink: '#',
    backgroundColor: '#e8f5e9',
    ctaButtonColor: '#1b5e20',
    textColor: '#2e7d32',
    ctaTextColor: '#ffffff'
  });

  const [showCode, setShowCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      } catch (err) {
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

  return (
    <DashboardContainer>
      <FormSection>
        <FormTitle>Banner Configuration</FormTitle>
        
        <FormGroup>
          <InputGroup>
            <Label>Banner Text</Label>
            <TextArea
              name="text"
              value={config.text}
              onChange={handleChange}
              placeholder="Enter banner text..."
            />
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Text Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput
                  type="color"
                  name="textColor"
                  value={config.textColor}
                  onChange={handleChange}
                />
                <HexInput
                  type="text"
                  name="textColorHex"
                  value={config.textColor}
                  onChange={handleChange}
                />
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>Banner Image URL</Label>
            <Input
              type="text"
              name="bannerImage"
              value={config.bannerImage}
              onChange={handleChange}
              placeholder="Enter image URL..."
            />
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Background</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput
                  type="color"
                  name="backgroundColor"
                  value={config.backgroundColor}
                  onChange={handleChange}
                />
                <HexInput
                  type="text"
                  name="backgroundColorHex"
                  value={config.backgroundColor}
                  onChange={handleChange}
                />
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>CTA Text</Label>
            <Input
              type="text"
              name="ctaText"
              value={config.ctaText}
              onChange={handleChange}
              placeholder="Enter CTA text..."
            />
          </InputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Button Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput
                  type="color"
                  name="ctaButtonColor"
                  value={config.ctaButtonColor}
                  onChange={handleChange}
                />
                <HexInput
                  type="text"
                  name="ctaButtonColorHex"
                  value={config.ctaButtonColor}
                  onChange={handleChange}
                />
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
          <ColorInputGroup>
            <ColorPickerWrapper>
              <Label>Text Color</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ColorInput
                  type="color"
                  name="ctaTextColor"
                  value={config.ctaTextColor}
                  onChange={handleChange}
                />
                <HexInput
                  type="text"
                  name="ctaTextColorHex"
                  value={config.ctaTextColor}
                  onChange={handleChange}
                />
              </div>
            </ColorPickerWrapper>
          </ColorInputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <Label>CTA Link</Label>
            <Input
              type="text"
              name="ctaLink"
              value={config.ctaLink}
              onChange={handleChange}
              placeholder="Enter CTA link..."
            />
          </InputGroup>
        </FormGroup>

        <Divider />

        <GenerateButton onClick={() => setShowCode(!showCode)}>
          {showCode ? 'Hide Code' : 'Generate Code'}
        </GenerateButton>

        {showCode && (
          <CodeSection>
            <CodeOutput ref={codeRef}>
              {generateCode()}
            </CodeOutput>
            <CopyButton onClick={handleCopy}>
              {copySuccess ? '✓ Copied!' : 'Copy Code'}
            </CopyButton>
          </CodeSection>
        )}
      </FormSection>

      <PreviewSection>
        <PreviewTitle>Live Preview</PreviewTitle>
        <BannerPreview config={config}>
          <BannerContent>
            <BannerText color={config.textColor}>{config.text}</BannerText>
            <CTAButton
              bgColor={config.ctaButtonColor}
              textColor={config.ctaTextColor}
              onClick={() => window.open(config.ctaLink, '_blank')}
            >
              {config.ctaText}
            </CTAButton>
          </BannerContent>
          <BannerImage imageUrl={config.bannerImage} />
        </BannerPreview>
      </PreviewSection>
    </DashboardContainer>
  );
};

export default BannerDashboard; 