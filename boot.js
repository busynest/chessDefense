const firebaseHost = location.hostname;
const firebaseConfig = (firebaseHost === 'localhost' || firebaseHost === '127.0.0.1')
  ? window.firebaseDevelopment
  : window.firebaseProduction;
window.process = {
  env: {
    NODE_ENV: 'production',
    FIREBASE_CONFIG: JSON.stringify(firebaseConfig),
  },
};
