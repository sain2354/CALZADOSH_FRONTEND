import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria.model';

// PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Excel/CSV
import * as XLSX from 'xlsx';

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

  // Validación
  campoInvalido: boolean = false;

  // --- Estados para modales (eliminar / éxito / editar / error) ---
  mostrarConfirmEliminar: boolean = false;
  idAEliminar: number | null = null;

  mostrarModalSuccess: boolean = false;
  modalSuccessMessage: string = '';
  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';

  mostrarModalEditar: boolean = false;
  categoriaEditando: Categoria | null = null;
  descripcionEdicion: string = '';
  editCampoInvalido: boolean = false;

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
        this.showErrorModal('Error al cargar categorías. Revisa la consola.');
      }
    });
  }

  // Filtra la lista según "filtro"
  filtrarCategorias() {
    const texto = (this.filtro || '').toLowerCase();
    this.categoriasFiltradas = this.categorias.filter(cat =>
      (cat.descripcion ?? '').toLowerCase().includes(texto)
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

  // ---------------- Export / Print ----------------

  // Exporta a Excel (.xlsx) y CSV (.csv) la lista filtrada (o todas si no hay filtro)
  exportarExcel() {
    try {
      const lista = this.categoriasFiltradas && this.categoriasFiltradas.length > 0 ? this.categoriasFiltradas : this.categorias;
      if (!lista || lista.length === 0) {
        this.showErrorModal('No hay categorías para exportar.');
        return;
      }

      const data = lista.map(c => ({
        ID: c.idCategoria,
        Descripción: c.descripcion ?? ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data, { header: ['ID', 'Descripción'] });
      XLSX.utils.book_append_sheet(wb, ws, 'Categorías');

      const fecha = new Date().toISOString().slice(0,10);
      const nombreXlsx = `categorias_${fecha}.xlsx`;
      XLSX.writeFile(wb, nombreXlsx);

      // CSV: descargamos además el CSV (opcional)
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const fileNameCsv = `categorias_${fecha}.csv`;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', fileNameCsv);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando Excel/CSV:', err);
      this.showErrorModal('Ocurrió un error al exportar. Revisa la consola.');
    }
  }

  // Imprimir: abrir ventana con tabla HTML y botón imprimir
  imprimir() {
    try {
      const lista = this.categoriasFiltradas && this.categoriasFiltradas.length > 0 ? this.categoriasFiltradas : this.categorias;
      if (!lista || lista.length === 0) {
        this.showErrorModal('No hay categorías para imprimir.');
        return;
      }

      const styles = `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color:#222; }
          table { width:100%; border-collapse: collapse; margin-top:10px; }
          th, td { border: 1px solid #999; padding: 8px; font-size: 12px; text-align: left; }
          th { background:#17a2b8; color: white; }
          h2 { margin: 0 0 10px 0; }
          .no-print { margin-top: 12px; }
        </style>
      `;

      let html = `<h2>Listado de Categorías</h2>`;
      html += `<table><thead><tr><th>ID</th><th>Descripción</th></tr></thead><tbody>`;
      lista.forEach(c => {
        html += `<tr><td>${c.idCategoria}</td><td>${c.descripcion ?? ''}</td></tr>`;
      });
      html += `</tbody></table>`;
      html += `<div class="no-print"><button onclick="window.print()">Imprimir</button></div>`;

      const popup = window.open('', '_blank', 'width=900,height=700');
      if (!popup) {
        this.showErrorModal('No se pudo abrir ventana de impresión (bloqueador de popups). Permite popups e inténtalo de nuevo.');
        return;
      }
      popup.document.write(`<html><head><title>Imprimir Categorías</title>${styles}</head><body>${html}</body></html>`);
      popup.document.close();
    } catch (err) {
      console.error('Error preparando impresión:', err);
      this.showErrorModal('Ocurrió un error al preparar la impresión. Revisa la consola.');
    }
  }

  // Opción alternativa: generar PDF con jsPDF + autotable
  generarPdf() {
    try {
      const lista = this.categoriasFiltradas && this.categoriasFiltradas.length > 0 ? this.categoriasFiltradas : this.categorias;
      if (!lista || lista.length === 0) {
        this.showErrorModal('No hay categorías para exportar a PDF.');
        return;
      }

      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFontSize(14);
      doc.text('Listado de Categorías', 40, 40);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 40, 56);

      const columns = ['ID', 'Descripción'];
      const rows = lista.map(c => [c.idCategoria, c.descripcion ?? '']);

      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 80,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [23,162,184], textColor: 255 },
        margin: { left: 40, right: 40 }
      });

      const fileName = `categorias_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
      this.showErrorModal('Ocurrió un error al generar PDF.');
    }
  }

  // ---------------- Registro / Edición / Eliminación ----------------

  // Registra nueva categoría (con validación)
  registrarCategoria() {
    const name = (this.nuevaCategoria.descripcion ?? '').trim();
    if (!name) {
      this.campoInvalido = true;
      return;
    }
    this.campoInvalido = false;

    const categoriaParaEnviar = { descripcion: name };
    this.categoriaService.create(categoriaParaEnviar).subscribe({
      next: (catCreada) => {
        this.categorias.push(catCreada);
        this.nuevaCategoria.descripcion = '';
        this.filtrarCategorias();
        this.showSuccessModal('Categoría registrada correctamente.');
      },
      error: (err) => {
        console.error('Error al registrar categoría:', err);
        this.showErrorModal('Ocurrió un error al registrar la categoría. Revisa la consola.');
      }
    });
  }

  // Abrir modal de edición
  abrirEditarCategoria(cat: Categoria) {
    this.categoriaEditando = { ...cat }; // clonamos
    this.descripcionEdicion = cat.descripcion ?? '';
    this.editCampoInvalido = false;
    this.mostrarModalEditar = true;
  }

  // Guardar edición (usa servicio update si existe)
  guardarEdicionCategoria() {
    if (!this.categoriaEditando) return;

    const desc = (this.descripcionEdicion ?? '').trim();
    if (!desc) {
      this.editCampoInvalido = true;
      return;
    }
    this.editCampoInvalido = false;

    const id = this.categoriaEditando.idCategoria;

    // Verificamos si el servicio tiene método update
    const svcAny = this.categoriaService as any;
    if (typeof svcAny.update === 'function') {
      svcAny.update(id, { descripcion: desc }).subscribe({
        next: (catActualizada: any) => {
          const idx = this.categorias.findIndex(c => c.idCategoria === id);
          if (idx >= 0) this.categorias[idx] = catActualizada;
          this.mostrarModalEditar = false;
          this.categoriaEditando = null;
          this.descripcionEdicion = '';
          this.filtrarCategorias();
          this.showSuccessModal('Categoría actualizada correctamente.');
        },
        error: (err: any) => {
          console.error('Error al actualizar categoría:', err);
          this.showErrorModal('Ocurrió un error al actualizar la categoría. Revisa la consola.');
        }
      });
    } else {
      // Si no existe update en el servicio, mostramos error para que lo implementes
      this.showErrorModal('El servicio no implementa el método update. Imposible actualizar en backend.');
    }
  }

  cancelarEdicion() {
    this.mostrarModalEditar = false;
    this.categoriaEditando = null;
    this.descripcionEdicion = '';
    this.editCampoInvalido = false;
  }

  // Solicita confirmación (abre modal) antes de eliminar
  solicitarEliminarCategoria(idCategoria: number) {
    this.idAEliminar = idCategoria;
    this.mostrarConfirmEliminar = true;
  }

  cancelarEliminar() {
    this.idAEliminar = null;
    this.mostrarConfirmEliminar = false;
  }

  // Confirma eliminación: llama al servicio, cierra confirm modal y abre modal de éxito
  confirmarEliminar() {
    if (this.idAEliminar === null) return;

    this.categoriaService.delete(this.idAEliminar).subscribe({
      next: () => {
        // quitar de la lista local
        this.categorias = this.categorias.filter(c => c.idCategoria !== this.idAEliminar);
        this.filtrarCategorias();

        // cerrar confirm y mostrar modal de éxito con check verde
        this.mostrarConfirmEliminar = false;
        this.idAEliminar = null;
        this.showSuccessModal('La categoría fue eliminada correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar categoría:', err);
        this.showErrorModal('Ocurrió un error al eliminar la categoría. Revisa la consola.');
        this.mostrarConfirmEliminar = false;
        this.idAEliminar = null;
      }
    });
  }

  // Alias para editar (compatibilidad)
  editarCategoria(cat: Categoria) {
    this.abrirEditarCategoria(cat);
  }

  // Alias para eliminar (compatibilidad)
  eliminarCategoria(idCategoria: number) {
    this.solicitarEliminarCategoria(idCategoria);
  }

  // ---------------- Modales de estado ----------------

  private showSuccessModal(message: string) {
    this.modalSuccessMessage = message;
    this.mostrarModalSuccess = true;
    // opcional: auto-cerrar en X segundos -> commented out
    // setTimeout(()=> this.mostrarModalSuccess = false, 2500);
  }

  cerrarModalSuccess() {
    this.mostrarModalSuccess = false;
    this.modalSuccessMessage = '';
  }

  private showErrorModal(message: string) {
    this.modalErrorMessage = message;
    this.mostrarModalError = true;
  }

  cerrarModalError() {
    this.mostrarModalError = false;
    this.modalErrorMessage = '';
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
