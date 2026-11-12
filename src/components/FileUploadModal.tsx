import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCheck2,
  FolderPlus,
  Tag,
  AlertCircle,
  FileUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { saveFileBlob, formatFileSize } from '../lib/storage';
import { FileCategory, VaultFile } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientNames: string[];
  defaultClient?: string;
  defaultCategory?: FileCategory | 'All';
  onFileUploaded: (file: VaultFile) => void;
}

export function FileUploadModal({
  isOpen,
  onClose,
  clientNames,
  defaultClient,
  defaultCategory,
  onFileUploaded,
}: FileUploadModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>(
    defaultClient && defaultClient !== 'All' ? defaultClient : (clientNames[0] || 'Acme Studio')
  );
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [category, setCategory] = useState<FileCategory>(
    defaultCategory && defaultCategory !== 'All' ? defaultCategory : 'Deliverables'
  );
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    // If image, create thumbnail
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Keep thumbnail lightweight (<20KB for Firestore schema compliance if stored)
        setPreviewThumb(result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewThumb(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be signed in to upload files.');
      return;
    }
    if (!selectedFile) {
      setErrorMsg('Please choose a file to upload.');
      return;
    }

    const trimmedClient = clientName.trim();
    if (!trimmedClient) {
      setErrorMsg('Please specify a client name for this file.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 100);

    try {
      const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const nowIso = new Date().toISOString();

      // 1. Save raw binary blob to client storage
      await saveFileBlob(fileId, selectedFile);

      // 2. Prepare lightweight thumbnail for Firestore
      let safeThumb: string | undefined = undefined;
      if (previewThumb && previewThumb.length < 18000) {
        safeThumb = previewThumb;
      }

      // 3. Save metadata to Firestore under /users/{userId}/files/{fileId}
      const newFileDoc: VaultFile = {
        id: fileId,
        userId: user.uid,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        category,
        clientName: trimmedClient,
        notes: notes.trim() || undefined,
        isStarred: false,
        downloadCount: 0,
        previewDataUrl: safeThumb,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const fileDocRef = doc(db, 'users', user.uid, 'files', fileId);
      await setDoc(fileDocRef, newFileDoc);

      clearInterval(progressInterval);
      setUploadProgress(100);

      onFileUploaded(newFileDoc);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setNotes('');
        onClose();
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/files`);
      setErrorMsg('Failed to upload file. Please check permissions and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-700 dark:text-red-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Client File
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Securely store and share project deliverables with your clients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/30 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-red-500/60 dark:hover:border-red-800/80 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center gap-3 overflow-hidden">
                  {previewThumb ? (
                    <img
                      src={previewThumb}
                      alt="Thumbnail preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Binary asset'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewThumb(null);
                  }}
                  className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 mx-auto flex items-center justify-center shadow-xs">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Drag and drop file here, or{' '}
                    <span className="text-red-800 dark:text-red-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Supports PDFs, mockups, design assets, ZIP archives, spreadsheets, and videos
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Client & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                Client Name
              </label>

              {isCustomClient || clientNames.length === 0 ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Corp / Nike Design"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 text-slate-900 dark:text-white"
                  />
                  {clientNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomClient(false)}
                      className="text-[11px] text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Choose existing client
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <select
                    value={clientName}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomClient(true);
                        setClientName('');
                      } else {
                        setClientName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {clientNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add New Client...</option>
                  </select>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Deliverables">Deliverables</option>
                <option value="Contracts & Invoices">Contracts & Invoices</option>
                <option value="Brand Assets">Brand Assets</option>
                <option value="Drafts & Revisions">Drafts & Revisions</option>
                <option value="Source Files">Source Files</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Client Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Client Instructions or Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Hi Sarah, here are the final vector SVG logos with transparent backgrounds."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
            />
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-red-600 animate-spin" />
                  Encrypting and saving deliverable...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-rose-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Save Deliverable'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
