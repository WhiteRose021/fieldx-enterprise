import React from 'react';

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('.')
    .toUpperCase();
};

// Helper function to generate color from string
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#E11D48', '#7C3AED', '#2563EB', '#0891B2', '#059669', 
    '#EA580C', '#9333EA', '#C026D3', '#0D9488', '#65A30D',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, className = "" }) => {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{ backgroundColor }}
    >
      <span className="text-white font-bold">
        {initials}
      </span>
    </div>
  );
};

export default InitialsAvatar;