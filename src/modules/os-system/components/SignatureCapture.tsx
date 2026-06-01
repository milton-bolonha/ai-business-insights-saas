import React, { useRef, useState } from 'react';

interface SignatureCaptureProps {
  onCapture: (signatureDataUrl: string) => void;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({ onCapture }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(
      'touches' in e ? e.touches[0].clientX - canvas.getBoundingClientRect().left : e.clientX - canvas.getBoundingClientRect().left,
      'touches' in e ? e.touches[0].clientY - canvas.getBoundingClientRect().top : e.clientY - canvas.getBoundingClientRect().top
    );
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(
      'touches' in e ? e.touches[0].clientX - canvas.getBoundingClientRect().left : e.clientX - canvas.getBoundingClientRect().left,
      'touches' in e ? e.touches[0].clientY - canvas.getBoundingClientRect().top : e.clientY - canvas.getBoundingClientRect().top
    );
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onCapture(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
      <h4 className="text-sm font-medium text-gray-800 mb-2">Assinatura do Cliente</h4>
      <div className="border-2 border-dashed border-gray-300 rounded bg-gray-50 mb-3 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-[150px] cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 font-medium">
            Assine aqui
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button 
          onClick={clearCanvas}
          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Limpar
        </button>
        <button 
          onClick={handleConfirm}
          disabled={!hasSignature}
          className="px-4 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-gray-300"
        >
          Salvar Assinatura
        </button>
      </div>
    </div>
  );
};
