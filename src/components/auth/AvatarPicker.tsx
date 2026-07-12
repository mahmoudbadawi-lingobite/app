// ============================================================
// LingoBite - Avatar Picker
// Lets a user choose one of the preset avatars. Shown automatically
// (non-dismissable) the first time a user signs in, and reopenable
// later (dismissable) to change their pick.
// ============================================================

import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AVATAR_OPTIONS } from '@/lib/avatars';
import { uploadImage } from '@/lib/cloudinary';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  dismissable: boolean;
  currentAvatarUrl?: string | null;
  /** Teachers get an extra option to upload their own photo instead of a preset. */
  allowUpload?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarUrl: string) => Promise<void> | void;
}

const AvatarPicker: React.FC<Props> = ({
  open,
  dismissable,
  currentAvatarUrl,
  allowUpload = false,
  onOpenChange,
  onSelect,
}) => {
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPreset = currentAvatarUrl
    ? AVATAR_OPTIONS.some((a) => a.url === currentAvatarUrl)
    : false;

  const handlePick = async (url: string) => {
    if (saving || uploading) return;
    setSaving(url);
    try {
      await onSelect(url);
    } finally {
      setSaving(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await onSelect(url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
            {allowUpload
              ? 'Pick a preset avatar, or upload your own photo. You can change it anytime.'
              : 'Pick the one that feels like you. You can change it anytime.'}
          </DialogDescription>
        </DialogHeader>

        {allowUpload && (
          <div className="pb-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving !== null || uploading}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-[#c9993f]/40 hover:border-[#c9993f] bg-[#c9993f]/5 hover:bg-[#c9993f]/10 transition-colors px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="relative shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 border-[#c9993f]/30 bg-white flex items-center justify-center">
                {isPreset || !currentAvatarUrl ? (
                  uploading ? (
                    <Loader2 className="w-5 h-5 text-[#c9993f] animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-[#c9993f]" />
                  )
                ) : (
                  <>
                    <img
                      src={currentAvatarUrl}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#c9993f] animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#0d1b2a]">
                  {uploading ? 'Uploading...' : !isPreset && currentAvatarUrl ? 'Change your photo' : 'Upload your own photo'}
                </p>
                <p className="text-xs text-[#0d1b2a]/50">JPG or PNG, up to 5MB</p>
              </div>
            </button>
            {uploadError && (
              <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>
            )}
            <div className="flex items-center gap-3 pt-3">
              <div className="h-px flex-1 bg-[#e5ddd0]" />
              <span className="text-xs uppercase tracking-wider text-[#0d1b2a]/40">or pick a preset</span>
              <div className="h-px flex-1 bg-[#e5ddd0]" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-2">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = currentAvatarUrl === avatar.url;
            const isSaving = saving === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handlePick(avatar.url)}
                disabled={saving !== null || uploading}
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
