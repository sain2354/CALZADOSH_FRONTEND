
import { Routes } from '@angular/router';
import { LayoutTiendaComponent } from './components/layout-tienda/layout-tienda.component';
import { HomeComponent } from './components/home/home.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { AuthPageComponent } from './components/auth-page/auth-page.component'; 
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { PagoPageComponent } from './components/pago-page/pago-page.component';

// Importar los nuevos componentes
import { MisPedidosComponent } from './components/pages/mis-pedidos/mis-pedidos.component';
import { DetallePedidoUsuarioComponent } from './components/pages/detalle-pedido/detalle-pedido.component';
import { FavoritesPageComponent } from './components/favorites-page/favorites-page.component';


// Estas son las rutas para la sección pública de la tienda online
export const TIENDA_ROUTES: Routes = [
  {
    path: '',
    component: LayoutTiendaComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'producto/:id', component: ProductDetailComponent },
      { path: 'auth', component: AuthPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: 'checkout', component: CheckoutPageComponent },
      { path: 'pago', component: PagoPageComponent },

      // Rutas para la gestión de pedidos del usuario
      { path: 'mis-pedidos', component: MisPedidosComponent },
      { path: 'mis-pedidos/:id', component: DetallePedidoUsuarioComponent },
      { path: 'favoritos', component: FavoritesPageComponent },
      
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
