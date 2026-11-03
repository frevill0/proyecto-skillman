import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link } from 'react-router';

import { FileType } from '@/components/ui';
import { formatSize, plural, sectionNumber } from '@/lib/format';
import {
  buildPlan,
  filesFromDrop,
  filesFromInput,
  findSimilarClient,
  isOffice,
  runImport,
  selectedFiles,
  type ImportProgress,
  type Plan,
  type PickedFile,
} from '@/lib/importar';
import { useClients } from '@/lib/queries';
import { errorMessage, useToast } from '@/state/toast';

type Step = { kind: 'pick' } | { kind: 'review'; plan: Plan } | { kind: 'running'; progress: ImportProgress } | { kind: 'done'; clientId: string; progress: ImportProgress };

export function ImportPage() {
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const toast = useToast();

  function load(picked: PickedFile[]) {
    const plan = buildPlan(picked);
    if (!plan || !plan.sections.length) toast('No encontré documentos en esa carpeta', 'error');
    else setStep({ kind: 'review', plan });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Importar carpeta</h1>
          <p>Sube la carpeta completa de un cliente: se crean el cliente, sus secciones y sus documentos.</p>
        </div>
      </div>
      {step.kind === 'pick' && <Picker onFiles={load} />}
      {step.kind === 'review' && (
        <Review
          plan={step.plan}
          onCancel={() => setStep({ kind: 'pick' })}
          onRun={(progress) => setStep({ kind: 'running', progress })}
          onProgress={(progress) => setStep((s) => (s.kind === 'running' ? { kind: 'running', progress } : s))}
          onDone={(clientId, progress) => setStep({ kind: 'done', clientId, progress })}
        />
      )}
      {(step.kind === 'running' || step.kind === 'done') && (
        <Progress
          progress={step.progress}
          clientId={step.kind === 'done' ? step.clientId : null}
          onAgain={() => setStep({ kind: 'pick' })}
        />
      )}
    </>
  );
}

function Picker({ onFiles }: { onFiles: (files: PickedFile[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [over, setOver] = useState(false);

  return (
    <div
      className={`drop ${over ? 'over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        const files = await filesFromDrop(e.dataTransfer.items);
        if (files) onFiles(files);
        else toast('Suelta la carpeta completa del cliente, no archivos sueltos', 'error');
      }}>
      <h2>Arrastra aquí la carpeta del cliente</h2>
      <p>
        Por ejemplo «PROYECTO SKILLMAN». Cada subcarpeta será una sección; los archivos sueltos van a «00 Documentos
        generales». Antes de subir verás todo y podrás quitar lo que no deba ver el cliente.
      </p>
      <button className="btn" onClick={() => input.current?.click()}>
        Elegir carpeta
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        {...{ webkitdirectory: '' }}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(filesFromInput(e.target.files));
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Review({
  plan: initial,
  onCancel,
  onRun,
  onProgress,
  onDone,
}: {
  plan: Plan;
  onCancel: () => void;
  onRun: (p: ImportProgress) => void;
  onProgress: (p: ImportProgress) => void;
  onDone: (clientId: string, p: ImportProgress) => void;
}) {
  const clients = useClients();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [plan, setPlan] = useState(initial);
  const [hidden, setHidden] = useState(false);

  const files = selectedFiles(plan);
  const office = files.filter(isOffice).length;
  const bytes = files.reduce((n, f) => n + f.file.size, 0);
  const suspicious = plan.sections.flatMap((s) => s.files).filter((f) => f.suspicious).length;
  const similar = findSimilarClient(clients.data ?? [], plan.clientName);

  const update = (fn: (draft: Plan) => void) =>
    setPlan((p) => {
      const draft = structuredClone(p);
      // structuredClone copia los File; se restauran las referencias originales.
      draft.sections.forEach((s, i) => s.files.forEach((f, j) => (f.file = p.sections[i].files[j].file)));
      fn(draft);
      return draft;
    });

  async function start() {
    let last: ImportProgress = { done: 0, total: files.length, current: '', warnings: [] };
    onRun(last);
    try {
      const clientId = await runImport({
        plan,
        existingClientId: similar?.id ?? null,
        hidden,
        onProgress: (p) => {
          last = p;
          onProgress(p);
        },
      });
      await queryClient.invalidateQueries();
      onDone(clientId, last);
    } catch (e) {
      toast(errorMessage(e), 'error');
      onDone('', { ...last, warnings: [...last.warnings, errorMessage(e)] });
    }
  }

  return (
    <>
      <section className="panel">
        <div className="form-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
          <div className="field">
            <label htmlFor="client-name">Nombre del cliente</label>
            <input
              id="client-name"
              value={plan.clientName}
              onChange={(e) => update((d) => void (d.clientName = e.target.value))}
            />
          </div>
          <span className="fine">Carpeta: {plan.root}</span>
        </div>

        <div className="kpis" style={{ marginTop: 14, marginBottom: 0 }}>
          <div className="kpi">
            <b>{plan.sections.filter((s) => s.include).length}</b>
            <span>secciones</span>
          </div>
          <div className="kpi">
            <b>{files.length}</b>
            <span>documentos · {formatSize(bytes)}</span>
          </div>
          <div className="kpi">
            <b>{office}</b>
            <span>de Office (se convierten a PDF)</span>
          </div>
        </div>
      </section>

      <section className="panel">
        {similar ? (
          <div className="notice danger">
            <b>Ya existe «{similar.name}».</b> Se borrará todo su contenido actual y se reemplazará por esta carpeta. Sus
            usuarios se mantienen. Si es un cliente distinto, cambia el nombre arriba.
          </div>
        ) : (
          <div className="notice info">
            <b>Cliente nuevo.</b> Se creará «{plan.clientName.trim() || '…'}».
          </div>
        )}
        {suspicious > 0 && (
          <div className="notice">
            <b>Revisa {plural(suspicious, 'archivo', 'archivos')} marcados.</b> Parecen borradores, copias o archivos de
            WhatsApp y quedaron sin marcar. Márcalos si de verdad debe verlos el cliente.
          </div>
        )}
        <label className="check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          <span>
            Subir todas las secciones <b>ocultas</b> y publicarlas yo después, una por una.
            <br />
            <span className="fine">Útil si la carpeta incluye material interno de tu metodología.</span>
          </span>
        </label>

        {plan.sections.map((s, i) => {
          const chosen = s.files.filter((f) => f.include).length;
          return (
            <details key={s.key} className={`plan-sec ${s.include ? '' : 'excluded'}`}>
              <summary>
                <input
                  type="checkbox"
                  aria-label={`Incluir sección ${s.name}`}
                  checked={s.include}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => update((d) => void (d.sections[i].include = e.target.checked))}
                />
                <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M9 6l6 6-6 6" />
                </svg>
                <span className="num">{sectionNumber(s.number)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{s.name}</b>
                  <span className="fine">
                    {' · '}
                    {s.files.length ? `${chosen} de ${s.files.length} documentos` : 'vacía'}
                  </span>
                </span>
                {s.files.some((f) => f.suspicious) && <span className="pill warn">revisar</span>}
              </summary>
              <div className="plan-files">
                {s.files.map((f, j) => (
                  <label key={f.key} className={`check ${f.include ? '' : 'excluded'}`}>
                    <input
                      type="checkbox"
                      checked={f.include}
                      disabled={!s.include}
                      onChange={(e) => update((d) => void (d.sections[i].files[j].include = e.target.checked))}
                    />
                    <FileType ext={f.ext} />
                    <span>
                      {f.name}
                      <span className="fine">
                        {f.subfolder ? ` · ${f.subfolder}` : ''} · {formatSize(f.file.size)}
                      </span>{' '}
                      {f.suspicious && <span className="pill warn">¿borrador?</span>}
                    </span>
                  </label>
                ))}
              </div>
            </details>
          );
        })}

        <div className="dialog-actions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onCancel}>
            Elegir otra carpeta
          </button>
          <button className="btn" disabled={!files.length || !plan.clientName.trim() || clients.isPending} onClick={start}>
            {similar ? `Reemplazar «${similar.name}»` : 'Subir'} ({plural(files.length, 'documento', 'documentos')})
          </button>
        </div>
      </section>
    </>
  );
}

function Progress({ progress, clientId, onAgain }: { progress: ImportProgress; clientId: string | null; onAgain: () => void }) {
  const finished = clientId !== null;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <section className="panel">
      <h2 style={{ margin: 0, fontSize: 18 }}>
        {finished ? (clientId ? 'Importación terminada' : 'La importación se detuvo') : 'Subiendo…'}
      </h2>
      <div className="pbar">
        <i style={{ width: `${finished && clientId ? 100 : pct}%` }} />
      </div>
      <p className="fine" style={{ margin: 0 }}>
        {progress.done} de {progress.total} documentos{!finished && progress.current ? ` · ${progress.current}` : ''}
      </p>
      {!finished && <p className="fine">No cierres esta pestaña hasta que termine.</p>}
      {progress.warnings.length > 0 && (
        <>
          <p style={{ margin: '14px 0 0' }}>
            <b>{plural(progress.warnings.length, 'aviso', 'avisos')}</b>
            <span className="fine"> · los Office sin PDF se pueden convertir después desde la ficha del cliente.</span>
          </p>
          <ul className="warnings">
            {progress.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </>
      )}
      {finished && (
        <div className="dialog-actions" style={{ marginTop: 14, justifyContent: 'flex-start' }}>
          {clientId && (
            <Link className="btn" to={`/clientes/${clientId}`}>
              Ver el cliente
            </Link>
          )}
          <button className="btn ghost" onClick={onAgain}>
            Importar otra carpeta
          </button>
        </div>
      )}
    </section>
  );
}
