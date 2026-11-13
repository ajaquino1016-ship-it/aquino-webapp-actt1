import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Download,
  RotateCcw,
  Settings,
  X,
  AlertCircle,
} from 'lucide-react';
import { StreakSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: StreakSettings;
  onUpdateSettings: (next: StreakSettings) => void;
  onExportData: () => void;
  onResetStreak: () => Promise<void>;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  settings,
  onUpdateSettings,
  onExportData,
  onResetStreak,
  onClose,
}: SettingsModalProps) {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return window.Notification.permission;
  });

  if (!isOpen) return null;

  const notificationsSupported = permissionState !== 'unsupported';

  const handleToggleNotifications = async () => {
    if (!notificationsSupported) return;

    if (!settings.notificationsEnabled) {
      let perm = window.Notification.permission;
      if (perm === 'default') {
        try {
          perm = await window.Notification.requestPermission();
        } catch {
          perm = window.Notification.permission;
        }
      }
      setPermissionState(perm);
      onUpdateSettings({
        ...settings,
        notificationsEnabled: perm === 'granted',
      });
    } else {
      onUpdateSettings({
        ...settings,
        notificationsEnabled: false,
      });
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onResetStreak();
      setConfirmResetOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </span>
            <div>
              <h2
                id="settings-modal-title"
                className="font-serif text-xl font-semibold text-[var(--text)]"
              >
                Settings
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Reminders, data export, and streak controls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications & Streak Reminder (hidden if browser Notification API is unsupported) */}
        {notificationsSupported && (
          <div className="rounded-xl bg-[var(--surface-nested)] border border-[var(--card-border)] p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[var(--accent-on-card)]" />
                  <span>Notifications</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Allow PantryAI browser reminders
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={
                  settings.notificationsEnabled && permissionState === 'granted'
                }
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  settings.notificationsEnabled && permissionState === 'granted'
                    ? 'bg-[var(--primary)]'
                    : 'bg-[var(--subtle)]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[var(--card)] shadow-xs transition-transform ${
                    settings.notificationsEnabled && permissionState === 'granted'
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {permissionState === 'denied' && (
              <p className="text-xs text-[var(--warning-on-card)] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Notifications are blocked by your browser. Enable site notifications in browser settings to turn them on.
                </span>
              </p>
            )}

            {settings.notificationsEnabled && permissionState === 'granted' && (
              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[var(--text)]">
                      Streak reminder
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Notify if you haven&apos;t cooked yet
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.streakReminderEnabled}
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        streakReminderEnabled: !settings.streakReminderEnabled,
                      })
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      settings.streakReminderEnabled
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--subtle)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-[var(--card)] shadow-xs transition-transform ${
                        settings.streakReminderEnabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.streakReminderEnabled && (
                  <label className="flex items-center justify-between gap-3 text-xs font-medium text-[var(--text)]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                      <span>Reminder time</span>
                    </span>
                    <input
                      type="time"
                      value={settings.reminderTime}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          reminderTime: e.target.value || '18:00',
                        })
                      }
                      className="min-h-[40px] px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--subtle)] text-sm text-[var(--text)] tabular-nums focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export My Data */}
        <div className="rounded-xl bg-[var(--surface-nested)] border border-[var(--card-border)] p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[var(--text)]">
              Export my data
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Download your favorites, history, meal plan, and streak data as JSON
            </p>
          </div>
          <button
            type="button"
            onClick={onExportData}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Reset Streak */}
        <div className="rounded-xl bg-[var(--surface-nested)] border border-[var(--warning-border)]/50 p-4 space-y-3">
          {!confirmResetOpen ? (
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[var(--warning-on-card)]">
                  Reset streak
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Start your cooking streak, freezes, and badges from zero
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[var(--warning)] hover:bg-[var(--warning-hover)] border border-[var(--warning-border)] text-[var(--warning-text)] text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset streak</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-medium text-[var(--text)]">
                Reset your cooking streak, freezes, badges, and cooked history? This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  disabled={isResetting}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--subtle)] text-xs font-medium text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={isResetting}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[var(--warning)] hover:bg-[var(--warning-hover)] border border-[var(--warning-border)] text-[var(--warning-text)] text-xs font-medium cursor-pointer"
                >
                  {isResetting ? 'Resetting...' : 'Yes, reset streak'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
