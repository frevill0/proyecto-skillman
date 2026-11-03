import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { Dialog, ErrorBox, Loading } from '@/components/ui';
import { createClient } from '@/lib/api';
import { accessStatus, initials, plural } from '@/lib/format';
import { keys, useClients } from '@/lib/queries';
import { errorMessage } from '@/state/toast';

export function ClientsPage() {
  const clients = useClients();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <p>Cada cliente ve solo su propia carpeta en la app.</p>
        </div>
        <div className="row-actions">
          <button className="btn ghost" onClick={() => setCreating(true)}>
            + Nuevo cliente
          </button>
          <Link className="btn" to="/importar">
            Importar carpeta
          </Link>
        </div>
      </div>

      {clients.isPending ? (
        <Loading />
      ) : clients.isError ? (
        <ErrorBox error={clients.error} onRetry={() => clients.refetch()} />
      ) : !clients.data.length ? (
        <div className="panel empty-state">
          <p>Aún no hay clientes. Importa la carpeta del primero y se crea solo.</p>
          <Link className="btn" to="/importar">
            Importar carpeta
          </Link>
        </div>
      ) : (
        <div className="clients">
          {clients.data.map((c) => {
            const sections = c.sections[0]?.count ?? 0;
            const docs = c.documents[0]?.count ?? 0;
            const users = c.profiles[0]?.count ?? 0;
            const access = accessStatus(c.access_until);
            return (
              <Link key={c.id} to={`/clientes/${c.id}`} className="client-card">
                <span className="av">{initials(c.name)}</span>
                <span>
                  <b>{c.name}</b>
                  <span>
                    {sections ? `${plural(sections, 'sección', 'secciones')} · ${plural(docs, 'documento', 'documentos')}` : 'Sin carpetas'}
                    {' · '}
                    {plural(users, 'usuario', 'usuarios')}
                  </span>
                  {c.access_until && <span className={`pill ${access.kind} access-pill`}>{access.label}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {creating && <NewClientDialog onClose={() => setCreating(false)} />}
    </>
  );
}

function NewClientDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await createClient(name);
      await queryClient.invalidateQueries({ queryKey: keys.clients });
      navigate(`/clientes/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title="Nuevo cliente" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="fine" style={{ margin: 0 }}>
          Crea el cliente vacío y agrega sus secciones a mano. Para traer una carpeta completa usa «Importar carpeta».
        </p>
        <div className="field">
          <label htmlFor="client-name">Nombre de la organización</label>
          <input id="client-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn" disabled={busy || !name.trim()}>
            Crear
          </button>
        </div>
      </form>
    </Dialog>
  );
}
