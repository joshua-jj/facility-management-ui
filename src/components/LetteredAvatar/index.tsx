import React, { useMemo } from 'react';

interface LetterAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

// Generate a random hex color
const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Determine if white or black text is better for contrast
const getTextColor = (bgColor: string): string => {
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
};

const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name,
  size = 48,
  className = '',
}) => {
  const initials = getInitials(name);

  const [bgColor, textColor] = useMemo(() => {
    const bg = getRandomColor();
    const text = getTextColor(bg);
    return [bg, text];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        fontSize: size / 2.2,
        backgroundColor: bgColor,
        color: textColor,
      }}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
};

export default LetterAvatar;
