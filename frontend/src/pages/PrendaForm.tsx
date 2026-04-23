import React, { useState, useContext, useEffect } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonSelect, IonSelectOption, IonButton, IonAlert, IonToggle, 
  IonActionSheet, IonText, IonButtons, IonBackButton
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; 

const PrendaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const isEditing = !!id;
  
  const { user, token } = useContext(AuthContext);

  const [formData, setFormData] = useState({ 
    categoria: '', color: '', estilo: '', ocasion: '', conceptual: false, comprar: false 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fotoActual, setFotoActual] = useState<string>(''); 
  const [previewUrl, setPreviewUrl] = useState<string>(''); 
  
  const [showBgAlert, setShowBgAlert] = useState(!isEditing);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showCameraActionSheet, setShowCameraActionSheet] = useState(false);

  const CLOUD_NAME = 'dt9l3ca5r';
  const UPLOAD_PRESET = 'ml_default'; 

  useEffect(() => {
    if (isEditing && token) {
      const fetchPrenda = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/prendas/${id}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          const p = response.data;
          setFormData({ 
            categoria: p.categoria || '', 
            color: p.color || '', 
            estilo: p.estilo || '', 
            ocasion: p.ocasion || '', 
            conceptual: p.conceptual || false, 
            comprar: p.comprar || false 
          });
          setFotoActual(p.foto_url);
          setPreviewUrl(p.foto_url);
        } catch (error) { 
          console.error("Error al cargar la prenda:", error); 
        }
      };
      fetchPrenda();
    }
  }, [id, isEditing, token]);

  const openCameraActionSheet = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setShowCameraActionSheet(true);
  };

  const handleTakePhoto = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.Uri, source: source });
      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        if (blob.size > 5242880) {
          setValidationMessage("La imagen es demasiado pesada. El límite máximo es de 5MB.");
          setShowValidationAlert(true);
          return;
        }
        const fileName = `prenda_${Date.now()}.${image.format}`;
        setImageFile(new File([blob], fileName, { type: blob.type }));
        setPreviewUrl(image.webPath);
      }
    } catch (error: any) {
      if (error.message !== "User cancelled photos app" && error.message !== "User cancelled the camera picker") {
        console.error("Error al acceder a la cámara/galería:", error);
      }
    }
  };

  // CORRECCIÓN: Recibimos el evento y prevenimos recarga
  const handleUploadAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.categoria || !formData.color) {
      setValidationMessage("Por favor, selecciona una categoría y escribe un color. Son obligatorios.");
      setShowValidationAlert(true); 
      return;
    }
    if (!isEditing && !imageFile) {
      setValidationMessage("Es obligatorio adjuntar una foto de la prenda para poder registrarla.");
      setShowValidationAlert(true); 
      return; 
    }

    let foto_url = fotoActual; 

    try {
      if (imageFile) {
        const formUpload = new FormData();
        formUpload.append('file', imageFile);
        formUpload.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formUpload });
        const data = await res.json();
        foto_url = data.secure_url;
      }

      const payload = { ...formData, foto_url, usuario_id: user?.id };
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditing) await axios.put(`http://localhost:3000/prendas/${id}`, payload, config);
      else await axios.post('http://localhost:3000/prendas', payload, config);

      history.goBack();
    } catch (error) {
      console.error("Error al guardar:", error);
      setValidationMessage("Ocurrió un error al guardar la prenda en el servidor.");
      setShowValidationAlert(true);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/prendas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      history.goBack();
    } catch (error) {
      setValidationMessage("No se pudo eliminar la prenda."); setShowValidationAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/prendas" />
          </IonButtons>
          <IonTitle>{isEditing ? 'Gestionar Prenda' : 'Nueva Prenda'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" color="light">
        
        <IonAlert isOpen={showBgAlert} onDidDismiss={() => setShowBgAlert(false)} header="Aviso Importante" message="Estamos en una etapa temprana del desarrollo. Por favor, asegúrate de quitar el fondo de la foto antes de subirla." buttons={['Entendido']} />
        <IonAlert isOpen={showValidationAlert} onDidDismiss={() => setShowValidationAlert(false)} header="Atención" message={validationMessage} buttons={['OK']} />

        {/* CORRECCIÓN: Envolvemos en un <form> */}
        <form onSubmit={handleUploadAndSave}>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', marginBottom: '25px', cursor: 'pointer' }} onClick={openCameraActionSheet}>
            <div style={{ width: '200px', height: '200px', borderRadius: '20px', backgroundColor: previewUrl ? 'white' : '#e0e0e0', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: previewUrl ? 'none' : '3px dashed #a0a0a0', overflow: 'hidden' }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Vista previa" style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }} />
              ) : (
                <IonText color="dark" style={{textAlign: 'center', padding: '10px', fontSize: '0.9rem'}}>
                  Toca para añadir foto <br/> (Cámara / Galería)
                </IonText>
              )}
            </div>
          </div>

          <IonActionSheet
            isOpen={showCameraActionSheet}
            onDidDismiss={() => setShowCameraActionSheet(false)}
            header="Selecciona una opción"
            buttons={[
              { text: 'Tomar foto', handler: () => handleTakePhoto(CameraSource.Camera) },
              { text: 'Elegir de la galería', handler: () => handleTakePhoto(CameraSource.Photos) },
              { text: 'Cancelar', role: 'cancel' }
            ]}
          />

          <IonItem className="ion-margin-top" lines="full">
            <IonLabel>Categoría *</IonLabel>
            <IonSelect value={formData.categoria} placeholder="Selecciona" onIonChange={e => setFormData({...formData, categoria: e.detail.value})}>
              <IonSelectOption value="Saco">Saco</IonSelectOption>
              <IonSelectOption value="Camisa">Camisa</IonSelectOption>
              <IonSelectOption value="Pantalon">Pantalón</IonSelectOption>
              <IonSelectOption value="Calzado">Calzado</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem className="ion-margin-top" lines="full">
            <IonLabel position="stacked">Color *</IonLabel>
            <IonInput value={formData.color} placeholder="Ej. Azul marino" onIonInput={e => setFormData({...formData, color: e.detail.value!})} />
          </IonItem>
          
          <IonItem className="ion-margin-top" lines="full">
            <IonLabel position="stacked">Estilo</IonLabel>
            <IonInput value={formData.estilo} placeholder="Ej. Casual" onIonInput={e => setFormData({...formData, estilo: e.detail.value!})} />
          </IonItem>
          
          <IonItem className="ion-margin-top" lines="full">
            <IonLabel position="stacked">Ocasión</IonLabel>
            <IonInput value={formData.ocasion} placeholder="Ej. Trabajo" onIonInput={e => setFormData({...formData, ocasion: e.detail.value!})} />
          </IonItem>

          {isEditing && (
            <>
              <IonItem className="ion-margin-top" lines="none">
                <IonLabel>Conceptual (Prenda de referencia)</IonLabel>
                <IonToggle checked={formData.conceptual} onIonChange={e => setFormData({...formData, conceptual: e.detail.checked})} />
              </IonItem>
              <IonItem lines="none">
                <IonLabel>Por comprar (No está en mi armario)</IonLabel>
                <IonToggle checked={formData.comprar} onIonChange={e => setFormData({...formData, comprar: e.detail.checked})} />
              </IonItem>
            </>
          )}

          <div className="ion-padding-top ion-margin-top">
            {/* CORRECCIÓN: type="submit" */}
            <IonButton type="submit" expand="block" color="primary">
              {isEditing ? 'Actualizar Prenda' : 'Guardar Prenda'}
            </IonButton>

            {/* CORRECCIÓN: type="button" para los botones que NO deben guardar */}
            <IonButton type="button" expand="block" color="medium" fill="outline" className="ion-margin-top" onClick={() => history.goBack()}>
              Cancelar
            </IonButton>

            {isEditing && (
              <IonButton type="button" expand="block" color="danger" fill="clear" className="ion-margin-top" onClick={() => setShowDeleteAlert(true)} style={{fontSize: '0.9rem'}}>
                Eliminar Prenda
              </IonButton>
            )}
          </div>
        </form>

        <IonAlert 
          isOpen={showDeleteAlert} 
          onDidDismiss={() => setShowDeleteAlert(false)} 
          header="Confirmar Eliminación" 
          message="¿Estás seguro de que deseas eliminar esta prenda? Esta acción no se puede deshacer." 
          buttons={[
            { text: 'Cancelar', role: 'cancel' }, 
            { text: 'Eliminar', handler: handleDelete }
          ]} 
        />

      </IonContent>
    </IonPage>
  );
};

export default PrendaForm;