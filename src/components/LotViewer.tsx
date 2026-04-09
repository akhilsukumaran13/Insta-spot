import React from 'react';
import { motion } from 'motion/react';

interface Element {
  id: string;
  type: 'slot' | 'entrance' | 'exit' | 'wall';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

interface LotViewerProps {
  layout: Element[];
  bookedSlots: string[];
  selectedSlot: string | null;
  onSelectSlot: (label: string) => void;
}

export default function LotViewer({ layout, bookedSlots, selectedSlot, onSelectSlot }: any) {
  // Safety check for layout
  if (!Array.isArray(layout) || layout.length === 0) return null;

  // Calculate content dimensions with safety checks
  const maxX = Math.max(...layout.map((el: any) => (Number(el.x) || 0) + (Number(el.width) || 0)), 800);
  const maxY = Math.max(...layout.map((el: any) => (Number(el.y) || 0) + (Number(el.height) || 0)), 500);

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-xl overflow-auto border border-slate-700 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
      <div 
        className="relative"
        style={{ width: maxX + 100, height: maxY + 100 }}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {layout.map((el: any) => {
            // Skip invalid elements
            if (!el || typeof el.x !== 'number' || typeof el.y !== 'number') return null;

            const isBooked = el.type === 'slot' && el.label && bookedSlots.includes(el.label);
            const isSelected = el.type === 'slot' && el.label === selectedSlot;

            return (
            <motion.div
                key={el.id}
                initial={{ x: el.x, y: el.y, rotate: el.rotation || 0 }}
                className="absolute flex items-center justify-center"
                style={{ 
                    left: 0, top: 0,
                    x: el.x, y: el.y,
                    width: el.width || 50, height: el.height || 80
                }}
                onClick={() => {
                    if (el.type === 'slot' && el.label && !isBooked) {
                        onSelectSlot(el.label);
                    }
                }}
            >
                {/* Visuals based on type */}
                {el.type === 'slot' && (
                    <div 
                        className={`
                            w-full h-full border-2 rounded-lg flex items-center justify-center relative transition-all cursor-pointer shadow-lg
                            ${isBooked 
                                ? 'bg-red-900/50 border-red-500 text-red-400 cursor-not-allowed' 
                                : isSelected 
                                    ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' 
                                    : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50 hover:border-emerald-400'
                            }
                        `}
                    >
                        <span className="font-bold text-xs">{el.label}</span>
                        <div className={`absolute top-0 w-full h-[10%] ${isBooked ? 'bg-red-500/50' : 'bg-slate-600/30'}`}></div>
                        
                        {/* Car Icon if booked */}
                        {isBooked && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                {/* Simple Car Shape */}
                                <div className="w-[60%] h-[70%] bg-red-500 rounded-sm"></div>
                            </div>
                        )}
                    </div>
                )}
                {el.type === 'entrance' && (
                    <div className="w-full h-full bg-emerald-900/50 border border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Entrance</span>
                    </div>
                )}
                {el.type === 'exit' && (
                    <div className="w-full h-full bg-red-900/50 border border-red-500 flex items-center justify-center shadow-lg shadow-red-900/20">
                        <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Exit</span>
                    </div>
                )}
                {el.type === 'wall' && (
                    <div className="w-full h-full bg-slate-600 rounded-full shadow-md"></div>
                )}
            </motion.div>
            );
        })}
      </div>
    </div>
  );
}
