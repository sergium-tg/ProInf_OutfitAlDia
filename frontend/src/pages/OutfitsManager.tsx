import React, { useState, useEffect, useContext } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonButtons, 
  IonIcon, IonCard, IonGrid, IonRow, IonCol, IonItem, IonLabel, 
  IonSegment, IonSegmentButton, IonToggle, IonInput, useIonToast, IonImg, IonAlert, useIonViewWillEnter
} from '@ionic/react';
import { heart, heartOutline, trash, home } from 'ionicons/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const OutfitsManager: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [view, setView] = useState<'crear' | 'galeria'>('crear');
  const [prendas, setPrendas] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [present] = useIonToast();

  const [selectedPrendas, setSelectedPrendas] = useState<any[]>([]);
  const [nombreOutfit, setNombreOutfit] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [outfitAEliminar, setOutfitAEliminar] = useState<number | null>(null);

  useIonViewWillEnter(() => {
    if (token) { 
      fetchPrendas(); 
      fetchOutfits(); 
    }
  });

  const fetchPrendas = async () => {
    try {
      const res = await axios.get('http://localhost:3000/prendas', { headers: { Authorization: `Bearer ${token}` } });
      setPrendas(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchOutfits = async () => {
    try {
      const res = await axios.get('http://localhost:3000/outfits', { headers: { Authorization: `Bearer ${token}` } });
      setOutfits(res.data);
    } catch (e) { console.error(e); }
  };

  const toggleSelect = (prenda: any) => {
    const isSelected = selectedPrendas.some(p => p.id === prenda.id);
    if (isSelected) {
      setSelectedPrendas(selectedPrendas.filter(p => p.id !== prenda.id));
    } else {
      setSelectedPrendas([...selectedPrendas, prenda]);
    }
  };

  const handleCrearOutfit = async () => {
    if (selectedPrendas.length < 2) {
      present({ message: 'Selecciona al menos 2 prendas para tu outfit', color: 'warning', duration: 2000 });
      return;
    }

    const categorias = selectedPrendas.map(p => p.categoria);

    if (categorias.includes('Calzado')) {
      present({ message: 'Por el momento armar este outfit no es posible', color: 'danger', duration: 3000 });
      return;
    }

    const countCamisas = categorias.filter(c => c === 'Camisa').length;
    const countSacos = categorias.filter(c => c === 'Saco').length;
    const countPantalones = categorias.filter(c => c === 'Pantalon' || c === 'Pantalón').length;

    if (countCamisas > 1 || countSacos > 1 || countPantalones > 1) {
      present({ message: 'Solo puedes elegir 1 camisa, 1 saco y 1 pantalón', color: 'warning', duration: 3000 });
      return;
    }

    if (!nombreOutfit.trim()) {
      present({ message: 'Asigna un nombre a tu outfit', color: 'warning', duration: 2000 });
      return;
    }

    // --- NUEVA LÓGICA: VALIDACIÓN DE OUTFITS DUPLICADOS ---
    
    // 1. Tomamos los IDs seleccionados, los ORDENAMOS de menor a mayor y los unimos en un texto (ej: "5,12")
    const combinacionActual = selectedPrendas.map(p => p.id).sort().join(',');

    // 2. Revisamos si alguno de los outfits ya guardados tiene exactamente esa misma combinación
    const existeDuplicado = outfits.some(outfit => {
      const combinacionGuardada = outfit.prendas.map((op: any) => op.prenda.id).sort().join(',');
      return combinacionActual === combinacionGuardada;
    });

    if (existeDuplicado) {
      present({ message: 'Ya tienes un outfit guardado con esta misma combinación exacta de ropa.', color: 'danger', duration: 3000 });
      return;
    }
    // --------------------------------------------------------

    try {
      await axios.post('http://localhost:3000/outfits', {
        nombre: nombreOutfit,
        prendaIds: selectedPrendas.map(p => p.id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      present({ message: 'Outfit guardado con éxito', color: 'success', duration: 2000 });
      setNombreOutfit(''); setSelectedPrendas([]); fetchOutfits(); setView('galeria');
    } catch (e) {
      present({ message: 'Error al guardar outfit', color: 'danger', duration: 2000 });
    }
  };

  const toggleFavorito = async (outfitId: number, current: boolean) => {
    try {
      await axios.patch(`http://localhost:3000/outfits/${outfitId}/favorito`, { favorito: !current }, { headers: { Authorization: `Bearer ${token}` } });
      fetchOutfits(); // Recargar datos para mostrar el corazón coloreado
    } catch (e) {}
  };

  // Renderizado Inteligente de Previsualización (HU-16)
  const renderPreview = () => {
    // Buscamos si entre las prendas seleccionadas hay un Saco
    const hasSaco = selectedPrendas.some(p => p.categoria === 'Saco');
    
    // Si hay Saco, mostramos el Saco. Si no, mostramos la Camisa.
    const topItem = selectedPrendas.find(p => p.categoria === (hasSaco ? 'Saco' : 'Camisa'));
    
    // Buscamos el Pantalon (cubriendo ambas formas de escribirlo)
    const bottomItem = selectedPrendas.find(p => p.categoria === 'Pantalon' || p.categoria === 'Pantalón');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e9ecef', borderRadius: '10px', padding: '10px', minHeight: '200px', width: '100%' }}>
        {topItem ? (
          <IonImg src={topItem.foto_url} style={{ height: '140px', zIndex: 2 }} />
        ) : (
          <p style={{ color: '#888', margin: '20px' }}>[Parte Superior]</p>
        )}
        {bottomItem ? (
          <IonImg src={bottomItem.foto_url} style={{ height: '140px', marginTop: '-40px', zIndex: 1 }} />
        ) : (
          <p style={{ color: '#888', margin: '20px' }}>[Parte Inferior]</p>
        )}
      </div>
    );
  };

  const outfitsToShow = outfits.filter(o => soloFavoritos ? o.favorito : true);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton routerLink="/home">
              <IonIcon icon={home} style={{ fontSize: '24px', color: 'white' }} />
            </IonButton>
          </IonButtons>
          <IonTitle>Planificador de Outfits</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={view} onIonChange={e => setView(e.detail.value as any)}>
            <IonSegmentButton value="crear"><IonLabel>Crear Outfit</IonLabel></IonSegmentButton>
            <IonSegmentButton value="galeria"><IonLabel>Mis Outfits</IonLabel></IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {view === 'crear' && (
          <>
            <h3>Previsualización</h3>
            {renderPreview()}
            
            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Nombre del Outfit</IonLabel>
              <IonInput value={nombreOutfit} onIonInput={e => setNombreOutfit(e.detail.value!)} placeholder="Ej: Casual de Viernes" />
            </IonItem>

            <IonButton expand="block" onClick={handleCrearOutfit} className="ion-margin-bottom">Guardar Outfit</IonButton>

            <h3>Selecciona tus prendas</h3>
            <IonGrid>
              <IonRow>
                {prendas.map(p => (
                  <IonCol size="4" key={p.id}>
                    <IonCard 
                      button 
                      onClick={() => toggleSelect(p)} 
                      style={{ border: selectedPrendas.some(sp => sp.id === p.id) ? '3px solid var(--ion-color-primary)' : 'none' }}
                    >
                      {/* CAMBIA imagenUrl por foto_url AQUÍ */}
                      <IonImg src={p.foto_url} style={{ height: '80px', objectFit: 'cover' }} />
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </>
        )}

        {view === 'galeria' && (
          <>
            <IonItem lines="none" className="ion-margin-bottom">
              <IonLabel>Ver solo favoritos</IonLabel>
              <IonToggle checked={soloFavoritos} onIonChange={e => setSoloFavoritos(e.detail.checked)} />
            </IonItem>

            <IonGrid>
              <IonRow>
                {outfitsToShow.map(outfit => (
                  <IonCol size="12" key={outfit.id}>
                    <IonCard>
                      <IonItem lines="none">
                        <IonLabel>
                          <h2>{outfit.nombre}</h2>
                        </IonLabel>
                        <IonButton fill="clear" onClick={() => toggleFavorito(outfit.id, outfit.favorito)}>
                          <IonIcon icon={outfit.favorito ? heart : heartOutline} color={outfit.favorito ? "danger" : "medium"} />
                        </IonButton>
                        <IonButton fill="clear" onClick={() => setOutfitAEliminar(outfit.id)}>
                          <IonIcon icon={trash} color="danger" />
                        </IonButton>
                      </IonItem>
                      <div style={{ display: 'flex', padding: '10px', overflowX: 'auto', background: '#f4f5f8' }}>
                        {outfit.prendas.map((op: any) => (
                          /* CAMBIA op.prenda.imagenUrl por op.prenda.foto_url AQUÍ */
                          <IonImg key={op.prenda.id} src={op.prenda.foto_url} style={{ height: '70px', marginRight: '10px', borderRadius: '5px' }} />
                        ))}
                      </div>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </>
        )}

        <IonAlert
          isOpen={outfitAEliminar !== null}
          header="¿Eliminar Outfit?"
          message="Esta acción no se puede deshacer."
          buttons={[
            { 
              text: 'Cancelar', 
              role: 'cancel', 
              handler: () => setOutfitAEliminar(null) 
            },
            { 
              text: 'Sí, eliminar', 
              handler: async () => {
                try {
                  await axios.delete(`http://localhost:3000/outfits/${outfitAEliminar}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  present({ message: 'Outfit eliminado', color: 'dark', duration: 2000 });
                  fetchOutfits(); // Recargamos la lista
                  setOutfitAEliminar(null); // Cerramos la alerta
                } catch (e) {
                  present({ message: 'Error al eliminar', color: 'danger', duration: 2000 });
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default OutfitsManager;