import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Trash2, RotateCw, Maximize2 } from 'lucide-react';

export interface Element {
  id: string;
  type: 'slot' | 'entrance' | 'exit' | 'wall';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

interface LotDesignerProps {
  layout: Element[];
  onChange: (layout: Element[]) => void;
}

export default function LotDesigner({ layout, onChange }: LotDesignerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addElement = (type: Element['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Auto-increment label for slots
    let label = '';
    if (type === 'slot') {
        const slotCount = layout.filter(e => e.type === 'slot').length;
        label = (slotCount + 1).toString();
    }

    let width = 50;
    let height = 80;

    if (type === 'entrance' || type === 'exit') {
        width = 100;
        height = 40;
    } else if (type === 'wall') {
        width = 150;
        height = 20;
    }

    onChange([
      ...layout,
      {
        id,
        type,
        x: 50, // Default start position
        y: 50,
        width,
        height,
        rotation: 0,
        label
      }
    ]);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    onChange(layout.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeElement = (id: string) => {
    onChange(layout.filter(e => e.id !== id));
    setSelectedId(null);
  };

  const selectedElement = layout.find(e => e.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      {/* Toolbar */}
      <div className="bg-slate-800 p-2 md:p-4 border-b border-slate-700 flex gap-2 md:gap-4 items-center overflow-x-auto shrink-0 z-10 no-scrollbar">
        <span className="text-slate-400 text-xs md:text-sm font-bold uppercase hidden md:inline">Tools:</span>
        <button onClick={() => addElement('slot')} className="px-2 py-1.5 md:px-3 md:py-2 bg-indigo-600 rounded-lg text-xs md:text-sm font-bold hover:bg-indigo-500 whitespace-nowrap">
            + Slot
        </button>
        <button onClick={() => addElement('entrance')} className="px-2 py-1.5 md:px-3 md:py-2 bg-emerald-600 rounded-lg text-xs md:text-sm font-bold hover:bg-emerald-500 whitespace-nowrap">
            + In
        </button>
        <button onClick={() => addElement('exit')} className="px-2 py-1.5 md:px-3 md:py-2 bg-red-600 rounded-lg text-xs md:text-sm font-bold hover:bg-red-500 whitespace-nowrap">
            + Out
        </button>
        <button onClick={() => addElement('wall')} className="px-2 py-1.5 md:px-3 md:py-2 bg-slate-600 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-500 whitespace-nowrap">
            + Wall
        </button>
        
        <div className="w-px h-6 md:h-8 bg-slate-700 mx-1 md:mx-2"></div>

        <button 
            onClick={() => selectedId && removeElement(selectedId)}
            disabled={!selectedId}
            className={`px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 whitespace-nowrap ${
                selectedId 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
            }`}
        >
            <Trash2 size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Delete Selected</span><span className="md:hidden">Del</span>
        </button>
      </div>

      {/* Canvas Container (Scrollable) */}
      <div className="flex-1 relative overflow-auto bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900" onClick={() => setSelectedId(null)}>
        {/* Large Canvas Area */}
        <div 
            ref={containerRef}
            className="relative min-w-[3000px] min-h-[3000px]" 
            style={{ 
                width: Math.max(3000, ...layout.map(el => el.x + el.width + 500)),
                height: Math.max(3000, ...layout.map(el => el.y + el.height + 500))
            }}
        >
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {layout.map((el) => (
            <DraggableElement 
                key={el.id} 
                element={el} 
                isSelected={selectedId === el.id}
                onSelect={() => setSelectedId(el.id)}
                onUpdate={(updates: any) => updateElement(el.id, updates)}
                containerRef={containerRef}
            />
            ))}
        </div>
      </div>
      
      {/* Properties Panel (Bottom) */}
      {selectedElement && (
          <div className="bg-slate-800 p-3 border-t border-slate-700 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400 font-bold uppercase">{selectedElement.type}</span>
                
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">W:</label>
                    <input 
                        type="number" 
                        value={selectedElement.width} 
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">H:</label>
                    <input 
                        type="number" 
                        value={selectedElement.height} 
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                    />
                </div>
                {selectedElement.type === 'slot' && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Label:</label>
                        <input 
                            type="text" 
                            value={selectedElement.label || ''} 
                            onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                            className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                        />
                    </div>
                )}
              </div>

              <div className="flex gap-2">
                  <button onClick={() => {
                      updateElement(selectedElement.id, { rotation: (selectedElement.rotation + 90) % 360 });
                  }} className="p-2 bg-slate-700 rounded hover:bg-slate-600" title="Rotate">
                      <RotateCw size={16} />
                  </button>
                  <button onClick={() => {
                      // Duplicate element
                      const newId = Math.random().toString(36).substr(2, 9);
                      let newLabel = selectedElement.label;
                      if (selectedElement.type === 'slot') {
                          const slotCount = layout.filter(e => e.type === 'slot').length;
                          newLabel = (slotCount + 1).toString();
                      }
                      
                      onChange([
                          ...layout,
                          {
                              ...selectedElement,
                              id: newId,
                              x: selectedElement.x + 20,
                              y: selectedElement.y + 20,
                              label: newLabel
                          }
                      ]);
                  }} className="p-2 bg-slate-700 rounded hover:bg-slate-600" title="Duplicate">
                      <span className="text-xs font-bold">+1</span>
                  </button>
                  <button onClick={() => removeElement(selectedElement.id)} className="p-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900" title="Delete">
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}

function DraggableElement({ element, isSelected, onSelect, onUpdate, containerRef }: any) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ x: element.x, y: element.y, rotate: element.rotation }}
            animate={{ rotate: element.rotation, width: element.width, height: element.height }}
            onDragEnd={(_, info) => {
                const newX = element.x + info.offset.x;
                const newY = element.y + info.offset.y;
                onUpdate({ x: newX, y: newY });
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            className={`absolute cursor-move flex items-center justify-center
                ${isSelected ? 'ring-2 ring-yellow-400 z-50' : 'z-10'}
            `}
            style={{
                left: 0, top: 0,
                x: element.x, 
                y: element.y,
                width: element.width,
                height: element.height
            }}
        >
            {/* Visuals based on type */}
            {element.type === 'slot' && (
                <div className="w-full h-full bg-slate-800 border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center relative">
                    <span className="text-slate-400 font-bold text-xs">{element.label}</span>
                    <div className="absolute top-0 w-full h-[10%] bg-slate-600/50"></div>
                </div>
            )}
            {element.type === 'entrance' && (
                <div className="w-full h-full bg-emerald-900/50 border border-emerald-500 flex items-center justify-center">
                    <span className="text-emerald-400 text-[10px] font-bold uppercase">Entrance</span>
                </div>
            )}
            {element.type === 'exit' && (
                <div className="w-full h-full bg-red-900/50 border border-red-500 flex items-center justify-center">
                    <span className="text-red-400 text-[10px] font-bold uppercase">Exit</span>
                </div>
            )}
            {element.type === 'wall' && (
                <div className="w-full h-full bg-slate-600"></div>
            )}
        </motion.div>
    );
}
