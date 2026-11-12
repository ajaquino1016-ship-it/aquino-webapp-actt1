import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Eye,
  Share2,
  Check,
  Calendar,
  HardDrive,
  UserCheck,
  FolderOpen,
} from 'lucide-react';
import { VaultFile } from '../types';
import { formatFileSize, formatDate, triggerFileDownload } from '../lib/storage';
import { getFileCategoryIcon } from '../lib/fileIcons';

interface FileGridProps {
  files: VaultFile[];
  onDeleteFile: (file: VaultFile) => void;
  onPreviewFile: (file: VaultFile) => void;
  onOpenUpload: () => void;
}

export function FileGrid({
  files,
  onDeleteFile,
  onPreviewFile,
  onOpenUpload,
}: FileGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopyLink = (file: VaultFile) => {
    const shareUrl = `${window.location.origin}?client=${encodeURIComponent(file.clientName)}&file=${encodeURIComponent(file.id)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownload = async (file: VaultFile) => {
    setDownloadingId(file.id);
    try {
      await triggerFileDownload(file.id, file.name, file.type, file.previewDataUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-400 mx-auto flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/50">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No files in this view
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          Upload project assets, deliverables, and documents for your clients.
        </p>
        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-semibold text-xs sm:text-sm shadow-md transition cursor-pointer"
        >
          Upload Your First File
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => {
        const { Icon, color, bg, label } = getFileCategoryIcon(file.type, file.name);
        const isCopied = copiedId === file.id;
        const isDownloading = downloadingId === file.id;

        return (
          <div
            key={file.id}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900/60 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden"
          >
            {/* Top Preview/Visual Box */}
            <div
              onClick={() => onPreviewFile(file)}
              className="h-36 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-center relative cursor-pointer overflow-hidden p-3"
            >
              {file.previewDataUrl ? (
                <img
                  src={file.previewDataUrl}
                  alt={file.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              )}

              {/* Client Tag Pill */}
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  {file.clientName}
                </span>
              </div>

              {/* Category Pill */}
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-900/80 text-white backdrop-blur-xs shadow-2xs">
                  {file.category}
                </span>
              </div>
            </div>

            {/* Bottom Meta & Action Area */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => onPreviewFile(file)}
                  className="font-bold text-sm text-slate-900 dark:text-white hover:text-red-700 dark:hover:text-red-400 transition truncate block text-left w-full cursor-pointer"
                  title={file.name}
                >
                  {file.name}
                </button>

                {file.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" title={file.notes}>
                    {file.notes}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    {formatFileSize(file.size)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(file.createdAt)}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={isDownloading}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Download file"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-red-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleCopyLink(file)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isCopied
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isCopied ? 'Link copied!' : 'Copy client share link'}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onDeleteFile(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
