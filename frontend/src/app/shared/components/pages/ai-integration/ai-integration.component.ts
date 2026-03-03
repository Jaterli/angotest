import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-ai-integration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-integration.component.html',
})
export class AiIntegrationComponent {
  // Señal para la pestaña activa
  activeTab = signal<'overview' | 'json-format' | 'examples' | 'tips'>('overview');

  // Características principales
  features: AIFeature[] = [
    {
      id: 'mode-guided',
      title: 'Modo Guiado',
      description: 'Selecciona tema principal, subtema y tema específico de la jerarquía existente. La IA generará preguntas enfocadas en ese contenido concreto.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
      id: 'mode-free',
      title: 'Modo Libre',
      description: 'Describe en lenguaje natural el tipo de test que necesitas. La IA inferirá la jerarquía de temas y generará el contenido, pudiendo crear nuevas categorías si es necesario.',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    {
      id: 'json-import',
      title: 'Importación JSON (solo administradores)',
      description: 'Genera tests con cualquier asistente de IA externo y pégalos directamente en el sistema. El formato JSON está perfectamente estructurado y validado.',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
    },
    {
      id: 'quota',
      title: 'Sistema de Cuotas',
      description: 'Cada usuario tiene una cuota mensual configurable de tests generados por IA. Los administradores pueden gestionar estas cuotas desde el panel de control.',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  // Estructura del JSON para importación
  jsonStructure = {
    title: "Título del test",
    description: "Descripción breve del test",
    main_topic: "Tema principal (ej: Matemáticas)",
    sub_topic: "Subtema (ej: Álgebra)",
    specific_topic: "Tema específico (ej: Ecuaciones de segundo grado)",
    level: "Principiante, Intermedio, Avanzado",
    questions: [
      {
        question_text: "Texto de la pregunta 1",
        answers: [
          { answer_text: "Opción A", is_correct: true },
          { answer_text: "Opción B", is_correct: false },
          { answer_text: "Opción C", is_correct: false },
          { answer_text: "Opción D", is_correct: false }
        ]
      }
    ]
  };

  // Consejos para la generación con IA
  tips = [
    {
      title: "Sé específico en la descripción",
      description: "Cuanto más detallado sea el prompt, mejores serán las preguntas generadas. Incluye el nivel de dificultad, los conceptos clave y el tipo de preguntas que necesitas."
    },
    {
      title: "Valida siempre el resultado",
      description: "Aunque la IA es muy precisa, siempre es recomendable revisar las preguntas generadas antes de publicarlas para asegurar la calidad educativa."
    },
    {
      title: "Usa el modo libre para innovar (solo administradores)",
      description: "Si necesitas crear contenido sobre temas novedosos o muy específicos, el modo libre permite a la IA crear nuevas categorías que luego quedarán disponibles en el sistema."
    },
    {
      title: "Aprovecha la jerarquía existente",
      description: "Para contenido estándar, usa el modo guiado. La IA generará preguntas mucho más alineadas con los tests ya existentes en la plataforma."
    }
  ];

  constructor() {}

  setActiveTab(tab: 'overview' | 'json-format' | 'examples' | 'tips'): void {
    this.activeTab.set(tab);
  }

  // Método para copiar el JSON al portapapeles
  copyJsonToClipboard(): void {
    const jsonString = JSON.stringify(this.jsonStructure, null, 2);
    navigator.clipboard.writeText(jsonString);
    // Aquí podrías mostrar una notificación de éxito
  }
}