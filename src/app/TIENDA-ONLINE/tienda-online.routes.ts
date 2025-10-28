// src/app/TIENDA-ONLINE/tienda-online.routes.ts
import { Routes } from '@angular/router';
import { LayoutTiendaComponent } from './components/layout-tienda/layout-tienda.component';
import { HomeComponent } from './components/home/home.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { AuthPageComponent } from './components/auth-page/auth-page.component'; 
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
// --- INICIO DE LA MODIFICACIÓN ---
// 1. Se importa el nuevo componente para la página de pago.
import { PagoPageComponent } from './components/pago-page/pago-page.component';
// --- FIN DE LA MODIFICACIÓN ---

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

      // --- INICIO DE LA MODIFICACIÓN ---
      // 2. Se reemplaza la redirección temporal por la ruta real a la página de pago.
      { path: 'pago', component: PagoPageComponent },
      // --- FIN DE LA MODIFICACIÓN ---
      
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
