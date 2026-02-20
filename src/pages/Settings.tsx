import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, ChevronLeft } from 'lucide-react';
import './Settings.css';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} />
        </button>
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        {/* User Profile Section */}
        <section className="settings-section">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={32} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2>Account</h2>
          
          <button 
            className="settings-item danger"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </section>
      </div>
    </div>
  );
};
