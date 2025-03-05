import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { ListadoProductosComponent } from './components/productos/listado-productos/listado-productos.component';
import { ListadoCategoriaComponent } from './components/productos/listado-categoria/listado-categoria.component';
import { PuntoVentaComponent } from './components/ventas/punto-venta/punto-venta.component';
import { ListadoVentasComponent } from './components/ventas/listado-ventas/listado-venta.component';
import { PersonaComponent } from './components/persona/persona.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: LayoutComponent },

      // Rutas de productos
      {
        path: 'productos',
        children: [
          { path: '', redirectTo: 'listado', pathMatch: 'full' },
          { path: 'listado', component: ListadoProductosComponent },
        ],
      },
      { path: 'categorias', component: ListadoCategoriaComponent },

      // Rutas de Ventas
      {
        path: 'ventas',
        children: [
          { path: '', redirectTo: 'punto', pathMatch: 'full' },
          { path: 'punto', component: PuntoVentaComponent },
          { path: 'listado', component: ListadoVentasComponent },
        ],
      },

      // NUEVO: Ruta para Persona
      { path: 'persona', component: PersonaComponent },
    ],
  },
];
