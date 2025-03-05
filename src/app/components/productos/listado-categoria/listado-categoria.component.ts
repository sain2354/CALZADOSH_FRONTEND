import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import {AutocompleteLibModule} from 'angular-ng-autocomplete';

import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria.model';

@Component({
  selector: 'app-listado-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, AutocompleteLibModule],
  templateUrl: './listado-categoria.component.html',
  styleUrls: ['./listado-categoria.component.css']
})
export class ListadoCategoriaComponent implements OnInit {
  // Lista total de categorías (traídas de la API)
  categorias: Categoria[] = [];
  // Lista filtrada para la tabla
  categoriasFiltradas: Categoria[] = [];

  // Paginación
  p: number = 1;               // Página actual
  itemsPorPagina: number = 5;  // Filas por página

  // Búsqueda
  filtro: string = '';

  // Modelo para registrar nueva categoría
  nuevaCategoria = {
    descripcion: ''
  };

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // Llama a la API para obtener todas las categorías
  cargarCategorias() {
    this.categoriaService.getAll().subscribe({
      next: (data) => {
        this.categorias = data;
        this.filtrarCategorias();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  // Filtra la lista según "filtro"
  filtrarCategorias() {
    const texto = this.filtro.toLowerCase();
    this.categoriasFiltradas = this.categorias.filter(cat =>
      cat.descripcion?.toLowerCase().includes(texto)
    );
    // Reiniciamos la paginación
    this.p = 1;
  }

  // Cambia la cantidad de filas por página
  cambiarItemsPorPagina() {
    this.p = 1;
  }

  // Maneja el cambio de página
  onPageChange(page: number) {
    this.p = page;
  }

  // Botones Excel/Print (ejemplo simulado)
  exportarExcel() {
    alert('Exportar a Excel (lógica pendiente)');
  }

  imprimir() {
    alert('Imprimir (lógica pendiente)');
  }

  // Registra nueva categoría
  registrarCategoria() {
    const categoriaParaEnviar = { descripcion: this.nuevaCategoria.descripcion };
    this.categoriaService.create(categoriaParaEnviar).subscribe({
      next: (catCreada) => {
        this.categorias.push(catCreada);
        this.nuevaCategoria.descripcion = '';
        this.filtrarCategorias();
        alert('Categoría registrada con éxito!');
      },
      error: (err) => {
        console.error('Error al registrar categoría:', err);
        alert('Ocurrió un error al registrar la categoría.');
      }
    });
  }

  // Editar categoría (pendiente)
  editarCategoria(cat: Categoria) {
    alert(`Editar categoría con ID: ${cat.idCategoria} (pendiente)`);
  }

  // Eliminar categoría
  eliminarCategoria(idCategoria: number) {
    if (confirm('¿Desea eliminar esta categoría?')) {
      this.categoriaService.delete(idCategoria).subscribe({
        next: () => {
          this.categorias = this.categorias.filter(c => c.idCategoria !== idCategoria);
          this.filtrarCategorias();
          alert('Categoría eliminada');
        },
        error: (err) => {
          console.error('Error al eliminar categoría:', err);
          alert('Ocurrió un error al eliminar la categoría.');
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
    return (hasta > this.categoriasFiltradas.length)
      ? this.categoriasFiltradas.length
      : hasta;
  }
}
