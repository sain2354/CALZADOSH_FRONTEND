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
  ventasMenuAbierto = false;
  comprasMenuAbierto = false;
  inventarioMenuAbierto = false;
  mantenimientoMenuAbierto = false;

  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }
  toggleProductosMenu(e: Event) { e.stopPropagation(); this.productosMenuAbierto = !this.productosMenuAbierto; }
  toggleVentasMenu(e: Event)    { e.stopPropagation(); this.ventasMenuAbierto = !this.ventasMenuAbierto; }
  toggleComprasMenu(e: Event)   { e.stopPropagation(); this.comprasMenuAbierto = !this.comprasMenuAbierto; }
  toggleInventarioMenu(e: Event)   { e.stopPropagation(); this.inventarioMenuAbierto = !this.inventarioMenuAbierto; }
  toggleMantenimientoMenu(e: Event){ e.stopPropagation(); this.mantenimientoMenuAbierto = !this.mantenimientoMenuAbierto; }

  navegar(ruta: string) {
    this.router.navigateByUrl(ruta);
    this.productosMenuAbierto    = ruta.startsWith('/productos');
    this.ventasMenuAbierto       = ruta.startsWith('/ventas');
    this.comprasMenuAbierto      = ruta.startsWith('/compras');
    this.inventarioMenuAbierto   = ruta.startsWith('/inventario');
    this.mantenimientoMenuAbierto= ruta.startsWith('/usuarios');
  }
}
