import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'admin',
        loadChildren: () => import('./admin.routes').then(m => m.ADMIN_ROUTES)
    },
    {
        // La ruta raíz de la aplicación (ej: /)
        path: '',
        // Carga las rutas de la tienda online
        loadChildren: () => import('./TIENDA-ONLINE/tienda-online.routes').then(m => m.TIENDA_ROUTES),
    },
    {
        // Ruta comodín de nivel superior. Si ninguna otra ruta coincide,
        // redirige a la página de inicio de la tienda.
        path: '**', 
        redirectTo: ''
    }
];
