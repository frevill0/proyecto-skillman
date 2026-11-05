import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ConfirmButton, Dialog, ErrorBox, FileType, Loading, Switch } from '@/components/ui';
import {
  convertDocument,
  createSection,
  deleteClient,
  deleteDocument,
  deleteSection,
  openDocument,
  pool,
  renameClient,
  setAccessUntil,
  setArchived,
  setAllSectionsVisible,
  setSectionVisible,
  storeDocument,
  updateSection,
} from '@/lib/api';
import { accessStatus, addMonths, formatDate, formatSize, needsPdf, plural, sectionNumber, todayEcuador } from '@/lib/format';
import { keys, useClient, useDocuments, useProfiles, useSections } from '@/lib/queries';
import type { Client, DocumentRow, Section } from '@/lib/types';
import { errorMessage, useToast } from '@/state/toast';

import { ActivityList } from './Actividad';
import { UsersTable } from './Usuarios';

type Tab = 'carpetas' | 'usuarios' | 'actividad' | 'ajustes';

export function ClientPage() {
  const { id = '' } = useParams();
  const client = useClient(id);
  const sections = useSections(id);
  const documents = useDocuments(id);
  const profiles = useProfiles();
  const [tab, setTab] = useState<Tab>('carpetas');

  if (client.isPending || sections.isPending || documents.isPending) return <Loading />;
  if (client.isError || sections.isError || documents.isError) {
    return (
      <ErrorBox
        error={client.error ?? sections.error ?? documents.error}
        onRetry={() => {
          client.refetch();
          sections.refetch();
          documents.refetch();
        }}
      />
    );
  }
  if (!client.data) {
    return (
      <div className="panel empty-state">
        <p>Este cliente ya no existe.</p>
        <Link className="btn ghost" to="/">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const visible = sections.data.filter((s) => s.visible).length;
  const pending = documents.data.filter(needsPdf).length;
  const users = (profiles.data ?? []).filter((p) => p.client_id === id);
  const activeUsers = users.filter((u) => u.active).length;
  const access = accessStatus(client.data.access_until);

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="crumb">
            ← Clientes
          </Link>
          <h1>{client.data.name}</h1>
        </div>
        {client.data.archived && <span className="pill off">Archivado</span>}
      </div>

      <div className="kpis">
        <div className="kpi">
          <b>
            {visible}/{sections.data.length}
          </b>
          <span>secciones visibles</span>
        </div>
        <div className="kpi">
          <b>{documents.data.length}</b>
          <span>documentos</span>
        </div>
        <div className="kpi">
          <b>{activeUsers}</b>
          <span>usuarios con acceso</span>
        </div>
        <button
          type="button"
          className={`kpi kpi-button ${access.kind === 'warn' || access.kind === 'danger' ? 'warn' : ''}`}
          onClick={() => setTab('ajustes')}>
          <b>{access.kind === 'danger' ? 'Vencido' : client.data.access_until ? formatDate(client.data.access_until) : '—'}</b>
          <span>{access.kind === 'danger' ? 'renuévalo en Ajustes' : access.label}</span>
        </button>
        {pending > 0 && (
          <div className="kpi warn">
            <b>{pending}</b>
            <span>Office sin PDF todavía</span>
          </div>
        )}
      </div>

      <section className="panel">
        <div className="subtabs" role="tablist">
          {(
            [
              ['carpetas', 'Carpetas'],
              ['usuarios', `Usuarios (${users.length})`],
              ['actividad', 'Actividad'],
              ['ajustes', 'Ajustes'],
            ] as const
          ).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'carpetas' && <Folders client={client.data} sections={sections.data} documents={documents.data} />}
        {tab === 'usuarios' && <UsersTable clientId={id} />}
        {tab === 'actividad' && <ActivityList clientId={id} />}
        {tab === 'ajustes' && <Settings client={client.data} hasUsers={users.length > 0} />}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Carpetas
// ---------------------------------------------------------------------------
function Folders({ client, sections, documents }: { client: Client; sections: Section[]; documents: DocumentRow[] }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const pending = documents.filter(needsPdf);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.sections(client.id) }),
      queryClient.invalidateQueries({ queryKey: keys.documents(client.id) }),
      queryClient.invalidateQueries({ queryKey: keys.clients }),
    ]);

  async function setAll(visible: boolean) {
    try {
      await setAllSectionsVisible(client.id, visible);
      await refresh();
      toast(visible ? 'El cliente ahora ve todas las secciones' : 'Todas las secciones quedaron ocultas');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  async function convertPending() {
    let ok = 0;
    let firstError: string | null = null;
    for (const [i, doc] of pending.entries()) {
      setConverting(`${i + 1}/${pending.length}`);
      try {
        await convertDocument(doc, client.name);
        ok++;
      } catch (e) {
        firstError ??= errorMessage(e);
      }
    }
    setConverting(null);
    await refresh();
    if (firstError) toast(`Convertí ${ok} de ${pending.length}. ${firstError}`, 'error');
    else toast(`Listo: ${plural(ok, 'documento convertido', 'documentos convertidos')} a PDF`);
  }

  return (
    <>
      <div className="toolbar">
        <div className="row-actions">
          <button className="btn ghost small" onClick={() => setAll(true)}>
            Mostrar todas
          </button>
          <button className="btn ghost small" onClick={() => setAll(false)}>
            Ocultar todas
          </button>
          {pending.length > 0 && (
            <button className="btn ghost small" disabled={!!converting} onClick={convertPending}>
              {converting ? `Convirtiendo ${converting}…` : `Convertir ${pending.length} pendientes a PDF`}
            </button>
          )}
        </div>
        <button className="btn small" onClick={() => setAdding(true)}>
          + Sección
        </button>
      </div>

      {!sections.length ? (
        <div className="empty-state">
          <p>Este cliente todavía no tiene carpetas.</p>
          <Link className="btn" to="/importar">
            Importar su carpeta
          </Link>
        </div>
      ) : (
        <div className="sections">
          {sections.map((s) => (
            <SectionItem
              key={s.id}
              client={client}
              section={s}
              documents={documents.filter((d) => d.section_id === s.id)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      {adding && (
        <SectionDialog
          title="Nueva sección"
          initial={{ number: Math.max(0, ...sections.map((s) => s.number)) + 1, name: '' }}
          onClose={() => setAdding(false)}
          onSave={async (number, name) => {
            await createSection(client.id, number, name);
            await refresh();
            toast('Sección creada');
          }}
        />
      )}
    </>
  );
}

function SectionItem({
  client,
  section,
  documents,
  onChanged,
}: {
  client: Client;
  section: Section;
  documents: DocumentRow[];
  onChanged: () => Promise<unknown>;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = documents.filter(needsPdf).length;

  async function run(label: string, task: () => Promise<unknown>, done?: string) {
    setBusy(label);
    try {
      await task();
      await onChanged();
      if (done) toast(done);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function upload(files: FileList) {
    const list = Array.from(files);
    const warnings: string[] = [];
    let done = 0;
    setBusy(`Subiendo 0/${list.length}…`);
    await pool(list, 3, async (file) => {
      try {
        const { warning } = await storeDocument({ clientId: client.id, clientName: client.name, sectionId: section.id, file });
        if (warning) warnings.push(`${file.name}: ${warning}`);
      } catch (e) {
        warnings.push(`${file.name}: ${errorMessage(e)}`);
      }
      setBusy(`Subiendo ${++done}/${list.length}…`);
    });
    await onChanged();
    setBusy(null);
    if (warnings.length) toast(warnings[0], 'error');
    else toast(`${plural(list.length, 'documento subido', 'documentos subidos')}`);
  }

  return (
    <div className={`sec ${section.visible ? '' : 'hidden-sec'}`} data-open={open}>
      <div className="sec-head">
        <button className="sec-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span className="num">{sectionNumber(section.number)}</span>
          <span>
            <b>{section.name}</b>
            <small>
              {documents.length ? plural(documents.length, 'documento', 'documentos') : 'Sin documentos aún'}
              {!section.visible && ' · oculta para el cliente'}
            </small>
          </span>
        </button>
        {pending > 0 && <span className="pill warn">{pending} sin PDF</span>}
        <Switch
          checked={section.visible}
          label={`Mostrar «${section.name}» al cliente`}
          onChange={(v) =>
            run('', () => setSectionVisible(section.id, v), v ? 'Ahora el cliente la ve' : 'Oculta para el cliente')
          }
        />
      </div>

      {open && (
        <div className="sec-body">
          {documents.map((d) => (
            <div key={d.id} className="doc-row">
              <FileType ext={d.storage_path_pdf ? 'pdf' : d.original_ext} />
              <div className="t">
                <b>{d.name}</b>
                <span>
                  {[
                    d.original_ext.toUpperCase(),
                    formatSize(d.size_bytes),
                    formatDate(d.doc_date),
                    d.subfolder_label,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              {needsPdf(d) && <span className="pill warn">Sin PDF</span>}
              <div className="row-actions">
                <button className="btn ghost small" onClick={() => openDocument(d).catch((e) => toast(errorMessage(e), 'error'))}>
                  Ver
                </button>
                {needsPdf(d) && (
                  <button
                    className="btn ghost small"
                    disabled={!!busy}
                    onClick={() => run('Convirtiendo…', () => convertDocument(d, client.name), 'Convertido a PDF')}>
                    Convertir
                  </button>
                )}
                <ConfirmButton
                  disabled={!!busy}
                  confirmText="¿Eliminar?"
                  onConfirm={() => run('', () => deleteDocument(d), 'Documento eliminado')}>
                  Eliminar
                </ConfirmButton>
              </div>
            </div>
          ))}

          <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
            <div className="row-actions">
              <button className="btn small" disabled={!!busy} onClick={() => fileInput.current?.click()}>
                Subir archivos
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) void upload(e.target.files);
                  e.target.value = '';
                }}
              />
              {busy && <span className="fine">{busy}</span>}
            </div>
            <div className="row-actions">
              <button className="btn ghost small" onClick={() => setEditing(true)}>
                Editar
              </button>
              <ConfirmButton
                disabled={!!busy}
                confirmText={documents.length ? `¿Borrar con sus ${documents.length} documentos?` : '¿Eliminar?'}
                onConfirm={() => run('', () => deleteSection(section.id, documents), 'Sección eliminada')}>
                Eliminar sección
              </ConfirmButton>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <SectionDialog
          title="Editar sección"
          initial={{ number: section.number, name: section.name }}
          onClose={() => setEditing(false)}
          onSave={async (number, name) => {
            await updateSection(section.id, number, name);
            await onChanged();
            toast('Sección guardada');
          }}
        />
      )}
    </div>
  );
}

function SectionDialog({
  title,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  initial: { number: number; name: string };
  onClose: () => void;
  onSave: (number: number, name: string) => Promise<void>;
}) {
  const [number, setNumber] = useState(String(initial.number));
  const [name, setName] = useState(initial.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(parseInt(number, 10) || 0, name);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="sec-num">N.º</label>
            <input id="sec-num" type="number" min={0} required value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="sec-name">Nombre</label>
            <input id="sec-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <p className="fine" style={{ margin: 0 }}>
          El número define el orden en la app.
        </p>
        {error && <p className="error-text">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn" disabled={busy || !name.trim()}>
            Guardar
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

/** Vencimiento del acceso: al pasar la fecha, el servidor deja de mostrar la carpeta a sus usuarios. */
function AccessEditor({ client }: { client: Client }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState(client.access_until ?? '');
  const status = accessStatus(client.access_until);
  // Renovar suma desde el vencimiento actual si sigue vigente; si no, desde hoy.
  const today = todayEcuador();
  const base = client.access_until && client.access_until >= today ? client.access_until : today;

  async function save(next: string | null) {
    try {
      await setAccessUntil(client.id, next);
      setDate(next ?? '');
      await queryClient.invalidateQueries({ queryKey: keys.client(client.id) });
      await queryClient.invalidateQueries({ queryKey: keys.clients });
      toast(next ? `Acceso hasta el ${formatDate(next)}` : 'Acceso sin vencimiento');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <div className="form">
      <div className="field">
        <label htmlFor="access-until">Acceso de sus usuarios hasta (incluido)</label>
        <div className="row-actions">
          <input
            id="access-until"
            className="input"
            type="date"
            style={{ width: 'auto' }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn small" disabled={!date || date === client.access_until} onClick={() => save(date)}>
            Guardar
          </button>
          <span className={`pill ${status.kind}`}>{status.label}</span>
        </div>
      </div>
      <div className="row-actions">
        <span className="fine">Renovar:</span>
        <button className="btn ghost small" onClick={() => save(addMonths(base, 1))}>
          +1 mes
        </button>
        <button className="btn ghost small" onClick={() => save(addMonths(base, 3))}>
          +3 meses
        </button>
        <button className="btn ghost small" onClick={() => save(addMonths(base, 12))}>
          +1 año
        </button>
        {client.access_until && (
          <button className="btn ghost small" onClick={() => save(null)}>
            Quitar vencimiento
          </button>
        )}
      </div>
      <p className="fine" style={{ margin: 0 }}>
        Al vencer, sus usuarios siguen pudiendo entrar a la app pero solo ven el aviso «El acceso de tu organización
        venció». Siete días antes la app les avisa. Nada se borra: al renovar vuelven a ver todo.
      </p>
    </div>
  );
}
function Settings({ client, hasUsers }: { client: Client; hasUsers: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(client.name);
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);

  async function rename(e: FormEvent) {
    e.preventDefault();
    try {
      await renameClient(client.id, name);
      await queryClient.invalidateQueries({ queryKey: keys.client(client.id) });
      await queryClient.invalidateQueries({ queryKey: keys.clients });
      toast('Nombre guardado');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteClient(client.id);
      await queryClient.invalidateQueries({ queryKey: keys.clients });
      toast(`«${client.name}» eliminado`);
      navigate('/');
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <div className="form" style={{ maxWidth: 520 }}>
      <form className="form" onSubmit={rename}>
        <div className="field">
          <label htmlFor="rename">Nombre del cliente</label>
          <input id="rename" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <button className="btn small" disabled={!name.trim() || name.trim() === client.name}>
            Guardar nombre
          </button>
        </div>
      </form>

      <AccessEditor client={client} />

      <div className="notice info">
        <b>{client.archived ? 'Cliente archivado.' : 'Archivar cliente.'}</b>{' '}
        {client.archived
          ? 'No aparece en las listas del panel ni en la vista de administrador de la app.'
          : 'Lo oculta de las listas del panel y de la vista de administrador de la app (por ejemplo, durante una presentación). No borra nada ni cambia el acceso de sus usuarios.'}
        <div style={{ marginTop: 10 }}>
          <button
            className="btn ghost small"
            onClick={async () => {
              try {
                await setArchived(client.id, !client.archived);
                await queryClient.invalidateQueries({ queryKey: keys.client(client.id) });
                await queryClient.invalidateQueries({ queryKey: keys.clients });
                await queryClient.invalidateQueries({ queryKey: keys.profiles });
                toast(client.archived ? `«${client.name}» vuelve a las listas` : `«${client.name}» archivado`);
                if (!client.archived) navigate('/');
              } catch (err) {
                toast(errorMessage(err), 'error');
              }
            }}>
            {client.archived ? 'Restaurar' : 'Archivar'}
          </button>
        </div>
      </div>

      <div className="notice info">
        <b>Actualizar toda la carpeta.</b> Para reemplazar el contenido con una versión nueva de la carpeta, usa{' '}
        <Link to="/importar">Importar carpeta</Link>: si el nombre coincide, se reemplaza este cliente.
      </div>

      <div className="notice danger">
        <b>Eliminar cliente.</b> Borra sus secciones, documentos y archivos. No se puede deshacer.
        {hasUsers ? (
          <p className="fine" style={{ marginBottom: 0 }}>
            Primero elimina sus usuarios en la pestaña Usuarios.
          </p>
        ) : (
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="confirm-delete">Escribe «{client.name}» para confirmar</label>
              <input id="confirm-delete" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
            </div>
            <div>
              <button className="btn small danger-solid" disabled={busy || confirmName.trim() !== client.name} onClick={remove}>
                {busy ? 'Eliminando…' : 'Eliminar cliente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
