import React from "react";
import { TableOfContents } from "./TableOfContents";

interface PostLeftColumnProps {
  contentHtml: string;
  authorName?: string;
  authorRole?: string;
  authorImage?: string;
  publishedAt?: string;
}

export function PostLeftColumn({ contentHtml, authorName, authorRole, authorImage, publishedAt }: PostLeftColumnProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
      
      {/* Author Card */}
      {(authorName || publishedAt) && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Published</div>
          {publishedAt && (
            <time className="text-sm font-medium text-gray-900">
              {new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          )}
          
          {authorName && (
            <div className="flex items-center gap-3 mt-4">
              {authorImage ? (
                <img src={authorImage} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                  {authorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{authorName}</p>
                {authorRole && <p className="text-xs text-gray-500">{authorRole}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table of Contents */}
      <TableOfContents contentHtml={contentHtml} />
      
    </aside>
  );
}
