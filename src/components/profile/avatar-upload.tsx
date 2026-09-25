'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  name: string;
}

export function AvatarUpload({ initialAvatarUrl, name }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>(initialAvatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (n[0] || 'U').toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB max
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden input for form submission */}
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      {/* Avatar Image / Fallback Container */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-[#222222] bg-[#121212] flex items-center justify-center shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-base font-semibold text-[#FF6B00]">
              {getInitials(name)}
            </span>
          )}
        </div>

        {/* Action triggers */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              id="avatarFileInput"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm h-9 gap-1.5 font-normal"
            >
              <Camera className="h-3.5 w-3.5 text-[#9AA1AA]" />
              <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </Button>

            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-sm h-9 text-[#9AA1AA] hover:text-red-400 font-normal"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Remove</span>
              </Button>
            )}
          </div>
          <p className="text-sm text-[#9AA1AA]">
            Recommended: JPG, PNG, or WebP. Max 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
