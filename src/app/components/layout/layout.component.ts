import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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

  // NUEVO: Manejo del submenú de Ventas
  ventasMenuAbierto = false;

  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  toggleProductosMenu(event: Event) {
    event.stopPropagation();
    this.productosMenuAbierto = !this.productosMenuAbierto;
  }

  // NUEVO: Manejo de clic en "Ventas"
  toggleVentasMenu(event: Event) {
    event.stopPropagation();
    this.ventasMenuAbierto = !this.ventasMenuAbierto;
  }

  navegar(ruta: string) {
    this.router.navigateByUrl(ruta);

    // ✅ Mantiene el menú de productos abierto si se navega dentro de /productos
    if (ruta.includes('/productos')) {
      this.productosMenuAbierto = true;
    }
    // NUEVO: Si quieres que el menú de Ventas se mantenga abierto al navegar, haz algo similar:
    if (ruta.includes('/ventas')) {
      this.ventasMenuAbierto = true;
    }
  }
}
