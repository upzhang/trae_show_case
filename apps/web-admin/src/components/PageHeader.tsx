import type { FC, ReactNode } from "react";
import { Button } from "./Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, actions, className = "" }) => {
  return (
    <div className={`page-header ${className}`}>
      <div>
        <h2>{title}</h2>
        {description && <p className="page-sub">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
};
