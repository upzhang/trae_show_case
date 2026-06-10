import type { FC, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type TagColor = "blue" | "green" | "orange" | "red" | "purple" | "gray";

interface TagProps {
  children: ReactNode;
  color?: TagColor;
  onClose?: () => void;
  className?: string;
}

const colorClasses: Record<TagColor, string> = {
  blue: "tag-blue",
  green: "tag-green",
  orange: "tag-orange",
  red: "tag-red",
  purple: "tag-purple",
  gray: "tag-gray",
};

export const Tag: FC<TagProps> = ({ children, color = "gray", onClose, className = "" }) => {
  return (
    <span className={`tag ${colorClasses[color]} ${className}`}>
      {children}
      {onClose && (
        <button className="tag-close" onClick={onClose} aria-label="移除">
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  );
};
