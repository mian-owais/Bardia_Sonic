import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  animated = true,
  variant = 'dark'
}) => {
  // Size mapping
  const dimensions = {
    small: { width: 32, height: 32, fontSize: 14 },
    medium: { width: 40, height: 40, fontSize: 18 },
    large: { width: 48, height: 48, fontSize: 22 },
  };

  // Color mapping
  const colors = {
    dark: {
      primary: '#6366F1',
      secondary: '#EC4899',
      text: '#1F2937'
    },
    light: {
      primary: '#818CF8',
      secondary: '#F472B6',
      text: '#FFFFFF'
    }
  };

  const { width, height, fontSize } = dimensions[size];
  const { primary, secondary, text } = colors[variant];

  // Logo with sound wave and music note design
  return (
    <div className="d-flex align-items-center">
      <div 
        className={`position-relative ${animated ? 'logo-pulse' : ''}`}
        style={{ 
          width: width, 
          height: height, 
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Music note symbol */}
        <svg 
          width={width * 0.6} 
          height={height * 0.6} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M9 18V5L21 3V16" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="2" />
          <circle cx="18" cy="16" r="3" stroke="white" strokeWidth="2" />
        </svg>

        {/* Sound waves (animated) */}
        <div className="position-absolute" style={{ right: -4, top: '25%' }}>
          <svg 
            width={width * 0.5} 
            height={height * 0.5} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.9 }}
          >
            <path 
              d="M3 12H5M19 12H21M7 6H9M15 6H17M7 18H9M15 18H17" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      
      {/* Text part of the logo */}
      <div 
        className="d-flex flex-column justify-content-center" 
        style={{ 
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700, 
          color: text,
          letterSpacing: '-0.02em'
        }}
      >
        <div style={{ fontSize, lineHeight: 1 }}>
          <span>Bardia</span>
          <span style={{ color: primary }}> Sonic</span>
        </div>
        <div style={{ fontSize: fontSize * 0.6, fontWeight: 600, opacity: 0.8 }}>
          PDF Experience
        </div>
      </div>
    </div>
  );
};

export default Logo; 