import type { FC } from "react";

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const avatarColors = [
  "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#4f46e5", "#be185d",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Avatar: FC<AvatarProps> = ({ name, size = 36, className = "" }) => {
  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.38,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
