import React, { useState, useContext } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, 
  IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonCard, IonImg, 
  IonButton, IonAlert, IonActionSheet, useIonViewWillEnter 
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const PrendasManager: React.FC = () => {
  const history = useHistory();
  
  // Extraemos el usuario y el token de seguridad
  const { user, token } = useContext(AuthContext); 
  
  const [prendas, setPrendas] = useState<any[]>([]);
  const [selectedPrenda, setSelectedPrenda] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState<{isOpen: boolean, header: string, message: string, handler?: () => void}>({isOpen: false, header: '', message: ''});

  // Función para obtener las prendas desde tu backend en PostgreSQL
  const fetchPrendas = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:3000/prendas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrendas(response.data);
    } catch (error) {
      console.error("Error obteniendo las prendas:", error);
    }
  };

  // useIonViewWillEnter es de Ionic: se ejecuta CADA VEZ que entras a esta pantalla.
  // Así, cuando guardas una prenda y "vuelves atrás", la lista se actualiza sola.
  useIonViewWillEnter(() => {
    fetchPrendas();
  });

  const handlePrendaClick = (prenda: any) => {
    setSelectedPrenda(prenda);
    setShowActionSheet(true);
  };

  const handleUsarPrenda = async () => {
    if (!selectedPrenda || !user) return;
    
    // HU-15: Validar repetición
    const diasNoRep = user.dias_no_rep || 7;
    
    // Verificamos si existe historial de uso previo
    const lastUsed = selectedPrenda.historial?.[0]?.fecha_uso; 
    
    if (lastUsed) {
      const diffTime = Math.abs(new Date().getTime() - new Date(lastUsed).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < diasNoRep) {
        setShowAlert({
          isOpen: true,
          header: 'Aviso de Repetición',
          message: `Usaste esta prenda hace ${diffDays} días (límite: ${diasNoRep} días). ¿Seguro que quieres usarla hoy?`,
          handler: () => registrarUso() 
        });
        return;
      }
    }
    registrarUso();
  };

  const registrarUso = async () => {
    try {
      // HU-13: Mandamos el registro de uso al backend
      await axios.post(`http://localhost:3000/prendas/${selectedPrenda.id}/usar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cerramos el menú y volvemos a cargar la lista para actualizar el historial
      setShowActionSheet(false);
      fetchPrendas();
      
      alert("¡Genial! Has registrado el uso de esta prenda.");
    } catch (error) {
      console.error("Error al registrar uso:", error);
    }
  };

  const verPrendasOlvidadas = () => {
    // HU-14: Filtramos localmente las prendas sin uso en los últimos 'dias_olvido'
    const diasOlvido = user?.dias_olvido || 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasOlvido);

    const olvidadas = prendas.filter(prenda => {
      // Si nunca se ha usado
      if (!prenda.historial || prenda.historial.length === 0) return true;
      // Si su último uso es más viejo que la fecha límite
      const ultimoUso = new Date(prenda.historial[0].fecha_uso);
      return ultimoUso < fechaLimite;
    });

    if (olvidadas.length === 0) {
      alert("¡Felicidades! No tienes prendas olvidadas (todas se han usado recientemente).");
    } else {
      // Solo mostramos las olvidadas en la cuadrícula
      setPrendas(olvidadas);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mi Armario</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonButton expand="block" color="warning" onClick={verPrendasOlvidadas} className="ion-margin-bottom">
          Ver Prendas Olvidadas
        </IonButton>

        {prendas.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            No hay prendas para mostrar. ¡Agrega tu primera prenda!
          </p>
        ) : (
          <IonGrid>
            <IonRow>
              {prendas.map((prenda) => (
                <IonCol size="6" key={prenda.id}>
                  <IonCard onClick={() => handlePrendaClick(prenda)}>
                    {/* Estilo para que todas las imágenes mantengan proporción de cuadrado */}
                    <IonImg 
                      src={prenda.foto_url} 
                      style={{ objectFit: 'cover', height: '150px', width: '100%' }} 
                    />
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/prenda/nueva')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Opciones de Prenda"
          buttons={[
            { text: 'Sí, la voy a usar', handler: handleUsarPrenda },
            { text: 'Gestionar prenda', handler: () => {
                setShowActionSheet(false);
                history.push(`/prenda/editar/${selectedPrenda?.id}`);
              }
            },
            { text: 'Cancelar', role: 'cancel' }
          ]}
        />

        <IonAlert
          isOpen={showAlert.isOpen}
          onDidDismiss={() => setShowAlert({ ...showAlert, isOpen: false })}
          header={showAlert.header}
          message={showAlert.message}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Continuar y usar', handler: showAlert.handler }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default PrendasManager;