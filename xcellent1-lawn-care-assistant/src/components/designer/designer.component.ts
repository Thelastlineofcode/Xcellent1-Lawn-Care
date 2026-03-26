import { Component, signal, inject, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';

interface DesignItem {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
  scale: number;
}

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col md:flex-row bg-gray-50">
      <!-- Sidebar Tools -->
      <div class="w-full md:w-64 bg-white p-4 shadow-md flex-shrink-0 z-10 overflow-y-auto">
        <h3 class="font-bold text-[#1A4D2E] mb-4">Design Tools</h3>

        <!-- Background Mode -->
        <div class="mb-6 bg-gray-100 p-2 rounded-lg">
          <p class="text-xs text-gray-500 mb-2 font-semibold uppercase">1. Choose View</p>
          <div class="flex flex-col gap-2">
            <button 
               (click)="enableAR()"
               [class]="isAR() ? 'bg-red-500 text-white' : 'bg-white text-gray-700'"
               class="w-full py-2 px-3 rounded shadow-sm text-sm font-medium transition-colors flex items-center justify-center gap-2">
               📷 {{ isAR() ? 'Stop Camera (AR)' : 'Live Camera (AR)' }}
            </button>
            <label class="block w-full text-center py-2 px-3 border border-dashed border-gray-300 bg-white rounded cursor-pointer hover:bg-gray-50 text-sm">
              <span class="text-gray-600">📁 Upload Photo</span>
              <input type="file" accept="image/*" (change)="handleBackgroundUpload($event)" class="hidden">
            </label>
          </div>
        </div>

        <!-- Element Library -->
        <div class="mb-6">
          <p class="text-xs text-gray-500 mb-2 font-semibold uppercase">2. Add Elements</p>
          
          <div class="space-y-4">
             <div>
               <p class="text-[10px] text-gray-400 mb-1">PLANTS & TREES</p>
               <div class="grid grid-cols-4 gap-2">
                @for (plant of plants; track plant.name) {
                  <button
                    (click)="addItem(plant.emoji, plant.name)"
                    class="aspect-square flex items-center justify-center text-2xl bg-gray-50 rounded hover:bg-green-100 border border-transparent hover:border-green-300 transition-colors"
                    [title]="plant.name">
                    {{ plant.emoji }}
                  </button>
                }
               </div>
             </div>

             <div>
               <p class="text-[10px] text-gray-400 mb-1">PRODUCTS & HARDSCAPE</p>
               <div class="grid grid-cols-4 gap-2">
                @for (prod of products; track prod.name) {
                  <button
                    (click)="addItem(prod.emoji, prod.name)"
                    class="aspect-square flex items-center justify-center text-2xl bg-gray-50 rounded hover:bg-yellow-100 border border-transparent hover:border-yellow-300 transition-colors"
                    [title]="prod.name">
                    {{ prod.emoji }}
                  </button>
                }
               </div>
             </div>
          </div>
        </div>

        <!-- AI Assistant -->
        <div class="mt-auto pt-4 border-t border-gray-200">
          <button
            (click)="getSuggestions()"
            [disabled]="(!backgroundImage() && !isAR()) || isSuggesting()"
            class="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm py-2 px-4 rounded shadow hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            @if (isSuggesting()) {
              <div class="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            } @else {
              ✨
            }
            AI Suggest Ideas
          </button>
          @if (suggestionResult()) {
            <div class="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded">
              <span class="font-bold">Suggestion:</span> {{ suggestionResult() }}
            </div>
          }
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center"
           (mousemove)="onDragMove($event)"
           (mouseup)="onDragEnd()"
           (mouseleave)="onDragEnd()"
           (touchmove)="onTouchMove($event)"
           (touchend)="onDragEnd()">

        @if (!backgroundImage() && !isAR()) {
          <div class="text-center text-gray-500 p-8">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p>Select Live Camera or Upload Photo</p>
          </div>
        }

        <div #canvasContainer class="relative w-full h-full flex items-center justify-center">
           <!-- Video Layer (AR) -->
           <video 
             #videoElement 
             autoplay 
             playsinline 
             class="absolute inset-0 w-full h-full object-cover z-0"
             [class.hidden]="!isAR()"></video>

           <!-- Image Layer -->
           @if (!isAR() && backgroundImage()) {
             <img [src]="backgroundImage()" class="max-w-full max-h-[80vh] object-contain select-none pointer-events-none z-0" draggable="false">
           }

           <!-- Overlays Layer -->
           <!-- Note: In AR mode, items are absolute to the container. In Image mode, they are absolute to the container as well. -->
           <div class="absolute inset-0 z-10 overflow-hidden">
             @for (item of items(); track item.id) {
               <div
                 class="absolute cursor-move flex flex-col items-center select-none"
                 [style.left.px]="item.x"
                 [style.top.px]="item.y"
                 [style.transform]="'scale(' + item.scale + ')'"
                 (mousedown)="onDragStart($event, item.id)"
                 (touchstart)="onTouchStart($event, item.id)">
                  <span class="text-6xl drop-shadow-xl filter">{{ item.emoji }}</span>
                  @if (selectedId() === item.id) {
                    <div class="absolute -top-10 flex gap-1 bg-white/90 rounded shadow px-2 py-1 z-50">
                       <button (click)="deleteItem(item.id)" class="text-red-500 hover:bg-red-50 px-2 rounded">✕</button>
                       <button (click)="scaleItem(item.id, 0.1)" class="text-gray-700 hover:bg-gray-100 px-2 rounded">+</button>
                       <button (click)="scaleItem(item.id, -0.1)" class="text-gray-700 hover:bg-gray-100 px-2 rounded">-</button>
                    </div>
                  }
               </div>
             }
           </div>
        </div>
      </div>
    </div>
  `
})
export class DesignerComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  geminiService = inject(GeminiService);

  backgroundImage = signal<string | null>(null);
  imageBase64 = signal<string | null>(null);
  items = signal<DesignItem[]>([]);
  selectedId = signal<number | null>(null);
  isSuggesting = signal(false);
  suggestionResult = signal<string | null>(null);
  isAR = signal(false);
  mediaStream: MediaStream | null = null;

  // Drag State
  isDragging = false;
  dragOffset = { x: 0, y: 0 };
  draggedItemId: number | null = null;

  plants = [
    { emoji: '🌳', name: 'Live Oak' },
    { emoji: '🌲', name: 'Pine' },
    { emoji: '🌴', name: 'Palmetto' },
    { emoji: '🌺', name: 'Azalea' },
    { emoji: '🌻', name: 'Sunflower' },
    { emoji: '🪷', name: 'Lotus' },
    { emoji: '🌾', name: 'Pampas' },
    { emoji: '🌹', name: 'Rose' },
  ];

  products = [
    { emoji: '🪨', name: 'Stone' },
    { emoji: '⛲', name: 'Fountain' },
    { emoji: '🪴', name: 'Potted Plant' },
    { emoji: '🏮', name: 'Light' },
    { emoji: '🥡', name: 'Fertilizer Bag' },
    { emoji: '🧱', name: 'Pavers' },
  ];

  ngOnDestroy() {
    this.stopCamera();
  }

  async enableAR() {
    if (this.isAR()) {
      this.stopCamera();
      this.isAR.set(false);
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.isAR.set(true);
      // Allow change detection to render video element
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      });
      // Clear background image if any
      this.backgroundImage.set(null);
    } catch (err) {
      alert("Camera access denied or not available. Please try on a mobile device with HTTPS.");
      console.error(err);
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  handleBackgroundUpload(event: Event) {
    this.stopCamera();
    this.isAR.set(false);
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.backgroundImage.set(e.target.result);
        this.imageBase64.set(e.target.result.split(',')[1]);
        this.items.set([]); // Reset items on new background
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  addItem(emoji: string, name: string) {
    if (!this.backgroundImage() && !this.isAR()) return;
    
    // Start roughly in center
    const newItem: DesignItem = {
      id: Date.now(),
      emoji,
      name,
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight / 2 - 50,
      scale: 1
    };
    this.items.update(items => [...items, newItem]);
    this.selectedId.set(newItem.id);
  }

  deleteItem(id: number) {
    this.items.update(items => items.filter(i => i.id !== id));
    this.selectedId.set(null);
  }

  scaleItem(id: number, amount: number) {
    this.items.update(items => items.map(i => {
      if (i.id === id) return { ...i, scale: Math.max(0.5, i.scale + amount) };
      return i;
    }));
  }

  // Mouse Dragging
  onDragStart(event: MouseEvent, id: number) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedId.set(id);
    this.isDragging = true;
    this.draggedItemId = id;
    this.dragOffset = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging || this.draggedItemId === null) return;
    event.preventDefault();

    const deltaX = event.clientX - this.dragOffset.x;
    const deltaY = event.clientY - this.dragOffset.y;

    this.items.update(items => items.map(item => {
      if (item.id === this.draggedItemId) {
        return { ...item, x: item.x + deltaX, y: item.y + deltaY };
      }
      return item;
    }));

    this.dragOffset = { x: event.clientX, y: event.clientY };
  }

  // Touch Dragging
  onTouchStart(event: TouchEvent, id: number) {
    event.stopPropagation();
    this.selectedId.set(id);
    this.isDragging = true;
    this.draggedItemId = id;
    const touch = event.touches[0];
    this.dragOffset = { x: touch.clientX, y: touch.clientY };
  }

  onTouchMove(event: TouchEvent) {
     if (!this.isDragging || this.draggedItemId === null) return;
     const touch = event.touches[0];
     const deltaX = touch.clientX - this.dragOffset.x;
     const deltaY = touch.clientY - this.dragOffset.y;

     this.items.update(items => items.map(item => {
       if (item.id === this.draggedItemId) {
         return { ...item, x: item.x + deltaX, y: item.y + deltaY };
       }
       return item;
     }));

     this.dragOffset = { x: touch.clientX, y: touch.clientY };
  }

  onDragEnd() {
    this.isDragging = false;
    this.draggedItemId = null;
  }

  async getSuggestions() {
    if (this.isAR()) {
      // In AR mode, we can't easily capture the frame without a canvas draw, 
      // for simplicity we'll simulate or skip, or user must snap a pic first.
      // For this MVP, we disable specific image analysis in AR mode unless we implemented frame capture.
      this.suggestionResult.set("Take a photo upload for specific suggestions, or just drag items in AR!");
      return;
    }

    const base64 = this.imageBase64();
    if (!base64) return;

    this.isSuggesting.set(true);
    this.suggestionResult.set(null);

    const jsonStr = await this.geminiService.getDesignSuggestions(base64);
    try {
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanJson);
      if (Array.isArray(suggestions)) {
        this.suggestionResult.set(suggestions.join(', '));
      } else {
        this.suggestionResult.set("Couldn't parse suggestions.");
      }
    } catch (e) {
      this.suggestionResult.set(jsonStr);
    }

    this.isSuggesting.set(false);
  }
}