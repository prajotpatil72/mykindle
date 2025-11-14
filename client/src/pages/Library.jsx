import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Library = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="library-container">
      <header className="library-header">
        <h1>PDF Library</h1>
        <div className="user-menu">
          <span>Welcome, {user?.name}</span>
          <Link to="/profile" className="btn btn-secondary">
            Settings
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="library-content">
        <p>Your PDF documents will appear here.</p>
        <p className="text-muted">Coming in Phase 7...</p>
      </div>
    </div>
  );
};

export default Library;