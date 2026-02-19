import { useEffect, useState } from "react";

type ModalVariant = "alert" | "confirm" | "input" | "select";

type ModalSelectOption = {
  label: string;
  value: string;
};

type ModalProps = {
  open: boolean;
  variant: ModalVariant;
  title: string;
  message: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  selectOptions?: ModalSelectOption[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
};

export default function Modal({
  open,
  variant,
  title,
  message,
  inputLabel = "",
  inputPlaceholder = "",
  inputDefaultValue = "",
  selectOptions = [],
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ModalProps) {
  const [value, setValue] = useState(inputDefaultValue);

  useEffect(() => {
    if (open) {
      setValue(inputDefaultValue);
    }
  }, [open, inputDefaultValue, variant]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <div className="modal-message">
            {message.split("\n").map((line, index) => (
              <span key={`${index}-${line}`} className="modal-message-line">
                {line}
              </span>
            ))}
          </div>
          {variant === "input" && (
            <label className="modal-field">
              <span className="label">{inputLabel}</span>
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder}
              />
            </label>
          )}
          {variant === "select" && (
            <label className="modal-field">
              <span className="label">{inputLabel}</span>
              <select
                value={value}
                onChange={(event) => setValue(event.target.value)}
              >
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="modal-actions">
          {variant !== "alert" && (
            <button type="button" className="secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className="primary"
            onClick={() => onConfirm(variant === "input" || variant === "select" ? value : undefined)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
