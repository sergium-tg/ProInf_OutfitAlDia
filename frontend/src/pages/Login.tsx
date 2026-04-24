import React, { useState, useContext } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, IonText, IonList 
} from '@ionic/react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login: React.FC = () => {
  const history = useHistory();
  const { setSession } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Petición al backend
      const response = await axios.post('http://localhost:3000/auth/login', { email, password });
      
      // Guardamos el token y el usuario en el Contexto y LocalStorage
      setSession(response.data.token, response.data.user);
      
      /**
       * CAMBIO CLAVE: window.location.href
       * Forzamos una recarga completa hacia el Home. 
       * Esto asegura que el AuthContext se inicialice con los datos frescos 
       * y que las "PrivateRoute" en App.tsx detecten el cambio de estado.
       */
      window.location.href = '/home';
      
    } catch (err: any) {
      // Si la contraseña es incorrecta o el usuario no existe, caemos aquí.
      // No habrá redirección y el usuario verá el mensaje de error.
      setError(err.response?.data?.error || 'Credenciales incorrectas.');
    }
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Iniciar Sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="ion-text-center">
          <h2>¡Bienvenida!</h2>
          <p>Ingresa tus datos para gestionar tus outfits.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Correo Electrónico</IonLabel>
              <IonInput 
                type="email" 
                placeholder="ejemplo@correo.com"
                value={email} 
                onIonInput={e => setEmail(e.detail.value!)} 
                required 
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput 
                type="password" 
                placeholder="********"
                value={password} 
                onIonInput={e => setPassword(e.detail.value!)} 
                required 
              />
            </IonItem>
          </IonList>

          {error && (
            <IonText color="danger">
              <p className="ion-padding-start" style={{ fontSize: '0.9rem' }}>
                {error}
              </p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top">
            Entrar
          </IonButton>
        </form>

        <IonButton expand="block" fill="clear" color="medium" routerLink="/register">
          ¿No tienes cuenta? Regístrate aquí
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;