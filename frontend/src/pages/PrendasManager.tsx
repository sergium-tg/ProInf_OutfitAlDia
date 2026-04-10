import React, { useState, useContext, useEffect } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, 
  IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonCard, IonImg, 
  IonButton, IonAlert, IonActionSheet, IonSelect, IonSelectOption, 
  IonInput, IonItem, IonLabel, useIonViewWillEnter, IonButtons
} from '@ionic/react';
import { add, home } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const PrendasManager: React.FC = () => {
  const history = useHistory();
  const { user, token } = useContext(AuthContext); 
  
  const [prendas, setPrendas] = useState<any[]>([]);
  const [selectedPrenda, setSelectedPrenda] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState<{isOpen: boolean, header: string, message: string, handler?: () => void}>({isOpen: false, header: '', message: ''});
  
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroColor, setFiltroColor] = useState('');

  const fetchPrendas = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.append('categoria', filtroCategoria);
      if (filtroColor) params.append('color', filtroColor);

      const response = await axios.get(`http://localhost:3000/prendas?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrendas(response.data);
    } catch (error) {
      console.error("Error obteniendo las prendas:", error);
    }
  };

  useIonViewWillEnter(() => { fetchPrendas(); });
  useEffect(() => { fetchPrendas(); }, [filtroCategoria, filtroColor]);

  const navigateTo = (path: string) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    history.push(path);
  };

  const handlePrendaClick = (prenda: any) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSelectedPrenda(prenda);
    setShowActionSheet(true);
  };

  const handleUsarPrenda = async (confirmar = false) => {
    if (!selectedPrenda || !user) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    try {
      await axios.post(`http://localhost:3000/prendas/${selectedPrenda.id}/usar`, 
        { confirmar }, { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowActionSheet(false);
      fetchPrendas();
      alert("¡Genial! Has registrado el uso de esta prenda.");

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

  const handleDeshacerUso = async () => {
    if (!selectedPrenda) return;
    try {
      await axios.delete(`http://localhost:3000/prendas/${selectedPrenda.id}/usar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowActionSheet(false);
      fetchPrendas();
      alert("Marca de uso eliminada correctamente.");
    } catch (error) {
      alert("No se pudo eliminar el uso de hoy.");
    }
  };

  const seUsoHoy = () => {
    if (!selectedPrenda || !selectedPrenda.historial || selectedPrenda.historial.length === 0) return false;
    const fechaUltimoUso = new Date(selectedPrenda.historial[0].fecha_uso);
    return fechaUltimoUso.toDateString() === new Date().toDateString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => navigateTo('/home')}><IonIcon icon={home} /></IonButton>
          </IonButtons>
          <IonTitle>Mi Armario</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding" color="light">
        <IonButton expand="block" color="warning" onClick={() => navigateTo('/prendas/olvidadas')} className="ion-margin-bottom">
          Ver Prendas Olvidadas
        </IonButton>

        <IonGrid style={{ backgroundColor: 'white', borderRadius: '10px', marginBottom: '15px', padding: '5px' }}>
          <IonRow>
            <IonCol size="6">
              <IonItem lines="none">
                <IonLabel position="stacked">Categoría</IonLabel>
                <IonSelect value={filtroCategoria} placeholder="Todas" onIonChange={e => setFiltroCategoria(e.detail.value)}>
                  <IonSelectOption value="">Todas</IonSelectOption>
                  <IonSelectOption value="Saco">Saco</IonSelectOption>
                  <IonSelectOption value="Camisa">Camisa</IonSelectOption>
                  <IonSelectOption value="Pantalon">Pantalón</IonSelectOption>
                  <IonSelectOption value="Calzado">Calzado</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="6">
              <IonItem lines="none" style={{ borderLeft: '1px solid #eee' }}>
                <IonLabel position="stacked">Color</IonLabel>
                <IonInput value={filtroColor} placeholder="Ej. Rojo" onIonChange={e => setFiltroColor(e.detail.value!)} clearInput />
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>

        {prendas.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: '#666' }}>
            <p>No se encontraron prendas con estos filtros.</p>
          </div>
        ) : (
          <IonGrid>
            <IonRow>
              {prendas.map((prenda) => (
                <IonCol size="6" key={prenda.id}>
                  <IonCard onClick={() => handlePrendaClick(prenda)} style={{ margin: '5px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <IonImg src={prenda.foto_url} style={{ objectFit: 'contain', height: '150px', width: '100%', backgroundColor: '#fff', padding: '10px' }} />
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => navigateTo('/prenda/nueva')}><IonIcon icon={add} /></IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Opciones de Prenda"
          buttons={[
            { text: 'Sí, la voy a usar', handler: () => handleUsarPrenda(false) },
            ...(seUsoHoy() ? [{ text: 'Deshacer uso de hoy', role: 'destructive', handler: handleDeshacerUso }] : []),
            { text: 'Gestionar prenda', handler: () => { setShowActionSheet(false); navigateTo(`/prenda/editar/${selectedPrenda?.id}`); } },
            { text: 'Cancelar', role: 'cancel' }
          ]}
        />

        <IonAlert isOpen={showAlert.isOpen} onDidDismiss={() => setShowAlert({ ...showAlert, isOpen: false })} header={showAlert.header} message={showAlert.message} buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Continuar y usar', handler: showAlert.handler }]} />
      </IonContent>
    </IonPage>
  );
};

export default PrendasManager;