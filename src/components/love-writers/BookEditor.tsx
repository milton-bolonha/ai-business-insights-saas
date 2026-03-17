"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

interface BookEditorProps {
  bookId: string;
  initialContent: string;
  isReadOnly?: boolean;     // Agora sempre true na prática
  isAIGenerating?: boolean; // Mantido na prop interface por segurança legada
  onEditorReady?: (editor: any) => void;
}

const PAGE_H = 794;  // altura total A5 (px)
const PAGE_W = 560;  // largura total A5 (px)
const MARGIN_V = 73;   // margem sup/inf
const MARGIN_H = 48;   // margem esq/dir
const LINE_H = 24;   // grid base — todos os espaços são múltiplos disto

export function BookEditor({
  initialContent,
  isReadOnly = true,
  onEditorReady,
}: BookEditorProps) {

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const viewportRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable: !isReadOnly, // Sempre false agora
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "book-tiptap focus:outline-none",
      },
      handleScrollToSelection: () => {
        // Ignorar scroll para selecao
        return true;
      }
    },
    onUpdate: () => {
      // Read-only, no update expected, mas se rodar, chamamos calculate
      calculateTotalPages();
    },
  });

  const calculateTotalPages = () => {
    if (!viewportRef.current) return;
    const wrapper = viewportRef.current.querySelector(".tiptap-content-wrapper") as HTMLElement | null;
    if (!wrapper) return;

    // wrapper.scrollHeight pega o tamanho total em pixels do documento.
    // Como a viewport não tem padding e o margin-bottom não colapsa pra fora do wrapper,
    // dividir pela altura EXATA da folha A5 (794px) dá o total de páginas com exatidão.
    const count = Math.ceil(wrapper.scrollHeight / PAGE_H);
    setTotalPages(Math.max(1, count));
  };

  // Calcula qts paginas tem quando a montagem/conteúdo termina
  useEffect(() => {
    if (editor) {
      // Um tempinho pro DOM do Tiptap realmente renderizar
      setTimeout(() => calculateTotalPages(), 100);
    }
  }, [editor?.getHTML()]);


  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // A Mágica do TranslateY: 
  // O visor é fixo. Movemos o conteúdo inteiro pra cima num múltiplo certinho de 794px.
  // Como o editor e usuario não estão digitando, ele NUNCA sai do lugar sozinho.
  const translateAmount = (currentPage - 1) * PAGE_H;

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="w-full flex flex-col gap-6 relative items-center">

      {/* Estilos */}
      <style dangerouslySetInnerHTML={{
        __html: `

        /* VIEWPORT — A "janela" burra e fixa que corta tudo fora do A5 (560x794) */
        .tiptap-viewport {
          width: ${PAGE_W}px;
          height: ${PAGE_H}px;
          overflow: hidden;
          background: white;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          position: relative;
          
          /* Sem padding!! As margens vão direto pro Editor lá dentro. */
          padding: 0;
          margin: 0 auto;
        }

        /* WRAPPER — A fita que roda pra cima e pra baixo suavemente */
        .tiptap-content-wrapper {
          transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1);
          width: 100%;
          /* Margin zerado. Só transform importa. */
          margin: 0;
        }

          /* ReadOnly! Não queremos overflow auto, a div estica até o fim das palavras */
          overflow: hidden !important; 
        }

        @font-face {
          font-family: 'Palatino';
          src: url('/fonts/Palatino.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        /* EDITOR — Aqui botamos o Padding (As Margens Brancas do Livro) */
        .book-tiptap {
          width: 100%;
          box-sizing: border-box;
          
          /* Margens da página inteiras (Superior, Inferior, Laterais) no container de texto bruto */
          padding: ${MARGIN_V}px ${MARGIN_H}px;
          
          outline: none !important;
          font-size: 16px;
          line-height: ${LINE_H}px;
          color: #1a1a1a;
          font-family: 'Palatino', 'Montserrat Variable', sans-serif;
          text-align: justify;
          word-break: break-word;
          
          /* ReadOnly! Não queremos overflow auto, a div estica até o fim das palavras */
          overflow: hidden !important; 
        }

        /* 
         * PARÁGRAFOS e TIPOGRAFIA
         * O line-height e o margin-bottom são super rigorosos pra casar os 648px (27 linhas) exatos
         */
        .book-tiptap p {
          margin: 0;
          margin-bottom: ${LINE_H}px;
          padding: 0;
          line-height: ${LINE_H}px;
        }

        /* Recuo na primeira linha da história ou pós-Títulos */
        .book-tiptap p:first-child,
        .book-tiptap h1 + p,
        .book-tiptap h2 + p {
          text-indent: ${LINE_H}px;
        }

        /* TÍTULOS (H2/H1)
         * Usamos padding-top ao invés de margin-top, caso bata numa margem e colapse.
         */
        .book-tiptap h2 {
          font-family: 'Oswald Bold', sans-serif;
          font-weight: 700;
          font-size: 21px;
          line-height: ${LINE_H}px;
          text-align: center;
          letter-spacing: 0.05em;
          color: #1a1a1a;
          margin: 0;
          padding-top: ${LINE_H * 2}px;
          margin-bottom: ${LINE_H * 2}px;
        }

        .book-tiptap h1 {
          font-family: 'Montserrat Variable', sans-serif;
          font-weight: 700;
          font-size: 29px;
          line-height: ${LINE_H * 2}px;
          text-align: center;
          color: #1a1a1a;
          margin: 0;
          padding-top: ${LINE_H * 2}px;
          margin-bottom: ${LINE_H * 2}px;
        }

        .book-tiptap *::selection {
          background: rgba(236, 72, 153, 0.4);
        }

      `}} />

      {/* Editor Viewer Paginated (The "Window") */}
      <div className="tiptap-viewport" ref={viewportRef}>
        <div
          className="tiptap-content-wrapper"
          style={{ transform: `translateY(-${translateAmount}px)` }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Paginador Horizontal */}
      <div className="flex justify-center items-center gap-2 py-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xs"
        >
          FIRST
        </button>
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xs"
        >
          PREV
        </button>

        <div className="flex gap-1">
          {getPageNumbers().map(num => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === num
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-200 scale-110"
                  : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xs"
        >
          NEXT
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xs"
        >
          LAST
        </button>

        <div className="ml-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          Page {currentPage} of {totalPages}
        </div>
      </div>

    </div>
  );
}
