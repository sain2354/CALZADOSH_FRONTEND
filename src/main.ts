import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // Importamos nuestra configuración

// Arrancamos la aplicación principal (AppComponent) y le pasamos
// nuestra configuración global (appConfig). Esto asegura que los providers
// (como los de Firebase) estén disponibles en toda la app.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
