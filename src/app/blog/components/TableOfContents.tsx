import React from "react";

interface TOCProps {
  contentHtml: string;
}

export function TableOfContents({ contentHtml }: TOCProps) {
  if (!contentHtml) return null;

  // Simple regex to extract H2 and H3 tags and their inner text
  const headingRegex = /<(h[23])>(.*?)<\/\1>/gi;
  const headings: { id: string; text: string; level: number }[] = [];
  
  let match;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    const level = parseInt(match[1].replace("h", ""), 10);
    const rawText = match[2].replace(/<[^>]+>/g, ""); // strip inner html if any
    const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    headings.push({ id, text: rawText, level });
  }

  if (headings.length === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Table of Contents</h3>
      <ul className="space-y-3">
        {headings.map((h, i) => (
          <li 
            key={i} 
            className={`text-sm ${h.level === 3 ? "ml-4 text-gray-500" : "font-medium text-gray-700"}`}
          >
            <a href={`#${h.id}`} className="hover:text-blue-600 transition-colors">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
