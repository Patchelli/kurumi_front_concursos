import { useState, useEffect, useRef } from 'react';
import { MaterialDialog } from './MaterialDialog';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  maxLength?: number;
  confirmLabel?: string;
  onConfirm(value: string): void;
  onClose(): void;
};

export function InputDialog({ open, title, description, placeholder, maxLength = 300, confirmLabel = 'Adicionar', onConfirm, onClose }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setValue(''); setTimeout(() => inputRef.current?.focus(), 80); } }, [open]);

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
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      </div>
    </MaterialDialog>
  );
}
