import React, { useState, useEffect } from 'react';
import { CompetitionProvider } from './context/CompetitionContext';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { PlayPage } from './pages/PlayPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Read from window location or hash
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('/')) {
      return hash;
    }
    return path || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      } else {
        setCurrentPath(path || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo(0, 0);
  };

  const renderRoute = () => {
    // Route: /play/:teamCode
    if (currentPath.startsWith('/play/')) {
      const parts = currentPath.split('/play/');
      const code = parts[1]?.split('/')[0] || '';
      return <PlayPage teamCode={code} onNavigate={navigate} />;
    }

    // Route: /admin
    if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
      return <AdminPage onNavigate={navigate} />;
    }

    // Route: /join
    if (currentPath === '/join' || currentPath.startsWith('/join/')) {
      return <JoinPage onNavigate={navigate} />;
    }

    // Default: Home
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <CompetitionProvider>
      <div className="min-h-screen bg-[#090d16] text-slate-100 font-['Inter',sans-serif]">
        {renderRoute()}
      </div>
    </CompetitionProvider>
  );
}

export default App;

