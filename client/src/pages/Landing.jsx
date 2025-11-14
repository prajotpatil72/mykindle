import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    },
    content: {
      textAlign: 'center',
      color: 'white',
      maxWidth: '900px',
    },
    title: {
      fontSize: '48px',
      fontWeight: '800',
      marginBottom: '16px',
    },
    subtitle: {
      fontSize: '20px',
      marginBottom: '40px',
      opacity: '0.9',
    },
    actions: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '80px',
    },
    btn: {
      padding: '16px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      textDecoration: 'none',
      cursor: 'pointer',
      border: 'none',
    },
    btnPrimary: {
      backgroundColor: '#4f46e5',
      color: 'white',
    },
    btnSecondary: {
      backgroundColor: 'white',
      color: '#4f46e5',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>PDF Reader with LLM</h1>
        <p style={styles.subtitle}>
          Read, annotate, and chat with your PDF documents using AI
        </p>

        <div style={styles.actions}>
          {isAuthenticated ? (
            <Link to="/library" style={{...styles.btn, ...styles.btnPrimary}}>
              Go to Library
            </Link>
          ) : (
            <>
              <Link to="/register" style={{...styles.btn, ...styles.btnPrimary}}>
                Get Started
              </Link>
              <Link to="/login" style={{...styles.btn, ...styles.btnSecondary}}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;