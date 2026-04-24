import React, { useRef, useEffect, useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    onCancel: () => void;
    title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, title }) => {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set display size
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        ctx.scale(ratio, ratio);

        ctx.strokeStyle = '#111827'; // gray-900
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        setHasStarted(true);
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasStarted(false);
        }
    };

    const save = () => {
        if (!hasStarted) return;
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{title || t('signature')}</h3>
                        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {t('pleaseSignBelow')}
                    </p>
                </div>

                <div className="px-6 relative group">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-crosshair touch-none"
                    />
                    {!hasStarted && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 bg-gray-50/50 rounded-2xl m-6 mt-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Sign Here</span>
                        </div>
                    )}
                </div>

                <div className="p-6 flex gap-3">
                    <button 
                        onClick={clear}
                        className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <RotateCcw size={14} /> Clear
                    </button>
                    <button 
                        onClick={save}
                        disabled={!hasStarted}
                        className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-200 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                    >
                        <Check size={14} /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
