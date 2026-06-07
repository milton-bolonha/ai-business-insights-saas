import React from "react";
import { ArrowUpRight } from "lucide-react";

interface BlogFooterProps {
  settings: any;
  tenantId: string;
}

export function BlogFooter({ settings, tenantId }: BlogFooterProps) {
  const brandName = settings?.business?.brandName || "Blog Platform";
  const brandDesc = settings?.business?.brandDescription || "Enterprise publishing platform powered by next-gen SEO automation.";
  const brandColor = settings?.theme?.colors?.mainBrandColor || "#8b5cf6";
  const footerText = settings?.site?.footerText || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  const mainMenu = settings?.navigation?.mainMenu || [];

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Brand Col */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <span className="font-extrabold text-xl tracking-tight" style={{ color: brandColor }}>
              {brandName}
            </span>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              {brandDesc}
            </p>
          </div>

          {/* Quick Links Col */}
          <div className="md:col-span-6 flex flex-col md:items-end gap-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navegação</h4>
            <div className="flex flex-wrap md:justify-end gap-x-6 gap-y-3">
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
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                  >
                    {item.label}
                    {isExternal && <ArrowUpRight className="w-3 h-3 opacity-60" />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-gray-200/60 my-10" />

        {/* Footer Sub-Info */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-400 leading-relaxed max-w-4xl text-center md:text-left">
            {footerText}
          </p>
          <div className="text-xs text-gray-400 font-semibold tracking-wide">
            Powered by I/O SaaS
          </div>
        </div>
      </div>
    </footer>
  );
}
