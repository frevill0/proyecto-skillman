import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { ConfirmButton, Credentials, Dialog, ErrorBox, Loading, Switch } from '@/components/ui';
import { createUser, deleteUser, resetPassword, setUserActive } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { keys, useClients, useProfiles } from '@/lib/queries';
import type { Profile, Role } from '@/lib/types';
import { useSession } from '@/state/session';
import { errorMessage, useToast } from '@/state/toast';

export function UsersPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Usuarios</h1>
          <p>Quién puede entrar a la app y a qué cliente pertenece.</p>
        </div>
      </div>
      <section className="panel">
        <UsersTable />
      </section>
    </>
  );
}

/** Tabla de usuarios. Con `clientId`, solo los de ese cliente y el alta queda fijada a él. */
export function UsersTable({ clientId }: { clientId?: string }) {
  const profiles = useProfiles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { session } = useSession();
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  if (profiles.isPending) return <Loading />;
  if (profiles.isError) return <ErrorBox error={profiles.error} onRetry={() => profiles.refetch()} />;

  // En la lista general no aparecen los usuarios de clientes archivados.
  const list = clientId
    ? profiles.data.filter((p) => p.client_id === clientId)
    : profiles.data.filter((p) => !p.clients?.archived);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.profiles }),
      queryClient.invalidateQueries({ queryKey: keys.clients }),
    ]);

  async function act(task: () => Promise<unknown>, done: string) {
    try {
      await task();
      await refresh();
      toast(done);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className="fine">
          Revocar el acceso lo bloquea al instante, sin borrar la cuenta. Para dar acceso de nuevo, vuelve a activarlo.
        </span>
        <button className="btn small" onClick={() => setCreating(true)}>
          + Nuevo usuario
        </button>
      </div>

      {!list.length ? (
        <p className="empty-state">{clientId ? 'Crea el primer usuario de este cliente.' : 'Aún no hay usuarios.'}</p>
      ) : (
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                {!clientId && <th>Cliente</th>}
                <th>Alta</th>
                <th>Acceso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const isMe = p.id === session?.user.id;
                return (
                  <tr key={p.id} className={p.active ? '' : 'off'}>
                    <td>
                      <div className="cell-main">
                        <span className="av round">{initials(p.full_name || p.email || '?')}</span>
                        <span>
                          <b>{p.full_name || p.email}</b>
                          <small>{p.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${p.role === 'admin' ? 'warn' : ''}`}>{p.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
                    </td>
                    {!clientId && <td>{p.clients?.name ?? '—'}</td>}
                    <td className="n">{formatDate(p.created_at)}</td>
                    <td>
                      <Switch
                        checked={p.active}
                        disabled={isMe}
                        label={`Acceso de ${p.email}`}
                        onChange={(v) => act(() => setUserActive(p.id, v), v ? 'Acceso reactivado' : 'Acceso revocado')}
                      />
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <ConfirmButton
                          className="btn ghost small"
                          confirmText="¿Nueva contraseña?"
                          onConfirm={() =>
                            resetPassword(p.id)
                              .then(({ password }) => setCredentials({ email: p.email ?? '', password }))
                              .catch((e) => toast(errorMessage(e), 'error'))
                          }>
                          Restablecer contraseña
                        </ConfirmButton>
                        {!isMe && (
                          <ConfirmButton confirmText="¿Eliminar cuenta?" onConfirm={() => act(() => deleteUser(p.id), 'Usuario eliminado')}>
                            Eliminar
                          </ConfirmButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <NewUserDialog
          clientId={clientId}
          onClose={() => setCreating(false)}
          onCreated={async (creds) => {
            setCreating(false);
            setCredentials(creds);
            await refresh();
          }}
        />
      )}
      {credentials && (
        <Dialog title="Datos de acceso" onClose={() => setCredentials(null)}>
          <Credentials {...credentials} />
        </Dialog>
      )}
    </>
  );
}

function NewUserDialog({
  clientId,
  onClose,
  onCreated,
}: {
  clientId?: string;
  onClose: () => void;
  onCreated: (c: { email: string; password: string }) => void;
}) {
  const clients = useClients();
  const profiles = useProfiles();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('client_user');
  const [client, setClient] = useState(clientId ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing: Profile | undefined = profiles.data?.find((p) => p.email?.toLowerCase() === email.trim().toLowerCase());

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { password } = await createUser({
        email,
        full_name: fullName,
        role,
        client_id: role === 'admin' ? null : client,
      });
      onCreated({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title="Nuevo usuario" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="u-email">Correo</label>
          <input id="u-email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {existing && (
          <p className="fine" style={{ margin: 0, color: 'var(--accent)' }}>
            Ese correo ya tiene cuenta: se le asignará una contraseña nueva y estos datos.
          </p>
        )}
        <div className="field">
          <label htmlFor="u-name">Nombre</label>
          <input id="u-name" placeholder="Opcional" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="u-role">Rol</label>
          <select id="u-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="client_user">Cliente (ve solo su carpeta en la app)</option>
            <option value="admin">Administrador (ve todo y usa este panel)</option>
          </select>
        </div>
        {role === 'client_user' && (
          <div className="field">
            <label htmlFor="u-client">Cliente</label>
            <select id="u-client" required value={client} disabled={!!clientId} onChange={(e) => setClient(e.target.value)}>
              <option value="" disabled>
                Elige un cliente
              </option>
              {clients.data?.filter((c) => !c.archived || c.id === clientId).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Creando…' : 'Crear y ver contraseña'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
