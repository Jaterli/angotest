import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true, // o false dependiendo de tu configuración
  template: `
<footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-sm py-3 px-4 z-40">
  <div class="container mx-auto">
    <div class="flex flex-col md:flex-row items-center justify-between gap-2">
      
      <!-- Logo y copyright -->
      <div class="flex items-center gap-2">
        <div class="flex items-center">
          <img src="assets/Logo-AngoTest_footer.png" alt="Logo AnGoTest" class="h-6 sm:h-8 w-auto mr-2">
          <span class="text-xs sm:text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-100">AngoTest</span>
        </div>
        <div class="hidden xs:block text-gray-400 dark:text-gray-500 text-sm sm:text-lg">•</div>
        <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">© {{currentYear}} Todos los derechos reservados</div>
      </div>

      <!-- Enlaces y versión -->
      <div class="flex items-center gap-4 text-sm sm:text-base">
        <!-- Enlaces útiles -->
        <div class="flex items-center gap-4">
          <a href="/privacy" 
             class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Privacidad
          </a>
          <a href="/terms" 
             class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Términos
          </a>
          <a href="/contact" 
             class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Contacto
          </a>
        </div>

        <!-- Separador -->
        <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

        <!-- Versión -->
        <div class="flex items-center gap-1">
          <span class="text-gray-500 dark:text-gray-500">v{{appVersion}}</span>
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</footer>  
  `
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  appVersion = '1.0.0'; // Puedes obtener esto de environment.ts
  
  // Opcional: si quieres obtener la versión del package.json
  // constructor() {
  //   this.appVersion = environment.version;
  // }
}