import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { InventarioService } from '../../../services/inventario.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { InventarioResumenResponse } from '../../../models/inventario-resumen-response.model';

@Component({
  selector: 'app-entrada-salida',
  templateUrl: './entrada-salida.component.html',
  styleUrls: ['./entrada-salida.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule] // Importa CommonModule para *ngIf y *ngFor
})
export class EntradaSalidaComponent implements OnInit {

  inventarioResumen: InventarioResumenResponse[] = []; // Usaremos el modelo InventarioResumenResponse
  inventarioFiltrado: InventarioResumenResponse[] = []; // Propiedad para almacenar los datos filtrados
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  textoBusqueda: string = '';

  constructor(private inventarioService: InventarioService) { }

  ngOnInit() {
    this.cargarInventario();
  }

  cargarInventario() {
    // Llama al servicio para obtener los datos del inventario
    this.inventarioService.obtenerResumenInventario().pipe(
      catchError(error => {
        console.error('Error al obtener resumen de inventario:', error);
        return of([]); // Retorna un array vacío en caso de error
      })
    ).subscribe(
 data => {
 this.inventarioResumen = data;
 this.aplicarFiltro(); // Aplicar filtro inicial al cargar datos
 this.paginaActual = 1; // Resetear paginación al cargar nuevos datos
      });
  }

  actualizarBusqueda(valor: string) {
    this.textoBusqueda = valor.toLowerCase();
    this.paginaActual = 1;
  }

  actualizarRegistros(valor: string) {
    this.registrosPorPagina = parseInt(valor, 10);
    this.paginaActual = 1;
  }

  aplicarFiltro() {
 this.inventarioFiltrado = this.inventarioResumen.filter(item =>
      item.codigo.toLowerCase().includes(this.textoBusqueda) ||
      item.descripcion.toLowerCase().includes(this.textoBusqueda)
    );
 this.paginaActual = 1; // Resetear paginación al aplicar filtro
  }

  get inventarioPaginado() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.inventarioFiltrado.slice(inicio, inicio + this.registrosPorPagina);
  }
  
 cambiarPagina(pagina: number) {
 if (pagina >= 1 && pagina <= this.totalPaginas()) {
 this.paginaActual = pagina;
 }
  }
  
  totalPaginas(): number {
    return Math.ceil(this.inventarioFiltrado.length / this.registrosPorPagina);
  }

  // Método para filtrar por producto y fecha (Opcional, si quieres la funcionalidad del GET con parámetros)
}


