import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

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
          <p className="text-sm">{session.user.email}</p>
<Link to="/settings" className="bg-gray-500 text-white px-3 py-1 rounded-md">
            Paramètres
          </Link>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-md">
            Déconnexion
          </button>
        </div>
      ) : (
        <Link to="/auth" className="bg-blue-500 text-white px-3 py-1 rounded-md">
          Connexion
        </Link>
      )}
    </div>
  );
};

export default UserSession;
