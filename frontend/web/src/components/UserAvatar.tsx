import { useState } from 'react';
import { Avatar, type AvatarProps } from '@monochrome-ui/design-system';

type UserAvatarProps = Omit<AvatarProps, 'alt' | 'children' | 'src' | 'slotProps'> & {
  displayName?: string | null;
  photoURLs: Array<string | null | undefined>;
};

/** Tries known profile photo sources in order, then falls back to initials. */
export function UserAvatar({ displayName, photoURLs, ...avatarProps }: UserAvatarProps) {
  const sources = [...new Set(photoURLs.filter((source): source is string => Boolean(source)))];
  const sourceKey = sources.join('|');
  const [failure, setFailure] = useState<{ sourceKey: string; index: number } | null>(null);
  const sourceIndex = failure?.sourceKey === sourceKey ? failure.index : 0;
  const handleImageError = () => {
    setFailure({ sourceKey, index: Math.min(sourceIndex + 1, sources.length) });
  };

  return (
    <Avatar
      {...avatarProps}
      alt={displayName || 'User'}
      src={sources[sourceIndex]}
      slotProps={{ img: { onError: handleImageError } }}
    >
      {displayName?.trim().charAt(0).toUpperCase() || 'U'}
    </Avatar>
  );
}
