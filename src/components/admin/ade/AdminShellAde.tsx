"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { toRgba } from "@/lib/color";

interface AdminShellAdeProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  appearance: AdeAppearanceTokens;
}

export function AdminShellAde({
  sidebar,
  header,
  children,
  appearance,
}: AdminShellAdeProps) {
  // Use lazy initialization to avoid setState in effect
  const [mounted, setMounted] = useState(() => false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const target = event.target as Element;
        if (!target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Don't render until mounted and appearance is ready
  if (!mounted || !appearance) {
    return null;
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: "transparent", // Deixa o body controlar a cor de fundo
        color: appearance.textColor,
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-sidebar
        className={`fixed left-0 top-0 z-50 h-full w-64 flex-shrink-0 flex-col p-4 transition-transform duration-300 lg:static lg:translate-x-0 lg:overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:flex`}
        style={{
          backgroundColor: appearance.sidebarColor || toRgba("#808080", 0.15),
          backdropFilter: "blur(10px)",
          color: appearance.textColor,
        }}
      >
        {sidebar}
      </aside>

      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: "transparent" }}
      >
        <header
          className="flex flex-shrink-0 items-center justify-between px-4"
          style={{
            height: "72px",
            backgroundColor: "transparent",
            color: appearance.headingColor,
          }}
        >
          {/* Mobile Sidebar Toggle */}
          <button
            data-sidebar-toggle
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Spacer for mobile */}
          <div className="lg:hidden" />

          {header}
        </header>
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "transparent" }}
        >
          <div
            className="container mx-auto min-h-full px-6 py-8"
            style={{ color: appearance.textColor }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

