import React from 'react';
import { AppTab } from '../types/lms';

interface TopBarProps {
  activeTab: AppTab;
  isAdmin: boolean;
  onSelectTab: (tab: AppTab) => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
}

const NAV_ITEMS: { id: AppTab; label: string; adminOnly?: boolean }[] = [
  { id: 'catalog', label: 'Paket Belajar' },
  { id: 'workspace', label: 'Ruang Belajar' },
  { id: 'analytics', label: 'Analitik Skor' },
  { id: 'admin', label: 'Dashboard Admin', adminOnly: true },
  { id: 'architecture', label: 'Arsitektur LMS' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  isAdmin,
  onSelectTab,
  onPrimaryAction,
  primaryActionLabel,
}) => {
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('catalog')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Lentera Akademi
        </button>

        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-7"
        >
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-blue-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Navigasi Mobile"
        className="flex md:hidden items-center justify-between gap-2 px-4 py-2 border-t border-slate-100 overflow-x-auto"
      >
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
