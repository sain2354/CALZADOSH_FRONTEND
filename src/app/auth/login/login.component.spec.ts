import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería ejecutar login() y redirigir al dashboard', () => {
    component.login();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debería cambiar el estado de showPassword con togglePasswordVisibility()', () => {
    const initialState = component.showPassword;
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(!initialState);
  });
});


