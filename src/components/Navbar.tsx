/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  BookOpen,
  PenTool,
  TrendingUp,
  Settings,
  Sparkles,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { TargetDifficulty, TARGET_DIFFICULTIES } from '../types';

export type NavTab = 'home' | 'knowledge' | 'standard' | 'analytics' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  dueCardsCount: number;
  aiStudioUrl: string;
  targetDifficulty?: TargetDifficulty;
  onChangeDifficulty?: (difficulty: TargetDifficulty) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  dueCardsCount,
  aiStudioUrl,
  targetDifficulty = '北大前期',
  onChangeDifficulty,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'ホーム', icon: Home },
    {
      id: 'knowledge' as NavTab,
      label: '知識論述部門',
      icon: BookOpen,
      badge: dueCardsCount > 0 ? dueCardsCount : undefined,
    },
    { id: 'standard' as NavTab, label: '通常の論述問題部門', icon: PenTool },
    { id: 'analytics' as NavTab, label: '学習分析', icon: TrendingUp },
    { id: 'settings' as NavTab, label: '設定・データ管理', icon: Settings },
  ];

  const handleOpenAIStudio = () => {
    window.open(aiStudioUrl || 'https://aistudio.google.com/u/2/prompts/new_chat', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & App Title */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-8 h-8 rounded bg-emerald-700 flex items-center justify-center text-white shadow-2xs transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>大学受験生物 論述学習システム</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                難関大学 二次記述・論述総合対策
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="bg-red-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions: Target Difficulty Selector & Google AI Studio */}
          <div className="flex items-center gap-2">
            {/* Common Target Difficulty Selector */}
            <div
              className="flex items-center gap-1.5 bg-emerald-50/70 hover:bg-emerald-100/60 border border-emerald-200/80 rounded-md px-2.5 py-1 transition-colors"
              title="全プロンプト共通の想定難易度設定"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-tight leading-none hidden sm:block">
                  想定難易度
                </span>
                <select
                  value={targetDifficulty}
                  onChange={(e) => onChangeDifficulty?.(e.target.value as TargetDifficulty)}
                  className="bg-transparent font-bold text-emerald-950 text-xs focus:outline-none cursor-pointer pr-1 leading-tight"
                >
                  {TARGET_DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* External Google AI Studio Link Button */}
            <button
              onClick={handleOpenAIStudio}
              title="Google AI Studioを新規タブで開く"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Google AI Studio</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Row */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto border-t border-slate-100 py-2 gap-1 scrollbar-none text-[11px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 min-w-[70px] flex flex-col items-center py-1 px-1 rounded transition-colors relative ${
                  isActive ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[75px]">{tab.label.replace('部門', '')}</span>
                {tab.badge !== undefined && (
                  <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
