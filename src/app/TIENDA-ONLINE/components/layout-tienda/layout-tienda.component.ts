import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, startWith } from 'rxjs/operators';

import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [ CommonModule, RouterModule, HeaderComponent ],
  templateUrl: './layout-tienda.component.html',
  styleUrls: ['./layout-tienda.component.css']
})
export class LayoutTiendaComponent {

  showHeader$: Observable<boolean>;

  constructor(private router: Router) {
    // Lógica corregida y más robusta para la visibilidad del header.
    this.showHeader$ = this.router.events.pipe(
      // 1. Filtramos solo los eventos que nos interesan (cuando la navegación termina).
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      
      // 2. Mapeamos el evento a un valor booleano.
      //    Será `true` si la URL final NO incluye '/checkout'.
      map((event: NavigationEnd) => !event.urlAfterRedirects.includes('/checkout')),
      
      // 3. (¡LA CLAVE!) Usamos `startWith` para emitir un valor inicial.
      //    Esto comprueba la URL actual en el momento en que el componente se carga,
      //    asegurando que el header se muestre (o no) en la carga inicial de la página.
      startWith(!this.router.url.includes('/checkout'))
    );
  }
}
