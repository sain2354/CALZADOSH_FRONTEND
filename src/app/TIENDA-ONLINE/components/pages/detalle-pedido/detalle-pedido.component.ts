import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PedidoUsuarioService } from './../../../services/pedido-usuario.service';
import { Pedido } from '../../../../models/pedido.model';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment'; // Importar environment

@Component({
  selector: 'app-detalle-pedido-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css']
})
export class DetallePedidoUsuarioComponent implements OnInit {

  pedido: Pedido | null = null;
  cargando = true;
  error: string | null = null;
  apiBaseUrl = environment.apiUrl; // Variable para la URL base de la API

  constructor(
    private route: ActivatedRoute,
    private pedidoUsuarioService: PedidoUsuarioService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pedidoUsuarioService.getPedidoPorId(+id).subscribe({
        next: (data) => {
          this.pedido = data;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar el detalle del pedido. Inténtalo de nuevo más tarde.';
          this.cargando = false;
        }
      });
    }
  }

  // Nueva función para construir la URL de la imagen
  getImagenUrl(idProducto: number): string {
    // Asume que el endpoint para obtener la imagen es /api/productos/{id}/imagen
    return `${this.apiBaseUrl}/productos/${idProducto}/imagen`;
  }
}
