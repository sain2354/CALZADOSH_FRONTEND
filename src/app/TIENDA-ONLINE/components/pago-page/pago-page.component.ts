import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Importar HttpClientModule
import { environment } from '../../../../environments/environment';

// Esta declaración le dice a TypeScript que 'MercadoPago' es un objeto global
// que existirá en el navegador porque lo cargamos en index.html.
declare var MercadoPago: any;

@Component({
  selector: 'app-pago-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // Añadir HttpClientModule
  templateUrl: './pago-page.component.html',
  styleUrls: ['./pago-page.component.css']
})
export class PagoPageComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  
  ventaId: string | null = null;
  isLoading = true;
  error: string | null = null;

  private mercadoPago: any;

  ngOnInit(): void {
    this.ventaId = this.route.snapshot.paramMap.get('ventaId');
    console.log('ID de Venta recuperado:', this.ventaId);

    if (!this.ventaId) {
      this.error = 'Error: No se proporcionó un ID de venta válido.';
      this.isLoading = false;
      return;
    }

    // 1. Inicializamos MercadoPago con la clave pública
    this.initializeMercadoPago();

    // 2. Creamos la preferencia de pago en nuestro backend
    this.crearPreferenciaDePago();
  }

  initializeMercadoPago(): void {
    this.mercadoPago = new MercadoPago(environment.mercadoPagoPublicKey, {
      locale: 'es-PE' // Localización para Perú
    });
  }

  crearPreferenciaDePago(): void {
    console.log(`Iniciando la creación de la preferencia de pago para la venta ${this.ventaId}...`);

    const url = `${environment.apiUrl}/pagos/crear-preferencia/${this.ventaId}`;

    this.http.post<{ preferenceId: string }>(url, {}).subscribe({
      next: (response) => {
        console.log('Preferencia de pago creada con éxito. ID:', response.preferenceId);
        this.isLoading = false;
        // 3. Con el ID de la preferencia, renderizamos el botón de pago
        this.renderMercadoPagoButton(response.preferenceId);
      },
      error: (err) => {
        console.error('Error al crear la preferencia de pago:', err);
        this.error = 'No pudimos preparar tu pago. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }

  async renderMercadoPagoButton(preferenceId: string): Promise<void> {
    // Limpiamos el contenedor por si acaso
    const container = document.getElementById('wallet_container');
    if (container) {
      container.innerHTML = '';
    }

    const bricksBuilder = this.mercadoPago.bricks();

    await bricksBuilder.create('wallet', 'wallet_container', {
      initialization: {
        preferenceId: preferenceId,
        redirectMode: 'self' // El usuario permanecerá en tu página
      },
      customization: {
        texts: {
          valueProp: 'smart_option',
          action: 'pay',
        },
      },
    });

    console.log('Botón de pago de Mercado Pago renderizado.');
  }
}
