import { useState, type FC } from "react";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: FC<CopyButtonProps> = ({ text, label = "复制", className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Tooltip content={copied ? "已复制" : label}>
      <button
        className={`copy-btn ${className}`}
        onClick={handleCopy}
        aria-label={label}
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
      </button>
    </Tooltip>
  );
};
