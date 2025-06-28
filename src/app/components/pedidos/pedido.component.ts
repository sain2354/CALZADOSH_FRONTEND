import { Component, OnInit } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { DetallePedidoComponent } from './detalles_pedidos/detalle-pedido.component';

type EstadoPedido =
  | 'Pendiente Validación'
  | 'Pago Validado'
  | 'En Preparación'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    DetallePedidoComponent
  ],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent implements OnInit {
  pedidos: Pedido[] = [];
  filtros = {
    estadoPedido: '',
    estadoPago: '',
    cliente: '',
    fechaDesde: '',
    fechaHasta: ''
  };
  page = 1;
  pageSize = 10;
  mostrarFiltros = false;

  pedidoSeleccionado: Pedido | null = null;
  mostrarDetalle = false;

  estados: EstadoPedido[] = [
    'Pendiente Validación',
    'Pago Validado',
    'En Preparación',
    'Enviado',
    'Entregado',
    'Cancelado'
  ];

  constructor(private pedidoSvc: PedidoService) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.pedidoSvc.getPedidos().subscribe({
      next: data => this.pedidos = data,
      error: err => console.error('Error cargando pedidos', err)
    });
  }

  verDetalle(p: Pedido) {
    this.pedidoSvc.getDetallePedido(p.idVenta).subscribe({
      next: detalle => {
        this.pedidoSeleccionado = detalle;
        this.mostrarDetalle = true;
      },
      error: err => console.error('Error trayendo detalle', err)
    });
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pedidoSeleccionado = null;
  }

  eliminarPedido(p: Pedido) {
    if (!confirm(`¿Eliminar pedido ${p.idVenta}?`)) return;
    this.pedidoSvc.eliminarPedido(p.idVenta).subscribe({
      next: () =>
        this.pedidos = this.pedidos.filter(x => x.idVenta !== p.idVenta),
      error: err => console.error('Error eliminando', err)
    });
  }

  cambiarEstadoPedido(p: Pedido, e: Event) {
    const nuevo = (e.target as HTMLSelectElement).value as EstadoPedido;
    this.pedidoSvc.cambiarEstado(p.idVenta, nuevo).subscribe({
      next: () => p.estado = nuevo,
      error: err => console.error('Error cambiando estado', err)
    });
  }

  get pedidosFiltrados(): Pedido[] {
    return this.pedidos.filter(p => {
      const { estadoPedido, estadoPago, cliente, fechaDesde, fechaHasta } = this.filtros;

      if (estadoPedido && p.estado !== estadoPedido) return false;
      if (estadoPago   && p.estadoPago !== estadoPago) return false;
      if (cliente && !(p.cliente?.idUsuario.toString().includes(cliente))) return false;
      if (fechaDesde && new Date(p.fecha) < new Date(fechaDesde)) return false;
      if (fechaHasta && new Date(p.fecha) > new Date(fechaHasta)) return false;

      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      estadoPedido: '',
      estadoPago: '',
      cliente: '',
      fechaDesde: '',
      fechaHasta: ''
    };
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }
}
