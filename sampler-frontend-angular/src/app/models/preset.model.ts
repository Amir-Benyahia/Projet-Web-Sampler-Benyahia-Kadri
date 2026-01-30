/**
 * Modèle représentant un sample audio dans un preset
 */
export interface Sample {
  name: string;
  url: string;
  padIndex: number | null;
}

/**
 * Modèle représentant un preset complet avec ses samples
 */
export interface Preset {
  _id?: string;
  type?: string;
  name: string;
  category?: string;
  samples: Sample[];
  createdAt?: Date;
  updatedAt?: Date;
}
