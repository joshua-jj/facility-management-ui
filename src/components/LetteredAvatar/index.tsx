import React from 'react';

interface LetterAvatarProps {
  name: string;
  size?: number;
  className?: string;
  singleLetter?: boolean;
}

const getInitials = (name: string, singleLetter: boolean): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (singleLetter || parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? '?';
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

// Brand colors — gold accent on dark navy text, or vice versa for the
// inverted hover state. The previous version generated random hex
// colors per-name (purple, magenta, lime, …) which produced an
// off-brand look across the app.
const BRAND_GOLD = '#B28309';
const BRAND_NAVY = '#0F2552';

const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name,
  size = 48,
  className = '',
  singleLetter = false,
}) => {
  const initials = getInitials(name, singleLetter);

  return (
    <div
      className={`flex items-center justify-center font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        fontSize: size / 2.2,
        backgroundColor: BRAND_GOLD,
        color: BRAND_NAVY,
      }}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
};

export default LetterAvatar;
