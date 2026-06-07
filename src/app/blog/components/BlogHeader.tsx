"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

interface BlogHeaderProps {
  settings: any;
  tenantId: string;
}

export function BlogHeader({ settings, tenantId }: BlogHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const brandName = settings?.business?.brandName || "Blog Platform";
  const logoUrl = settings?.logos?.mainLogo;
  const brandColor = settings?.theme?.colors?.mainBrandColor || "#8b5cf6";
  const headerHeight = settings?.theme?.header?.headerHeight || 64;
  const menuPosition = settings?.theme?.header?.mainMenuPosition || "right";
  const logoAlignment = settings?.theme?.header?.logoAlignment || "left";

  const mainMenu = settings?.navigation?.mainMenu || [];
  const showCategories = settings?.navigation?.showCategoriesInMenu;
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    if (showCategories) {
      const targetWorkspace = settings?.workspaceId || tenantId;
      fetch(`/api/blog/categories?workspaceId=${targetWorkspace}`)
        .then(res => res.json())
        .then(data => {
          if (data?.categories) {
            setDbCategories(data.categories);
          }
        })
        .catch(console.error);
    }
  }, [showCategories, tenantId, settings?.workspaceId]);

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-gray-100 transition-all duration-300"
      style={{
        height: `${headerHeight}px`,
        backgroundColor: `${brandColor}80`,
        borderColor: `${brandColor}20`,
      }}
    >
      <div className="w-full h-full bg-black/70">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo / Brand Block */}
          <div
            className={`flex items-center ${logoAlignment === "center" ? "mx-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2" : ""}`}
          >
            <a
              href={`/blog/${tenantId}`}
              className="flex items-center gap-3 group"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                />
              ) : (
                <span
                  className="font-extrabold text-2xl tracking-tight transition-colors duration-300"
                  style={{ color: brandColor }}
                >
                  {brandName}
                </span>
              )}
            </a>
          </div>

          {/* Desktop Menu */}
          <nav
            className={`hidden md:flex items-center gap-8 ${menuPosition === "right" ? "ml-auto" : "mr-auto"}`}
          >
            {mainMenu.map((item: any, i: number) => {
              const isExternal = item.href?.startsWith("http");
              const href = isExternal
                ? item.href
                : `/blog/${tenantId}/p/${item.href || ''}`;
              return (
                <a
                  key={i}
                  href={href}
                  target={isExternal ? "_blank" : "_self"}
                  rel={isExternal ? "noopener noreferrer" : ""}
                  className="text-sm font-semibold text-white hover:text-gray-200 transition-all duration-200 flex items-center gap-1"
                >
                  {item.label}
                  {isExternal && (
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  )}
                </a>
              );
            })}

            {showCategories && dbCategories.map((cat: any, i: number) => (
              <a
                key={`cat-${i}`}
                href={`/blog/${tenantId}?category=${cat.slug}`}
                className="text-sm font-semibold text-white hover:text-gray-200 transition-all duration-200 flex items-center gap-1"
              >
                {cat.name}
              </a>
            ))}
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 focus:outline-none rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-6 px-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4">
            {mainMenu.map((item: any, i: number) => {
              const isExternal = item.href?.startsWith("http");
              const href = isExternal
                ? item.href
                : `/blog/${tenantId}/p/${item.href || ''}`;
              return (
                <a
                  key={i}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  target={isExternal ? "_blank" : "_self"}
                  rel={isExternal ? "noopener noreferrer" : ""}
                  className="text-base font-semibold text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 flex items-center justify-between"
                >
                  {item.label}
                  {isExternal && (
                    <ArrowUpRight className="w-4 h-4 opacity-50" />
                  )}
                </a>
              );
            })}

            {showCategories && dbCategories.map((cat: any, i: number) => (
              <a
                key={`cat-mob-${i}`}
                href={`/blog/${tenantId}?category=${cat.slug}`}
                onClick={() => setIsOpen(false)}
                className="text-base font-semibold text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 flex items-center justify-between"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
