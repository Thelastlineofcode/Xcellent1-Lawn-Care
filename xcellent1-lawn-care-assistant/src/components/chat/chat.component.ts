import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

interface Message {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-[#1A4D2E] text-white rounded-t-lg">
        <div>
          <h2 class="font-bold text-lg">Lawn Care Assistant</h2>
          <p class="text-xs text-green-100">Expert on South LA Gardens</p>
        </div>
        <div class="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
          🤖
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" #scrollContainer>
        @for (msg of messages(); track $index) {
          <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
            <div
              [class]="msg.role === 'user'
                ? 'bg-[#1A4D2E] text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'"
              class="max-w-[80%] p-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed">
              {{ msg.text }}
            </div>
          </div>
        }
        @if (isLoading()) {
          <div class="flex justify-start">
            <div class="bg-gray-100 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center h-10">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-gray-100">
        <form (submit)="sendMessage($event)" class="flex gap-2">
          <input
            [(ngModel)]="currentMessage"
            name="message"
            placeholder="Ask about chinch bugs, fertilizer..."
            class="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-[#1A4D2E] focus:ring-1 focus:ring-[#1A4D2E]"
            autocomplete="off"
            [disabled]="isLoading()"
          >
          <button
            type="submit"
            [disabled]="!currentMessage.trim() || isLoading()"
            class="bg-[#1A4D2E] text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#143d24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  geminiService = inject(GeminiService);

  messages = signal<Message[]>([
    { role: 'model', text: 'Hello! I can help you with your South Louisiana lawn. Ask me about grass types, pests, or design ideas.' }
  ]);
  currentMessage = '';
  isLoading = signal(false);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    if (!this.currentMessage.trim() || this.isLoading()) return;

    const userText = this.currentMessage;
    this.currentMessage = '';
    this.messages.update(msgs => [...msgs, { role: 'user', text: userText }]);
    this.isLoading.set(true);

    // Prepare history for API
    const history = this.messages().map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await this.geminiService.chat(history, userText);

    this.messages.update(msgs => [...msgs, { role: 'model', text: response }]);
    this.isLoading.set(false);
  }
}