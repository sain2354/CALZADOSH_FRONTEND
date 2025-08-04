import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoletaVentaComponent } from './boleta-venta.component';

describe('BoletaVentaComponent', () => {
  let component: BoletaVentaComponent;
  let fixture: ComponentFixture<BoletaVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoletaVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoletaVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
