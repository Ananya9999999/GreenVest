export type PreferenceWeights = {
  carbon: number;
  roi: number;
  lowRisk: number;
  biodiversity: number;
  waterEfficiency: number;
};

export type LandInput = {
  landId: string;
  location: string;
  areaHectares: number;
  budget: number;
  investmentHorizonYears: number;
  healthScore: number;
  soilType?: string;
  proximityKm?: number;
};

export type StrategyType = "maximum_carbon" | "maximum_roi" | "balanced";

export type StrategyRecommendation = {
  strategyType: StrategyType;
  title: string;
  approach: string;
  recommendedSpecies: string[];
  carbonScore: number;
  roiScore: number;
  riskLevel: string;
  estimatedInvestment: number;
  expectedRoiPercent: number;
  rank: number;
  rankScore: number;
};

export type MarketplaceListing = {
  id: string;
  userId: string;
  location: string;
  areaHectares: number;
  healthScore: number;
  carbonPotential: number;
  soilType: string;
  priceHint?: string;
};
