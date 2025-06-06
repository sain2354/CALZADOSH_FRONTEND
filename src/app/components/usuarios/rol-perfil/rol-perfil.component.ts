import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Permiso {
  modulo: string;
  pagina: string;
  acceso: boolean;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-rol-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rol-perfil.component.html',
  styleUrls: ['./rol-perfil.component.css']
})
export class RolPerfilComponent {
  rolSeleccionado: Rol | null = null;
  
  roles: Rol[] = [
    {
      id: 'administrador',
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema',
      icono: 'fa-shield-alt',
      color: '#9b59b6',
      permisos: [
        { modulo: 'Dashboard', pagina: 'Ver', acceso: true },
        { modulo: 'Pedidos', pagina: 'Listado', acceso: true },
        { modulo: 'Pedidos', pagina: 'Crear/Editar', acceso: true },
        { modulo: 'Ventas', pagina: 'Punto de Venta', acceso: true },
        { modulo: 'Ventas', pagina: 'Listado', acceso: true },
        { modulo: 'Productos', pagina: 'Listado', acceso: true },
        { modulo: 'Productos', pagina: 'Categorías', acceso: true },
        { modulo: 'Compras', pagina: 'Clientes', acceso: true },
        { modulo: 'Compras', pagina: 'Proveedores', acceso: true },
        { modulo: 'Inventario', pagina: 'Entradas', acceso: true },
        { modulo: 'Inventario', pagina: 'Salidas', acceso: true },
        { modulo: 'Mantenimiento', pagina: 'Usuarios', acceso: true },
        { modulo: 'Mantenimiento', pagina: 'Roles', acceso: true }
      ]
    },
    {
      id: 'almacenero',
      nombre: 'Almacenero',
      descripcion: 'Gestión de inventario y productos',
      icono: 'fa-box-open',
      color: '#3498db',
      permisos: [
        { modulo: 'Dashboard', pagina: 'Ver', acceso: true },
        { modulo: 'Pedidos', pagina: 'Listado', acceso: true },
        { modulo: 'Pedidos', pagina: 'Crear/Editar', acceso: true },
        { modulo: 'Ventas', pagina: 'Punto de Venta', acceso: false },
        { modulo: 'Ventas', pagina: 'Listado', acceso: false },
        { modulo: 'Productos', pagina: 'Listado', acceso: true },
        { modulo: 'Productos', pagina: 'Categorías', acceso: true },
        { modulo: 'Compras', pagina: 'Clientes', acceso: false },
        { modulo: 'Compras', pagina: 'Proveedores', acceso: true },
        { modulo: 'Inventario', pagina: 'Entradas', acceso: true },
        { modulo: 'Inventario', pagina: 'Salidas', acceso: true },
        { modulo: 'Mantenimiento', pagina: 'Usuarios', acceso: false },
        { modulo: 'Mantenimiento', pagina: 'Roles', acceso: false }
      ]
    },
    {
      id: 'vendedor',
      nombre: 'Vendedor',
      descripcion: 'Ventas y atención al cliente',
      icono: 'fa-cash-register',
      color: '#2ecc71',
      permisos: [
        { modulo: 'Dashboard', pagina: 'Ver', acceso: true },
        { modulo: 'Pedidos', pagina: 'Listado', acceso: false },
        { modulo: 'Pedidos', pagina: 'Crear/Editar', acceso: false },
        { modulo: 'Ventas', pagina: 'Punto de Venta', acceso: true },
        { modulo: 'Ventas', pagina: 'Listado', acceso: true },
        { modulo: 'Productos', pagina: 'Listado', acceso: true },
        { modulo: 'Productos', pagina: 'Categorías', acceso: false },
        { modulo: 'Compras', pagina: 'Clientes', acceso: true },
        { modulo: 'Compras', pagina: 'Proveedores', acceso: false },
        { modulo: 'Inventario', pagina: 'Entradas', acceso: false },
        { modulo: 'Inventario', pagina: 'Salidas', acceso: false },
        { modulo: 'Mantenimiento', pagina: 'Usuarios', acceso: false },
        { modulo: 'Mantenimiento', pagina: 'Roles', acceso: false }
      ]
    }
  ];

  seleccionarRol(rol: Rol): void {
    this.rolSeleccionado = rol;
  }

  volverALista(): void {
    this.rolSeleccionado = null;
  }
  agruparPorModulo(): { nombre: string, permisos: Permiso[] }[] {
  if (!this.rolSeleccionado) return [];
  
  const grupos: { [key: string]: Permiso[] } = {};
  
  this.rolSeleccionado.permisos.forEach(permiso => {
    if (!grupos[permiso.modulo]) {
      grupos[permiso.modulo] = [];
    }
    grupos[permiso.modulo].push(permiso);
  });
  
  return Object.keys(grupos).map(modulo => ({
    nombre: modulo,
    permisos: grupos[modulo]
  }));
}
}