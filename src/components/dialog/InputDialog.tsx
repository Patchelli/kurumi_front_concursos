import { useState, useEffect, useRef, useCallback } from 'react';
import { MaterialDialog } from './MaterialDialog';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  confirmLabel?: string;
  onConfirm(value: string): void;
  onClose(): void;
};

export function InputDialog({ open, title, description, placeholder, defaultValue = '', maxLength = 300, confirmLabel = 'Adicionar', onConfirm, onClose }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
      autoResize();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open, defaultValue, autoResize]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    onClose();
  };

  return (
    <MaterialDialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      actions={
        <>
          <button className="md-text-button" onClick={onClose}>Cancelar</button>
          <button className="md-filled-button" onClick={handleConfirm} disabled={!value.trim()}>{confirmLabel}</button>
        </>
      }
    >
      <div className="md-dialog-form">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); autoResize(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirm(); } }}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={1}
          style={{ resize: 'none', overflow: 'hidden', minHeight: 38 }}
        />
      </div>
    </MaterialDialog>
  );
}
