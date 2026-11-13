import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  PRODUCT_PLATFORM_POSITION,
  withPlatformPositionTitle,
} from '../content/productIdentity';

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
  const defaultDescription =
    'ClearPath Trader — educational financial markets site with four trader desks, charts, and research. Not a brokerage or financial advice.';
  const defaultKeywords = "analysis, market data, market science, clear path markets science, financial terminal";

  const fullTitle = withPlatformPositionTitle(
    title ? `${title} | ${siteName}` : `${siteName} | Clear Insights Terminal`,
  );

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="clearpath-platform-position" content={PRODUCT_PLATFORM_POSITION} />
      
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
      
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
    </Helmet>
  );
};

export default SEO;
