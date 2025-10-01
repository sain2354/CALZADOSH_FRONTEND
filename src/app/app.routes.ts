import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        // La ruta raíz de la aplicación (ej: /)
        path: '',
        // En lugar de cargar solo el Layout, le decimos que cargue 
        // un conjunto completo de rutas hijas desde otro archivo.
        loadChildren: () => import('./TIENDA-ONLINE/tienda-online.routes').then(m => m.TIENDA_ROUTES),
    },
    {
        // Ruta comodín de nivel superior. Si ninguna otra ruta coincide,
        // redirige a la página de inicio.
        path: '**', 
        redirectTo: ''
    }
];
