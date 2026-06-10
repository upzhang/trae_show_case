import type { FC, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon = "info",
  title,
  description,
  action,
  className = "",
  children,
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon name={icon} size={48} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick} icon="plus">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
};
