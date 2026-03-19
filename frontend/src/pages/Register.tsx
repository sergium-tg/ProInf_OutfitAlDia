import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonAlert, IonText, IonList } from '@ionic/react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validarPassword = (pass: string) => {
    const p = pass.trim();
    const faltantes = [];
    if (p.length < 8) faltantes.push("8 caracteres mínimo");
    if (!/[A-Z]/.test(p)) faltantes.push("una mayúscula");
    if (!/[a-z]/.test(p)) faltantes.push("una minúscula");
    if (!/[0-9]/.test(p)) faltantes.push("un número");
    if (!/[^A-Za-z0-9]/.test(p)) faltantes.push("un carácter especial");
    return faltantes.length > 0 ? `Falta: ${faltantes.join(', ')}` : null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const errorValidacion = validarPassword(password);
    if (errorValidacion) {
      setError(errorValidacion);
      return; 
    }

    try {
      await axios.post('http://localhost:3000/auth/register', {
        email: email,
        password: password
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse.');
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

        <IonAlert
          isOpen={success}
          onDidDismiss={() => history.push('/login')}
          header="¡Éxito!"
          message="Tu cuenta ha sido creada. Ahora puedes ingresar."
          buttons={['Aceptar']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;