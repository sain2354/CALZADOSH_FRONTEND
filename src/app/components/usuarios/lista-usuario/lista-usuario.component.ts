import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { RolService } from '../../../services/rol.service';
import { UsuarioWebResponse } from '../../../models/usuario-web-response.model';
import { UsuarioWebRequest } from '../../../models/usuario-web-request.model';
import { Rol } from '../../../models/rol.model';
import { AuthService } from '../../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-lista-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-usuario.component.html',
  styleUrls: ['./lista-usuario.component.css']
})
export class ListaUsuarioComponent implements OnInit {
  usuarios: UsuarioWebResponse[] = [];
  usuariosFiltrados: UsuarioWebResponse[] = [];
  filtro = '';
  mostrarModal = false;
  mostrarPassword = false;
  usuarioSeleccionado: UsuarioWebRequest = this.limpiarUsuario();
  roles: Rol[] = [];

  // Inject AuthService
  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  // AGREGADO: Helper method to check if current user is Administrator (for UI control)
  isAdministrator(): boolean {
      return this.authService.hasRole('Administrador');
  }

  // AGREGADO: Helper method to check if current user has any of the specified roles (for UI control)
  hasAnyRole(roles: string[]): boolean {
      return this.authService.hasAnyRole(roles);
  }


  cargarUsuarios(): void {
    this.usuarioService.obtenerUsuariosWeb().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filtrarUsuarios();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        alert('Error al cargar usuarios. Inténtalo de nuevo.');
      }
    });
  }

  cargarRoles(): void {
    this.rolService.obtenerRoles().subscribe({
      next: (data) => {
        this.roles = data;
        console.log('Roles cargados:', this.roles);
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        alert('Error al cargar roles. Inténtalo de nuevo.');
      }
    });
  }

  contarUsuariosPorRol(nombreRol: string): number {
    return this.usuarios.filter(u => u.nombreRol === nombreRol).length;
  }

  filtrarUsuarios(): void {
    if (!this.filtro) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    const f = this.filtro.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.nombreCompleto.toLowerCase().includes(f) ||
      u.email.toLowerCase().includes(f) ||
      u.nombreRol.toLowerCase().includes(f)
    );
  }

  abrirModalNuevo(): void {
     // Only allow if user has Administrator role (Frontend UI control)
     if (!this.isAdministrator()) {
         alert('No tienes permisos para crear usuarios.');
         return; // Stop the operation
     }
    this.usuarioSeleccionado = this.limpiarUsuario();
    this.mostrarModal = true;
    this.mostrarPassword = true;
  }

  verUsuario(usuario: UsuarioWebResponse): void {
     // No role restriction on viewing, but you could add one if needed
    this.usuarioSeleccionado = {
         idUsuario: usuario.idUsuario,
         username: usuario.username,
         nombreCompleto: usuario.nombreCompleto,
         email: usuario.email,
         telefono: usuario.telefono,
         fechaRegistro: usuario.fechaRegistro,
         password: '',
         idRol: usuario.idRol
     };
    this.mostrarModal = true;
    this.mostrarPassword = false;
  }

  editarUsuario(usuario: UsuarioWebResponse): void {
     // Only allow if user has Administrator role (Frontend UI control)
     if (!this.isAdministrator()) {
          alert('No tienes permisos para editar usuarios.');
          return; // Stop the operation
      }
    this.usuarioSeleccionado = {
        idUsuario: usuario.idUsuario,
        username: usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        telefono: usuario.telefono,
        fechaRegistro: usuario.fechaRegistro,
        password: '',
        idRol: usuario.idRol
    };
    this.mostrarModal = true;
    this.mostrarPassword = true;
  }

  guardarUsuario(): void {
     // Basic validation
    if (!this.validarUsuario()) {
      return;
    }

     // Frontend UI control: Check role before saving
     if (!this.isAdministrator()) {
         alert('No tienes permisos para guardar cambios de usuario.');
         return; // Stop the operation
     }


    const usuarioData: UsuarioWebRequest = {
         username: this.usuarioSeleccionado.username,
         nombreCompleto: this.usuarioSeleccionado.nombreCompleto,
         email: this.usuarioSeleccionado.email,
         telefono: this.usuarioSeleccionado.telefono,
         password: this.usuarioSeleccionado.password,
         idRol: this.usuarioSeleccionado.idRol
    };

    if (this.usuarioSeleccionado.idUsuario && this.usuarioSeleccionado.idUsuario > 0) {
      // Actualizar usuario
      this.usuarioService.actualizarUsuarioWeb(this.usuarioSeleccionado.idUsuario, usuarioData).subscribe({
        next: (usuarioActualizado) => {
          console.log('Usuario actualizado con éxito:', usuarioActualizado);
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
           alert(error.message || 'Error al actualizar usuario. Inténtalo de nuevo.'); // Display backend error message
        }
      });
    } else {
      // Crear nuevo usuario
       if (!usuarioData.idRol || usuarioData.idRol <= 0) {
           alert('Selecciona un rol para el nuevo usuario.');
           return;
       }

      this.usuarioService.crearUsuarioWeb(usuarioData).subscribe({
        next: (usuarioCreado) => {
          console.log('Usuario creado con éxito:', usuarioCreado);
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert(error.message || 'Error al crear usuario. Inténtalo de nuevo.'); // Display backend error message
        }
      });
    }
  }

   // AGREGADO: eliminarUsuario - Frontend UI control
   eliminarUsuario(usuario: UsuarioWebResponse): void {
        // Only allow if user has Administrator role (Frontend UI control)
        if (!this.isAdministrator()) {
           alert('No tienes permisos para eliminar usuarios.');
           return; // Stop the operation
        }

       if (confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombreCompleto}? Esta acción es irreversible.`)) {
           this.usuarioService.eliminarUsuario(usuario.idUsuario).subscribe({
               next: () => {
                   console.log('Usuario eliminado con éxito:', usuario.nombreCompleto);
                   this.cargarUsuarios();
                   alert('Usuario eliminado con éxito.');
               },
               error: (error) => {
                   console.error('Error al eliminar usuario:', error);
                    alert(error.message || 'Error al eliminar usuario. Inténtalo de nuevo.'); // Display backend error message
               }
           });
       }
   }


  private limpiarUsuario(): UsuarioWebRequest {
    return {
      idUsuario: 0,
      username: '',
      nombreCompleto: '',
      email: '',
      telefono: '',
      password: '',
      idRol: 0, // Default placeholder role ID
      fechaRegistro: new Date()
    };
  }

  private validarUsuario(): boolean {
    if (!this.usuarioSeleccionado.nombreCompleto || !this.usuarioSeleccionado.email || !this.usuarioSeleccionado.username) {
      alert('Nombre completo, email y username son campos obligatorios');
      return false;
    }

    if (!this.usuarioSeleccionado.idUsuario && !this.usuarioSeleccionado.password) {
        alert('La contraseña es obligatoria para nuevos usuarios');
        return false;
    }

    // You might want to add frontend validation for email format, etc.

    return true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = this.limpiarUsuario();
  }

  getNombreRolSeleccionado(): string {
      const selectedRole = this.roles.find(r => r.idRol === this.usuarioSeleccionado.idRol);
      return selectedRole ? selectedRole.nombre : 'Seleccione Rol';
  }
}