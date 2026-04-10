import React, { useContext, useState, useEffect } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, IonAlert, IonText, IonLoading, useIonToast, IonButtons, IonIcon 
} from '@ionic/react';
import { home } from 'ionicons/icons';
import { AuthContext } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user, token, setSession, clearSession } = useContext(AuthContext);
  const history = useHistory();
  const [present] = useIonToast();
  
  const [nuevoNombre, setNuevoNombre] = useState(user?.nombre_usuario || '');
  const [diasNoRep, setDiasNoRep] = useState(user?.dias_no_rep?.toString() || '7');
  const [diasOlvido, setDiasOlvido] = useState(user?.dias_olvido?.toString() || '30');

  const [nuevaPassword, setNuevaPassword] = useState(''); 
  const [confirmNuevaPassword, setConfirmNuevaPassword] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setNuevoNombre(user.nombre_usuario || '');
      setDiasNoRep(user.dias_no_rep?.toString() || '7');
      setDiasOlvido(user.dias_olvido?.toString() || '30');
    } else {
      history.push('/login');
    }
  }, [user, history]);

  if (!user) return null;

  const handleLogout = () => {
    clearSession();
    history.push('/login');
    present({ message: 'Sesión cerrada correctamente. ¡Vuelve pronto!', duration: 2000, position: 'bottom', color: 'dark' });
  };

  // CORRECCIÓN: Recibimos el evento del formulario
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); // Evitamos que la página se recargue sola
    setError(null);
    if (nuevaPassword && nuevaPassword !== confirmNuevaPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { nombre_usuario: nuevoNombre };
      if (diasNoRep !== '') payload.dias_no_rep = Number(diasNoRep);
      if (diasOlvido !== '') payload.dias_olvido = Number(diasOlvido);
      if (nuevaPassword) payload.password = nuevaPassword;

      const response = await axios.patch('http://localhost:3000/user/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      setSession(token!, response.data.user);
      setNuevaPassword('');
      setConfirmNuevaPassword('');
      present({ message: 'Perfil actualizado con éxito', duration: 2000, color: 'success' });
      history.push('/home'); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('http://localhost:3000/user/account', { headers: { Authorization: `Bearer ${token}` } });
      clearSession();
      history.push('/register');
      present({ message: 'Cuenta eliminada permanentemente', duration: 3000, color: 'danger' });
    } catch {
      setError('No se pudo eliminar la cuenta.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/home')}>
              <IonIcon icon={home} />
            </IonButton>
          </IonButtons>
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h3>Gestionar mi cuenta</h3>
        
        {/* CORRECCIÓN: Envolvemos los inputs en un <form> */}
        <form onSubmit={handleSaveProfile}>
          <IonItem>
            <IonLabel position="stacked">Email (No editable)</IonLabel>
            <IonInput value={user.email} readonly disabled />
          </IonItem>

          {/* CORRECCIÓN: Usamos onIonInput en vez de onIonChange para tiempo real */}
          <IonItem className="ion-margin-top">
            <IonLabel position="stacked">Nombre de Usuario</IonLabel>
            <IonInput value={nuevoNombre} onIonInput={e => setNuevoNombre(e.detail.value!)} />
          </IonItem>
          <IonItem className="ion-margin-top">
            <IonLabel position="stacked">Días sin repetir outfit</IonLabel>
            <IonInput type="number" min="0" value={diasNoRep} onIonInput={e => setDiasNoRep(e.detail.value!)} />
          </IonItem>
          <IonItem className="ion-margin-top">
            <IonLabel position="stacked">Días para olvido de prenda</IonLabel>
            <IonInput type="number" min="0" value={diasOlvido} onIonInput={e => setDiasOlvido(e.detail.value!)} />
          </IonItem>
          <IonItem className="ion-margin-top">
            <IonLabel position="stacked">Cambiar Contraseña</IonLabel>
            <IonInput type="password" value={nuevaPassword} onIonInput={e => setNuevaPassword(e.detail.value!)} placeholder="Nueva contraseña" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Confirmar Contraseña</IonLabel>
            <IonInput type="password" value={confirmNuevaPassword} onIonInput={e => setConfirmNuevaPassword(e.detail.value!)} disabled={!nuevaPassword} />
          </IonItem>

          {error && <IonText color="danger"><p>{error}</p></IonText>}

          {/* CORRECCIÓN: type="submit" */}
          <IonButton type="submit" expand="block" className="ion-margin-top">
            Guardar Cambios
          </IonButton>
        </form>

        {/* CORRECCIÓN: type="button" para que no activen el formulario por error */}
        <IonButton type="button" expand="block" color="medium" fill="outline" onClick={() => history.push('/home')} className="ion-margin-top">Cancelar</IonButton>
        <IonButton type="button" expand="block" color="danger" fill="clear" onClick={handleLogout} className="ion-margin-top">Cerrar Sesión</IonButton>
        <IonButton type="button" expand="block" color="danger" fill="clear" onClick={() => setShowConfirmDelete(true)} className="ion-margin-top" style={{fontSize:'0.8rem'}}>Eliminar mi cuenta permanentemente</IonButton>

        <IonLoading isOpen={loading} message="Actualizando..." />
        <IonAlert isOpen={showConfirmDelete} onDidDismiss={() => setShowConfirmDelete(false)} header="¿Eliminar cuenta?" message="Esta acción borrará permanentemente tus datos." buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', handler: handleDeleteAccount }]} />
      </IonContent>
    </IonPage>
  );
};

export default Profile;