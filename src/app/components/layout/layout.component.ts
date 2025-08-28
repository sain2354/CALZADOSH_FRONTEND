// layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  sidebarHidden = false;
  productosMenuAbierto = false;
  ventasMenuAbierto = false;
  comprasMenuAbierto = false;
  inventarioMenuAbierto = false;
  mantenimientoMenuAbierto = false;
  usuarioMenuAbierto = false; // Added to control user dropdown menu

  constructor(private router: Router, public authService: AuthService) {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  toggleProductosMenu(e: Event) { e.stopPropagation(); this.productosMenuAbierto = !this.productosMenuAbierto; }
  toggleVentasMenu(e: Event)    { e.stopPropagation(); this.ventasMenuAbierto = !this.ventasMenuAbierto; }
  toggleComprasMenu(e: Event)   { e.stopPropagation(); this.comprasMenuAbierto = !this.comprasMenuAbierto; }
  toggleInventarioMenu(e: Event)   { e.stopPropagation(); this.inventarioMenuAbierto = !this.inventarioMenuAbierto; }
  toggleMantenimientoMenu(e: Event){ e.stopPropagation(); this.mantenimientoMenuAbierto = !this.mantenimientoMenuAbierto; }

  // AGREGADO: Method to toggle the user dropdown menu
  toggleUsuarioMenu() {
    this.usuarioMenuAbierto = !this.usuarioMenuAbierto;
  }

  navegar(ruta: string) {
    this.sidebarHidden = true;
    this.router.navigateByUrl(ruta);
    this.productosMenuAbierto    = ruta.startsWith('/productos');
    this.ventasMenuAbierto       = ruta.startsWith('/ventas');
    this.comprasMenuAbierto      = ruta.startsWith('/compras');
    this.inventarioMenuAbierto   = ruta.startsWith('/inventario');
    this.mantenimientoMenuAbierto= ruta.startsWith('/usuarios');
     // Close user menu on navigation
    this.usuarioMenuAbierto = false;
  }

   // Helper to get the logged-in username
   get loggedInUsername(): string {
       return this.authService.getUsername() || 'Usuario';
   }

   // AGREGADO: Method to handle logout from the dropdown menu
   logout() {
       this.authService.logout();
        this.usuarioMenuAbierto = false; // Close menu after logout
   }
}
