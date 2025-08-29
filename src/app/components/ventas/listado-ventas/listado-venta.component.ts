// src/app/components/ventas/listado-ventas/listado-venta.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service';
import { VentaDetalleResponse } from '../../../models/venta-detalle-response.model';
import { NgxPaginationModule } from 'ngx-pagination';

interface Venta {
  idVenta: number;
  tipoComprobante: string;
  numeroComprobante: string;
  total: number;
  fecha: string;
  estado: string;
  serie: string;
  estadoPago: string;
  costoEnvio: number;
  metodoEntrega: string;
  sucursalRecoge?: string;
  clienteNombre?: string;
  usuarioNombre?: string;
}

@Component({
  selector: 'app-listado-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, NgxPaginationModule],
  templateUrl: './listado-venta.component.html',
  styleUrls: ['./listado-venta.component.css']
})
export class ListadoVentasComponent implements OnInit {
  fechaInicio: string = '';
  fechaFin: string = '';
  paginaActual: number = 1;
  totalRegistros: number = 0;
  cantidadPorPagina: number = 10;
  textoBusqueda: string = '';
  ventas: Venta[] = [];
  mostrarModalDetalle = false;
  ventaSeleccionadaParaDetalle: VentaDetalleResponse | null = null;

  constructor(private ventaService: VentaService) { }

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.ventaService.getVentas().subscribe({
      next: (data: Venta[]) => {
        this.ventas = data;
        this.totalRegistros = this.ventas.length;
        console.log('Ventas cargadas:', this.ventas);
      },
      error: (err) => {
        console.error('Error cargando ventas:', err);
        alert('Ocurrió un error al cargar el listado de ventas.');
      }
    });
  }

  buscar(): void {
    console.log('Implementar búsqueda con filtros:');
    console.log('Fecha Inicio:', this.fechaInicio);
    console.log('Fecha Fin:', this.fechaFin);
    console.log('Texto de búsqueda:', this.textoBusqueda);
    this.cargarVentas();
  }

  imprimir(): void {
    console.log('Implementar imprimir listado');
  }

  verDetalle(venta: Venta): void {
    console.log('Obteniendo detalles de la venta:', venta);
    this.ventaService.getVentaById(venta.idVenta).subscribe({
      next: (detalleCompleto: VentaDetalleResponse) => {
        this.ventaSeleccionadaParaDetalle = detalleCompleto;
        this.mostrarModalDetalle = true;
        console.log('Detalles de venta obtenidos:', detalleCompleto);
      },
      error: (err) => {
        console.error('Error cargando detalles de la venta:', err);
        alert('Ocurrió un error al cargar los detalles de la venta.');
      }
    });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.ventaSeleccionadaParaDetalle = null;
  }

  anularVenta(venta: Venta): void {
    console.log('Implementar anular venta:', venta);
  }
}