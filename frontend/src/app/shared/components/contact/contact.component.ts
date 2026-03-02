import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { ContactFormData } from '../../models/contact.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  
  contactForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  submitStatus = signal<'idle' | 'success' | 'error'>('idle');
  errorMessage = signal<string>('');
  
  // Opciones para el selector de asunto
  subjectOptions = [
    { value: 'soporte', label: 'Soporte técnico' },
    { value: 'consulta', label: 'Consulta general' },
    { value: 'sugerencia', label: 'Sugerencia de mejora' },
    { value: 'error', label: 'Reportar un error' },
    { value: 'privacidad', label: 'Consulta de privacidad' },
    { value: 'otros', label: 'Otros' }
  ];

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      consent: [false, Validators.requiredTrue]

    });
  }

  get messageLength(): number {
    return this.contactForm?.get('message')?.value?.length || 0;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.contactForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.submitStatus.set('idle');
    this.errorMessage.set('');

    const formData: ContactFormData = this.contactForm.value;

    this.contactService.sendContactEmail(formData).subscribe({
      next: (response) => {
        console.log('Email enviado:', response);
        this.submitStatus.set('success');
        this.resetForm();
        this.isSubmitting.set(false);
        
        // Auto-ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.submitStatus.set('idle');
        }, 5000);
      },
      error: (error) => {
        console.error('Error al enviar email:', error);
        this.submitStatus.set('error');
        this.errorMessage.set(error.error?.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.');
        this.isSubmitting.set(false);
        
        // Auto-ocultar mensaje de error después de 5 segundos
        setTimeout(() => {
          this.submitStatus.set('idle');
        }, 5000);
      }
    });
  }

  /**
   * Resetea el formulario
   */
  resetForm(): void {
    this.contactForm.reset({
      name: '',
      email: '',
      subject: '',
      message: '',
      consent: false
    });
  }

  /**
   * Obtiene la clase CSS para los inputs según su estado
   */
  getInputClass(controlName: string): string {
    const control = this.contactForm.get(controlName);
    const baseClass = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all';
    
    if (control?.invalid && control?.touched) {
      return baseClass + ' border-red-500 dark:border-red-500';
    }
    
    return baseClass + ' border-gray-300 dark:border-gray-600';
  }

  /**
   * Obtiene la clase CSS para el select
   */
  getSelectClass(): string {
    const control = this.contactForm.get('subject');
    const baseClass = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all';
    
    if (control?.invalid && control?.touched) {
      return baseClass + ' border-red-500 dark:border-red-500';
    }
    
    return baseClass + ' border-gray-300 dark:border-gray-600';
  }

  /**
   * Obtiene la clase CSS para el textarea
   */
  getTextareaClass(): string {
    const control = this.contactForm.get('message');
    const baseClass = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all resize-none';
    
    if (control?.invalid && control?.touched) {
      return baseClass + ' border-red-500 dark:border-red-500';
    }
    
    return baseClass + ' border-gray-300 dark:border-gray-600';
  }
}