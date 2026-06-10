import type { FC, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const typeConfig: Record<AlertType, { className: string; icon: IconName }> = {
  info: { className: "alert-info", icon: "info" },
  success: { className: "alert-success", icon: "check" },
  warning: { className: "alert-warning", icon: "warning" },
  error: { className: "alert-error", icon: "x" },
};

export const Alert: FC<AlertProps> = ({
  type = "info",
  title,
  children,
  onClose,
  className = "",
}) => {
  const config = typeConfig[type];

  return (
    <div className={`alert ${config.className} ${className}`} role="alert">
      <div className="alert-icon">
        <Icon name={config.icon} size={18} />
      </div>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="关闭">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
};
