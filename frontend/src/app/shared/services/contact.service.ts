import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactFormData, EmailResponse } from '../models/contact.models';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`; // Ajusta la URL según tu backend

  constructor(private http: HttpClient) {}

  /**
   * Envía el formulario de contacto por email
   */
  sendContactEmail(formData: ContactFormData): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(this.apiUrl, formData);
  }

}