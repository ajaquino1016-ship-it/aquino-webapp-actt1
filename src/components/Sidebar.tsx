import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ShieldCheck,
  FolderLock,
  Files,
  FileCheck2,
  FileText,
  Palette,
  Layers,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  HardDrive,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { FileCategory } from '../types';
import { formatFileSize } from '../lib/storage';

interface SidebarProps {
  currentCategory: FileCategory | 'All';
  onSelectCategory: (cat: FileCategory | 'All') => void;
  selectedClient: string | 'All';
  onSelectClient: (client: string | 'All') => void;
  clientNames: string[];
  totalFilesCount: number;
  totalStorageBytes: number;
  onOpenClientDropPortal: () => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentCategory,
  onSelectCategory,
  selectedClient,
  onSelectClient,
  clientNames,
  totalFilesCount,
  totalStorageBytes,
  onOpenClientDropPortal,
  isOpenOnMobile,
  onCloseMobile,
}: SidebarProps) {
  const { user, userProfile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navItems: { label: string; category: FileCategory | 'All'; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'All Files', category: 'All', icon: Files },
    { label: 'Deliverables', category: 'Deliverables', icon: FileCheck2 },
    { label: 'Contracts & Invoices', category: 'Contracts & Invoices', icon: FileText },
    { label: 'Brand Assets', category: 'Brand Assets', icon: Palette },
    { label: 'Drafts & Revisions', category: 'Drafts & Revisions', icon: Layers },
  ];

  // Storage limit representation (e.g. 5GB free tier display)
  const maxStorage = 5 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(100, Math.max(1, (totalStorageBytes / maxStorage) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Dark Red Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#3b0808] via-[#4c0d13] to-[#2d0505] text-white flex flex-col justify-between border-r border-red-950/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-5 border-b border-red-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-700 to-rose-600 flex items-center justify-center shadow-lg border border-red-400/30 text-white">
                <ShieldCheck className="w-5 h-5 text-red-50" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  AVault
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-950/40" title="System Online & Protected" />
                </span>
                <p className="text-[10px] uppercase tracking-widest text-red-300 font-semibold">Client File Portal</p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700/30 text-red-200 transition cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-red-200" />}
            </button>
          </div>

          {/* Quick Client Drop Portal Banner */}
          <button
            onClick={() => {
              onOpenClientDropPortal();
              onCloseMobile();
            }}
            className="w-full mt-4 p-2.5 rounded-xl bg-gradient-to-r from-red-900/70 to-rose-950/80 hover:from-red-800 hover:to-rose-900 border border-red-500/30 text-left transition flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-red-800/80 text-red-200 group-hover:scale-105 transition-transform">
                <FolderLock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-red-100 flex items-center gap-1">
                  Client Drop Portal
                  <Sparkles className="w-3 h-3 text-amber-400 inline" />
                </p>
                <p className="text-[10px] text-red-300/80">Simulate client upload view</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-red-300/70 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Categories */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-red-300/70">
              Vault Categories
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentCategory === item.category && selectedClient === 'All';
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onSelectCategory(item.category);
                      onSelectClient('All');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-red-800/90 text-white shadow-md font-semibold border border-red-600/40'
                        : 'text-red-200/80 hover:bg-red-900/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-red-200' : 'text-red-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.category === 'All' && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-red-950/80 text-red-200 border border-red-800/60">
                        {totalFilesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Client Filter List */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-300/70 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-red-400" />
                Active Clients
              </p>
              {selectedClient !== 'All' && (
                <button
                  onClick={() => onSelectClient('All')}
                  className="text-[10px] text-red-300 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {clientNames.length === 0 ? (
              <p className="px-3 text-xs text-red-300/50 italic">No clients yet. Upload files to add clients.</p>
            ) : (
              <div className="space-y-1">
                {clientNames.map((client) => {
                  const isSelected = selectedClient === client;
                  return (
                    <button
                      key={client}
                      onClick={() => {
                        onSelectClient(client);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-red-800/90 text-white font-semibold border border-red-600/40 shadow-sm'
                          : 'text-red-200/80 hover:bg-red-900/40 hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{client}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-red-400/60'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Storage Quota Card */}
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/40">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-red-200 font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-red-400" />
                Storage Used
              </span>
              <span className="text-[11px] font-semibold text-white">
                {formatFileSize(totalStorageBytes)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-red-950 rounded-full overflow-hidden border border-red-900/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-rose-400 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, storagePercentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-red-300/60 mt-1.5 flex justify-between">
              <span>{totalFilesCount} total deliverables</span>
              <span>Unlimited Tier</span>
            </p>
          </div>
        </div>

        {/* Footer: User Profile & Sign Out */}
        <div className="p-4 border-t border-red-900/40 bg-red-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-red-800 border border-red-600/60 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {userProfile?.displayName || user?.displayName || 'Creative Designer'}
                </p>
                <p className="text-[10px] text-red-300/70 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-200 hover:text-white transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
