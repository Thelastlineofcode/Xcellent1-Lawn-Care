import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GardenService } from '../../services/garden.service';
import { GeminiService } from '../../services/gemini.service';

interface CalendarTask {
  title: string;
  type: 'mow' | 'fertilize' | 'pest' | 'water';
  description?: string;
  done: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-white p-6 rounded-lg shadow-sm overflow-y-auto">
      <h2 class="text-2xl font-bold text-[#1A4D2E] mb-2">Seasonal Care Schedule</h2>
      <p class="text-gray-500 mb-6">Optimized for South Louisiana (Zone 9a).</p>

      <!-- Month Selector -->
      <div class="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        @for (m of months; track m; let i = $index) {
           <button
             (click)="selectMonth(i)"
             [class]="selectedMonth() === i
               ? 'bg-[#1A4D2E] text-white'
               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
             class="px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors">
             {{ m }}
           </button>
        }
      </div>

      <!-- My Garden Context -->
      <div class="mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
        <div class="flex justify-between items-center mb-2">
           <h3 class="font-bold text-[#1A4D2E] text-sm uppercase">My Garden Plants</h3>
           <span class="text-xs text-gray-500">{{ gardenService.myPlants().length }} plants tracked</span>
        </div>
        @if (gardenService.myPlants().length === 0) {
           <p class="text-sm text-gray-600 italic">No plants added yet. Use the "Analyze" tab to identify plants.</p>
        } @else {
           <div class="flex flex-wrap gap-2">
             @for (plant of gardenService.myPlants(); track plant) {
               <span class="px-2 py-1 bg-white text-green-800 text-xs rounded border border-green-200 shadow-sm flex items-center gap-1">
                 🌿 {{ plant }}
                 <button (click)="gardenService.removePlant(plant)" class="text-red-400 hover:text-red-600 ml-1">×</button>
               </span>
             }
           </div>
           <button 
             (click)="generatePersonalizedSchedule()" 
             [disabled]="isGenerating()"
             class="mt-3 w-full bg-[#1A4D2E] text-white py-2 rounded text-sm hover:bg-[#143d24] disabled:opacity-50 flex items-center justify-center gap-2">
             @if(isGenerating()) { <span class="animate-spin">⌛</span> }
             Regenerate Schedule with AI
           </button>
        }
      </div>

      <!-- Tasks List -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 class="text-xl font-semibold text-green-900 mb-4 flex justify-between items-center">
          {{ months[selectedMonth()] }} Checklist
          <span class="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Zone 9a</span>
        </h3>

        @if (currentTasks().length === 0) {
          <p class="text-gray-500 italic p-4 text-center">No critical tasks found.</p>
        } @else {
          <div class="space-y-3">
             @for (task of currentTasks(); track task.title) {
               <div class="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:border-green-300 transition-colors">
                  <div
                    [class]="{
                      'bg-green-100 text-green-600': task.type === 'mow',
                      'bg-blue-100 text-blue-600': task.type === 'water',
                      'bg-yellow-100 text-yellow-600': task.type === 'fertilize',
                      'bg-red-100 text-red-600': task.type === 'pest'
                    }"
                    class="p-2 rounded-full mt-0.5 shrink-0">
                    @if(task.type === 'mow') { ✂️ }
                    @if(task.type === 'water') { 💧 }
                    @if(task.type === 'fertilize') { 🌱 }
                    @if(task.type === 'pest') { 🐛 }
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-800 text-sm">{{ task.title }}</h4>
                    <p class="text-xs text-gray-600 mt-1 leading-relaxed">
                      {{ task.description || getStaticDescription(task.type) }}
                    </p>
                  </div>
               </div>
             }
          </div>
        }
      </div>
    </div>
  `
})
export class CalendarComponent {
  gardenService = inject(GardenService);
  geminiService = inject(GeminiService);

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  selectedMonth = signal(new Date().getMonth());
  isGenerating = signal(false);
  
  // Tasks stored by month index
  tasksData = signal<Record<number, CalendarTask[]>>({
    0: [{ title: 'Apply Pre-emergent Herbicide', type: 'fertilize', done: false }], 
    1: [{ title: 'Spot Treat Winter Weeds', type: 'pest', done: false }], 
    2: [{ title: 'First Mow of Season', type: 'mow', done: false }, { title: 'Apply Pre-emergent (Round 2)', type: 'fertilize', done: false }],
    3: [{ title: 'Apply Fertilizer after Green-up', type: 'fertilize', done: false }, { title: 'Check for Chinch Bugs', type: 'pest', done: false }],
    4: [{ title: 'Weekly Mowing', type: 'mow', done: false }, { title: 'Water 1" per week', type: 'water', done: false }],
    5: [{ title: 'Monitor for Sod Webworms', type: 'pest', done: false }, { title: 'Apply Iron for Deep Green', type: 'fertilize', done: false }],
    6: [{ title: 'High Mowing Height (Heat Stress)', type: 'mow', done: false }, { title: 'Check Irrigation Coverage', type: 'water', done: false }],
    7: [{ title: 'Monitor for Chinch Bugs (Peak)', type: 'pest', done: false }, { title: 'Aeration (if needed)', type: 'fertilize', done: false }],
    8: [{ title: 'Apply Fall Pre-emergent', type: 'fertilize', done: false }, { title: 'Watch for Brown Patch Fungus', type: 'pest', done: false }],
    9: [{ title: 'Reduce Watering Frequency', type: 'water', done: false }, { title: 'Apply Fungicide Preventative', type: 'pest', done: false }],
    10: [{ title: 'Raise Mower Height for Winter', type: 'mow', done: false }, { title: 'Winterizer Fertilizer (Potassium)', type: 'fertilize', done: false }],
    11: [{ title: 'Clean up Leaves (Prevent Mold)', type: 'pest', done: false }, { title: 'Service Mower Equipment', type: 'mow', done: false }]
  });

  currentTasks = computed(() => {
    return this.tasksData()[this.selectedMonth()] || [];
  });

  selectMonth(i: number) {
    this.selectedMonth.set(i);
  }

  getStaticDescription(type: string): string {
    switch(type) {
      case 'mow': return 'Maintain appropriate height. Never scalp St. Augustine.';
      case 'water': return 'Water deeply, 1 inch per week early morning.';
      case 'fertilize': return 'Use slow-release nitrogen based on package instructions.';
      case 'pest': return 'Inspect for activity early morning or dusk.';
      default: return '';
    }
  }

  async generatePersonalizedSchedule() {
    if (this.gardenService.myPlants().length === 0) return;
    
    this.isGenerating.set(true);
    const monthName = this.months[this.selectedMonth()];
    const plants = this.gardenService.myPlants();
    
    const aiTasks = await this.geminiService.generatePersonalizedSchedule(plants, monthName);
    
    if (aiTasks && Array.isArray(aiTasks)) {
      this.tasksData.update(data => ({
        ...data,
        [this.selectedMonth()]: aiTasks.map((t: any) => ({...t, done: false}))
      }));
    }
    
    this.isGenerating.set(false);
  }
}