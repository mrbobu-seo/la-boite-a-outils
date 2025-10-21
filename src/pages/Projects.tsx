import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

interface Project {
  id: number;
  name: string;
  created_at: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data);
        }
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: newProjectName, user_id: user.id }])
        .select();

      if (error) {
        alert(error.message);
      } else if (data) {
        setProjects([data[0], ...projects]);
        setNewProjectName('');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Mes Projets</h1>
          
          <form onSubmit={handleCreateProject} className="mb-8 flex gap-4">
            <input
              type="text"
              placeholder="Nom du nouveau projet"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            />
            <button type="submit" disabled={loading} className="flex-shrink-0 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {loading ? 'Création...' : 'Créer Projet'}
            </button>
          </form>

          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                  <p className="text-sm text-gray-500">Créé le: {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <Link to={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">
                  Voir les résultats
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
