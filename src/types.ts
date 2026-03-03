export type Method = 'V60' | 'Origami' | 'Aeropress' | 'Prensa Francesa';

export interface Pour {
  id?: number;
  recipe_id?: number;
  name: string;
  start_time_seconds: number;
  water_grams: number;
  notes?: string;
}

export interface SensoryProfile {
  body: number;
  sweetness: number;
  acidity: number;
  bitterness: number;
}

export interface CoffeeDetails {
  origin?: string;
  variety?: string;
  process?: 'Lavado' | 'Honey' | 'Natural';
  roast?: 'Claro' | 'Medio' | 'Oscuro';
}

export interface Recipe {
  id?: number;
  name: string;
  method: Method;
  coffee_grams: number;
  ratio: number;
  grind_clicks: number;
  temp_c: number;
  total_time_seconds: number;
  pours: Pour[];
  sensory_profile?: SensoryProfile;
  coffee_details?: CoffeeDetails;
  created_at?: string;
}

export const METHODS: Method[] = ['V60', 'Origami', 'Aeropress', 'Prensa Francesa'];

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr: string) => {
  const [mins, secs] = timeStr.split(':').map(Number);
  return (mins * 60) + (secs || 0);
};
