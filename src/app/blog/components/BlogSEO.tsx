import React from "react";

interface SEOProps {
  title: string;
  description: string;
  featuredImage?: string;
  authorName?: string;
  siteUrl: string;
  articleUrl?: string;
  datePublished?: string;
  keywords?: string[];
  themeColor?: string;
  isArticle?: boolean;
  adsAccount?: string;
  brandName?: string;
  favicon?: string;
  markLogo?: string;
  customCSS?: string;
  customHeaderScripts?: string;
  googleAnalyticsID?: string;
  metaPixelID?: string;
  sameAsSocials?: string[];
  categoryName?: string;
}

export function BlogSEO({ data }: { data: SEOProps }) {
  if (!data) return null;

  const type = data.isArticle ? "article" : "website";
  const image = data.featuredImage || "/placeholder-blog.png";
  const faviconUrl = data.favicon || "/favicon.ico";
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": data.articleUrl || data.siteUrl
    },
    "headline": data.title,
    "description": data.description,
    "image": image,
    "author": {
      "@type": "Person",
      "name": data.authorName || "Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": data.brandName || "Company",
      "logo": {
        "@type": "ImageObject",
        "url": data.markLogo || image
      }
    },
    "datePublished": data.datePublished || new Date().toISOString()
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": data.siteUrl,
    "name": data.brandName || "Company"
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.brandName || "Company",
    "url": data.siteUrl,
    "logo": data.markLogo || image,
    "sameAs": data.sameAsSocials || []
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": data.siteUrl
      },
      ...(data.categoryName ? [{
        "@type": "ListItem",
        "position": 2,
        "name": data.categoryName,
        "item": `${data.siteUrl}?category=${encodeURIComponent(data.categoryName)}`
      }] : []),
      {
        "@type": "ListItem",
        "position": data.categoryName ? 3 : 2,
        "name": data.title,
        "item": data.articleUrl || data.siteUrl
      }
    ]
  };

  return (
    <>
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content={data.themeColor || "#ffffff"} />
      <link rel="icon" href={faviconUrl} />
      {data.keywords && data.keywords.length > 0 && (
        <meta name="keywords" content={data.keywords.join(", ")} />
      )}
      
      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={data.articleUrl || data.siteUrl} />
      <meta property="og:site_name" content={data.brandName} />
      <meta property="og:title" content={data.title} />
      <meta property="og:description" content={data.description} />
      <meta property="og:image" content={image} />
      {data.datePublished && (
        <meta property="article:published_time" content={data.datePublished} />
      )}
      {data.authorName && (
        <meta property="article:author" content={data.authorName} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={data.title} />
      <meta name="twitter:description" content={data.description} />
      <meta name="twitter:image" content={image} />

      {/* Google AdSense */}
      {data.adsAccount && (
        <meta name="google-adsense-account" content={data.adsAccount} />
      )}

      {/* Google Analytics Integration */}
      {data.googleAnalyticsID && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${data.googleAnalyticsID}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${data.googleAnalyticsID}');
              `
            }}
          />
        </>
      )}

      {/* Facebook/Meta Pixel Integration */}
      {data.metaPixelID && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${data.metaPixelID}');
              fbq('track', 'PageView');
            `
          }}
        />
      )}

      {/* Custom Header CSS Style Injection */}
      {data.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: data.customCSS }} />
      )}

      {/* Custom Header Scripts Injection */}
      {data.customHeaderScripts && (
        <div dangerouslySetInnerHTML={{ __html: data.customHeaderScripts }} />
      )}

      {/* Schema.org */}
      {data.isArticle && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
        </>
      )}
      {!data.isArticle && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        </>
      )}
    </>
  );
}
