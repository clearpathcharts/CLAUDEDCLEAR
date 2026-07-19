import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  canonical 
}) => {
  const siteName = "CLEAR PATH MARKETS SCIENCE";
  const defaultDescription = "Premium market market science interface and market research terminal. High-fidelity data visualization and analysis.";
  const defaultKeywords = "analysis, market data, market science, clear path markets science, financial terminal";

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Clear Insights Terminal`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content="https://clearpathtrader.com/og-image.png" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content="https://clearpathtrader.com/og-image.png" />

      {canonical && <link rel="canonical" href={canonical} />}
      
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    </Helmet>
  );
};

export default SEO;
