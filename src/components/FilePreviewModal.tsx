import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  Calendar,
  HardDrive,
  UserCheck,
  Tag,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { VaultFile } from '../types';
import { formatFileSize, formatDate, triggerFileDownload } from '../lib/storage';
import { getFileCategoryIcon } from '../lib/fileIcons';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onDelete: (file: VaultFile) => void;
}

export function FilePreviewModal({
  file,
  onClose,
  onDelete,
}: FilePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;

  const { Icon, color, bg, label } = getFileCategoryIcon(file.type, file.name);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?client=${encodeURIComponent(file.clientName)}&file=${encodeURIComponent(file.id)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await triggerFileDownload(file.id, file.name, file.type, file.previewDataUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {label} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content Area */}
        <div className="p-6 space-y-6">
          {file.previewDataUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center max-h-72">
              <img
                src={file.previewDataUrl}
                alt={file.name}
                className="max-h-72 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl p-8 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <div className={`w-16 h-16 rounded-2xl border mx-auto flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {file.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Full fidelity binary file ({file.type || 'Unknown MIME'})
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                Target Client
              </span>
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {file.clientName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                Category
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {file.category}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                File Size
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatFileSize(file.size)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                Uploaded
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          {/* Notes if present */}
          {file.notes && (
            <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300 block mb-1">
                Client Notes
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {file.notes}
              </p>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted and isolated in client vault</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(file);
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer"
          >
            Delete File
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Preparing...' : 'Download File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
