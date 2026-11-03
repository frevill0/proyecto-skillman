import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router';

import { BrandMark, Loading } from './components/ui';
import { ActivityPage } from './pages/Actividad';
import { ClientPage } from './pages/Cliente';
import { ClientsPage } from './pages/Clientes';
import { ImportPage } from './pages/Importar';
import { LoginPage } from './pages/Login';
import { UsersPage } from './pages/Usuarios';
import { useSession } from './state/session';

export function App() {
  const { restoring, session } = useSession();
  if (restoring) return <Loading />;
  if (!session) return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ClientsPage />} />
        <Route path="clientes/:id" element={<ClientPage />} />
        <Route path="importar" element={<ImportPage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="actividad" element={<ActivityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  const { session, signOut } = useSession();
  return (
    <div className="shell">
      <header className="top">
        <NavLink to="/" className="brand">
          <BrandMark />
          <span>
            Portal PDP <small>Administración</small>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Secciones del panel">
          <NavLink to="/" end>
            Clientes
          </NavLink>
          <NavLink to="/importar">Importar carpeta</NavLink>
          <NavLink to="/usuarios">Usuarios</NavLink>
          <NavLink to="/actividad">Actividad</NavLink>
        </nav>
        <div className="who">
          <span>{session?.user.email}</span>
          <button className="btn ghost small" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
