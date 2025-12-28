import { FiveElement, AnalysisResult, RecommendationItem, Coordinates } from '../types';

// Helper: Deterministic pseudo-random based on coordinates
// This ensures the same location always gets the same "Feng Shui" reading
const getGeoHash = (lat: number, lng: number): number => {
  const str = `${lat.toFixed(4)}${lng.toFixed(4)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const mockVisionAnalysis = (hasImage: boolean): string => {
  if (!hasImage) return "";
  const scenarios = [
    "침대 헤드가 창문을 등지고 있어 기가 산란됩니다. 두꺼운 커튼이 필수입니다.",
    "현관에서 들어오자마자 거울이 보입니다. 이는 들어오는 복을 반사해 내보내는 형국이니 거울을 치우거나 가려야 합니다.",
    "전반적인 가구 배치는 안정적이나, 방의 모서리에 죽은 공간이 있습니다. 이곳에 조명을 두어 양기를 채워주세요.",
    "책상이 문을 등지고 있어 심리적 불안감을 조성할 수 있습니다. 문을 대각선으로 바라보는 위치로 이동하세요."
  ];
  return scenarios[Math.floor(Math.random() * scenarios.length)];
};

const getBirthElement = (month: number): FiveElement => {
  if (month >= 2 && month <= 4) return FiveElement.Wood;
  if (month >= 5 && month <= 7) return FiveElement.Fire;
  if (month >= 8 && month <= 10) return FiveElement.Metal;
  return FiveElement.Water;
};

const getNeededConfig = (excess: FiveElement) => {
  switch (excess) {
    case FiveElement.Fire:
      return {
        needed: [FiveElement.Water],
        summary: "타고난 불의 기운이 강해 성격이 급하고 열정이 넘칩니다. 이를 식혀줄 '수(Water)' 기운이 집안에 흘러야 재물이 모입니다.",
        items: [
          { id: 1, name: "실내 분수대", description: "흐르는 물이 화기를 조절하고 재물운 순환", searchKeyword: "인테리어 실내 분수대" },
          { id: 2, name: "블랙 암막 커튼", description: "북쪽의 차가운 기운을 형상화하여 열기 진정", searchKeyword: "암막 커튼 블랙 네이비" },
          { id: 3, name: "수경 식물", description: "물을 머금은 식물이 생기를 부여", searchKeyword: "수경재배 개운죽" }
        ]
      };
    case FiveElement.Water:
      return {
        needed: [FiveElement.Fire, FiveElement.Earth],
        summary: "겨울의 차가운 물 기운을 타고났습니다. 집안에 온기를 불어넣는 '화(Fire)'나 안정을 주는 '토(Earth)' 기운이 없으면 우울해질 수 있습니다.",
        items: [
          { id: 4, name: "웜톤 무드등", description: "인공적인 태양을 만들어 양기 보충", searchKeyword: "침실 무드등 웜톤" },
          { id: 5, name: "황토색/레드 러그", description: "땅의 기운으로 차가운 바닥 기운 차단", searchKeyword: "거실 러그 옐로우 레드" },
          { id: 6, name: "해바라기 액자", description: "강력한 화의 기운으로 금전운 상승", searchKeyword: "풍수 해바라기 액자" }
        ]
      };
    case FiveElement.Wood:
      return {
        needed: [FiveElement.Metal, FiveElement.Fire],
        summary: "봄의 나무처럼 뻗어나가는 기운입니다. 가지치기를 해줄 '금(Metal)'이나 꽃을 피울 '화(Fire)'가 있어야 결실을 맺습니다.",
        items: [
          { id: 7, name: "메탈 시계/오브제", description: "금속의 기운이 과한 의욕을 절제시킴", searchKeyword: "모던 메탈 탁상시계" },
          { id: 8, name: "화이트 도자기", description: "백색(금)은 목의 기운을 다듬어 줌", searchKeyword: "화이트 도자기 화병" },
          { id: 9, name: "아로마 캔들", description: "자신을 태워 향을 내는 희생의 불 기운", searchKeyword: "소이 캔들 선물세트" }
        ]
      };
    case FiveElement.Metal: // Autumn
    default:
      return {
        needed: [FiveElement.Water, FiveElement.Wood],
        summary: "가을의 서늘하고 날카로운 금 기운입니다. 유연함을 더해줄 '수(Water)'나 풍요로운 '목(Wood)' 기운이 있어야 인복이 따릅니다.",
        items: [
          { id: 10, name: "대형 관엽식물", description: "풍성한 잎이 날카로운 금기를 완화", searchKeyword: "거실 공기정화 식물 여인초" },
          { id: 11, name: "어항/수족관", description: "물의 흐름이 금의 기운을 유통시킴", searchKeyword: "인테리어 미니 어항" },
          { id: 12, name: "우드 슬랩 테이블", description: "나무의 따뜻함이 차가운 금속을 감쌈", searchKeyword: "원목 사이드 테이블" }
        ]
      };
  }
};

export const analyzeFortune = async (
  name: string, 
  birthDateStr: string, 
  houseDirection: string,
  coordinates: Coordinates | null,
  hasImage: boolean
): Promise<AnalysisResult> => {
  const birthDate = new Date(birthDateStr);
  const month = birthDate.getMonth() + 1;
  const excess = getBirthElement(month);
  const { needed, summary: baseSummary, items } = getNeededConfig(excess);

  // --- Geo-Logic (Simulated based on Coordinates) ---
  
  let geoScore = 0;
  let geoAnalysis = "";
  let badLuckWarning = "";

  if (coordinates) {
    const hash = getGeoHash(coordinates.lat, coordinates.lng);
    const scenarios = [
      { type: 'GOOD', msg: "집 뒤로 산맥의 기운이 흐르고 있어 '배산임수'의 조건을 일부 갖추었습니다. 귀인이 도울 형국입니다.", score: 20 },
      { type: 'BAD', msg: "집 주변 도로의 모양이 활처럼 굽어 집을 겨누고 있는 '반궁수'의 형상입니다. 재물이 쉽게 나갈 수 있습니다.", score: -15 },
      { type: 'NEUTRAL', msg: "평지에 위치하여 기의 흐름이 완만하나, 주변 건물이 높아 채광과 통풍에 유의해야 합니다.", score: 5 },
      { type: 'BAD', msg: "인근에 흐르는 물이 없어 건조하고 삭막한 땅입니다. 생기를 불어넣는 노력이 필요합니다.", score: -10 },
      { type: 'GOOD', msg: "정남향의 햇살을 가리는 장애물이 없어 '양명한 기운'이 집안 깊숙이 들어옵니다.", score: 15 }
    ];
    
    // Pick scenario based on hash
    const selectedScenario = scenarios[hash % scenarios.length];
    geoScore = selectedScenario.score;
    geoAnalysis = selectedScenario.msg;
    
    if (selectedScenario.type === 'BAD') {
      badLuckWarning = "주의! 지리적 요건이 좋지 않아 특별한 비보(풍수적 처방)가 필요합니다.";
    } else {
      badLuckWarning = "지리적 요건은 양호합니다. 내부 인테리어에만 집중하세요.";
    }

  } else {
    // Fallback if no map used
    geoAnalysis = "정확한 지리 분석을 건너뛰고 기본 지기(地氣) 분석만 수행했습니다. 집의 정확한 위치를 입력하면 주변의 수맥과 도로 살기를 파악할 수 있습니다.";
    geoScore = 5; // Neutral default
    badLuckWarning = "위치 정보 미입력으로 정밀 분석이 제한됩니다.";
  }

  // --- Direction Score ---
  let dirScore = 70;
  const dirMap: Record<string, FiveElement> = { 'N': FiveElement.Water, 'S': FiveElement.Fire, 'E': FiveElement.Wood, 'W': FiveElement.Metal };
  const houseEl = Object.entries(dirMap).find(([k]) => houseDirection.includes(k))?.[1] || FiveElement.Earth;
  
  if (needed.includes(houseEl)) dirScore += 15;
  else if (houseEl === excess) dirScore -= 10;

  // Final Score Calculation
  let totalScore = dirScore + geoScore;
  if (totalScore > 98) totalScore = 98;
  if (totalScore < 40) totalScore = 40;

  return {
    score: totalScore,
    excessElement: excess,
    neededElements: needed,
    basicSummary: baseSummary,
    luckyColor: needed[0] === FiveElement.Fire ? 'text-red-400' : 
                needed[0] === FiveElement.Water ? 'text-blue-400' :
                needed[0] === FiveElement.Wood ? 'text-green-400' :
                needed[0] === FiveElement.Metal ? 'text-gray-300' : 'text-yellow-500',
    geoAnalysis,
    badLuckWarning,
    visionAnalysis: mockVisionAnalysis(hasImage),
    items
  };
};