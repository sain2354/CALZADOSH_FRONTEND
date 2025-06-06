import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  activo: boolean;
}

@Component({
  selector: 'app-lista-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-usuario.component.html',
  styleUrls: ['./lista-usuario.component.css']
})
export class ListaUsuarioComponent {
  usuarios: Usuario[] = [
    { id: 1, nombre: 'Admin Principal', email: 'admin@tienda.com', password: 'admin123', rol: 'Administrador', activo: true },
    { id: 2, nombre: 'Almacén Manager', email: 'almacen@tienda.com', password: 'almacen123', rol: 'Almacenero', activo: true },
    { id: 3, nombre: 'Vendedor 1', email: 'vendedor1@tienda.com', password: 'vendedor123', rol: 'Vendedor', activo: true },
    { id: 4, nombre: 'Vendedor 2', email: 'vendedor2@tienda.com', password: 'vendedor123', rol: 'Vendedor', activo: false }
  ];

  usuariosFiltrados: Usuario[] = [...this.usuarios];
  filtro = '';
  mostrarModal = false;
  mostrarPassword = false;
  usuarioSeleccionado: Usuario = this.limpiarUsuario();

  constructor() {}

  contarUsuariosPorRol(rol: string): number {
    return this.usuarios.filter(u => u.rol === rol).length;
  }

  filtrarUsuarios(): void {
    if (!this.filtro) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    
    const f = this.filtro.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.nombre.toLowerCase().includes(f) ||
      u.email.toLowerCase().includes(f) ||
      u.rol.toLowerCase().includes(f)
    );
  }

  abrirModalNuevo(): void {
    this.usuarioSeleccionado = this.limpiarUsuario();
    this.mostrarModal = true;
    this.mostrarPassword = false;
  }

  verUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModal = true;
    this.mostrarPassword = false;
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = { ...usuario, password: '' }; // No mostrar password actual
    this.mostrarModal = true;
    this.mostrarPassword = false;
  }

  guardarUsuario(): void {
    if (!this.validarUsuario()) {
      return;
    }

    if (this.usuarioSeleccionado.id) {
      // Editar usuario existente
      const index = this.usuarios.findIndex(u => u.id === this.usuarioSeleccionado.id);
      if (index !== -1) {
        // Si no cambió la contraseña, mantener la anterior
        if (!this.usuarioSeleccionado.password && this.usuarios[index].password) {
          this.usuarioSeleccionado.password = this.usuarios[index].password;
        }
        this.usuarios[index] = { ...this.usuarioSeleccionado };
      }
    } else {
      // Nuevo usuario
      this.usuarioSeleccionado.id = this.obtenerNuevoId();
      this.usuarioSeleccionado.activo = true;
      this.usuarios.push({ ...this.usuarioSeleccionado });
    }
    
    this.filtrarUsuarios();
    this.cerrarModal();
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de ${accion} al usuario ${usuario.nombre}?`)) {
      usuario.activo = !usuario.activo;
      this.filtrarUsuarios();
    }
  }

  private limpiarUsuario(): Usuario {
    return {
      id: 0,
      nombre: '',
      email: '',
      password: '',
      rol: 'Vendedor',
      activo: true
    };
  }

  private obtenerNuevoId(): number {
    return this.usuarios.length > 0 ? Math.max(...this.usuarios.map(u => u.id)) + 1 : 1;
  }

  private validarUsuario(): boolean {
    if (!this.usuarioSeleccionado.nombre || !this.usuarioSeleccionado.email) {
      alert('Nombre y email son campos obligatorios');
      return false;
    }

    if (!this.usuarioSeleccionado.id && !this.usuarioSeleccionado.password) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return false;
    }

    return true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = this.limpiarUsuario();
  }
}