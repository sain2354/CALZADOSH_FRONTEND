import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

import { TallaService } from '../../services/talla.service';
import { Talla } from '../../models/talla.model';

@Component({
  selector: 'app-listado-talla',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule
  ],
  templateUrl: './listado-talla.component.html',
  styleUrls: ['./listado-talla.component.css']
})
export class ListadoTallaComponent implements OnInit {
  tallas: Talla[] = [];
  tallasFiltradas: Talla[] = [];

  // Paginación
  p = 1;
  itemsPorPagina = 5;

  // Filtro de búsqueda (busca en USA)
  filtro = '';

  constructor(private tallaService: TallaService) {}

  ngOnInit(): void {
    this.cargarTallas();
  }

  private cargarTallas(): void {
    this.tallaService.getTallas().subscribe({
      next: data => {
        this.tallas = data;
        this.aplicarFiltro();
      },
      error: err => console.error('Error al cargar tallas:', err)
    });
  }

  aplicarFiltro(): void {
    const txt = this.filtro.trim().toLowerCase();
    this.tallasFiltradas = this.tallas.filter(t =>
      t.usa.toString().toLowerCase().includes(txt)
    );
    this.p = 1;
  }

  get mostrandoDesde(): number {
    return (this.p - 1) * this.itemsPorPagina + 1;
  }
  get mostrandoHasta(): number {
    const hasta = this.p * this.itemsPorPagina;
    return hasta > this.tallasFiltradas.length
      ? this.tallasFiltradas.length
      : hasta;
  }
}
