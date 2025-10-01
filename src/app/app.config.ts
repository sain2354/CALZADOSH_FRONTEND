import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

// Importaciones de Firebase para la configuración global
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    // Proveedor para el enrutador de Angular
    provideRouter(routes),
    
    // Proveedor para las peticiones HTTP
    provideHttpClient(),

    // === INICIO DE LA CONFIGURACIÓN DE FIREBASE (CORREGIDO) ===
    
    // Los proveedores de @angular/fire para apps `standalone` 
    // se añaden directamente al array de providers.
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth())
    
    // === FIN DE LA CONFIGURACIÓN DE FIREBASE ===
  ]
};
