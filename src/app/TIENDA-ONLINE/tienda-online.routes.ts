
import { Routes } from '@angular/router';
import { LayoutTiendaComponent } from './components/layout-tienda/layout-tienda.component';
import { HomeComponent } from './components/home/home.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { AuthPageComponent } from './components/auth-page/auth-page.component'; 
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { PagoPageComponent } from './components/pago-page/pago-page.component';

// Componentes de usuario
import { MisPedidosComponent } from './components/pages/mis-pedidos/mis-pedidos.component';
import { DetallePedidoUsuarioComponent } from './components/pages/detalle-pedido/detalle-pedido.component';
import { FavoritesPageComponent } from './components/favorites-page/favorites-page.component';

// Componentes de páginas de información
import { TerminosPageComponent } from './components/pages/info-pages/terminos-page/terminos-page.component';
import { PrivacidadPageComponent } from './components/pages/info-pages/privacidad-page/privacidad-page.component';
import { PreguntasFrecuentesPageComponent } from './components/pages/info-pages/preguntas-frecuentes-page/preguntas-frecuentes-page.component';
import { PoliticaEnviosPageComponent } from './components/pages/info-pages/politica-envios-page/politica-envios-page.component';
import { PoliticaCambiosPageComponent } from './components/pages/info-pages/politica-cambios-page/politica-cambios-page.component';
import { ContactoPageComponent } from './components/pages/info-pages/contacto-page/contacto-page.component';

export const TIENDA_ROUTES: Routes = [
  {
    path: 'producto/:id',
    component: ProductDetailComponent
  },
  {
    path: '',
    component: LayoutTiendaComponent,
    children: [
      // Rutas existentes
      { path: 'home', component: HomeComponent },
      { path: 'auth', component: AuthPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: 'checkout', component: CheckoutPageComponent },
      { path: 'pago', component: PagoPageComponent },
      { path: 'mis-pedidos', component: MisPedidosComponent },
      { path: 'mis-pedidos/:id', component: DetallePedidoUsuarioComponent },
      { path: 'favoritos', component: FavoritesPageComponent },
      
      // Rutas de información
      { path: 'terminos', component: TerminosPageComponent },
      { path: 'privacidad', component: PrivacidadPageComponent },
      { path: 'preguntas-frecuentes', component: PreguntasFrecuentesPageComponent },
      { path: 'politica-de-envios', component: PoliticaEnviosPageComponent },
      { path: 'politica-de-cambios', component: PoliticaCambiosPageComponent },
      { path: 'contacto', component: ContactoPageComponent },

      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
];
