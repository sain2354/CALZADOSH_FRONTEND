// src/app/components/pedido/pedido.component.ts (Modernizado)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { PedidoService } from '../../services/pedido.service';
import { Pedido, Cliente } from '../../models/pedido.model';
import { DetallePedidoComponent } from './detalles_pedidos/detalle-pedido.component';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

type EstadoPedido =
  | 'En Preparación'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [ CommonModule, FormsModule, NgxPaginationModule, DetallePedidoComponent ],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent implements OnInit {
  pedidos: Pedido[] = [];
  page = 1;
  pageSize = 10;
  pedidoSeleccionado: Pedido | null = null;
  mostrarDetalle = false;
  cargandoNombres = false;

  // --- MODIFICACIÓN: Estados de pedido actualizados para el flujo de Mercado Pago ---
  estados: EstadoPedido[] = [
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
      next: data => {
        this.pedidos = data;
        if (this.pedidos && this.pedidos.length > 0) {
          this.obtenerNombresClientes();
        }
      },
      error: err => console.error('Error cargando pedidos', err)
    });
  }

  obtenerNombresClientes() {
    this.cargandoNombres = true;
    const solicitudes = this.pedidos.map(pedido => {
      return this.pedidoSvc.getDetallePedido(pedido.idVenta).toPromise()
        .then(detalle => {
          if (detalle) {
            if (detalle.cliente) pedido.cliente = detalle.cliente;
            if (detalle.pagos && detalle.pagos.length > 0) pedido.pagos = detalle.pagos;
            // Asigna un estado por defecto si no viene del backend
            if (!detalle.estado) pedido.estado = 'En Preparación'; 
            else pedido.estado = detalle.estado;
          }
        })
        .catch(err => {
          console.error(`Error obteniendo detalles para pedido ${pedido.idVenta}`, err);
          if (!pedido.cliente) {
            pedido.cliente = { idUsuario: 0, nombreCompleto: '—', telefono: 'No disponible', email: 'No disponible' };
          }
        });
    });
    Promise.all(solicitudes).then(() => { this.cargandoNombres = false; });
  }

  obtenerMetodoPago(p: Pedido): string {
    if (!p.pagos || p.pagos.length === 0) return 'N/A';
    const pago = p.pagos[0];

    // --- Lógica para identificar Mercado Pago ---
    // Suponemos que tu backend asigna idMedioPago = 4 para Mercado Pago
    if (pago.idMedioPago === 4) { 
        return 'Mercado Pago';
    }

    // Lógica anterior para otros tipos de pago manual
    switch (pago.idMedioPago) {
      case 1: return 'Yape';
      case 2: return 'Plin';
      case 3: return 'Transferencia';
      default: return 'Otro';
    }
  }

  verDetalle(p: Pedido) {
    this.pedidoSvc.getDetallePedido(p.idVenta).subscribe({
      next: detalle => {
        this.pedidoSeleccionado = detalle;
        this.mostrarDetalle = true;
      },
      error: (err: HttpErrorResponse) => console.error('Error al ver detalle:', err)
    });
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pedidoSeleccionado = null;
  }

  onPagoActualizado() {
    this.cargarPedidos();
    this.cerrarDetalle();
  }

  async eliminarPedido(p: Pedido) {
    // --- MODIFICACIÓN: Se quita 'Pago Validado' de los estados no eliminables ---
    const noEliminar = ['En Preparación', 'Enviado', 'Entregado'];
    if (noEliminar.includes(p.estado as EstadoPedido)) {
      Swal.fire({ icon: 'error', title: 'Acción denegada', text: 'Este pedido ya está en proceso o finalizado y no puede ser eliminado.' });
      return;
    }
    const result = await Swal.fire({ title: '¿Estás seguro?', text: `¿Deseas eliminar el pedido #${p.idVenta}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
      this.pedidoSvc.eliminarPedido(p.idVenta).subscribe({
        next: () => {
          this.pedidos = this.pedidos.filter(x => x.idVenta !== p.idVenta);
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Pedido eliminado correctamente.', timer: 1500, showConfirmButton: false });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el pedido.' })
      });
    }
  }

  async cambiarEstadoPedido(p: Pedido, e: Event) {
    const nuevo = (e.target as HTMLSelectElement).value as EstadoPedido;
    if (p.estado === nuevo) return;
    const result = await Swal.fire({ title: 'Confirmar cambio de estado', text: `¿Pasar el pedido a "${nuevo}"?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, cambiar' });
    if (result.isConfirmed) {
      this.pedidoSvc.cambiarEstado(p.idVenta, nuevo).subscribe({
        next: () => {
          p.estado = nuevo;
          Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
        },
        error: () => { (e.target as HTMLSelectElement).value = p.estado; Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado.' }); }
      });
    } else {
      (e.target as HTMLSelectElement).value = p.estado;
    }
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
