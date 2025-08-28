// layout.component.ts
import { Component, HostListener } from '@angular/core';
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
  usuarioMenuAbierto = false;
  showAdditionalCharts = false; // si lo necesitas

  constructor(private router: Router, public authService: AuthService) {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  toggleProductosMenu(e?: Event)    { if (e) e.stopPropagation(); this.productosMenuAbierto = !this.productosMenuAbierto; }
  toggleVentasMenu(e?: Event)       { if (e) e.stopPropagation(); this.ventasMenuAbierto = !this.ventasMenuAbierto; }
  toggleComprasMenu(e?: Event)      { if (e) e.stopPropagation(); this.comprasMenuAbierto = !this.comprasMenuAbierto; }
  toggleInventarioMenu(e?: Event)   { if (e) e.stopPropagation(); this.inventarioMenuAbierto = !this.inventarioMenuAbierto; }
  toggleMantenimientoMenu(e?: Event){ if (e) e.stopPropagation(); this.mantenimientoMenuAbierto = !this.mantenimientoMenuAbierto; }

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
    this.usuarioMenuAbierto = false;
  }

  get loggedInUsername(): string {
    return this.authService.getUsername() || 'Usuario';
  }

  logout() {
    this.authService.logout();
    this.usuarioMenuAbierto = false;
  }

  // Cierra submenús y dropdowns cuando se hace clic fuera (útil en mobile/desktop)
  closeMenusOnClickOutside() {
    this.productosMenuAbierto = false;
    this.ventasMenuAbierto = false;
    this.comprasMenuAbierto = false;
    this.inventarioMenuAbierto = false;
    this.mantenimientoMenuAbierto = false;
    this.usuarioMenuAbierto = false;
  }

  // También cerramos al hacer clic en cualquier parte del documento (excepto en la sidebar)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // si el clic es fuera de la barra lateral y fuera del menú de usuario -> cerrar menús
    if (!target.closest('.sidebar') && !target.closest('.user-dropdown-container')) {
      this.productosMenuAbierto = false;
      this.ventasMenuAbierto = false;
      this.comprasMenuAbierto = false;
      this.inventarioMenuAbierto = false;
      this.mantenimientoMenuAbierto = false;
      this.usuarioMenuAbierto = false;
    }
  }
}
