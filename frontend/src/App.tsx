import { Redirect, Route } from 'react-router-dom';
import { 
  IonApp, IonRouterOutlet, setupIonicReact 
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import OutfitsManager from './pages/OutfitsManager';

/* Core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

/* Importación de Páginas */
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PrendasManager from './pages/PrendasManager'; 
import PrendasOlvidadas from './pages/PrendasOlvidadas';
import PrendaForm from './pages/PrendaForm';       

/* Contexto de Autenticación */
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

setupIonicReact();

// Componente para proteger rutas Privadas
const PrivateRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <Route {...rest} render={(props) => isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />} />
  );
};

// NUEVO: Componente para rutas Públicas (Evita ir al login si ya estás logueado)
const PublicRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <Route {...rest} render={(props) => isAuthenticated ? <Redirect to="/home" /> : <Component {...props} />} />
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          
          {/* Rutas Públicas protegidas con PublicRoute */}
          <PublicRoute exact path="/login" component={Login} />
          <PublicRoute exact path="/register" component={Register} />

          {/* Rutas Privadas */}
          <PrivateRoute exact path="/home" component={Home} />
          <PrivateRoute exact path="/profile" component={Profile} />
          <PrivateRoute exact path="/prendas" component={PrendasManager} />
          <PrivateRoute exact path="/prendas/olvidadas" component={PrendasOlvidadas} />
          <PrivateRoute exact path="/prenda/nueva" component={PrendaForm} />
          <PrivateRoute exact path="/prenda/editar/:id" component={PrendaForm} />
          <PrivateRoute exact path="/outfits" component={OutfitsManager} />          

          {/* Redirección por defecto */}
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;