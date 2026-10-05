import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import AppSidebar from './AppSidebar.jsx';

export default function AppLayout() {
  const { pathname } = useLocation();
  const content = useRef(null);
  useEffect(() => { content.current?.focus(); }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-content">Skip to content</a>

      <AppSidebar />

      <div className="app-main" id="app-content" ref={content} tabIndex={-1}>
        <Outlet />
      </div>

    </div>
  );
}
