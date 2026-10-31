/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ContentBlock } from '../../types';
import { ZoomIn, X, Info, FileSpreadsheet, BarChart2 } from 'lucide-react';

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  title?: string;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ blocks, title }) => {
  const [zoomedImage, setZoomedImage] = useState<{ url: string; caption?: string } | null>(null);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {title && (
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
          {title}
        </h3>
      )}

      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return (
              <h4
                key={block.id || idx}
                className="text-base font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2"
              >
                <span className="w-1.5 h-4 bg-emerald-600 rounded-sm inline-block" />
                {block.content}
              </h4>
            );

          case 'text':
            return (
              <div
                key={block.id || idx}
                className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans"
              >
                {block.content}
              </div>
            );

          case 'image':
            return (
              <div key={block.id || idx} className="my-4">
                <div
                  className="relative group border border-slate-200 rounded bg-slate-50 overflow-hidden cursor-pointer max-w-lg mx-auto"
                  onClick={() => setZoomedImage({ url: block.content, caption: block.caption })}
                >
                  <img
                    src={block.content}
                    alt={block.caption || '問題図版'}
                    className="w-full max-h-80 object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                    onError={(e) => {
                      // Fallback placeholder if broken URL
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                    <ZoomIn className="w-4 h-4" />
                    クリックして拡大
                  </div>
                </div>
                {block.caption && (
                  <p className="text-xs text-center text-slate-500 mt-1.5 font-medium">
                    {block.caption}
                  </p>
                )}
              </div>
            );

          case 'table':
            return (
              <div key={block.id || idx} className="my-4 overflow-x-auto">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{block.content || '【表資料】'}</span>
                </div>
                {block.tableData ? (
                  <table className="min-w-full text-xs text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        {block.tableData.headers.map((h, hIdx) => (
                          <th key={hIdx} className="border border-slate-200 px-3 py-2">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {block.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-200 px-3 py-2 text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono rounded overflow-x-auto">
                    {block.content}
                  </pre>
                )}
                {block.caption && (
                  <p className="text-xs text-slate-500 mt-1">{block.caption}</p>
                )}
              </div>
            );

          case 'graph':
            return (
              <div key={block.id || idx} className="my-4 p-4 border border-slate-200 rounded bg-white">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    <span>{block.graphData?.title || block.content || 'グラフデータ'}</span>
                  </div>
                  {block.graphData?.yAxisLabel && (
                    <span className="text-[11px] text-slate-500">
                      Y軸: {block.graphData.yAxisLabel}
                    </span>
                  )}
                </div>

                {block.graphData ? (
                  <div className="space-y-3">
                    {/* SVG Chart */}
                    <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-l border-slate-300 relative bg-slate-50/50">
                      {block.graphData.labels.map((lbl, lIdx) => {
                        return (
                          <div
                            key={lIdx}
                            className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
                          >
                            <div className="w-full flex items-end justify-center gap-1.5 h-full">
                              {block.graphData?.series.map((ser, sIdx) => {
                                const val = ser.values[lIdx] ?? 0;
                                // find max
                                const allVals = block.graphData?.series.flatMap((s) => s.values) || [1];
                                const maxVal = Math.max(...allVals, 1);
                                const heightPercent = Math.min(100, Math.max(8, (val / maxVal) * 90));
                                const barColor = ser.color || (sIdx === 0 ? '#10b981' : '#3b82f6');

                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      height: `${heightPercent}%`,
                                      backgroundColor: barColor,
                                    }}
                                    className="w-full max-w-[24px] rounded-t transition-all hover:brightness-110 relative"
                                    title={`${ser.name}: ${val}`}
                                  >
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] text-slate-600 truncate max-w-full text-center mt-1">
                              {lbl}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-1">
                      {block.graphData.series.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-xs"
                            style={{ backgroundColor: s.color || (sIdx === 0 ? '#10b981' : '#3b82f6') }}
                          />
                          <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{block.content}</p>
                )}
                {block.caption && (
                  <p className="text-xs text-slate-500 mt-2 text-center">{block.caption}</p>
                )}
              </div>
            );

          case 'formula':
            return (
              <div
                key={block.id || idx}
                className="my-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded text-center text-sm font-mono text-emerald-950"
              >
                {block.content}
                {block.caption && (
                  <div className="text-[11px] text-emerald-800 font-sans mt-1">
                    {block.caption}
                  </div>
                )}
              </div>
            );

          case 'note':
            return (
              <div
                key={block.id || idx}
                className="my-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r text-xs text-amber-900 leading-relaxed flex items-start gap-2"
              >
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 whitespace-pre-wrap">{block.content}</div>
              </div>
            );

          case 'divider':
            return <hr key={block.id || idx} className="my-4 border-slate-200" />;

          default:
            return (
              <div key={block.id || idx} className="text-sm text-slate-800">
                {block.content}
              </div>
            );
        }
      })}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl p-3 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-slate-700">
                {zoomedImage.caption || '図表拡大表示'}
              </span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.caption || '拡大画像'}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            {zoomedImage.caption && (
              <p className="text-xs text-center text-slate-600 mt-2 font-medium">
                {zoomedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
