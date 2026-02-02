import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invitation-test-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <!-- Título y nivel -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
            {{ response?.test?.title }}
          </h2>
          @if (response?.test?.description) {
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ response?.test?.description }}
            </p>
          }
        </div>
        <span class="ml-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {{ response?.test?.level }}
        </span>
      </div>
      
      <!-- Jerarquía de temas -->
      <div class="mb-4">
        <div class="flex flex-wrap gap-1">
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
            {{ response?.test?.main_topic }} &gt; {{ response?.test?.sub_topic }} &gt; {{ response?.test?.specific_topic }}
          </span>
        </div>
      </div>
      
      <!-- Información del inviter y mensaje -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <!-- Invitado por -->
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Invitado por:</p>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ response?.inviter?.full_name || 'Usuario' }}
            </p>
            <div class="flex flex-col xs:flex-row xs:items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="truncate">@{{ response?.inviter?.username || 'invitador' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Mensaje personalizado -->
        @if (response?.invitation?.message) {
          <div class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                  {{ response?.inviter?.full_name || 'tu invitador' }}:
                </p>
                <p class="text-sm text-yellow-700 dark:text-yellow-400 italic">
                  "{{ response?.invitation?.message }}"
                </p>
              </div>
            </div>
          </div>
        } @else {
          <div class="mt-3 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 italic text-center">
              {{ response?.inviter?.full_name || 'Tu invitador' }} te ha invitado a realizar este test.
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class InvitationTestInfoComponent {
  @Input() response: any;
}