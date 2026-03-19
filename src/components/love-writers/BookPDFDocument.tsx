import React, { useMemo, useEffect } from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { registerFonts } from "@/lib/pdf/fonts";

// Register fonts once at module load
registerFonts();

/**
 * Helper to wrap image URLs in our proxy to bypass CSP/CORS
 */
const getProxyUrl = (url: string) => {
  if (!url || url.startsWith("data:") || url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

// 6x9 inch book dimensions in PostScript points: 432 x 648
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    paddingTop: 56, // 20mm
    paddingBottom: 72, // Increased to 25mm to avoid overlap
    paddingLeft: 48,
    paddingRight: 48,
  },
  titlePage: {
    justifyContent: "center",
    alignItems: "center",
  },
  titlePageContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontFamily: "Oswald Bold",
    fontWeight: 700,
    fontSize: 26,
    textAlign: "center",
    color: "#1a1a1a",
    marginBottom: 24,
  },
  authorName: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 14,
    textAlign: "center",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  publisherName: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 10,
    textAlign: "center",
    color: "#4b5563",
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
  },
  copyrightPage: {
    justifyContent: "flex-end",
    paddingBottom: 56,
  },
  copyrightContainer: {
    flexDirection: "column",
  },
  copyrightTitle: {
    fontFamily: "Oswald Bold",
    fontWeight: 700,
    fontSize: 10,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  copyrightText: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 9,
    lineHeight: 1.4,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  titleText: {
    fontFamily: "Oswald Bold",
    fontWeight: 700,
    fontSize: 18,
    lineHeight: 1.3,
    textAlign: "center",
    color: "#1a1a1a",
    marginTop: 32,
    marginBottom: 24,
    letterSpacing: 1,
  },
  paragraphText: {
    fontFamily: "Montserrat",
    fontSize: 12,
    lineHeight: 1.4,
    color: "#1a1a1a",
    textAlign: "left",
    marginBottom: 12,
  },
  indentedParagraphText: {
    fontFamily: "Montserrat",
    fontSize: 12,
    lineHeight: 1.4,
    color: "#1a1a1a",
    textAlign: "left",
    marginBottom: 12,
    textIndent: 24,
  },
  contentImage: {
    width: "100%",
    height: "auto",
    maxHeight: 300,
    objectFit: "contain",
    marginVertical: 12,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
  },
  debugBox: {
    border: "1pt solid red",
    padding: 10,
    margin: 10,
  }
});

interface BookPDFDocumentProps {
  title: string;
  contentHTML: string;
  names?: string[];
}

// A rugged parser to convert the incoming HTML string into React-PDF primitives
const parseHTMLContent = (htmlString: string) => {
  console.log("parseHTMLContent input:", htmlString);

  // 1. Remove newlines and trim to prevent empty text nodes
  const cleanHTML = htmlString.replace(/\n/g, "").trim();
  console.log("cleanHTML:", cleanHTML);

  // 2. Simple regex based parser to find h2, p, and img tags sequentially
  const elements: { type: "h2" | "p" | "img"; content?: string; src?: string }[] = [];

  // We will extract inner text of tags or src from img.
  // This regex looks for <h2>...</h2>, <p>...</p>, or <img ... src="..." ...>
  const tagRegex = /<(h2|p)[^>]*>(.*?)<\/\1>|<img[^>]+src=["'](.*?)["'][^>]*>/gi;

  let match;
  while ((match = tagRegex.exec(cleanHTML)) !== null) {
    if (match[1]) {
      // It's a text tag (h2 or p)
      const type = match[1].toLowerCase() as "h2" | "p";
      const content = match[2].replace(/<[^>]+>/g, "").trim();
      console.log("Found text element:", { type, content });
      if (content) {
        elements.push({ type, content });
      }
    } else if (match[3]) {
      // It's an img tag
      const src = match[3];
      console.log("Found image element:", { type: "img", src });
      elements.push({ type: "img", src });
    }
  }

  console.log("Parsed elements:", elements);
  return elements;
};

export const BookPDFDocument = ({
  title,
  contentHTML,
  names = [],
}: BookPDFDocumentProps) => {
  const elements = useMemo(() => parseHTMLContent(contentHTML), [contentHTML]);

  console.log("BookPDFDocument render - elements length:", elements.length);
  console.log(
    "BookPDFDocument render - first few elements:",
    elements.slice(0, 3),
  );

  return (
    <Document title={title} author="Love Writers" creator="Love Writers System">
      {/* Front matter: Title Page */}
      <Page size={[432, 648]} style={[styles.page, styles.titlePage]}>
        <View style={styles.titlePageContent}>
          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.authorName}>Autores Apaixonados</Text>
          {names.map((name, idx) => (
            <Text key={`name-${idx}`} style={styles.authorName}>
              {name}
            </Text>
          ))}
        </View>
        <Text style={styles.publisherName}>
          Editora Autores Apaixonados 2026
        </Text>
      </Page>

      {/* Front matter: Copyright Page */}
      <Page size={[432, 648]} style={[styles.page, styles.copyrightPage]}>
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightTitle}>{title}</Text>
          <Text style={styles.copyrightText}>
            por {names.join(", ")} {names.length > 0 ? "e " : ""}Autores
            Apaixonados
          </Text>
          <Text style={styles.copyrightText}>
            Publicado por Editora Autores Apaixonados
          </Text>
          <Text style={styles.copyrightText}>Ribeirão Preto – SP</Text>
          <Text style={styles.copyrightText}>
            Copyright © 2026 Autores Apaixonados
          </Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={styles.copyrightText}>
            Todos os direitos reservados. Este livro não deve ser reproduzido
            sem a permissão do autor, nem partes e nem na íntegra, exceto por
            formas previstas no ordenamento jurídico Brasileiro. Para permissões
            de uso contate: ola@autoresapaixonados.com
          </Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={styles.copyrightText}>Capa por Autores Apaixonados</Text>
          <Text style={styles.copyrightText}>Impresso no Brasil</Text>
        </View>
      </Page>

      {/* Main Content */}
      <Page size={[432, 648]} style={styles.page} wrap={true}>
        {elements.length === 0 && (
          <View style={styles.debugBox}>
            <Text>No content found in elements array.</Text>
          </View>
        )}
        {elements.map((el, index) => {
          if (el.type === "h2") {
            return (
              <Text key={`h2-${index}`} style={styles.titleText}>
                {el.content}
              </Text>
            );
          }

          if (el.type === "img" && el.src) {
            return (
              <Image key={`img-${index}`} src={getProxyUrl(el.src)} style={styles.contentImage} />
            );
          }

          const isFirstOrAfterTitle =
            index === 0 || elements[index - 1]?.type === "h2";

          return (
            <Text
              key={`p-${index}`}
              style={
                isFirstOrAfterTitle
                  ? styles.indentedParagraphText
                  : styles.paragraphText
              }
            >
              {el.content}
            </Text>
          );
        })}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => {
            const current = pageNumber - 2;
            const total = (totalPages || 0) - 2;
            return total > 0 ? `${current} / ${total}` : "";
          }}
          fixed
        />
      </Page>
    </Document>
  );
};
