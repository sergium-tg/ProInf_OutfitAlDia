import React, { useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

// Importación de Páginas
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Importación del Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS flavors that can be disabled */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

/**
 * Componente PrivateRoute (HU-08/09)
 * Protege las rutas que requieren que el usuario esté autenticado.
 * Si no hay token, redirige automáticamente al login.
 */
const PrivateRoute: React.FC<{ component: any; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

const App: React.FC = () => (
  <IonApp>
    {/* Envolvemos toda la aplicación en el AuthProvider para compartir la sesión */}
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          
          {/* HU-05: Ruta para el Registro de Usuarios */}
          <Route exact path="/register" component={Register} />
          
          {/* HU-06: Ruta para el Inicio de Sesión */}
          <Route exact path="/login" component={Login} />
          
          {/* HU-07, HU-08, HU-09: Ruta Protegida del Perfil */}
          <PrivateRoute exact path="/profile" component={Profile} />
          
          {/* Redirección inicial: Si el usuario entra a la raíz, intenta ir al perfil.
              Si no está logueado, PrivateRoute lo mandará a /login automáticamente. */}
          <Route exact path="/">
            <Redirect to="/profile" />
          </Route>

        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;