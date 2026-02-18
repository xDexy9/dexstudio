import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip scroll-to-top for the book page - it will handle its own scroll
    if (pathname === '/portal/book') {
      return;
    }
    
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
