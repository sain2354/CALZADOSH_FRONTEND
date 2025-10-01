// src/app/TIENDA-ONLINE/tienda-online.routes.ts
import { Routes } from '@angular/router';
import { LayoutTiendaComponent } from './components/layout-tienda/layout-tienda.component';
import { HomeComponent } from './components/home/home.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { AuthPageComponent } from './components/auth-page/auth-page.component'; 
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';

// --- INICIO DE LA MODIFICACIÓN ---
// 1. Se importa el nuevo componente para la página de checkout.
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
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

      // --- INICIO DE LA MODIFICACIÓN ---
      // 2. Se añade la ruta para la página de checkout y una ruta provisional para el pago.
      { path: 'checkout', component: CheckoutPageComponent },
      // Nota: La página de pago real se implementará más adelante.
      { path: 'pago', redirectTo: 'home', pathMatch: 'full' }, // Redirección temporal
      // --- FIN DE LA MODIFICACIÓN ---
      
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
