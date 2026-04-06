import React, { useContext, useState, useEffect } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, IonAlert, IonText, IonLoading, useIonToast 
} from '@ionic/react';
import { AuthContext } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user, token, setSession, clearSession } = useContext(AuthContext);
  const history = useHistory();
  const [present] = useIonToast();
  
  const [nuevoNombre, setNuevoNombre] = useState(user?.nombre_usuario || '');
  
  // Agregamos los estados para los nuevos campos, inicializados con los datos de context o los defaults
  const [diasNoRep, setDiasNoRep] = useState(user?.dias_no_rep?.toString() || '7');
  const [diasOlvido, setDiasOlvido] = useState(user?.dias_olvido?.toString() || '30');

  const [nuevaPassword, setNuevaPassword] = useState(''); 
  const [confirmNuevaPassword, setConfirmNuevaPassword] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Sincronizar estados si el context cambia al recargar
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
    present({
      message: 'Sesión cerrada correctamente. ¡Vuelve pronto!',
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
  };

  const handleSaveProfile = async () => {
    setError(null);
    if (nuevaPassword && nuevaPassword !== confirmNuevaPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // Construimos el payload de manera dinámica
      const payload: any = { 
        nombre_usuario: nuevoNombre
      };
      
      // Solo los enviamos si no están vacíos
      if (diasNoRep !== '') payload.dias_no_rep = Number(diasNoRep);
      if (diasOlvido !== '') payload.dias_olvido = Number(diasOlvido);
      if (nuevaPassword) payload.password = nuevaPassword;

      const response = await axios.patch('http://localhost:3000/user/profile', 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // La respuesta ahora trae todos los campos actualizados
      setSession(token!, response.data.user);
      setNuevaPassword('');
      setConfirmNuevaPassword('');
      present({ message: 'Perfil actualizado con éxito', duration: 2000, color: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('http://localhost:3000/user/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h3>Gestionar mi cuenta</h3>
        
        <IonItem>
          <IonLabel position="stacked">Email (No editable)</IonLabel>
          <IonInput value={user.email} readonly disabled />
        </IonItem>
        
        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Nombre de Usuario</IonLabel>
          <IonInput value={nuevoNombre} onIonChange={e => setNuevoNombre(e.detail.value!)} />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Días sin repetir outfit</IonLabel>
          <IonInput type="number" min="0" value={diasNoRep} onIonChange={e => setDiasNoRep(e.detail.value!)} />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Días para olvido de prenda</IonLabel>
          <IonInput type="number" min="0" value={diasOlvido} onIonChange={e => setDiasOlvido(e.detail.value!)} />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Cambiar Contraseña</IonLabel>
          <IonInput type="password" value={nuevaPassword} onIonChange={e => setNuevaPassword(e.detail.value!)} placeholder="Nueva contraseña" />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Confirmar Contraseña</IonLabel>
          <IonInput type="password" value={confirmNuevaPassword} onIonChange={e => setConfirmNuevaPassword(e.detail.value!)} disabled={!nuevaPassword} />
        </IonItem>

        {error && <IonText color="danger"><p>{error}</p></IonText>}

        <IonButton expand="block" onClick={handleSaveProfile} className="ion-margin-top">
          Guardar Cambios
        </IonButton>

        <IonButton expand="block" color="medium" fill="outline" onClick={handleLogout} className="ion-margin-top">
          Cerrar Sesión
        </IonButton>

        <IonButton expand="block" color="danger" fill="clear" onClick={() => setShowConfirmDelete(true)} className="ion-margin-top">
          Eliminar mi cuenta
        </IonButton>

        <IonLoading isOpen={loading} message="Actualizando..." />
        <IonAlert
          isOpen={showConfirmDelete}
          onDidDismiss={() => setShowConfirmDelete(false)}
          header="¿Eliminar cuenta?"
          message="Esta acción borrará permanentemente tus datos."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', handler: handleDeleteAccount, cssClass: 'alert-button-confirm' }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;