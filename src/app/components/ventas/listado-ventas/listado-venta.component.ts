// src/app/components/ventas/listado-ventas/listado-venta.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service'; // Importar VentaService

// Importar la nueva interfaz para el detalle de venta
import { VentaDetalleResponse } from '../../../models/venta-detalle-response.model';


// Ajustar la interfaz Venta para que coincida con VentaResponse del backend
interface Venta {
  idVenta: number;
  tipoComprobante: string;
  numeroComprobante: string;
  total: number;
  fecha: string; // Usamos string ya que es como viene en VentaResponse
  estado: string;
  serie: string;
  estadoPago: string;
  costoEnvio: number;
  metodoEntrega: string;
  sucursalRecoge?: string;
  // Asumimos que VentaResponse incluye información del cliente y usuario
  // Si no es así, tendremos que ajustar esto o usar un endpoint diferente
  clienteNombre?: string; // Ejemplo si el backend lo proporciona
  usuarioNombre?: string; // Ejemplo si el backend lo proporciona
}


@Component({
  selector: 'app-listado-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe], // Añadir DatePipe y DecimalPipe
  templateUrl: './listado-venta.component.html',
  styleUrls: ['./listado-venta.component.css']
})
export class ListadoVentasComponent implements OnInit {
  // Fechas para los filtros
  fechaInicio: string = '';
  fechaFin: string = '';

  // Paginación simulada (ajustaremos a paginación real si la API lo soporta)
  paginaActual: number = 1;
  totalRegistros: number = 0;
  cantidadPorPagina: number = 10;

  // Buscador
  textoBusqueda: string = '';

  // Lista de ventas obtenida del backend
  ventas: Venta[] = [];

  // Propiedades para el modal de detalles
  mostrarModalDetalle = false;
  ventaSeleccionadaParaDetalle: VentaDetalleResponse | null = null; // *** USAMOS LA NUEVA INTERFAZ ***

  constructor(private ventaService: VentaService) { } // Inyectar VentaService

  ngOnInit(): void {
    this.cargarVentas(); // Cargar ventas al inicializar
  }

  cargarVentas(): void {
    // Aquí llamarías al servicio de ventas para obtener la lista
    // Por ahora, usaremos getVentas() general. Si necesitas filtros o paginación,
    // tendrás que modificar VentaService y este método.
    this.ventaService.getVentas().subscribe({
      next: (data: Venta[]) => { // Asumimos que getVentas devuelve un array de Venta[]
        this.ventas = data;
        this.totalRegistros = this.ventas.length; // Actualizar total de registros
        console.log('Ventas cargadas:', this.ventas);
      },
      error: (err) => {
        console.error('Error cargando ventas:', err);
        alert('Ocurrió un error al cargar el listado de ventas.');
      }
    });
  }

  buscar(): void {
    // Implementar lógica de filtrado real llamando al backend con fechas y texto de búsqueda
    console.log('Implementar búsqueda con filtros:');
    console.log('Fecha Inicio:', this.fechaInicio);
    console.log('Fecha Fin:', this.fechaFin);
    console.log('Texto de búsqueda:', this.textoBusqueda);
    // Tendrás que añadir un método a VentaService que acepte estos parámetros
    // y llamar a ese método aquí. Por ahora, solo recargamos todas las ventas.
    this.cargarVentas();
  }


  exportarExcel(): void {
    console.log('Implementar exportar a Excel');
    // Lógica para exportar a Excel (puede requerir una librería o un endpoint en el backend)
  }

  imprimir(): void {
    console.log('Implementar imprimir listado');
    // Lógica para imprimir el listado (puede ser solo imprimir la página actual)
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || (pagina > this.totalRegistros / this.cantidadPorPagina && this.totalRegistros % this.cantidadPorPagina !== 0)) {
       // Validación básica, ajustar si se implementa paginación del lado del servidor
       return;
    }
    this.paginaActual = pagina;
    console.log('Cambiando a página:', this.paginaActual);
     // Si implementas paginación del lado del servidor, llama al backend aquí con la página y cantidad por página
  }

  // Función para mostrar el modal de detalles
  verDetalle(venta: Venta): void {
      console.log('Obteniendo detalles de la venta:', venta);
      // Llama al servicio para obtener los detalles completos de la venta
      // Asumo que tienes un endpoint como GET /api/Venta/{id}/detalle en tu backend
      this.ventaService.getVentaById(venta.idVenta).subscribe({
          next: (detalleCompleto: VentaDetalleResponse) => { // *** USAMOS LA NUEVA INTERFAZ AQUÍ ***
              this.ventaSeleccionadaParaDetalle = detalleCompleto;
              this.mostrarModalDetalle = true; // Mostrar el modal
              console.log('Detalles de venta obtenidos:', detalleCompleto);
          },
          error: (err) => {
              console.error('Error cargando detalles de la venta:', err);
              alert('Ocurrió un error al cargar los detalles de la venta.');
          }
      });
  }

  // Función para cerrar el modal de detalles
  cerrarModalDetalle(): void {
      this.mostrarModalDetalle = false;
      this.ventaSeleccionadaParaDetalle = null; // Limpiar los detalles al cerrar
  }


  anularVenta(venta: Venta): void {
    console.log('Implementar anular venta:', venta);
    // Lógica para anular la venta (llamar a un endpoint en el backend)
  }

  imprimirPDF(venta: Venta): void {
    console.log('Implementar generar PDF de venta:', venta);
    // Lógica para generar PDF de la venta (puede requerir una librería o un endpoint en el backend)
  }

  // Helper para obtener las ventas de la página actual (si la paginación es del lado del frontend)
  get ventasPaginaActual(): Venta[] {
      const inicio = (this.paginaActual - 1) * this.cantidadPorPagina;
      const fin = inicio + this.cantidadPorPagina;
      return this.ventas.slice(inicio, fin);
  }

   // Helper para calcular el texto "Mostrando X al Y total de Z registros" (si la paginación es del lado del frontend)
   get textoPaginacion(): string {
       if (this.totalRegistros === 0) return 'Mostrando (0 al 0) total de 0 registros';
       const inicio = (this.paginaActual - 1) * this.cantidadPorPagina + 1;
       const fin = Math.min(inicio + this.cantidadPorPagina - 1, this.totalRegistros);
       return `Mostrando (${inicio} al ${fin}) total de ${this.totalRegistros} registros`;
   }

}
