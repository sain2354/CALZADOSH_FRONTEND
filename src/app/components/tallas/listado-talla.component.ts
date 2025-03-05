import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

// RUTAS DE IMPORT CORREGIDAS
import { TallaService } from '../../services/talla.service';
import { Talla } from '../../models/talla.model';

@Component({
  selector: 'app-listado-talla',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule
  ],
  templateUrl: './listado-talla.component.html',
  styleUrls: ['./listado-talla.component.css'],
})
export class ListadoTallaComponent implements OnInit {
  // Lista total de tallas
  tallas: Talla[] = [];
  // Lista filtrada para la tabla
  tallasFiltradas: Talla[] = [];

  // Paginación
  p: number = 1;
  itemsPorPagina: number = 5;

  // Búsqueda
  filtro: string = '';

  // Modelo para registrar nueva talla
  nuevaTalla = {
    descripcion: ''
  };

  constructor(private tallaService: TallaService) {}

  ngOnInit(): void {
    this.cargarTallas();
  }

  // Llama a la API para obtener todas las tallas
  cargarTallas(): void {
    this.tallaService.getAllTallas().subscribe({
      next: (data: Talla[]) => {
        this.tallas = data;
        this.filtrarTallas();
      },
      error: (err: any) => {
        console.error('Error al cargar tallas:', err);
      }
    });
  }

  // Filtra la lista según "filtro"
  filtrarTallas(): void {
    const texto = this.filtro.toLowerCase();
    this.tallasFiltradas = this.tallas.filter(t =>
      t.descripcion?.toLowerCase().includes(texto)
    );
    // Reiniciamos la paginación
    this.p = 1;
  }

  // Maneja la paginación
  cambiarItemsPorPagina(): void {
    this.p = 1;
  }

  onPageChange(page: number): void {
    this.p = page;
  }

  // Botones Excel/Print (simulado)
  exportarExcel(): void {
    alert('Exportar a Excel (lógica pendiente)');
  }

  imprimir(): void {
    alert('Imprimir (lógica pendiente)');
  }

  // Registra nueva talla
  registrarTalla(): void {
    const tallaParaEnviar = { descripcion: this.nuevaTalla.descripcion };
    this.tallaService.createTalla(tallaParaEnviar).subscribe({
      next: (tallaCreada: Talla) => {
        this.tallas.push(tallaCreada);
        this.nuevaTalla.descripcion = '';
        this.filtrarTallas();
        alert('Talla registrada con éxito!');
      },
      error: (err: any) => {
        console.error('Error al registrar talla:', err);
        alert('Ocurrió un error al registrar la talla.');
      }
    });
  }

  // Editar talla (pendiente)
  editarTalla(t: Talla): void {
    alert(`Editar talla con ID: ${t.idTalla} (pendiente)`);
  }

  // Eliminar talla
  eliminarTalla(idTalla: number): void {
    if (confirm('¿Desea eliminar esta talla?')) {
      this.tallaService.deleteTalla(idTalla).subscribe({
        next: () => {
          this.tallas = this.tallas.filter(t => t.idTalla !== idTalla);
          this.filtrarTallas();
          alert('Talla eliminada');
        },
        error: (err: any) => {
          console.error('Error al eliminar talla:', err);
          alert('Ocurrió un error al eliminar la talla.');
        }
      });
    }
  }
  

  // Texto "Mostrando X a Y de Z registros"
  get mostrandoDesde(): number {
    return (this.p - 1) * this.itemsPorPagina + 1;
  }

  get mostrandoHasta(): number {
    const hasta = (this.p - 1) * this.itemsPorPagina + this.itemsPorPagina;
    return (hasta > this.tallasFiltradas.length)
      ? this.tallasFiltradas.length
      : hasta;
  }
}
