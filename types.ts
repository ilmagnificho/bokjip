export enum FiveElement {
  Wood = '목(Wood)',
  Fire = '화(Fire)',
  Earth = '토(Earth)',
  Metal = '금(Metal)',
  Water = '수(Water)',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserData {
  name: string;
  gender: 'male' | 'female' | null;
  calendarType: 'solar' | 'lunar';
  birthDate: string; 
  birthTime: string; // Optional
  address: string;
  coordinates: Coordinates | null; 
  houseDirection: string;
  roomImage: File | null;
}

// Compatibility Radar Chart Data
export interface CompatibilityDetail {
  label: string;
  score: number; // 0-100
  description: string; // Analysis text for this specific metric
  detailQuote: string; // New: Specific advice for the tooltip
}

export interface AnalysisResult {
  totalScore: number;
  tier: HouseTier;
  
  // The 6-axis data for the Radar Chart
  radarData: CompatibilityDetail[];
  
  // Copywriting
  mainCopy: string; 
  subCopy: string;
  
  // Explanation of location logic
  locationAnalysis: string; 

  // Paid Report Content
  premiumReport: {
    title: string;
    price: string;
    sections: {
      title: string;
      icon: string;
      content: string[];
    }[];
  };

  // Item Recommendations
  items: RecommendationItem[];
}

export enum HouseTier {
  S = 'S', 
  A = 'A', 
  B = 'B', 
  C = 'C', 
}

export interface RecommendationItem {
  id: number;
  name: string;
  effect: string; 
  description: string;
  searchKeyword: string; 
  tag: string; 
}