import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { AuthView } from './components/AuthView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FileList } from './components/FileList';
import { FileGrid } from './components/FileGrid';
import { FileUploadModal } from './components/FileUploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ClientDropPortalModal } from './components/ClientDropPortalModal';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { deleteFileBlob, saveFileBlob } from './lib/storage';
import { VaultFile, FileCategory, ViewMode, SortOption } from './types';
import {
  UploadCloud,
  FileUp,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  // Dashboard filter & view states
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<FileCategory | 'All'>('All');
  const [selectedClient, setSelectedClient] = useState<string | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<VaultFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quick drag & drop banner on dashboard
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time Firestore File Listener
  useEffect(() => {
    if (!user) {
      setFiles([]);
      setLoadingFiles(false);
      return;
    }

    setLoadingFiles(true);
    const filesPath = `users/${user.uid}/files`;
    const filesCol = collection(db, 'users', user.uid, 'files');

    const unsubscribe = onSnapshot(
      filesCol,
      (snapshot) => {
        const loaded: VaultFile[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as VaultFile);
        });

        // If user has zero files upon first log in, auto-seed starter deliverables
        if (loaded.length === 0 && snapshot.empty) {
          seedInitialFiles(user.uid);
        } else {
          setFiles(loaded);
          setLoadingFiles(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, filesPath);
        setLoadingFiles(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Seed initial starter files so new freelancers/designers immediately have sample deliverables
  const seedInitialFiles = async (uid: string) => {
    const starterFiles: Omit<VaultFile, 'userId'>[] = [
      {
        id: 'seed_file_1',
        name: 'Brand_Identity_Guidelines_v3.pdf',
        size: 4280000,
        type: 'application/pdf',
        category: 'Brand Assets',
        clientName: 'Linear Labs',
        notes: 'Final vector logo exports, color palettes, and typographic tokens for marketing team.',
        isStarred: true,
        downloadCount: 2,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'seed_file_2',
        name: 'Client_Service_Agreement_Signed.pdf',
        size: 1450000,
        type: 'application/pdf',
        category: 'Contracts & Invoices',
        clientName: 'Acme Studio',
        notes: 'Countersigned master services agreement covering Q4 product design milestones.',
        isStarred: false,
        downloadCount: 1,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'seed_file_3',
        name: 'Mobile_App_Figma_Exports.zip',
        size: 18600000,
        type: 'application/zip',
        category: 'Deliverables',
        clientName: 'Acme Studio',
        notes: 'All screen exports at 1x, 2x, and 3x resolutions ready for iOS/Android engineers.',
        isStarred: true,
        downloadCount: 4,
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'seed_file_4',
        name: 'Homepage_Hero_Mockup_Dark.png',
        size: 2150000,
        type: 'image/png',
        category: 'Drafts & Revisions',
        clientName: 'Stripe Ecosystem',
        notes: 'High-contrast dark mode desktop hero concept with glowing isometric cards.',
        isStarred: false,
        downloadCount: 3,
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
    ];

    try {
      for (const item of starterFiles) {
        const fullDoc: VaultFile = { ...item, userId: uid };
        await setDoc(doc(db, 'users', uid, 'files', item.id), fullDoc);
        // Save placeholder text blob so download test works immediately
        const dummyBlob = new Blob(
          [`AVault Verified Client Asset\nFile: ${item.name}\nClient: ${item.clientName}\nNotes: ${item.notes || 'None'}\n`],
          { type: item.type }
        );
        await saveFileBlob(item.id, dummyBlob);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingFiles(false);
    }
  };

  // Derive active client names
  const clientNames = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.clientName) set.add(f.clientName);
    });
    return Array.from(set).sort();
  }, [files]);

  // Total storage calculation
  const totalStorageBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [files]);

  // Deliverables count
  const deliverablesCount = useMemo(() => {
    return files.filter((f) => f.category === 'Deliverables').length;
  }, [files]);

  // Filtered and Sorted Files
  const filteredAndSortedFiles = useMemo(() => {
    return files
      .filter((file) => {
        // Category filter
        if (currentCategory !== 'All' && file.category !== currentCategory) {
          return false;
        }
        // Client filter
        if (selectedClient !== 'All' && file.clientName !== selectedClient) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = file.name.toLowerCase().includes(q);
          const matchClient = file.clientName?.toLowerCase().includes(q);
          const matchNotes = file.notes?.toLowerCase().includes(q);
          const matchCat = file.category?.toLowerCase().includes(q);
          if (!matchName && !matchClient && !matchNotes && !matchCat) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'date-desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortOption === 'date-asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortOption === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortOption === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortOption === 'size-desc') {
          return (b.size || 0) - (a.size || 0);
        }
        if (sortOption === 'size-asc') {
          return (a.size || 0) - (b.size || 0);
        }
        return 0;
      });
  }, [files, currentCategory, selectedClient, searchQuery, sortOption]);

  // Delete File Handler
  const handleDeleteConfirm = async () => {
    if (!fileToDelete || !user) return;
    setIsDeleting(true);
    try {
      // 1. Delete metadata from Firestore
      const docRef = doc(db, 'users', user.uid, 'files', fileToDelete.id);
      await deleteDoc(docRef);

      // 2. Delete binary from IndexedDB
      await deleteFileBlob(fileToDelete.id);

      showToast(`“${fileToDelete.name}” was deleted from your vault.`);
      setFileToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/files/${fileToDelete.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick drag & drop upload handler directly on dashboard surface
  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBannerDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploadOpen(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-800 to-rose-700 flex items-center justify-center shadow-lg border border-red-500/40 text-white animate-pulse">
          <ShieldCheck className="w-6 h-6 text-red-100" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400">
          Loading AVault Client Portal...
        </p>
      </div>
    );
  }

  // Not authenticated: render Auth View
  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 border border-slate-700/60 dark:border-slate-200 animate-slideUp">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dark Red Sidebar */}
      <Sidebar
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        clientNames={clientNames}
        totalFilesCount={files.length}
        totalStorageBytes={totalStorageBytes}
        onOpenClientDropPortal={() => setIsClientPortalOpen(true)}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (White & Light Gray in Light Mode, Dark Slate/Charcoal in Dark Mode) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50 dark:bg-[#0c1322] transition-colors">
        {/* Top Header */}
        <Header
          currentCategory={currentCategory}
          selectedClient={selectedClient}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortChange={setSortOption}
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          filteredFilesCount={filteredAndSortedFiles.length}
        />

        {/* Dashboard Body Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Stats Summary Bar */}
          <StatsOverview
            totalFiles={files.length}
            totalSize={totalStorageBytes}
            totalClients={clientNames.length}
            deliverablesCount={deliverablesCount}
          />

          {/* Quick File Upload Drop Banner */}
          <div
            onDrop={handleBannerDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsBannerDragging(true);
            }}
            onDragLeave={() => setIsBannerDragging(false)}
            onClick={() => setIsUploadOpen(true)}
            className={`rounded-2xl p-6 border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isBannerDragging
                ? 'border-red-600 bg-red-100/70 dark:bg-red-950/40 scale-[0.99]'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-red-400 dark:hover:border-red-900/60 shadow-xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                  Quick Upload to Client Vault
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                    Instant AES Encrypted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Drag and drop files anywhere here, or click to choose from your device
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsUploadOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-red-400" />
              <span>Choose Files</span>
            </button>
          </div>

          {/* Active Filter Pill Bar if Filtered */}
          {(currentCategory !== 'All' || selectedClient !== 'All' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Active Filters:</span>

              {selectedClient !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 font-semibold border border-red-200 dark:border-red-900/50">
                  Client: {selectedClient}
                  <button
                    onClick={() => setSelectedClient('All')}
                    className="hover:text-red-600 cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {currentCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 font-semibold border border-red-200 dark:border-red-900/50">
                  Category: {currentCategory}
                  <button
                    onClick={() => setCurrentCategory('All')}
                    className="hover:text-red-600 cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
                  Query: “{searchQuery}”
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSelectedClient('All');
                  setCurrentCategory('All');
                  setSearchQuery('');
                }}
                className="ml-auto text-xs text-red-700 dark:text-red-400 hover:underline font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Files Display: List View or Grid View */}
          {loadingFiles ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Syncing client files from secure Firestore vault...
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <FileList
              files={filteredAndSortedFiles}
              onDeleteFile={(file) => setFileToDelete(file)}
              onPreviewFile={(file) => setPreviewFile(file)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : (
            <FileGrid
              files={filteredAndSortedFiles}
              onDeleteFile={(file) => setFileToDelete(file)}
              onPreviewFile={(file) => setPreviewFile(file)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        clientNames={clientNames}
        defaultClient={selectedClient !== 'All' ? selectedClient : undefined}
        defaultCategory={currentCategory}
        onFileUploaded={(newFile) => {
          showToast(`“${newFile.name}” uploaded successfully.`);
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={(file) => {
          setPreviewFile(null);
          setFileToDelete(file);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        file={fileToDelete}
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Client Drop Portal Simulator Modal */}
      <ClientDropPortalModal
        isOpen={isClientPortalOpen}
        onClose={() => setIsClientPortalOpen(false)}
        clientNames={clientNames}
        onFileUploaded={(newFile) => {
          showToast(`Client deliverable “${newFile.name}” received!`);
        }}
      />
    </div>
  );
}
