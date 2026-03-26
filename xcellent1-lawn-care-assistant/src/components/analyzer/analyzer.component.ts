import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { GardenService } from '../../services/garden.service';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col p-4 bg-white rounded-lg shadow-sm overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-[#1A4D2E]">AI Scanner</h2>
        <div class="flex bg-gray-100 rounded-lg p-1">
          <button 
            (click)="mode.set('diagnose')" 
            [class]="mode() === 'diagnose' ? 'bg-white shadow text-[#1A4D2E]' : 'text-gray-500 hover:text-gray-700'"
            class="px-3 py-1 rounded-md text-sm font-medium transition-all">
            Diagnose Health
          </button>
          <button 
            (click)="mode.set('identify')" 
            [class]="mode() === 'identify' ? 'bg-white shadow text-[#1A4D2E]' : 'text-gray-500 hover:text-gray-700'"
            class="px-3 py-1 rounded-md text-sm font-medium transition-all">
            Identify Plant
          </button>
        </div>
      </div>
      
      <p class="text-gray-600 mb-6">
        @if (mode() === 'diagnose') {
          Upload a photo of your grass or problem area. Diagnose issues like Chinch bugs or Brown patch.
        } @else {
          Take a photo of a plant to identify it and get care instructions for South Louisiana.
        }
      </p>

      <div class="flex flex-col items-center gap-4">
        <!-- Upload Area -->
        <div class="w-full max-w-md aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#1A4D2E] transition-colors cursor-pointer">
          @if (imagePreview()) {
            <img [src]="imagePreview()" class="w-full h-full object-cover" alt="Uploaded lawn" />
            <button (click)="clearImage()" class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
          } @else {
            <input type="file" accept="image/*" (change)="handleFileInput($event)" class="absolute inset-0 opacity-0 cursor-pointer" />
            <div class="text-center p-4 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p class="text-sm font-medium text-gray-600">Tap to take photo or upload</p>
            </div>
          }
        </div>

        <!-- Analyze Button -->
        <button
          [disabled]="!imagePreview() || isLoading()"
          (click)="processImage()"
          class="w-full max-w-md bg-[#1A4D2E] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#143d24] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2">
          @if (isLoading()) {
            <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            Processing...
          } @else {
            {{ mode() === 'diagnose' ? 'Diagnose Lawn' : 'Identify Plant' }}
          }
        </button>

        <!-- Results: Diagnosis Mode -->
        @if (mode() === 'diagnose' && diagnosisResult()) {
          <div class="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-5 mt-4">
            <h3 class="font-bold text-[#1A4D2E] text-lg mb-2 flex items-center gap-2">
              Diagnosis Result
            </h3>
            <div class="prose prose-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {{ diagnosisResult() }}
            </div>
            <div class="mt-4 pt-4 border-t border-green-200">
               <p class="text-xs text-green-800 font-semibold uppercase tracking-wider">Suggested Products</p>
               <div class="flex gap-2 mt-2 overflow-x-auto pb-2">
                  <div class="flex-shrink-0 w-24 bg-white p-2 rounded border border-green-100 shadow-sm text-center">
                    <div class="h-12 w-full bg-gray-200 rounded mb-1 flex items-center justify-center text-xl">🧴</div>
                    <p class="text-xs truncate">Fungicide</p>
                  </div>
                  <div class="flex-shrink-0 w-24 bg-white p-2 rounded border border-green-100 shadow-sm text-center">
                    <div class="h-12 w-full bg-gray-200 rounded mb-1 flex items-center justify-center text-xl">🐜</div>
                    <p class="text-xs truncate">Pest Control</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Results: Plant ID Mode -->
        @if (mode() === 'identify' && plantIdResult()) {
           <div class="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-5 mt-4 animate-fade-in">
              <div class="flex justify-between items-start">
                 <h3 class="font-bold text-[#1A4D2E] text-xl">{{ plantIdResult()?.name }}</h3>
                 <button (click)="addToGarden()" class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                    + Add to Garden
                 </button>
              </div>
              <div class="mt-3 space-y-3">
                <div class="bg-white p-3 rounded shadow-sm">
                   <p class="text-xs font-bold text-gray-500 uppercase">Care Instructions</p>
                   <p class="text-sm text-gray-800">{{ plantIdResult()?.care }}</p>
                </div>
                <div class="bg-white p-3 rounded shadow-sm">
                   <p class="text-xs font-bold text-red-500 uppercase">Watch For Pests</p>
                   <p class="text-sm text-gray-800">{{ plantIdResult()?.pests }}</p>
                </div>
              </div>
              @if (addedToGarden()) {
                <div class="mt-3 text-center text-sm text-green-700 font-medium">
                   ✅ Added to your Garden Schedule!
                </div>
              }
           </div>
        }
      </div>
    </div>
  `
})
export class AnalyzerComponent {
  geminiService = inject(GeminiService);
  gardenService = inject(GardenService);
  
  mode = signal<'diagnose' | 'identify'>('diagnose');
  imagePreview = signal<string | null>(null);
  imageBase64 = signal<string | null>(null);
  isLoading = signal(false);
  
  diagnosisResult = signal<string | null>(null);
  plantIdResult = signal<{name: string, care: string, pests: string} | null>(null);
  addedToGarden = signal(false);

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.imagePreview.set(e.target.result);
        const base64 = e.target.result.split(',')[1];
        this.imageBase64.set(base64);
        this.diagnosisResult.set(null);
        this.plantIdResult.set(null);
        this.addedToGarden.set(false);
      };

      reader.readAsDataURL(file);
    }
  }

  clearImage() {
    this.imagePreview.set(null);
    this.imageBase64.set(null);
    this.diagnosisResult.set(null);
    this.plantIdResult.set(null);
  }

  async processImage() {
    const base64 = this.imageBase64();
    if (!base64) return;

    this.isLoading.set(true);
    this.diagnosisResult.set(null);
    this.plantIdResult.set(null);
    this.addedToGarden.set(false);

    if (this.mode() === 'diagnose') {
      const prompt = "Act as an expert agronomist for South Louisiana. Analyze this lawn image. Identify any visible weeds, pests, fungus (like brown patch), or drought stress. Provide a brief 3-step treatment plan specific to Zone 9a climate.";
      const analysis = await this.geminiService.analyzeImage(base64, prompt);
      this.diagnosisResult.set(analysis);
    } else {
      const result = await this.geminiService.identifyPlant(base64);
      this.plantIdResult.set(result);
    }

    this.isLoading.set(false);
  }

  addToGarden() {
    const plant = this.plantIdResult();
    if (plant) {
      this.gardenService.addPlant(plant.name);
      this.addedToGarden.set(true);
    }
  }
}