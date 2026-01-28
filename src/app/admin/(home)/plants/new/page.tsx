'use client';

import { PlantForm } from '../_components/plant-form';

export default function NewPlantPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add New Plant</h1>
        <p className="text-muted-foreground">Register a processing plant or waste destination</p>
      </div>

      <PlantForm />
    </div>
  );
}
