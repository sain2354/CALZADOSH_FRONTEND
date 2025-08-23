import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../services/compra.service';
// *** CORREGIDO: Importar las interfaces de respuesta correctas ***
import { CompraResponse, CompraDetalleResponse } from '../../../models/compra.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-listado-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-compras.component.html',
  styleUrls: ['./listado-compras.component.css']
})
export class ListadoComprasComponent implements OnInit {

  filtro = '';
  // *** CORREGIDO: Usar CompraResponse para la lista ***
  compras: CompraResponse[] = [];
  comprasOriginal: CompraResponse[] = [];

  // *** Propiedades para el detalle de compra ***
  compraSeleccionadaDetalle: CompraDetalleResponse | null = null;
  mostrarModalDetalle = false;

  constructor(private compraService: CompraService) { }

  ngOnInit(): void {
    this.cargarCompras();
  }

  /**
   * Carga el listado de compras desde el backend.
   */
  cargarCompras(): void {
    // *** CORREGIDO: Llamada al método real del servicio: obtenerCompras() ***
    this.compraService.obtenerCompras().subscribe({
      next: (data: CompraResponse[]) => { // Tipar la respuesta explícitamente
        this.comprasOriginal = data;
        this.compras = data;
        console.log('Compras cargadas:', data);
      },
      // *** CORREGIDO: Tipar el parámetro de error ***
      error: (error: any) => { // Puedes usar 'any' o HttpErrorResponse
        console.error('Error al cargar compras:', error);
        // Manejar el error
      }
    });
  }

  /**
   * Aplica el filtro a la lista de compras.
   */
  aplicarFiltro(): void {
    const term = this.filtro.toLowerCase();
    if (!term) {
      this.compras = [...this.comprasOriginal];
    } else {
       this.compras = this.comprasOriginal.filter(c =>
        // Usar las propiedades de CompraResponse
        c.fechaCompra?.toString().toLowerCase().includes(term) ||
        c.nombreProveedor?.toLowerCase().includes(term) ||
        c.total?.toString().includes(term) ||
        c.tipoDocumento?.toLowerCase().includes(term) ||
        c.numeroDocumento?.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Muestra el modal de detalle de compra.
   * @param idCompra El ID de la compra a detallar.
   */
  verDetalleCompra(idCompra: number): void {
      console.log('Intentando ver detalle de compra con ID:', idCompra);
      // *** CORREGIDO: Llamada al nuevo método del servicio: obtenerCompraPorId() ***
      this.compraService.obtenerCompraPorId(idCompra).subscribe({
          next: (detalle: CompraDetalleResponse) => { // Tipar la respuesta
              this.compraSeleccionadaDetalle = detalle;
              this.mostrarModalDetalle = true;
              console.log('Detalles de compra cargados:', detalle);
          },
           // *** CORREGIDO: Tipar el parámetro de error ***
          error: (error: any) => { // Puedes usar 'any' o HttpErrorResponse
              console.error('Error al cargar detalles de compra:', error);
              // Manejar el error
          }
      });
  }

  /**
   * Cierra el modal de detalle de compra.
   */
  cerrarModalDetalle(): void {
      this.mostrarModalDetalle = false;
      this.compraSeleccionadaDetalle = null;
  }
}
