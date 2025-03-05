import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../models/producto.model';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { Talla } from '../../../models/talla.model';

@Component({
  selector: 'app-listado-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule
  ],
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.css']
})
export class ListadoProductosComponent implements OnInit {
  // Paginación
  p: number = 1;

  // AUTOCOMPLETE
  keyword = 'nombre';
  productosAutoComplete: any[] = [];

  // Filtro interno
  filtro: string = '';

  // Lista de productos y la lista filtrada
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  // Listas para combos
  categorias: { id: number, nombre: string }[] = [
    { id: 1, nombre: 'Hombres' },
    { id: 2, nombre: 'Mujeres' },
    { id: 3, nombre: 'Infantil' }
  ];
  
  subcategorias: { id: number, idCategoria: number, nombre: string }[] = [
    { id: 1, idCategoria: 1, nombre: 'Nike' },
    { id: 2, idCategoria: 1, nombre: 'Adidas' },
    { id: 3, idCategoria: 1, nombre: 'Puma' },
    { id: 4, idCategoria: 1, nombre: 'I-Run' },
    { id: 5, idCategoria: 1, nombre: 'Reebok' },
    { id: 6, idCategoria: 1, nombre: 'Casual' },
    { id: 7, idCategoria: 2, nombre: 'Deporte' },
    { id: 8, idCategoria: 3, nombre: 'Outdoor' },
    { id: 9, idCategoria: 2, nombre: 'Nike' },
    { id: 10, idCategoria: 2, nombre: 'Adidas' },
    { id: 11, idCategoria: 2, nombre: 'Puma' },
    { id: 12, idCategoria: 2, nombre: 'I-Run' },
    { id: 13, idCategoria: 2, nombre: 'Reebok' },
    { id: 14, idCategoria: 3, nombre: 'Nike' },
    { id: 15, idCategoria: 3, nombre: 'Adidas' },
    { id: 16, idCategoria: 3, nombre: 'Puma' },
    { id: 17, idCategoria: 3, nombre: 'I-Run' },
    { id: 18, idCategoria: 3, nombre: 'Reebok' }
  ];
  
  unidadesMedida: { id: number, nombre: string }[] = [
    { id: 1, nombre: 'Pieza' },
    { id: 2, nombre: 'Caja' },
    { id: 3, nombre: 'Par' }
  ];

  // Modal
  modalAbierto: boolean = false;
  producto: Producto = this.nuevoProducto();
  subcategoriasFiltradas: { id: number, nombre: string }[] = [];

  // Tallas
  tallasDisponibles: Talla[] = [];
  tallaSeleccionadaId: number = 0;
  stockTallaSeleccionada: number = 0;
  tallasSeleccionadas: {
    idTalla: number;
    descripcionTalla: string;
    stock: number;
  }[] = [];

  constructor(
    private productoService: ProductoService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService
  ) {}

  ngOnInit() {
    this.obtenerProductos();
    this.cargarTallas();
  }

  // Cargar productos del backend
  obtenerProductos() {
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = [...this.productos];

        // Autocomplete
        this.productosAutoComplete = this.productos.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          categoria: p.categoria
        }));
      },
      error: (error: any) => console.error('Error al obtener productos:', error)
    });
  }

  // Cargar tallas del backend
  cargarTallas() {
    this.tallaService.getAllTallas().subscribe({
      next: (data) => {
        this.tallasDisponibles = data;
      },
      error: (err: any) => {
        console.error('Error al cargar tallas:', err);
      }
    });
  }

  // Paginación
  onPageChange(page: number) {
    this.p = page;
  }

  // Autocomplete
  selectEvent(item: any) {
    this.filtro = item.nombre;
    this.aplicarFiltro();
  }
  onChangeSearch(search: string) {
    this.filtro = search;
    this.aplicarFiltro();
  }
  onFocused(e: any) {
    // ...
  }

  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(texto) ||
        p.categoria?.toLowerCase().includes(texto)
    );
    this.p = 1;
  }

  // Abrir/Cerrar modal
  abrirModal() {
    this.modalAbierto = true;
    this.subcategoriasFiltradas = [];
  }
  cerrarModal() {
    this.modalAbierto = false;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
  }

  // Guardar nuevo producto
  guardarProducto() {
    const productoParaEnviar = {
      idCategoria: Number(this.producto.idCategoria) || 0,
      idSubCategoria: Number(this.producto.idSubCategoria) || 0,
      codigoBarra: this.producto.codigoBarra,
      nombre: this.producto.nombre,
      stock: Number(this.producto.stock) || 0,
      stockMinimo: Number(this.producto.stockMinimo) || 0,
      precioVenta: Number(this.producto.precioVenta) || 0,
      precioCompra: this.producto.precioCompra != null ? Number(this.producto.precioCompra) : undefined,
      idUnidadMedida: Number(this.producto.idUnidadMedida) || 0,
      estado: !!this.producto.estado,
      foto: this.producto.foto ?? ''
    };

    console.log('Producto que se envía:', productoParaEnviar);

    this.productoService.crearProducto(productoParaEnviar).subscribe({
      next: (productoCreado) => {
        console.log('Producto creado con éxito:', productoCreado);

        // Si el backend retorna el objeto con "idProducto", lo tendremos aquí
        if (this.tallasSeleccionadas.length > 0 && productoCreado.idProducto) {
          this.guardarTallasProducto(productoCreado.idProducto);
        } else {
          this.obtenerProductos();
          this.cerrarModal();
        }
      },
      error: (error: any) => {
        console.error('Error al guardar el producto:', error);
        if (error.error) {
          console.error('Detalles del error del backend:', error.error);
        }
      }
    });
  }

  // Guardar tallas asociadas
  guardarTallasProducto(idProducto: number) {
    let pendientes = this.tallasSeleccionadas.length;

    this.tallasSeleccionadas.forEach((tallaItem) => {
      const request = {
        idProducto,
        idTalla: tallaItem.idTalla,
        stock: tallaItem.stock
      };

      // Usar createTallaProducto (no 'crearTallaProducto')
      this.tallaProductoService.createTallaProducto(request).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.obtenerProductos();
            this.cerrarModal();
          }
        },
        error: (err: any) => {
          console.error('Error al asociar TallaProducto:', err);
          pendientes--;
          if (pendientes === 0) {
            this.obtenerProductos();
            this.cerrarModal();
          }
        }
      });
    });
  }

  // Agregar talla
  agregarTalla() {
    if (!this.tallaSeleccionadaId || this.tallaSeleccionadaId === 0) {
      alert('Selecciona una talla');
      return;
    }
    if (!this.stockTallaSeleccionada || this.stockTallaSeleccionada <= 0) {
      alert('Ingresa un stock válido para la talla');
      return;
    }

    const tallaEncontrada = this.tallasDisponibles.find(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );
    if (!tallaEncontrada) {
      alert('Talla no válida');
      return;
    }

    const yaExiste = this.tallasSeleccionadas.some(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );
    if (yaExiste) {
      alert('Esta talla ya fue agregada. Elimínala o edítala si quieres cambiar el stock.');
      return;
    }

    this.tallasSeleccionadas.push({
      idTalla: tallaEncontrada.idTalla,
      descripcionTalla: tallaEncontrada.descripcion,
      stock: this.stockTallaSeleccionada
    });

    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
  }

  // Eliminar talla temporal
  eliminarTalla(index: number) {
    this.tallasSeleccionadas.splice(index, 1);
  }

  // Actualizar subcategorías
  actualizarSubcategorias() {
    this.subcategoriasFiltradas = this.subcategorias.filter(
      (s) => s.idCategoria === Number(this.producto.idCategoria)
    );
    this.producto.idSubCategoria = 0;
  }

  // Manejar foto
  manejarFoto(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = (e: any) => (this.producto.foto = e.target.result);
      lector.readAsDataURL(archivo);
    }
  }

  // Crear un producto vacío
  private nuevoProducto(): Producto {
    return {
      idProducto: 0,
      codigoBarra: '',
      idCategoria: 0,
      idSubCategoria: 0,
      nombre: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      stockMinimo: 0,
      idUnidadMedida: 0,
      estado: true,
      foto: ''
    };
  }

  // ===================== MÉTODOS DE OPCIONES =====================

  editarProducto(prod: Producto) {
    console.log('Editar producto:', prod);
    // TODO: abrir modal de edición o navegar a /producto/editar/:idProducto
  }

  aumentarStock(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }

    const cantidad = prompt('¿Cuántas unidades deseas sumar al stock?');
    if (!cantidad) return;

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Cantidad inválida.');
      return;
    }

    const nuevaCantidad = (prod.stock || 0) + cantNum;

    const productoActualizado = { ...prod, stock: nuevaCantidad };
    this.productoService.updateProducto(prod.idProducto, productoActualizado)
      .subscribe({
        next: () => {
          prod.stock = nuevaCantidad; // Actualiza local
          alert('Stock aumentado correctamente');
        },
        error: (err) => {
          console.error('Error al aumentar stock:', err);
        }
      });
  }

  disminuirStock(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }

    const cantidad = prompt('¿Cuántas unidades deseas restar del stock?');
    if (!cantidad) return;

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Cantidad inválida.');
      return;
    }

    const nuevaCantidad = (prod.stock || 0) - cantNum;
    if (nuevaCantidad < 0) {
      alert('No puedes dejar el stock en negativo.');
      return;
    }

    const productoActualizado = { ...prod, stock: nuevaCantidad };
    this.productoService.updateProducto(prod.idProducto, productoActualizado)
      .subscribe({
        next: () => {
          prod.stock = nuevaCantidad;
          alert('Stock disminuido correctamente');
        },
        error: (err) => {
          console.error('Error al disminuir stock:', err);
        }
      });
  }

  generarCodigoBarras(prod: Producto) {
    console.log('Generar código de barras para:', prod);
    // TODO: Llamar a un servicio o librería para generar PDF/imágenes
  }

  eliminarProducto(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }
    if (!confirm(`¿Deseas eliminar el producto "${prod.nombre}"?`)) {
      return;
    }

    this.productoService.deleteProducto(prod.idProducto)
      .subscribe({
        next: () => {
          // Quitamos localmente
          this.productos = this.productos.filter(p => p.idProducto !== prod.idProducto);
          this.aplicarFiltro(); // refresca la tabla
          alert('Producto eliminado con éxito');
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Ocurrió un error al eliminar el producto.');
        }
      });
  }
}
