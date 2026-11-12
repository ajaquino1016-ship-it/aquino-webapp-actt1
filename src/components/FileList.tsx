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

interface FileListProps {
  files: VaultFile[];
  onDeleteFile: (file: VaultFile) => void;
  onPreviewFile: (file: VaultFile) => void;
  onOpenUpload: () => void;
}

export function FileList({
  files,
  onDeleteFile,
  onPreviewFile,
  onOpenUpload,
}: FileListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopyLink = (file: VaultFile) => {
    // Generate simulated secure client access link
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
          No files found in this vault view
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          Upload your client deliverables, project assets, invoices, or brand materials to get started.
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4 sm:px-6">File Name</th>
              <th className="py-3.5 px-4">Client</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">File Size</th>
              <th className="py-3.5 px-4">Upload Date</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {files.map((file) => {
              const { Icon, color, bg } = getFileCategoryIcon(file.type, file.name);
              const isCopied = copiedId === file.id;
              const isDownloading = downloadingId === file.id;

              return (
                <tr
                  key={file.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* File Name + Icon */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-red-700 dark:hover:text-red-400 transition truncate block text-left cursor-pointer"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                        {file.notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={file.notes}>
                            {file.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Client Tag */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <UserCheck className="w-3 h-3 text-red-700 dark:text-red-400" />
                      <span className="truncate max-w-[120px]">{file.clientName}</span>
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                      {file.category}
                    </span>
                  </td>

                  {/* File Size */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {formatFileSize(file.size)}
                    </span>
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(file.createdAt)}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Preview Button */}
                      <button
                        onClick={() => onPreviewFile(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Preview file details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                        title="Download original file"
                      >
                        <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-red-600' : ''}`} />
                      </button>

                      {/* Share Link Button */}
                      <button
                        onClick={() => handleCopyLink(file)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isCopied
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isCopied ? 'Link copied!' : 'Copy client share link'}
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      </button>

                      {/* Delete File Button */}
                      <button
                        onClick={() => onDeleteFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
