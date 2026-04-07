import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/prendas')}>
                <IonCardHeader>
                  <IonCardTitle>Gestión de Prendas</IonCardTitle>
                </IonCardHeader>
              </IonCard>
            </IonCol>
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/outfits')}>
                <IonCardHeader>
                  <IonCardTitle>Gestión de Outfit</IonCardTitle>
                </IonCardHeader>
              </IonCard>
            </IonCol>
            <IonCol size="12">
              <IonCard button onClick={() => history.push('/profile')}>
                <IonCardHeader>
                  <IonCardTitle>Ajustes de Usuario</IonCardTitle>
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