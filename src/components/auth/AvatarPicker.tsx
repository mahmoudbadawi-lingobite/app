// ============================================================
// LingoBite - Avatar Picker
// Lets a user choose one of the preset avatars. Shown automatically
// (non-dismissable) the first time a user signs in, and reopenable
// later (dismissable) to change their pick.
// ============================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AVATAR_OPTIONS } from '@/lib/avatars';
import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  dismissable: boolean;
  currentAvatarUrl?: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarUrl: string) => Promise<void> | void;
}

const AvatarPicker: React.FC<Props> = ({
  open,
  dismissable,
  currentAvatarUrl,
  onOpenChange,
  onSelect,
}) => {
  const [saving, setSaving] = useState<string | null>(null);

  const handlePick = async (url: string) => {
    if (saving) return;
    setSaving(url);
    try {
      await onSelect(url);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={dismissable ? onOpenChange : undefined}>
      <DialogContent
        className="max-w-lg"
        showCloseButton={dismissable}
        onInteractOutside={(e) => { if (!dismissable) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dismissable) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0d1b2a]">
            Choose your avatar
          </DialogTitle>
          <DialogDescription>
            Pick the one that feels like you. You can change it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-3 py-2">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = currentAvatarUrl === avatar.url;
            const isSaving = saving === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handlePick(avatar.url)}
                disabled={saving !== null}
                aria-label={`Select ${avatar.id}`}
                className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-[#c9993f] ring-2 ring-[#c9993f]/40'
                    : 'border-[#e5ddd0]'
                } ${isSaving ? 'opacity-50' : ''}`}
              >
                <img
                  src={avatar.url}
                  alt={avatar.id}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                    <CheckCircle className="w-5 h-5 text-[#38a169]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPicker;
