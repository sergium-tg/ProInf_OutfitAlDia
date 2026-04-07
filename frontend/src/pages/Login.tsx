import React, { useState, useContext } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText, IonList } from '@ionic/react';
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
      const response = await axios.post('http://localhost:3000/auth/login', { email, password });
      setSession(response.data.token, response.data.user);
      history.push('/home'); // <--- Redirección corregida al menú principal
    } catch (err: any) {
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
              <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} required />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} required />
            </IonItem>
          </IonList>

          {error && <IonText color="danger"><p className="ion-padding-start">{error}</p></IonText>}

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