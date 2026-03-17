"use client";

import { useBooks } from "@/lib/state/query/book.queries";
import { BookPDFDocument } from "./BookPDFDocument";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2, Download, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

interface BookWriterViewProps {
    workspaceId: string;
    bookId: string;
    onClose?: () => void;
    initialMode?: "create" | "library"; // Kept for interface compatibility
}

export function BookWriterView({ workspaceId, bookId, onClose }: BookWriterViewProps) {
    const { data: books, isLoading } = useBooks(workspaceId);
    const currentDashboard = useWorkspaceStore(state => state.currentDashboard);

    const contactNames = useMemo(() => {
        return currentDashboard?.contacts?.map(c => c.name) || [];
    }, [currentDashboard]);

    const selectedBook = books?.find((b) => b._id === bookId) || null;

    // Clean initial content from any broken title markers
    const initialContentProcessed = selectedBook?.pages?.[0]?.content
        ? selectedBook.pages[0].content
            .replace(/\[TITLE\](.*?)\[END_TITLE\]/g, "<h2>$1</h2>")
            .replace(/\[TITLE\]/g, "")
            .replace(/\[END_TITLE\]/g, "")
        : "";

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

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    if (!selectedBook) {
        return <div className="p-8 text-center text-gray-500">Book not found or loading...</div>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-100 flex flex-col animate-in fade-in duration-200">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600" onClick={handleContainerClose}>
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold tracking-tight">{selectedBook?.title || "Book Generator"}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <PDFDownloadLink
                        document={<BookPDFDocument title={selectedBook.title || "Book"} contentHTML={initialContentProcessed} names={contactNames} />}
                        fileName={`${selectedBook.title?.replace(/\s+/g, '_') || 'Book'}.pdf`}
                        className="flex items-center border-2 border-gray-100 bg-white px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold cursor-pointer hover:shadow-sm"
                    >
                        {({ loading }) => (
                            <>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {loading ? 'Preparing PDF...' : 'Export PDF'}
                            </>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-hidden w-full h-full relative p-4 pb-8 items-center justify-center flex flex-col">
                <div className="w-full max-w-5xl h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                    <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                        <BookPDFDocument title={selectedBook.title || "Book"} contentHTML={initialContentProcessed} names={contactNames} />
                    </PDFViewer>
                </div>
            </div>
        </div>
    );
}
