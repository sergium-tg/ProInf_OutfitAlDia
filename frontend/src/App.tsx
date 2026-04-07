import { Redirect, Route } from 'react-router-dom';
import { 
  IonApp, 
  IonRouterOutlet, 
  setupIonicReact 
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Importación de Páginas */
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PrendasManager from './pages/PrendasManager'; // Nueva
import PrendaForm from './pages/PrendaForm';       // Nueva

/* Contexto de Autenticación */
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

setupIonicReact();

// Componente para proteger rutas (Corregido para TypeScript)
const PrivateRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Rutas Públicas */}
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/register">
            <Register />
          </Route>

          {/* Rutas Privadas (Requieren Login) */}
          <PrivateRoute exact path="/home" component={Home} />
          <PrivateRoute exact path="/profile" component={Profile} />
          
          {/* Gestión de Prendas */}
          <PrivateRoute exact path="/prendas" component={PrendasManager} />
          
          {/* Ruta para Crear Prenda (HU-10) */}
          <PrivateRoute exact path="/prenda/nueva" component={PrendaForm} />
          
          {/* Ruta para Editar/Gestionar Prenda (HU-12) */}
          <PrivateRoute exact path="/prenda/editar/:id" component={PrendaForm} />

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