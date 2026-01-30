// Detection automatique de l'environnement
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const environment = {
  production: false,
  apiUrl: isLocalhost 
    ? 'http://localhost:5000/api'
    : 'https://votre-backend.onrender.com/api' // A remplacer par l'URL Render du backend
};
