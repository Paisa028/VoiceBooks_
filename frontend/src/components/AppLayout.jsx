import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">

      <AppSidebar />

      <div className="app-main">
        <Outlet />
      </div>

    </div>
  );
}