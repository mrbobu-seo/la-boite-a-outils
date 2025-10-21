import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { LogIn, Settings, LogOut, Folder } from 'lucide-react';

// Redesigned user session buttons
const UserSession = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="absolute top-4 right-4">
      {session ? (
        <div className="flex items-center gap-4">
                  <p className="text-sm text-white bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">{session.user.email}</p>
          <Link to="/projects" className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            <Folder className="h-4 w-4" />
            <span>Projets</span>
          </Link>
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                    <Settings className="h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>      ) : (
        <Link to="/auth" className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
          <LogIn className="h-4 w-4" />
          <span>Connexion</span>
        </Link>
      )}
    </div>
  );
};

export default UserSession;
