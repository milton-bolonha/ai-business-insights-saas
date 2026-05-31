import React from "react";
import { PostLeftColumn } from "./PostLeftColumn";
import { PostRightColumn } from "./PostRightColumn";

interface SinglePostWrapperProps {
  post: any;
  author: any;
  settings: any;
  relatedPosts: any[];
  tenantId: string;
}

export function SinglePostWrapper({ post, author, settings, relatedPosts, tenantId }: SinglePostWrapperProps) {
  const showLeft = settings?.theme?.layout?.leftColumn !== false; // Default true
  const showRight = settings?.theme?.layout?.rightColumn !== false; // Default true

  // Grid distribution based on layout settings
  let gridCols = "lg:grid-cols-8"; // Default if neither 
  let centerCols = "lg:col-span-8";
  
  if (showLeft && showRight) {
    gridCols = "lg:grid-cols-12";
    centerCols = "lg:col-span-6";
  } else if (showLeft) {
    gridCols = "lg:grid-cols-10";
    centerCols = "lg:col-span-7";
  } else if (showRight) {
    gridCols = "lg:grid-cols-10";
    centerCols = "lg:col-span-7";
  }

  return (
    <article className="px-4 py-12 lg:px-8 max-w-7xl mx-auto">
      {/* Visual Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-8 pb-4 border-b border-gray-100/80">
        <a href={`/blog/${tenantId}`} className="hover:text-violet-600 transition-colors">
          Home
        </a>
        <span className="text-gray-400 font-normal">/</span>
        {post.categories?.[0] && (
          <>
            <a 
              href={`/blog/${tenantId}?category=${encodeURIComponent(post.categories[0])}`} 
              className="hover:text-violet-600 transition-colors"
            >
              {post.categories[0]}
            </a>
            <span className="text-gray-400 font-normal">/</span>
          </>
        )}
        <span className="text-gray-800 font-bold truncate max-w-[200px] sm:max-w-xs">
          {post.title}
        </span>
      </nav>

      <div className={`grid grid-cols-1 ${gridCols} gap-12`}>
        
        {/* Left Column (TOC, Meta) */}
        {showLeft && (
          <div className="lg:col-span-3">
            <PostLeftColumn 
              contentHtml={post.content} 
              authorName={author?.name}
              authorImage={author?.avatarUrl}
              publishedAt={post.publishedAt}
            />
          </div>
        )}

        {/* Center Column (Main Content) */}
        <div className={`${centerCols}`}>
          <header className="mb-10">
            {post.categories?.[0] && (
              <div className="mb-4">
                <span className="text-sm font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
                  {post.categories[0]}
                </span>
              </div>
            )}
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-gray-900 leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-500 leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}
            {post.featuredImage && (
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-sm">
                <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
          </header>

          <div 
            className="prose prose-lg prose-violet max-w-none prose-headings:font-bold prose-a:text-violet-600 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Right Column (Ads, Related Posts) */}
        {showRight && (
          <div className="lg:col-span-3">
            <PostRightColumn 
              relatedPosts={relatedPosts} 
              adsClientID={settings?.integrations?.googleIntegration?.adsClientID}
              adsSlot={settings?.integrations?.googleIntegration?.adsSlot}
              tenantId={tenantId}
            />
          </div>
        )}

      </div>
    </article>
  );
}
