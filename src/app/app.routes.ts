// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';

// Nuevos componentes
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PedidoComponent } from './components/pedidos/pedido.component';

// Components existentes
import { ListadoProductosComponent } from './components/productos/listado-productos/listado-productos.component';
import { ListadoCategoriaComponent } from './components/productos/listado-categoria/listado-categoria.component';
import { PuntoVentaComponent } from './components/ventas/punto-venta/punto-venta.component';
import { ListadoVentasComponent } from './components/ventas/listado-ventas/listado-venta.component';
import { ListadoPersonaComponent } from './components/persona/listado-persona/listado-persona.component';
import { IngresarComprasComponent } from './components/compras/ingresar/ingresar.component';
import { ListadoComprasComponent } from './components/compras/listado-compras/listado-compras.component';
import { EntradaSalidaComponent } from './components/inventario/entrada-salida/entrada-salida.component';
import { ListaUsuarioComponent } from './components/usuarios/lista-usuario/lista-usuario.component';
import { RolPerfilComponent } from './components/usuarios/rol-perfil/rol-perfil.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'caja', component: PedidoComponent },

      {
        path: 'productos',
        children: [
          { path: '', redirectTo: 'listado', pathMatch: 'full' },
          { path: 'listado', component: ListadoProductosComponent }
        ]
      },
      { path: 'categorias', component: ListadoCategoriaComponent },

      {
        path: 'ventas',
        children: [
          { path: '', redirectTo: 'punto', pathMatch: 'full' },
          { path: 'punto', component: PuntoVentaComponent },
          { path: 'listado', component: ListadoVentasComponent }
        ]
      },

      {
        path: 'compras',
        children: [
          { path: '', redirectTo: 'ingresar', pathMatch: 'full' },
          { path: 'ingresar', component: IngresarComprasComponent },
          { path: 'listado', component: ListadoComprasComponent }
        ]
      },

      // Clientes / Proveedores
      { path: 'clientes', component: ListadoPersonaComponent },
      { path: 'proveedores', component: ListadoPersonaComponent },

      {
        path: 'inventario',
        children: [
          { path: '', redirectTo: 'entrada-salida', pathMatch: 'full' },
          { path: 'entrada-salida', component: EntradaSalidaComponent }
        ]
      },

      {
        path: 'usuarios',
        children: [
          { path: 'lista', component: ListaUsuarioComponent },
          { path: 'rol-perfil', component: RolPerfilComponent }
        ]
      }
    ]
  }
];
