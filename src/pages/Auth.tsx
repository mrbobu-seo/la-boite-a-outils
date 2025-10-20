import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the confirmation link!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">Login / Signup</h1>
      <form className="max-w-sm mx-auto">
        <div className="mb-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-black"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-black"
          />
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={handleLogin} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md">
            {loading ? 'Loading...' : 'Login'}
          </button>
          <button onClick={handleSignup} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded-md">
            {loading ? 'Loading...' : 'Signup'}
          </button>
        </div>
        <div className="mt-4">
          <button onClick={handleGoogleLogin} className="bg-red-500 text-white px-4 py-2 rounded-md w-full">
            Login with Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;