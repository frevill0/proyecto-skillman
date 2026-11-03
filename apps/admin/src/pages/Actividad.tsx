import { ErrorBox, Loading } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useActivity } from '@/lib/queries';

export function ActivityPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Actividad</h1>
          <p>Quién abrió o descargó cada documento desde la app (últimos 300 registros).</p>
        </div>
      </div>
      <section className="panel">
        <ActivityList />
      </section>
    </>
  );
}

export function ActivityList({ clientId }: { clientId?: string }) {
  const activity = useActivity(clientId);

  if (activity.isPending) return <Loading />;
  if (activity.isError) return <ErrorBox error={activity.error} onRetry={() => activity.refetch()} />;
  if (!activity.data.length) return <p className="empty-state">Todavía nadie ha abierto documentos.</p>;

  return (
    <>
      <div className="toolbar">
        <span className="fine">{activity.data.length} registros</span>
        <button className="btn ghost small" onClick={() => activity.refetch()} disabled={activity.isFetching}>
          {activity.isFetching ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>
      <ul className="log">
        {activity.data.map((a) => (
          <li key={a.id}>
            <time dateTime={a.at}>{formatDateTime(a.at)}</time>
            <span>
              <b>{a.profiles?.full_name || a.profiles?.email || 'Usuario eliminado'}</b>{' '}
              {a.action === 'open' ? 'abrió' : 'descargó'} «{a.documents?.name ?? 'documento eliminado'}»
              {!clientId && a.documents?.clients && <span className="fine"> · {a.documents.clients.name}</span>}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
