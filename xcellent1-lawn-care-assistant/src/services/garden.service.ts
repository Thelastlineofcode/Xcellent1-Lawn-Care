import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GardenService {
  // Store the list of plants identified or added by the user
  myPlants = signal<string[]>([]);

  addPlant(plantName: string) {
    this.myPlants.update(plants => {
      if (!plants.includes(plantName)) {
        return [...plants, plantName];
      }
      return plants;
    });
  }

  removePlant(plantName: string) {
    this.myPlants.update(plants => plants.filter(p => p !== plantName));
  }
}