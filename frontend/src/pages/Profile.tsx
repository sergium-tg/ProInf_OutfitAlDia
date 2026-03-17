import React, { useContext, useState } from 'react';
import { IonPage, IonContent, IonButton, IonInput, IonItem, IonLabel, IonAlert } from '@ionic/react';
import { AuthContext } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const Profile: React.FC = () => {
    const { token, logout } = useContext(AuthContext);
    const history = useHistory();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDoubleConfirm, setShowDoubleConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete('http://localhost:3000/user/account', {
                headers: { Authorization: `Bearer ${token}` }
            });
            logout();
            // Redirigido a la pantalla de inicio tras la acción [cite: 60]
            history.push('/login');
        } catch (error) {
            console.error("Error al eliminar");
        }
    };

    return (
        <IonPage>
        <IonContent className="ion-padding">
        <h2>Mi Perfil</h2>
        {/* HU-07: Formulario de edición de perfil */}
        <IonItem>
        <IonLabel position="stacked">Nombre de Usuario</IonLabel>
        <IonInput placeholder="Actualizar nombre" />
        </IonItem>
        <IonButton expand="block" color="primary">Guardar Cambios</IonButton>

        {/* HU-08: Opción (o botón) visibles desde la pantalla de perfil  */}
        <IonButton expand="block" color="medium" onClick={handleLogout} className="ion-margin-top">
        Cerrar Sesión
        </IonButton>

        {/* HU-09: Modal de confirmación de "Doble Factor" [cite: 55, 58] */}
        <IonButton expand="block" color="danger" onClick={() => setShowConfirm(true)} className="ion-margin-top">
        Eliminar Cuenta
        </IonButton>

        <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        header="¿Estás seguro?"
        message="Esta acción iniciará el borrado de tu cuenta."
        buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Continuar', handler: () => setShowDoubleConfirm(true) }
        ]}
        />

        <IonAlert
        isOpen={showDoubleConfirm}
        onDidDismiss={() => setShowDoubleConfirm(false)}
        header="Confirmación Final"
        message="Esta acción es irreversible. ¿Deseas eliminar todos tus datos definitivamente?"
        buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sí, Eliminar', handler: handleDeleteAccount }
        ]}
        />
        </IonContent>
        </IonPage>
    );
};

export default Profile;
