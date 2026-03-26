import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzerComponent } from './components/analyzer/analyzer.component';
import { DesignerComponent } from './components/designer/designer.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { ChatComponent } from './components/chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AnalyzerComponent, DesignerComponent, CalendarComponent, ChatComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  activeTab = signal<'analyze' | 'design' | 'schedule' | 'chat'>('analyze');

  setTab(tab: 'analyze' | 'design' | 'schedule' | 'chat') {
    this.activeTab.set(tab);
  }
}