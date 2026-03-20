import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'tests' | 'account' | 'rankings' | 'ai' | 'technical';
  isOpen: boolean;
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faqs.component.html',
})
export class FaqsComponent {
  // Señal para la categoría activa
  activeCategory = signal<string>('all');
  
  // Señal para el término de búsqueda
  searchQuery = signal<string>('');
  
  // Señal para controlar el estado de carga (simulado)
  isLoading = signal<boolean>(false);
  
  // Opciones de categorías disponibles
  categories = [
    { id: 'all', name: 'Todas las preguntas', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'general', name: 'General', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'account', name: 'Cuenta y Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'tests', name: 'Tests y Preguntas', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'rankings', name: 'Rankings', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'ai', name: 'IA Generativa', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'technical', name: 'Soporte Técnico', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];
  
  // Lista completa de FAQs
  faqs: FAQ[] = [
    // GENERAL
    {
      id: '1',
      question: '¿Qué es AnGoTest?',
      answer: 'AnGoTest es una plataforma integral para la creación, gestión y realización de tests online. El nombre combina "Angular" (frontend), "Go" (backend) y "Test" (su utilidad principal). Ofrece herramientas tanto para evaluadores (profesores, administradores) como para evaluados (estudiantes, opositores), con funcionalidades como rankings, generación de tests por IA y estadísticas detalladas.',
      category: 'general',
      isOpen: false
    },
    {
      id: '2',
      question: '¿Es gratuito?',
      answer: 'Actualmente, AnGoTest es completamente gratuito para todos los usuarios registrados. Los usuarios tienen una cuota mensual de 5 tests generados por IA, que puede ser configurada por los administradores del sistema.',
      category: 'general',
      isOpen: false
    },
    {
      id: '3',
      question: '¿Necesito instalar algo?',
      answer: 'No, AnGoTest es una aplicación web. Solo necesitas un navegador moderno (Chrome, Firefox, Safari, Edge) y conexión a Internet para acceder a la plataforma.',
      category: 'general',
      isOpen: false
    },
    
    // CUENTA Y PERFIL
    {
      id: '4',
      question: '¿Cómo me registro?',
      answer: 'Puedes registrarte haciendo clic en el botón "Registrarse" de la página principal. Necesitarás proporcionar un email válido, nombre de usuario y contraseña. También puedes aceptar una invitación a un test como usuario invitado (guest) sin necesidad de registro completo.',
      category: 'account',
      isOpen: false
    },
    {
      id: '5',
      question: 'He olvidado mi contraseña, ¿qué hago?',
      answer: 'En la página de login, haz clic en "¿Olvidaste tu contraseña?". Introducirás tu email y recibirás un enlace de recuperación válido por 24 horas para establecer una nueva contraseña.',
      category: 'account',
      isOpen: false
    },
    {
      id: '6',
      question: '¿Puedo eliminar mi cuenta?',
      answer: 'Sí, desde la sección de perfil puedes solicitar la desactivación de tu cuenta. Deberás confirmar tu contraseña y escribir "CONFIRMAR ELIMINAR CUENTA". Tus tests y resultados serán transferidos a un usuario administrador para mantener la integridad del sistema.',
      category: 'account',
      isOpen: false
    },
    {
      id: '7',
      question: '¿Qué es un usuario "guest"?',
      answer: 'Un usuario "guest" (invitado) es aquel que accede a la plataforma a través de una invitación a un test sin haberse registrado previamente. Puede realizar el test, pero tiene funcionalidades limitadas. Desde su perfil puede completar sus datos y convertirse en un usuario "user" permanente.',
      category: 'account',
      isOpen: false
    },
    
    // TESTS Y PREGUNTAS
    {
      id: '8',
      question: '¿Cómo se organizan los tests?',
      answer: 'Los tests se organizan mediante una jerarquía de tres niveles: Tema Principal (ej. "Matemáticas"), Subtema (ej. "Álgebra") y Tema Específico (ej. "Ecuaciones de segundo grado"). Además, cada test tiene un nivel de dificultad: Principiante, Intermedio o Avanzado.',
      category: 'tests',
      isOpen: false
    },
    {
      id: '9',
      question: '¿Puedo guardar mi progreso en un test?',
      answer: '¡Sí! Mientras realizas un test, el sistema guarda automáticamente tus respuestas. Puedes salir y volver más tarde; el test continuará exactamente donde lo dejaste. Verás tus tests en progreso en la sección "Mis Tests > En Progreso".',
      category: 'tests',
      isOpen: false
    },
    {
      id: '10',
      question: '¿Cómo se calcula mi puntuación?',
      answer: 'Al finalizar un test, el sistema compara tus respuestas con las respuestas correctas. La puntuación se calcula como el porcentaje de aciertos sobre el total de preguntas. También se muestra el número de respuestas correctas, incorrectas y el tiempo empleado.',
      category: 'tests',
      isOpen: false
    },
    {
      id: '11',
      question: '¿Puedo ver qué respuestas fallé?',
      answer: 'Sí, en el resumen de un test completado hay un botón "Ver respuestas incorrectas" que te muestra detalladamente cada pregunta donde fallaste, cuál fue tu respuesta y cuál era la respuesta correcta.',
      category: 'tests',
      isOpen: false
    },
    {
      id: '12',
      question: '¿Qué significa que un test está "expirado"?',
      answer: 'Un test se marca como "expirado" transcurrido más días de lo establecido por sistema desde que se inició.',
      category: 'tests',
      isOpen: false
    },
    
    // RANKINGS
    {
      id: '13',
      question: '¿Cómo funcionan los rankings?',
      answer: 'Los rankings comparan tu rendimiento con el de toda la comunidad. Hay rankings globales (tests completados, precisión, tiempo por pregunta, preguntas respondidas) y rankings específicos por nivel de dificultad. Se distingue entre "primer intento" y "todos los intentos" para ser más justos.',
      category: 'rankings',
      isOpen: false
    },
    {
      id: '14',
      question: '¿Qué necesito para aparecer en el ranking?',
      answer: 'Para aparecer en los rankings principales, necesitas haber completado al menos 5 tests diferentes. Esto asegura que los rankings reflejen un compromiso mínimo con la plataforma y no solo un test puntual.',
      category: 'rankings',
      isOpen: false
    },
    {
      id: '15',
      question: '¿Qué son los "promedios de comunidad"?',
      answer: 'Son métricas agregadas que muestran el rendimiento medio de todos los usuarios activos. Puedes comparar tu tiempo por pregunta, precisión o preguntas respondidas con la media de la comunidad para ver tu progreso relativo.',
      category: 'rankings',
      isOpen: false
    },
    
    // IA GENERATIVA
    {
      id: '16',
      question: '¿Cómo funciona la generación de tests por IA?',
      answer: 'En el panel de administración (o para usuarios con permisos), hay un botón "Generar test con IA". Puedes elegir entre modo guiado (especificando tema, subtema, etc.) o modo libre (describiendo lo que quieres en un prompt). La IA generará preguntas, respuestas y clasificará automáticamente el test en la jerarquía de temas.',
      category: 'ai',
      isOpen: false
    },
    {
      id: '17',
      question: '¿Qué proveedor de IA utilizáis?',
      answer: 'Actualmente utilizamos la API de Groq, con modelos de la familia Llama. Esto nos permite generar tests de forma rápida y eficiente. La configuración es flexible para poder cambiar de proveedor en el futuro.',
      category: 'ai',
      isOpen: false
    },
    {
      id: '18',
      question: '¿Tengo límite en la generación de tests con IA?',
      answer: 'Sí, los usuarios tienen una cuota mensual de tests generados por IA (por defecto, 5). Los administradores pueden ver y gestionar estas cuotas desde el panel de administración. El límite se reinicia cada mes.',
      category: 'ai',
      isOpen: false
    },
    {
      id: '19',
      question: '¿Puedo generar tests en otros idiomas?',
      answer: 'Sí, el sistema de IA soporta generación en múltiples idiomas: español, inglés, francés, alemán, italiano y portugués. Puedes seleccionar el idioma deseado antes de generar el test.',
      category: 'ai',
      isOpen: false
    },
    
    // SOPORTE TÉCNICO
    {
      id: '20',
      question: '¿Qué navegadores están soportados?',
      answer: 'AnGoTest funciona correctamente en las últimas versiones de Chrome, Firefox, Safari y Edge. Aseguramos compatibilidad con navegadores modernos que soporten las características web actuales.',
      category: 'technical',
      isOpen: false
    },
    {
      id: '21',
      question: '¿Cómo puedo reportar un error?',
      answer: 'Si encuentras un error, puedes contactar con el administrador del sistema a través del email de soporte (soporte@angotest.com) o, si eres usuario registrado, utilizar el formulario de contacto disponible en el perfil.',
      category: 'technical',
      isOpen: false
    },
    {
      id: '22',
      question: '¿Mis datos están seguros?',
      answer: 'Sí, la seguridad es una prioridad. Las contraseñas se almacenan hasheadas con bcrypt, la autenticación se realiza mediante JWT almacenados en cookies HttpOnly (protegiendo contra XSS) y todas las conexiones se realizan mediante HTTPS en producción.',
      category: 'technical',
      isOpen: false
    }
  ];

  constructor() {}

  // Getter para FAQs filtradas por búsqueda y categoría
  get filteredFaqs(): FAQ[] {
    return this.faqs.filter(faq => {
      // Filtrar por categoría
      const matchesCategory = this.activeCategory() === 'all' || faq.category === this.activeCategory();
      
      // Filtrar por búsqueda
      const query = this.searchQuery().toLowerCase().trim();
      const matchesSearch = query === '' || 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query);
      
      return matchesCategory && matchesSearch;
    });
  }

  // Getter para FAQs abiertas
  get openFaqs(): FAQ[] {
    return this.faqs.filter(faq => faq.isOpen);
  }

  // Alternar apertura de una FAQ
  toggleFaq(faqId: string): void {
    const faq = this.faqs.find(f => f.id === faqId);
    if (faq) {
      faq.isOpen = !faq.isOpen;
    }
  }

  // Establecer categoría activa (CORREGIDO: ahora recibe string)
  setActiveCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
  }

  // Actualizar búsqueda (CORREGIDO: ahora maneja correctamente el evento)
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Limpiar búsqueda
  clearSearch(): void {
    this.searchQuery.set('');
  }

  // Reiniciar filtros
  resetFilters(): void {
    this.activeCategory.set('all');
    this.searchQuery.set('');
    
    // Cerrar todas las FAQs
    this.faqs.forEach(faq => faq.isOpen = false);
  }

  // Contar FAQs por categoría
  getCategoryCount(categoryId: string): number {
    if (categoryId === 'all') {
      return this.faqs.length;
    }
    return this.faqs.filter(faq => faq.category === categoryId).length;
  }

  // Formatear nombre de categoría para mostrar
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  // Obtener clase de badge para categoría
  getCategoryBadgeClass(categoryId: string): string {
    const classes: Record<string, string> = {
      'general': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'account': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'tests': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'rankings': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'ai': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'technical': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return classes[categoryId] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}