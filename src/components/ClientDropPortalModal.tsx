import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Check,
  Copy,
  FolderLock,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { saveFileBlob, formatFileSize } from '../lib/storage';
import { VaultFile } from '../types';

interface ClientDropPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientNames: string[];
  onFileUploaded: (file: VaultFile) => void;
}

export function ClientDropPortalModal({
  isOpen,
  onClose,
  clientNames,
  onFileUploaded,
}: ClientDropPortalModalProps) {
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeClient, setActiveClient] = useState(clientNames[0] || 'Acme Branding Co.');
  const [clientNotes, setClientNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const studioName = userProfile?.companyOrStudio || userProfile?.displayName || 'Creative Studio';
  const portalUrl = `${window.location.origin}/portal/${encodeURIComponent(activeClient.toLowerCase().replace(/\s+/g, '-'))}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewThumb(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewThumb(null);
    }
  };

  const handleClientDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setIsUploading(true);
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 25));
    }, 120);

    try {
      const fileId = 'client_drop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const nowIso = new Date().toISOString();

      await saveFileBlob(fileId, selectedFile);

      let safeThumb: string | undefined = undefined;
      if (previewThumb && previewThumb.length < 18000) {
        safeThumb = previewThumb;
      }

      const newFileDoc: VaultFile = {
        id: fileId,
        userId: user.uid,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        category: 'Drafts & Revisions',
        clientName: activeClient,
        notes: clientNotes ? `Uploaded by Client: ${clientNotes}` : 'Directly uploaded via Client Drop Portal',
        isStarred: true,
        downloadCount: 0,
        previewDataUrl: safeThumb,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const fileDocRef = doc(db, 'users', user.uid, 'files', fileId);
      await setDoc(fileDocRef, newFileDoc);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsSuccess(true);
      onFileUploaded(newFileDoc);

      setTimeout(() => {
        setIsUploading(false);
        setIsSuccess(false);
        setSelectedFile(null);
        setClientNotes('');
        setUploadProgress(0);
        onClose();
      }, 1200);
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/files`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden transition-colors">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#450a0a] via-[#5c0e18] to-[#7f1d1d] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-red-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-red-200" />
              Client-Facing Experience
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Client Drop Portal Simulator
          </h2>
          <p className="text-xs text-red-200/90 mt-1 max-w-md">
            This is what your clients see when uploading feedback, revisions, or brand files directly to you at {studioName}.
          </p>

          {/* Share Link Row */}
          <div className="mt-4 p-2 rounded-xl bg-black/30 border border-white/15 flex items-center justify-between text-xs">
            <span className="font-mono text-red-100/90 truncate mr-2 text-[11px]">
              {portalUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Client Portal Preview Form */}
        <form onSubmit={handleClientDrop} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Previewing As Client:
            </label>
            <select
              value={activeClient}
              onChange={(e) => setActiveClient(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {clientNames.length > 0 ? (
                clientNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                <option value="Acme Branding Co.">Acme Branding Co.</option>
              )}
            </select>
          </div>

          {/* Client Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-red-300 dark:border-red-900/60 rounded-2xl p-6 text-center bg-red-50/30 dark:bg-red-950/20 hover:border-red-500 cursor-pointer transition"
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
              <div className="flex items-center justify-center gap-3">
                <FileCheck2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click or drag files here to deliver to {studioName}
                </p>
                <p className="text-xs text-slate-400">
                  High-speed encrypted drop zone with instant receipt
                </p>
              </div>
            )}
          </div>

          {/* Message / Feedback from Client */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Add a note or feedback for {studioName}
            </label>
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="e.g. Here are the updated raw photos and company brand guidelines for the redesign."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Progress / Success Animation */}
          {isUploading && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  Delivering directly into your AVault...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-700 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Deliverable securely transferred into your freelancer vault!</span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Client portal link is active
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 text-white font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Transferring...' : 'Simulate Client Upload'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
