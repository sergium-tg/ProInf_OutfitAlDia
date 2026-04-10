import React, { useState, useContext } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, 
  IonCard, IonImg, IonButtons, IonBackButton, useIonViewWillEnter, IonActionSheet, IonAlert 
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const PrendasOlvidadas: React.FC = () => {
  const history = useHistory();
  const { token, user } = useContext(AuthContext); 
  
  const [prendas, setPrendas] = useState<any[]>([]);
  const [selectedPrenda, setSelectedPrenda] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState<{isOpen: boolean, header: string, message: string, handler?: () => void}>({isOpen: false, header: '', message: ''});

  const fetchPrendasOlvidadas = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:3000/prendas/olvidadas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrendas(response.data);
    } catch (error) {
      console.error("Error obteniendo las prendas olvidadas:", error);
    }
  };

  useIonViewWillEnter(() => {
    fetchPrendasOlvidadas();
  });

  // Función para navegar sin error aria-hidden
  const navigateTo = (path: string) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    history.push(path);
  };

  // Manejar el clic en una prenda
  const handlePrendaClick = (prenda: any) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSelectedPrenda(prenda);
    setShowActionSheet(true);
  };

  // Función para marcar la prenda olvidada como usada
  const handleUsarPrenda = async (confirmar = false) => {
    if (!selectedPrenda || !user) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    try {
      await axios.post(`http://localhost:3000/prendas/${selectedPrenda.id}/usar`, 
        { confirmar }, { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowActionSheet(false);
      fetchPrendasOlvidadas(); // Recargamos la lista para que la prenda desaparezca de "olvidadas"
      alert("¡Genial! Has rescatado esta prenda del olvido usándola hoy.");

    } catch (error: any) {
      if (error.response && error.response.status === 409 && error.response.data.alerta) {
        setShowActionSheet(false); 
        setTimeout(() => {
          setShowAlert({
            isOpen: true,
            header: 'Aviso de Repetición',
            message: error.response.data.mensaje,
            handler: () => handleUsarPrenda(true) 
          });
        }, 150);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/prendas" />
          </IonButtons>
          <IonTitle>Prendas Olvidadas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" color="light">
        
        <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'gray' }}>
          Mostrando prendas que no has usado en más de {user?.dias_olvido || 30} días, o que aún no has estrenado.
        </p>

        {prendas.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p>¡Felicidades! Tienes tu armario totalmente al día (todas tus prendas se han usado recientemente).</p>
          </div>
        ) : (
          <IonGrid>
            <IonRow>
              {prendas.map((prenda) => (
                <IonCol size="6" key={prenda.id}>
                  {/* CORRECCIÓN: Agregamos el onClick y el cursor pointer */}
                  <IonCard onClick={() => handlePrendaClick(prenda)} style={{ margin: '5px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <IonImg src={prenda.foto_url} style={{ objectFit: 'contain', height: '150px', width: '100%', backgroundColor: '#fff', padding: '10px' }} />
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        {/* Menú de opciones de la prenda */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Opciones de Prenda Olvidada"
          buttons={[
            { text: '¡La voy a usar hoy!', handler: () => handleUsarPrenda(false) },
            { text: 'Gestionar prenda', handler: () => { setShowActionSheet(false); navigateTo(`/prenda/editar/${selectedPrenda?.id}`); } },
            { text: 'Cancelar', role: 'cancel' }
          ]}
        />

        {/* Alerta de validación */}
        <IonAlert 
          isOpen={showAlert.isOpen} 
          onDidDismiss={() => setShowAlert({ ...showAlert, isOpen: false })} 
          header={showAlert.header} 
          message={showAlert.message} 
          buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Continuar y usar', handler: showAlert.handler }]} 
        />

      </IonContent>
    </IonPage>
  );
};

export default PrendasOlvidadas;