import React from 'react';
import {
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  FileQuestion,
  File,
} from 'lucide-react';

export function getFileCategoryIcon(type: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
    return {
      Icon: FileImage,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
      label: 'Image',
    };
  }

  if (type.includes('pdf') || ext === 'pdf') {
    return {
      Icon: FileText,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50',
      label: 'PDF',
    };
  }

  if (
    type.includes('zip') ||
    type.includes('tar') ||
    type.includes('gzip') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return {
      Icon: FileArchive,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
      label: 'Archive',
    };
  }

  if (
    type.includes('sheet') ||
    type.includes('excel') ||
    ['csv', 'xlsx', 'xls'].includes(ext)
  ) {
    return {
      Icon: FileSpreadsheet,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
      label: 'Sheet',
    };
  }

  if (
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('html') ||
    ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css'].includes(ext)
  ) {
    return {
      Icon: FileCode,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
      label: 'Code',
    };
  }

  if (type.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac'].includes(ext)) {
    return {
      Icon: FileAudio,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50',
      label: 'Audio',
    };
  }

  if (type.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi'].includes(ext)) {
    return {
      Icon: FileVideo,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
      label: 'Video',
    };
  }

  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return {
      Icon: FileText,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50',
      label: 'Document',
    };
  }

  return {
    Icon: File,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    label: ext ? ext.toUpperCase() : 'File',
  };
}
