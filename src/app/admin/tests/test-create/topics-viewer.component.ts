import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicsService } from '../../../shared/services/topics.service';
import { TopicHierarchy, TopicStructure } from '../../../shared/models/test.model';

@Component({
  selector: 'app-topics-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tema Principal
          </label>
          <input
            type="text"
            [ngModel]="mainTopicFilter()"
            (ngModelChange)="mainTopicFilter.set($event)"
            placeholder="Filtrar por tema principal..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subtema
          </label>
          <input
            type="text"
            [ngModel]="subTopicFilter()"
            (ngModelChange)="subTopicFilter.set($event)"
            placeholder="Filtrar por subtema..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tema Específico
          </label>
          <input
            type="text"
            [ngModel]="specificTopicFilter()"
            (ngModelChange)="specificTopicFilter.set($event)"
            placeholder="Filtrar por tema específico..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div class="flex items-end">
          <div class="flex items-center">
            <button
              (click)="clearFilters()"
              class="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="text-sm font-medium text-blue-800 dark:text-blue-300">Total Topics</div>
          <div class="text-2xl font-bold text-blue-900 dark:text-blue-200">{{ flatTopics().length }}</div>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div class="text-sm font-medium text-purple-800 dark:text-purple-300">Filtrados</div>
          <div class="text-2xl font-bold text-purple-900 dark:text-purple-200">
            {{ filteredFlatTopics().length }}
          </div>
        </div>
        
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div class="text-sm font-medium text-yellow-800 dark:text-yellow-300">Temas Principales Únicos</div>
          <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
            {{ uniqueMainTopics().length }}
          </div>
        </div>
      </div>

      <!-- Tabs para vista JSON y tabla -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            (click)="activeView.set('json')"
            [class]="activeView() === 'json' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Vista JSON
          </button>
          <button
            (click)="activeView.set('table')"
            [class]="activeView() === 'table' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Vista Tabla
          </button>
          <button
            (click)="activeView.set('hierarchy')"
            [class]="activeView() === 'hierarchy' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Vista Jerárquica
          </button>
        </nav>
      </div>

      <!-- Contenido según vista activa -->
      @switch (activeView()) {
        @case ('json') {
          <div class="relative">
            <div class="absolute top-2 right-2 z-10 flex space-x-2">
              <button
                (click)="toggleJsonFormat()"
                class="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
              >
                {{ isJsonFormatted() ? 'Minificar' : 'Formatear' }}
              </button>

              <button
                (click)="copyToClipboard()"
                class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
              >
                Copiar JSON
              </button>
            </div>
            <pre 
              [class]="isJsonFormatted() 
                ? 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm h-96 mt-2 whitespace-pre-wrap break-all' 
                : 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm h-96 mt-2 whitespace-normal break-all'"
            ><code>{{ formattedJson() }}</code></pre>
          </div>
        }
        
        @case ('table') {
          <div class="overflow-x-auto">
            @if (filteredFlatTopics().length === 0) {
              <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-2">No se encontraron resultados con los filtros actuales</p>
                <button 
                  (click)="clearFilters()"
                  class="mt-4 px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                >
                  Limpiar filtros
                </button>
              </div>
            } @else {
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tema Principal
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subtema
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tema Específico
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  @for (topic of filteredFlatTopics(); track topic.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ topic.id }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {{ topic.main_topic }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {{ topic.sub_topic }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {{ topic.specific_topic }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
        
        @case ('hierarchy') {
          <div class="space-y-4">
            @if (hierarchicalTopics().length === 0) {
              <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-2">No se encontraron resultados con los filtros actuales</p>
                <button 
                  (click)="clearFilters()"
                  class="mt-4 px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                >
                  Limpiar filtros
                </button>
              </div>
            } @else {
              @for (mainTopic of hierarchicalTopics(); track mainTopic.name) {
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div class="bg-gray-100 dark:bg-gray-800 px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                    {{ mainTopic.name }}
                    <span class="ml-2 text-xs font-normal text-gray-600 dark:text-gray-400">
                      ({{ mainTopic.subTopics.length }} subtemas)
                    </span>
                  </div>
                  
                  <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    @for (subTopic of mainTopic.subTopics; track subTopic.name) {
                      <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900/30">
                        <div class="font-medium text-gray-700 dark:text-gray-300">
                          ↳ {{ subTopic.name }}
                          <span class="ml-2 text-xs font-normal text-gray-600 dark:text-gray-400">
                            ({{ subTopic.specificTopics.length }} temas específicos)
                          </span>
                        </div>
                        
                        <div class="mt-2 ml-6 space-y-1">
                          @for (specificTopic of subTopic.specificTopics; track specificTopic.id) {
                            <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                <span class="text-gray-500 mr-1">•</span>
                                {{ specificTopic.name }}
                              </div>
                              <span class="text-xs text-gray-500">ID: {{ specificTopic.id }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }
      }

      <!-- Información adicional -->
      <div class="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div>
            <strong class="font-medium">Estructura de Topics:</strong> 
            Cada topic tiene una jerarquía de 3 niveles: Tema Principal → Subtema → Tema Específico.<br />
            Usa los filtros para buscar temas específicos. Actualmente hay <strong>{{ filteredFlatTopics().length }}</strong> temas que coinciden con los filtros.
          </div>
        </div>
      </div>
    </div>

    <!-- Toast para notificación -->
    @if (showToast()) {
      <div class="fixed bottom-4 right-4 z-[1000] animate-fade-in-up">
        <div class="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          {{ toastMessage() }}
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-up {
      animation: fade-in-up 0.3s ease-out;
    }
  `]
})
export class TopicsViewerComponent implements OnInit {
  private topicService = inject(TopicsService);

  // Signals
  activeView = signal<'json' | 'table' | 'hierarchy'>('json');
  isJsonFormatted = signal(true);
  showToast = signal(false);
  toastMessage = signal('');
  
  // Filtros como signals
  mainTopicFilter = signal('');
  subTopicFilter = signal('');
  specificTopicFilter = signal('');
  
  // Datos del API
  topicsData = signal<TopicStructure>({});
  
  // Datos planos para la tabla
  flatTopics = computed(() => {
    const topics: TopicHierarchy[] = [];
    let id = 1;
    
    const data = this.topicsData();
    
    for (const [mainTopic, subTopics] of Object.entries(data)) {
      for (const [subTopic, specificTopics] of Object.entries(subTopics)) {
        for (const specificTopic of specificTopics) {
          topics.push({
            id: id++,
            main_topic: mainTopic,
            sub_topic: subTopic,
            specific_topic: specificTopic
          });
        }
      }
    }
    
    return topics;
  });

  // Estructura jerárquica filtrada para el JSON
  filteredHierarchicalData = computed(() => {
    const mainFilter = this.mainTopicFilter().toLowerCase();
    const subFilter = this.subTopicFilter().toLowerCase();
    const specificFilter = this.specificTopicFilter().toLowerCase();
    
    const result: TopicStructure = {};
    const data = this.topicsData();
    
    // Aplicar filtros a la estructura jerárquica
    for (const [mainTopic, subTopics] of Object.entries(data)) {
      if (mainFilter && !mainTopic.toLowerCase().includes(mainFilter)) {
        continue;
      }
      
      const filteredSubTopics: {[key: string]: string[]} = {};
      
      for (const [subTopic, specificTopics] of Object.entries(subTopics)) {
        if (subFilter && !subTopic.toLowerCase().includes(subFilter)) {
          continue;
        }
        
        const filteredSpecificTopics = specificTopics.filter(specificTopic => {
          if (specificFilter && !specificTopic.toLowerCase().includes(specificFilter)) {
            return false;
          }
          return true;
        });
        
        if (filteredSpecificTopics.length > 0) {
          filteredSubTopics[subTopic] = filteredSpecificTopics;
        }
      }
      
      if (Object.keys(filteredSubTopics).length > 0) {
        result[mainTopic] = filteredSubTopics;
      }
    }
    
    return result;
  });

  // Computed values - ahora dependen de los signals de filtro
  filteredFlatTopics = computed(() => {
    const mainFilter = this.mainTopicFilter().toLowerCase();
    const subFilter = this.subTopicFilter().toLowerCase();
    const specificFilter = this.specificTopicFilter().toLowerCase();
    
    return this.flatTopics().filter(topic => {
      const matchesMainTopic = !mainFilter || 
        topic.main_topic.toLowerCase().includes(mainFilter);
      
      const matchesSubTopic = !subFilter || 
        topic.sub_topic.toLowerCase().includes(subFilter);
      
      const matchesSpecificTopic = !specificFilter || 
        topic.specific_topic.toLowerCase().includes(specificFilter);
      
      return matchesMainTopic && matchesSubTopic && matchesSpecificTopic;
    });
  });

  // JSON formateado - ahora solo muestra la estructura filtrada
  formattedJson = computed(() => {
    const data = {
      topics: this.filteredHierarchicalData(),
      metadata: {
        total_flat_topics: this.filteredFlatTopics().length,
        total_hierarchical_entries: this.getTotalHierarchicalEntries(this.filteredHierarchicalData()),
        unique_main_topics: Object.keys(this.filteredHierarchicalData()).length,
        filters: {
          main_topic: this.mainTopicFilter(),
          sub_topic: this.subTopicFilter(),
          specific_topic: this.specificTopicFilter()
        }
      }
    };
    
    return this.isJsonFormatted() 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
  });

  uniqueMainTopics = computed(() => {
    return Object.keys(this.topicsData());
  });

  hierarchicalTopics = computed(() => {
    const hierarchy: Array<{
      name: string;
      subTopics: Array<{
        name: string;
        specificTopics: Array<{
          id: number;
          name: string;
        }>
      }>
    }> = [];

    const flatTopics = this.filteredFlatTopics();
    const topicsByMainTopic = new Map<string, Map<string, any[]>>();

    // Organizar por jerarquía
    flatTopics.forEach(topic => {
      if (!topicsByMainTopic.has(topic.main_topic)) {
        topicsByMainTopic.set(topic.main_topic, new Map());
      }
      
      const subTopicsMap = topicsByMainTopic.get(topic.main_topic)!;
      if (!subTopicsMap.has(topic.sub_topic)) {
        subTopicsMap.set(topic.sub_topic, []);
      }
      
      subTopicsMap.get(topic.sub_topic)!.push({
        id: topic.id,
        name: topic.specific_topic
      });
    });

    // Convertir a estructura jerárquica
    topicsByMainTopic.forEach((subTopicsMap, mainTopic) => {
      const subTopicsArray: any[] = [];
      
      subTopicsMap.forEach((specificTopics, subTopic) => {
        subTopicsArray.push({
          name: subTopic,
          specificTopics: specificTopics
        });
      });

      hierarchy.push({
        name: mainTopic,
        subTopics: subTopicsArray
      });
    });

    return hierarchy;
  });

  ngOnInit() {    
    this.loadTopics();
  }

  toggleJsonFormat() {
    this.isJsonFormatted.update(value => !value);
  }

  clearFilters() {
    this.mainTopicFilter.set('');
    this.subTopicFilter.set('');
    this.specificTopicFilter.set('');
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.formattedJson());
      this.showToastMessage('JSON copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
      this.showToastMessage('Error al copiar el JSON');
    }
  }

  showToastMessage(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  private getTotalHierarchicalEntries(data: TopicStructure): number {
    let total = 0;
    
    for (const subTopics of Object.values(data)) {
      for (const specificTopics of Object.values(subTopics)) {
        total += specificTopics.length;
      }
    }
    
    return total;
  }

  private loadTopics() {
    this.topicService.getTopics().subscribe(data => {
      this.topicsData.set(data);
    });
  }
}