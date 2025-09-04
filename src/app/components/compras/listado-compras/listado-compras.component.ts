import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../services/compra.service';
import { CompraResponse, CompraDetalleResponse } from '../../../models/compra.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Importa el módulo de paginación (quitamos AutocompleteLibModule)
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-listado-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './listado-compras.component.html',
  styleUrls: ['./listado-compras.component.css']
})
export class ListadoComprasComponent implements OnInit {

  filtro = '';
  compras: CompraResponse[] = [];
  comprasOriginal: CompraResponse[] = [];
  fechaInicio?: string;
  fechaFin?: string;

  compraSeleccionadaDetalle: CompraDetalleResponse | null = null;
  mostrarModalDetalle = false;

  // --- Paginación ---
  p: number = 1; // página actual
  itemsPerPage: number = 10;

  // --- Confirmación eliminación ---
  mostrarModalConfirm: boolean = false;
  compraAEliminarId: number | null = null;

  // --- Modal éxito eliminación ---
  mostrarModalSuccess: boolean = false;

  constructor(private compraService: CompraService) { }

  ngOnInit(): void {
    this.cargarCompras();
  }

  cargarCompras(): void {
    this.compraService.obtenerCompras().subscribe({
      next: (data: CompraResponse[]) => {
        this.comprasOriginal = data;
        this.compras = data;
        this.p = 1; // resetear paginador al recargar
      },
      error: (error: any) => {
        console.error('Error al cargar compras:', error);
      }
    });
  }

  buscarPorFechas(): void {
    if (this.fechaInicio && this.fechaFin) {
      const fechaInicio = new Date(this.fechaInicio);
      const fechaFin = new Date(this.fechaFin);
      this.compras = this.comprasOriginal.filter(c => {
        const fechaCompra = new Date(c.fechaCompra);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      });
    } else {
      this.compras = [...this.comprasOriginal];
    }
    this.p = 1;
  }

  // --- APPLICAR FILTRO (usado por input) ---
  aplicarFiltro(): void {
    const term = this.filtro?.toLowerCase() ?? '';
    if (!term) {
      this.compras = [...this.comprasOriginal];
    } else {
      this.compras = this.comprasOriginal.filter(c =>
        (c.fechaCompra?.toString() ?? '').toLowerCase().includes(term) ||
        (c.nombreProveedor ?? '').toLowerCase().includes(term) ||
        (c.total?.toString() ?? '').includes(term) ||
        (c.tipoDocumento ?? '').toLowerCase().includes(term) ||
        (c.numeroDocumento ?? '').toLowerCase().includes(term)
      );
    }
    this.p = 1;
  }

  // --- Eliminación con confirmación y modal de éxito ---
  confirmarEliminar(id: number): void {
    this.compraAEliminarId = id;
    this.mostrarModalConfirm = true;
  }

  cancelarEliminar(): void {
    this.compraAEliminarId = null;
    this.mostrarModalConfirm = false;
  }

  confirmarEliminarAccion(): void {
    if (this.compraAEliminarId == null) return;

    const id = this.compraAEliminarId;
    this.compraService.eliminarCompra(id).subscribe({
      next: () => {
        // cerrar modal confirm
        this.mostrarModalConfirm = false;
        this.compraAEliminarId = null;

        // recargar datos
        this.cargarCompras();

        // mostrar modal de éxito
        this.mostrarModalSuccess = true;
      },
      error: (error: any) => {
        console.error('Error al eliminar la compra', error);
        // cerrar confirm y mostrar posible mensaje de error (puedes personalizar)
        this.mostrarModalConfirm = false;
        this.compraAEliminarId = null;
      }
    });
  }

  cerrarModalSuccess(): void {
    this.mostrarModalSuccess = false;
  }

  exportarExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.compras);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras');
    XLSX.writeFile(wb, 'ListadoCompras.xlsx');
  }

  imprimir(): void {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID Compra', 'Fecha', 'Proveedor', 'Documento', 'Total']],
      body: this.compras.map(c => [c.idCompra, c.fechaCompra, c.nombreProveedor, `${c.tipoDocumento} - ${c.numeroDocumento}`, c.total]),
    });
    doc.save('ListadoCompras.pdf');
  }

  verDetalleCompra(idCompra: number): void {
    this.compraService.obtenerCompraPorId(idCompra).subscribe({
      next: (detalle: CompraDetalleResponse) => {
        this.compraSeleccionadaDetalle = detalle;
        this.mostrarModalDetalle = true;
      },
      error: (error: any) => {
        console.error('Error al cargar detalles de compra:', error);
      }
    });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.compraSeleccionadaDetalle = null;
  }

  // --- Helpers para la vista: índices visibles en la paginación ---
  get startRecord(): number {
    if (!this.compras || this.compras.length === 0) return 0;
    return (this.p - 1) * this.itemsPerPage + 1;
  }

  get endRecord(): number {
    if (!this.compras || this.compras.length === 0) return 0;
    return Math.min(this.p * this.itemsPerPage, this.compras.length);
  }

  // handler cuando cambia el tamaño de página
  onItemsPerPageChange(event: any): void {
    const v = Number(event.target.value);
    if (!isNaN(v) && v > 0) {
      this.itemsPerPage = v;
      this.p = 1;
    }
  }
}
