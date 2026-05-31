"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, FileText, ArrowRight } from "lucide-react";

interface SearchPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  categories?: string[];
  featuredImage?: string;
  publishedAt?: string;
  createdAt?: string;
}

interface BlogSearchAutocompleteProps {
  posts: SearchPost[];
  tenantId: string;
  brandColor: string;
}

export function BlogSearchAutocomplete({ posts, tenantId, brandColor }: BlogSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPost[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Filter posts on query change
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const cleanQuery = query.toLowerCase().trim();
    const filtered = posts.filter(post => {
      const matchTitle = post.title.toLowerCase().includes(cleanQuery);
      const matchExcerpt = post.excerpt?.toLowerCase().includes(cleanQuery) || false;
      const matchCategory = post.categories?.some(cat => cat.toLowerCase().includes(cleanQuery)) || false;
      return matchTitle || matchExcerpt || matchCategory;
    });

    setResults(filtered.slice(0, 5)); // Limit to top 5 matches
    setIsOpen(true);
  }, [query, posts]);

  return (
    <div ref={containerRef} className="w-full max-w-xl mt-8 relative z-30">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Buscar artigos e insights..."
          className="w-full bg-white text-gray-900 border rounded-full px-6 py-4.5 pl-12 text-sm focus:outline-none shadow-md transition-all font-medium placeholder-gray-400 focus:placeholder-gray-500 focus:ring-2 focus:ring-[var(--brand-color)]"
          style={{
            borderColor: `${brandColor}33`,
            ["--brand-color" as any]: brandColor,
          }}
        />
        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-gray-500 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
        
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-150 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resultados Sugeridos ({results.length})</span>
            <span className="text-[9px] text-gray-400">Pressione enter ou clique no artigo</span>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {results.map((post) => (
              <a
                key={post._id}
                href={`/blog/${tenantId}/${post.slug}`}
                className="p-4 hover:bg-violet-50/30 transition-colors flex items-start gap-4 group text-left"
              >
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.categories?.[0] && (
                      <span
                        className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          color: brandColor,
                          backgroundColor: `${brandColor}12`,
                        }}
                      >
                        {post.categories[0]}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishedAt || post.createdAt || "").toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[var(--brand-color)] transition-colors" style={{ ["--brand-color" as any]: brandColor }}>
                    {post.title}
                  </h4>
                  {post.excerpt && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{post.excerpt}</p>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--brand-color)] group-hover:translate-x-0.5 transition-all self-center flex-shrink-0" style={{ ["--brand-color" as any]: brandColor }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No results placeholder */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl p-6 text-center text-gray-500 text-sm">
          Nenhum artigo encontrado para "{query}"
        </div>
      )}
    </div>
  );
}
