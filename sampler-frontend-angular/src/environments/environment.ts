// Detection automatique de l'environnement
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const environment = {
  production: false,
  apiUrl: isLocalhost 
    ? 'http://localhost:5000/api'
    : 'https://sampler-backend-benyahia-kadri.onrender.com/api'
};
