import React from "react";

interface PostRightColumnProps {
  relatedPosts: any[];
  adsClientID?: string;
  adsSlot?: string;
  tenantId: string;
}

export function PostRightColumn({ relatedPosts, adsClientID, adsSlot, tenantId }: PostRightColumnProps) {
  return (
    <aside className="flex flex-col gap-8">
      
      {/* AdSense Block */}
      {adsClientID && adsClientID !== "" && adsClientID !== "ca-pub-" && (
        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl overflow-hidden min-h-[250px] flex items-center justify-center">
          <p className="text-xs text-gray-400">Advertisement</p>
          {/* Note: In a real environment, you'd insert the <ins> tag for AdSense here. */}
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Related Articles</h3>
          <div className="flex flex-col gap-6">
            {relatedPosts.map(post => (
              <a key={post._id} href={`/blog/${tenantId}/${post.slug}`} className="group block">
                {post.featuredImage && (
                  <div className="w-full h-32 rounded-lg overflow-hidden mb-2">
                    <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                {post.categories?.[0] && (
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">{post.categories[0]}</span>
                )}
                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-2">
                  {post.title}
                </h4>
              </a>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
}
