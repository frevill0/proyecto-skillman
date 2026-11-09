import { useState, type FormEvent } from 'react';

import { BrandMark, Dialog } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { useToast } from '@/state/toast';

const MIN_LENGTH = 8;

function changeErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'same_password') return 'La nueva contraseña debe ser distinta de la actual.';
  if (error.code === 'weak_password') return 'Esa contraseña es muy débil. Usa una más larga o con números.';
  return 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
}

/** Formulario común. Con contraseña temporal no se pide la actual: se acaba de usar para entrar. */
function PasswordForm({ forced, onDone }: { forced: boolean; onDone: () => void }) {
  const { session } = useSession();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`Debe tener al menos ${MIN_LENGTH} caracteres.`);
    if (password !== confirm) return setError('Las dos contraseñas no coinciden.');

    setBusy(true);
    setError(null);
    if (!forced) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session?.user.email ?? '',
        password: current,
      });
      if (authError) {
        setBusy(false);
        return setError('La contraseña actual no es correcta.');
      }
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (updateError) return setError(changeErrorMessage(updateError));
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      {!forced && (
        <div className="field">
          <label htmlFor="pw-current">Contraseña actual</label>
          <input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      )}
      <div className="field">
        <label htmlFor="pw-new">Nueva contraseña</label>
        <input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="pw-confirm">Repite la nueva contraseña</label>
        <input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <p className="fine" style={{ margin: 0 }}>
        Al menos {MIN_LENGTH} caracteres.
      </p>
      {error && <p className="error-text">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  );
}

/** Pantalla obligatoria para un administrador que entra con contraseña temporal. */
export function ForcedPasswordPage() {
  const { signOut } = useSession();
  const toast = useToast();
  return (
    <div className="login">
      <div className="panel login-card">
        <BrandMark size={52} />
        <h1>Crea tu contraseña</h1>
        <p>Entraste con una contraseña temporal. Elige una propia para seguir.</p>
        <PasswordForm forced onDone={() => toast('Contraseña actualizada')} />
        <button className="btn ghost small" onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function PasswordDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  return (
    <Dialog title="Cambiar mi contraseña" onClose={onClose}>
      <PasswordForm
        forced={false}
        onDone={() => {
          toast('Contraseña actualizada');
          onClose();
        }}
      />
    </Dialog>
  );
}
