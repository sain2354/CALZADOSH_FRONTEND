// src/app/TIENDA-ONLINE/tienda-online.routes.ts
import { Routes } from '@angular/router';
import { LayoutTiendaComponent } from './layout-tienda/layout-tienda.component';
import { HomeComponent } from './home/home.component';
import { ProductDetailComponent } from './product-detail/product-detail.component'; // IMPORTAMOS EL NUEVO COMPONENTE

// Estas son las rutas para la sección pública de la tienda online
export const TIENDA_ROUTES: Routes = [
  {
    // La ruta padre usa el LayoutTiendaComponent como plantilla.
    path: '',
    component: LayoutTiendaComponent,
    // Las siguientes rutas son "hijas" y se renderizarán dentro del <router-outlet> del LayoutTiendaComponent.
    children: [
      // Ruta para la página de inicio de la tienda
      { path: 'home', component: HomeComponent },

      // NUEVA RUTA: para el detalle del producto.
      // Se activa con URLs como /producto/123
      { path: 'producto/:id', component: ProductDetailComponent },
      
      // Si el usuario va a la raíz de esta sección (ej: /tienda), 
      // lo redirigimos a la página de inicio.
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
