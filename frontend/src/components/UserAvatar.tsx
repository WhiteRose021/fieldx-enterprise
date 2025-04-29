import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  
  const sizeClass = sizeClasses[size];
  
  // If no user or user without name, show placeholder
  if (!user || !user.name) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center ${className}`}>
        <span className="font-medium text-gray-700">?</span>
      </div>
    );
  }
  
  // If user has avatar, show it
  if (user.avatar) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden ${className}`}>
        <Image 
          src={user.avatar} 
          alt={user.name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="object-cover"
        />
      </div>
    );
  }
  
  // Otherwise, show initials
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase();
  
  return (
    <div className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center ${className}`}>
      <span className="font-medium text-white">{initials}</span>
    </div>
  );
};

export default UserAvatar;