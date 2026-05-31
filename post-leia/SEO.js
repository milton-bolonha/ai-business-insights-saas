import React from "react";
import Head from "next/head";
const Seo = ({ children, data = null }) => {
  if (!data) {
    return (
      <Head>
        <title>NO SEO DATA</title>
      </Head>
    );
  }
  return (
    <Head>
      <title>{data?.title}</title>
      <meta name="robots" content={"index, follow"} />
      <meta name="description" content={data?.description} />
      <meta
        name="image"
        content={data?.featuredImage || data?.brandCardImage}
      />
      {data?.topology === "post" ? null : (
        <meta name="keywords" content={data?.keywords?.map((e) => e)} />
      )}
      <meta name="author" content={data?.author} />
      <meta property="article:author" content={data?.author} />
      <meta property="article:publisher" content={data?.siteUrl} />
      <meta
        name="publish_date"
        property="og:publish_date"
        content={data?.datePublished}
      />
      {/* OpenGraph tags */}
      {data?.topology === "post" ? (
        <meta property="og:type" content="article" />
      ) : (
        <meta property="og:type" content="website" />
      )}
      <meta property="og:url" content={data?.articleUrl} />
      <meta property="og:site_name" content={data?.title} />
      <meta property="og:title" content={data?.title} />
      <meta property="og:description" content={data?.description} />
      <meta
        property="og:image"
        content={data?.featuredImage || data?.brandCardImage}
      />
      <meta name="theme-color" content={data?.themeColor || "#FF0081"} />
      <link rel="canonical" href={data?.siteUrl + data?.slug} />
      {data?.fbAppID ? (
        <meta property="fb:app_id" content={data?.social.fbAppID} />
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={data?.author} />
      <meta name="twitter:title" content={data?.title} />
      <meta name="twitter:description" content={data?.description} />
      <meta
        name="twitter:image:src"
        content={data?.featuredImage || data?.brandCardImage}
      />
      <meta name="twitter:site" content={`@`} />
      <meta name="article:published_time" content={data?.datePublished} />
      {/* Schema.org tags */}
      {data?.topology === "post" ? (
        <script
          type="application/ld+json"
          data-schema="Article"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data?.articleSchema),
          }}
        />
      ) : null}
      <script
        type="application/ld+json"
        data-schema="WebSite"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data?.webSiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        data-schema="Organization"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data?.orgSchema) }}
      />
      {data?.adsAccount && data?.adsAccount !== "" ? (
        <meta name="google-adsense-account" content={data?.adsAccount} />
      ) : null}
      {children}
    </Head>
  );
};
export default Seo;
