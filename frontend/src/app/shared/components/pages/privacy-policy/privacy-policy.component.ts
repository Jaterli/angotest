import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html'
})
export class PrivacyPolicyComponent {
  // Señales para el estado de carga (simulado)
  isLoading = signal<boolean>(false);
  
  // Fecha actual para mostrar en el header
  currentDate = new Date();

  constructor() {
    // Simular carga de datos (en un caso real, aquí se llamaría a un servicio)
    // this.loadPrivacyPolicy();
  }

  /**
   * Simula la carga de la política de privacidad desde un servicio
   */
  loadPrivacyPolicy(): void {
    this.isLoading.set(true);
    
    // Simular llamada a API
    setTimeout(() => {
      this.isLoading.set(false);
    }, 800);
  }

  /**
   * Descarga la política de privacidad en formato PDF
   */
  downloadPolicy(): void {
    // En una implementación real, esto llamaría a un servicio que genere el PDF
    console.log('Descargando política de privacidad...');
    
    // Simulación de descarga
    const link = document.createElement('a');
    link.href = '#'; // URL real del PDF
    link.download = 'AngoTest-Politica-Privacidad.pdf';
    link.click();
  }
}