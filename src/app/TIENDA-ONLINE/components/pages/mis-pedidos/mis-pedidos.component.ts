
import { Component, OnInit } from '@angular/core';
import { PedidoUsuarioService } from './../../../services/pedido-usuario.service';
import { AuthTiendaService } from '../../../services/auth-tienda.service';
import { Pedido } from '../../../../models/pedido.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {

  pedidos: Pedido[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private pedidoUsuarioService: PedidoUsuarioService,
    private authService: AuthTiendaService
  ) { }

  ngOnInit(): void {
    const userId = this.authService.currentUserId;
    if (userId) {
      this.pedidoUsuarioService.getPedidosPorUsuario(userId).subscribe({
        next: (data) => {
          this.pedidos = data;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los pedidos. Inténtalo de nuevo más tarde.';
          this.cargando = false;
        }
      });
    }
  }
}
