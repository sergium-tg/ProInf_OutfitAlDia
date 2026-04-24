import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonAlert, IonText, IonList, useIonToast } from '@ionic/react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const Register: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast(); // 1. Inicializamos el Toast para los mensajes

  const [nombre, setNombre] = useState(''); // 2. Agregamos el estado para el nombre
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // 3. Evitamos que la página se recargue

    // 4. Validación puramente visual para que el usuario no se equivoque al tipear
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/auth/register', {
        nombre_usuario: nombre,
        email,
        password
      });
      
      present({ message: response.data.message || 'Registro exitoso', color: 'success', duration: 2000 });
      history.push('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al registrarse';
      const colorMsg = error.response?.data?.color || 'danger';
      
      present({ message: errorMsg, color: colorMsg, duration: 4000 });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Registro - Outfit Al Día</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleRegister}>
          <IonList>
            {/* 5. Agregamos el campo visual para el nombre de usuario */}
            <IonItem>
              <IonLabel position="stacked">Nombre de Usuario</IonLabel>
              <IonInput type="text" value={nombre} onIonChange={e => setNombre(e.detail.value!)} required />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Correo Electrónico</IonLabel>
              <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} required />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} required />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Confirmar Contraseña</IonLabel>
              <IonInput type="password" value={confirmPassword} onIonChange={e => setConfirmPassword(e.detail.value!)} required />
            </IonItem>
          </IonList>

          {error && <IonText color="danger"><p className="ion-padding-start">{error}</p></IonText>}

          <IonButton expand="block" type="submit" className="ion-margin-top">
            Crear Cuenta
          </IonButton>
        </form>
        
        <IonButton expand="block" fill="clear" color="medium" routerLink="/login">
          ¿Ya tienes cuenta? Inicia Sesión
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Register;