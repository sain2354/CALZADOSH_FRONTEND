import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./TIENDA-ONLINE/components/layout-tienda/layout-tienda.component').then(m => m.LayoutTiendaComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./TIENDA-ONLINE/components/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'producto/:id',
                loadComponent: () => import('./TIENDA-ONLINE/components/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
            },
            {
                path: 'carrito',
                loadComponent: () => import('./TIENDA-ONLINE/components/cart/cart.component').then(m => m.CartComponent),
            },
            {
                path: '**',
                redirectTo: '' 
            }
        ]
    },
    {
        path: '**', 
        redirectTo: ''
    }
];
