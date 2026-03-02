import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-navbar class="sticky top-0 z-50 transition-all duration-300"></app-navbar>
      <main class="flex-1">
        <router-outlet></router-outlet>   
      </main>
      <app-footer></app-footer>   
    </div> `,
})
export class AppComponent {
  title = 'AngularAuthApp';
}
