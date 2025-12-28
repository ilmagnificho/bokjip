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
  coordinates: Coordinates | null; // Optional now
  houseDirection: string;
  roomImage: File | null;
}

export interface AnalysisResult {
  score: number;
  excessElement: FiveElement;
  neededElements: FiveElement[];
  
  // Free Content
  basicSummary: string; 
  luckyColor: string;
  
  // Premium Content (To be unlocked)
  geoAnalysis: string; // Analysis based on Lat/Lng
  visionAnalysis?: string;
  badLuckWarning: string; // Disclaimer/Warning about bad spots
  
  items: RecommendationItem[];
}

export interface RecommendationItem {
  id: number;
  name: string;
  description: string;
  searchKeyword: string; // For automated search link
}