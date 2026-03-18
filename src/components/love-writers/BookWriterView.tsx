"use client";

import { useBooks } from "@/lib/state/query/book.queries";
import { BookPDFDocument } from "./BookPDFDocument";
import { BookCoverDocument } from "./BookCoverDocument";
import { PDFViewer, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { Loader2, Download, X, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

interface BookWriterViewProps {
  workspaceId: string;
  bookId: string;
  onClose?: () => void;
  initialMode?: "create" | "library"; // Kept for interface compatibility
}

export function BookWriterView({
  workspaceId,
  bookId,
  onClose,
}: BookWriterViewProps) {
  const { data: books, isLoading } = useBooks(workspaceId);
  const currentDashboard = useWorkspaceStore((state) => state.currentDashboard);
  const [viewMode, setViewMode] = useState<"content" | "cover">("content");

  const contactNames = useMemo(() => {
    return currentDashboard?.contacts?.map((c) => c.name) || [];
  }, [currentDashboard]);

  const selectedBook = books?.find((b) => b._id === bookId) || null;

  // Clean initial content from any broken title markers
  const initialContentProcessed = selectedBook?.pages?.[0]?.content
    ? selectedBook.pages[0].content
        .replace(/\[TITLE\](.*?)\[END_TITLE\]/g, "<h2>$1</h2>")
        .replace(/\[TITLE\]/g, "")
        .replace(/\[END_TITLE\]/g, "")
    : "";

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{
    url: string;
    size: number;
  } | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Debug: Log content for troubleshooting
  useEffect(() => {
    if (selectedBook?.pages?.[0]?.content) {
      console.log("Raw content:", selectedBook.pages[0].content);
      console.log("Processed content:", initialContentProcessed);
      console.log("Content length:", initialContentProcessed.length);
    }
  }, [selectedBook, initialContentProcessed]);

  // Generate a PDF blob and expose it via an iframe URL for deterministic preview
  useEffect(() => {
    let cancelled = false;

    const buildDocument = () => {
      if (viewMode === "cover" && selectedBook?.coverImageUrl) {
        return (
          <BookCoverDocument
            title={selectedBook.title || "Book"}
            author="Autores Apaixonados"
            description={
              selectedBook.inspiration || "Uma história de amor apaixonante"
            }
            coverImageUrl={selectedBook.coverImageUrl}
            pageCount={selectedBook.pagesCountGoal || 100}
            coupleNames={{
              character1: contactNames[0] || "Personagem 1",
              character2: contactNames[1] || "Personagem 2",
            }}
          />
        );
      }

      return (
        <BookPDFDocument
          title={selectedBook?.title || "Book"}
          contentHTML={initialContentProcessed}
          names={contactNames}
        />
      );
    };

    const createPreview = async () => {
      setPreviewLoading(true);
      try {
        const blob = await pdf(buildDocument()).toBlob();
        console.log("PDF blob created", { size: blob.size, type: blob.type });
        if (cancelled) return;
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setPreviewInfo({ url, size: blob.size });
      } catch (error) {
        console.error("Error creating PDF preview:", error);
        setPreviewUrl(null);
        setPreviewInfo(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    createPreview();

    return () => {
      cancelled = true;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [
    viewMode,
    selectedBook?.coverImageUrl,
    selectedBook?.title,
    selectedBook?.inspiration,
    selectedBook?.pages,
    initialContentProcessed,
    contactNames,
  ]);

  const handleContainerClose = () => {
    onClose?.();
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-pink-500" />
      </div>
    );

  if (!selectedBook) {
    return (
      <div className="p-8 text-center text-gray-500">
        Book not found or loading...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-9999 bg-gray-100 flex flex-col animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={handleContainerClose}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight">
            {selectedBook?.title || "Book Generator"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setViewMode(viewMode === "content" ? "cover" : "content")
            }
            className="flex items-center border-2 border-gray-100 bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold cursor-pointer hover:shadow-sm"
          >
            {viewMode === "content" ? (
              <Eye className="w-4 h-4 mr-2" />
            ) : (
              <EyeOff className="w-4 h-4 mr-2" />
            )}
            {viewMode === "content" ? "Ver Capa" : "Ver Conteúdo"}
          </button>
          <PDFDownloadLink
            document={
              viewMode === "cover" && selectedBook?.coverImageUrl ? (
                <BookCoverDocument
                  title={selectedBook.title || "Book"}
                  author="Autores Apaixonados"
                  description={
                    selectedBook.inspiration ||
                    "Uma história de amor apaixonante"
                  }
                  coverImageUrl={selectedBook.coverImageUrl}
                  pageCount={selectedBook.pagesCountGoal || 100}
                  coupleNames={{
                    character1: contactNames[0] || "Personagem 1",
                    character2: contactNames[1] || "Personagem 2",
                  }}
                />
              ) : (
                <BookPDFDocument
                  title={selectedBook.title || "Book"}
                  contentHTML={initialContentProcessed}
                  names={contactNames}
                />
              )
            }
            fileName={`${selectedBook.title?.replace(/\s+/g, "_") || "Book"}_${viewMode === "cover" ? "capa" : "conteudo"}.pdf`}
            className="flex items-center border-2 border-gray-100 bg-white px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold cursor-pointer hover:shadow-sm"
          >
            {({ loading }) => (
              <>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {loading
                  ? "Preparando PDF..."
                  : `Exportar ${viewMode === "cover" ? "Capa" : "Conteúdo"}`}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden w-full h-full relative p-4 pb-8 items-center justify-center flex flex-col">
        <div className="w-full max-w-5xl h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          {previewLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="animate-spin text-pink-500" />
            </div>
          ) : previewUrl ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm">
                <div className="text-gray-600">
                  Preview gerado{" "}
                  {previewInfo
                    ? `(tamanho: ${Math.round(previewInfo.size / 1024)} KB)`
                    : ""}
                </div>
                {previewInfo && (
                  <a
                    href={previewInfo.url}
                    download={`${selectedBook.title?.replace(/\s+/g, "_") || "book"}_${viewMode === "cover" ? "capa" : "conteudo"}.pdf`}
                    className="text-pink-600 hover:text-pink-700"
                  >
                    Download
                  </a>
                )}
              </div>
              <iframe
                src={previewUrl}
                className="w-full h-[calc(100%-48px)] border-none"
                title="PDF Preview"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              Preview indisponível. Tente gerar novamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
