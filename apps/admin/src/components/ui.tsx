import { useEffect, useRef, useState, type ReactNode } from 'react';

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span className="logo" style={{ width: size, height: size, borderRadius: size * 0.3 }} aria-hidden="true">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 3.5v5c0 4.6-3.4 8.4-8 9.5-4.6-1.1-8-4.9-8-9.5v-5z" />
        <path d="M8.5 12l2.4 2.4 4.6-4.6" />
      </svg>
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

export function FileType({ ext }: { ext: string }) {
  const label = (ext || '?').slice(0, 4).toUpperCase();
  return <span className={`ftype ${ext.replace(/x$/, '')}`}>{label}</span>;
}

export function Loading({ text = 'Cargando…' }: { text?: string }) {
  return <p className="empty-state">{text}</p>;
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="empty-state">
      <p>{error instanceof Error ? error.message : 'No pude cargar los datos.'}</p>
      {onRetry && (
        <button className="btn ghost small" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Diálogo modal nativo. Se abre al montarse; `onClose` lo desmonta. */
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onCancel={onClose}>
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="iconbtn" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** Botón que pide confirmación con un segundo clic. */
export function ConfirmButton({
  children,
  confirmText = '¿Seguro? Clic para confirmar',
  onConfirm,
  className = 'btn ghost small danger',
  disabled,
}: {
  children: ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}>
      {armed ? confirmText : children}
    </button>
  );
}

/** Muestra las credenciales nuevas una sola vez, con botón para copiarlas. */
export function Credentials({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Portal PDP\nCorreo: ${email}\nContraseña: ${password}`;
  return (
    <div className="credentials">
      <p className="fine">
        Entrégalos por un canal privado. La contraseña es temporal: la app le pedirá crear una propia al entrar. No se
        vuelve a mostrar.
      </p>
      <dl>
        <dt>Correo</dt>
        <dd>{email}</dd>
        <dt>Contraseña</dt>
        <dd className="mono">{password}</dd>
      </dl>
      <button
        type="button"
        className="btn small"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        }}>
        {copied ? 'Copiado ✓' : 'Copiar datos'}
      </button>
    </div>
  );
}
