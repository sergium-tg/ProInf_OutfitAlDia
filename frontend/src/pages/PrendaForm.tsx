import React, { useState, useContext, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonAlert, IonToggle } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

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
  const [showBgAlert, setShowBgAlert] = useState(!isEditing);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // NUEVO: Estados para manejar la alerta de validación
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Cloudinary Config
  const CLOUD_NAME = 'dt9l3ca5r';
  const UPLOAD_PRESET = 'ml_default'; 

  // Cargar los datos de la prenda al editar
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
          
        } catch (error) {
          console.error("Error al cargar la prenda:", error);
        }
      };
      fetchPrenda();
    }
  }, [id, isEditing, token]);

  const handleUploadAndSave = async () => {
    // ==========================================
    // NUEVA VALIDACIÓN: Foto obligatoria al crear
    // ==========================================
    if (!isEditing && !imageFile) {
      setValidationMessage("Es obligatorio adjuntar una foto de la prenda para poder registrarla en tu armario.");
      setShowValidationAlert(true);
      return; // Detenemos la ejecución aquí, no se enviará nada al backend
    }

    let foto_url = fotoActual; 

    try {
      // Subir imagen a Cloudinary solo si el usuario seleccionó una nueva
      if (imageFile) {
        const formUpload = new FormData();
        formUpload.append('file', imageFile);
        formUpload.append('upload_preset', UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formUpload
        });
        const data = await res.json();
        foto_url = data.secure_url;
      }

      const payload = { 
        ...formData, 
        foto_url, 
        usuario_id: user?.id 
      };

      console.log("Datos exactos a enviar:", payload);

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (isEditing) {
        await axios.put(`http://localhost:3000/prendas/${id}`, payload, config);
      } else {
        await axios.post('http://localhost:3000/prendas', payload, config);
      }

      history.goBack();

    } catch (error) {
      console.error("Hubo un error al comunicarse con el servidor:", error);
      setValidationMessage("Ocurrió un error al guardar la prenda en el servidor.");
      setShowValidationAlert(true);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/prendas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      history.goBack();
    } catch (error) {
      console.error("Error al borrar:", error);
      setValidationMessage("No se pudo eliminar la prenda.");
      setShowValidationAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isEditing ? 'Gestionar Prenda' : 'Registrar Prenda'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonAlert
          isOpen={showBgAlert}
          onDidDismiss={() => setShowBgAlert(false)}
          header="Aviso Importante"
          message="Estamos en una etapa muy temprana del desarrollo, por lo que por el momento vas a tener que quitar el fondo y alinear la prenda usando cualquier herramienta de IA."
          buttons={['Entendido']}
        />

        {/* ALERTA DE VALIDACIÓN Y ERRORES */}
        <IonAlert
          isOpen={showValidationAlert}
          onDidDismiss={() => setShowValidationAlert(false)}
          header="Atención"
          message={validationMessage}
          buttons={['OK']}
        />

        <IonItem>
          <IonLabel position="stacked">
            {isEditing ? 'Cambiar Foto (Opcional)' : 'Foto de la prenda (Obligatoria)'}
          </IonLabel>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </IonItem>

        <IonItem>
          <IonLabel>Categoría</IonLabel>
          <IonSelect value={formData.categoria} onIonChange={e => setFormData({...formData, categoria: e.detail.value})}>
            <IonSelectOption value="Saco">Saco</IonSelectOption>
            <IonSelectOption value="Camisa">Camisa</IonSelectOption>
            <IonSelectOption value="Pantalon">Pantalón</IonSelectOption>
            <IonSelectOption value="Calzado">Calzado</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Color</IonLabel>
          <IonInput value={formData.color} onIonInput={e => setFormData({...formData, color: e.detail.value!})} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Estilo</IonLabel>
          <IonInput value={formData.estilo} onIonInput={e => setFormData({...formData, estilo: e.detail.value!})} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Ocasión</IonLabel>
          <IonInput value={formData.ocasion} onIonInput={e => setFormData({...formData, ocasion: e.detail.value!})} />
        </IonItem>

        {isEditing && (
          <>
            <IonItem>
              <IonLabel>Conceptual</IonLabel>
              <IonToggle checked={formData.conceptual} onIonChange={e => setFormData({...formData, conceptual: e.detail.checked})} />
            </IonItem>
            <IonItem>
              <IonLabel>Comprar</IonLabel>
              <IonToggle checked={formData.comprar} onIonChange={e => setFormData({...formData, comprar: e.detail.checked})} />
            </IonItem>
          </>
        )}

        <IonButton expand="block" className="ion-margin-top" onClick={handleUploadAndSave}>
          {isEditing ? 'Actualizar Prenda' : 'Guardar Prenda'}
        </IonButton>

        {isEditing && (
          <IonButton expand="block" color="danger" fill="outline" className="ion-margin-top" onClick={() => setShowDeleteAlert(true)}>
            Eliminar Prenda
          </IonButton>
        )}

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