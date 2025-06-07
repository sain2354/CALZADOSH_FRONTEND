// src/app/components/ventas/listado-ventas/listado-venta.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Venta {
  cliente: string;
  comprobante: string;
  correlativo: string;
  monto: number;
  fecha: Date;
  usuario: string;
  estado: 'REGISTRADA' | 'ANULADA' | 'PENDIENTE';
}

@Component({
  selector: 'app-listado-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-venta.component.html',
  styleUrls: ['./listado-venta.component.css']
})
export class ListadoVentasComponent implements OnInit {
  // Fechas para los filtros
  fechaInicio: string = '';
  fechaFin: string = '';

  // Paginación simulada
  paginaActual: number = 1;
  totalRegistros: number = 0;
  cantidadPorPagina: number = 10;

  // Buscador
  textoBusqueda: string = '';

  // Arreglo vacío para que arranque sin registros
  ventas: Venta[] = [];

  constructor() { }

  ngOnInit(): void {
    // Inicia vacío
    this.totalRegistros = this.ventas.length;
  }

  buscar(): void {
    // Lógica de filtrado (a futuro) – por ahora solo actualiza totalRegistros
    console.log('Buscando de', this.fechaInicio, 'a', this.fechaFin, 'texto:', this.textoBusqueda);
    this.totalRegistros = this.ventas.length;
  }

  exportarExcel(): void {
    console.log('Exportar a Excel');
  }

  imprimir(): void {
    console.log('Imprimir listado');
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1) { return; }
    this.paginaActual = pagina;
  }

  formatearFecha(fecha: Date): string {
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('es-PE', opciones).format(fecha);
  }

  verDetalle(venta: Venta): void {
    console.log('Ver detalle de:', venta);
  }

  anularVenta(venta: Venta): void {
    console.log('Anular venta:', venta);
  }

  imprimirPDF(venta: Venta): void {
    console.log('Generar PDF de:', venta);
  }
}
