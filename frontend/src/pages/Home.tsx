import React, { useContext } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonGrid, IonRow, 
  IonCol, IonIcon, IonButtons, IonButton, IonLabel 
} from '@ionic/react';
import { 
  shirtOutline, colorPaletteOutline, personCircleOutline, logOutOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, clearSession } = useContext(AuthContext);
  const history = useHistory();

  const handleLogout = () => {
    // Usamos clearSession que es la función que definiste en tu AuthContext
    clearSession();
    history.push('/login');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Mi Armario Digital</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f4f5f8' }}>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '24px' }}>Bienvenido, {user?.nombre_usuario || 'Usuario'}</h2>
          <p style={{ color: '#666' }}>Escoge una opción</p>
        </div>

        <IonGrid>
          <IonRow>
            {/* Gestión de Prendas */}
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/prendas')} style={{ borderRadius: '15px', margin: '10px 0' }}>
                <IonCardHeader style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={shirtOutline} style={{ fontSize: '45px', marginRight: '20px', color: 'var(--ion-color-primary)' }} />
                  <div>
                    <IonCardTitle style={{ fontSize: '20px', fontWeight: 'bold' }}>Gestión de Prendas</IonCardTitle>
                    <p style={{ margin: 0, color: '#888' }}>Visualiza y organiza todo tu armario.</p>
                  </div>
                </IonCardHeader>
              </IonCard>
            </IonCol>

            {/* Gestión de Outfit */}
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/outfits')} style={{ borderRadius: '15px', margin: '10px 0' }}>
                <IonCardHeader style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={colorPaletteOutline} style={{ fontSize: '45px', marginRight: '20px', color: '#6a3093' }} />
                  <div>
                    <IonCardTitle style={{ fontSize: '20px', fontWeight: 'bold' }}>Gestión de Outfit</IonCardTitle>
                    <p style={{ margin: 0, color: '#888' }}>Crea combinaciones y guarda favoritos.</p>
                  </div>
                </IonCardHeader>
              </IonCard>
            </IonCol>

            {/* Ajustes de Usuario */}
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/profile')} style={{ borderRadius: '15px', margin: '10px 0' }}>
                <IonCardHeader style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={personCircleOutline} style={{ fontSize: '45px', marginRight: '20px', color: '#3dc2ff' }} />
                  <div>
                    <IonCardTitle style={{ fontSize: '20px', fontWeight: 'bold' }}>Ajustes de Usuario</IonCardTitle>
                    <p style={{ margin: 0, color: '#888' }}>Configura tu perfil y preferencias.</p>
                  </div>
                </IonCardHeader>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;