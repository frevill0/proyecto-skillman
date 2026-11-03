import { useState, type FormEvent } from 'react';

import { BrandMark } from '@/components/ui';
import { useSession } from '@/state/session';
import { errorMessage } from '@/state/toast';

export function LoginPage() {
  const { signIn, denied } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="panel login-card" onSubmit={submit}>
        <BrandMark size={52} />
        <h1>Panel del administrador</h1>
        <p>Gestiona los clientes, sus carpetas y quién tiene acceso.</p>
        <div className="field">
          <label htmlFor="email">Correo</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {(error || denied) && <p className="error-text">{error ?? denied}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
