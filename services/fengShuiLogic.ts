import { FiveElement, AnalysisResult, RecommendationItem, Coordinates, HouseTier, CompatibilityDetail } from '../types';

const getGeoHash = (lat: number, lng: number): number => {
  const str = `${lat.toFixed(4)}${lng.toFixed(4)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Calculate Five Element of the User
const getUserElement = (month: number): FiveElement => {
  if (month >= 2 && month <= 4) return FiveElement.Wood;
  if (month >= 5 && month <= 7) return FiveElement.Fire;
  if (month >= 8 && month <= 10) return FiveElement.Metal;
  return FiveElement.Water; // Winter includes Nov, Dec, Jan roughly for simplicity in MVP
};

// Calculate Needed Element (Balancing)
const getNeededElement = (userEl: FiveElement): FiveElement => {
  switch (userEl) {
    case FiveElement.Wood: return FiveElement.Metal; // Metal prunes Wood
    case FiveElement.Fire: return FiveElement.Water; // Water cools Fire
    case FiveElement.Earth: return FiveElement.Wood; // Wood holds Earth
    case FiveElement.Metal: return FiveElement.Fire; // Fire shapes Metal
    case FiveElement.Water: return FiveElement.Earth; // Earth channels Water
    default: return FiveElement.Fire;
  }
};

const getStrategicItems = (
  radarData: CompatibilityDetail[], 
  neededEl: FiveElement
): RecommendationItem[] => {
  const items: RecommendationItem[] = [];
  const mkItem = (id: number, name: string, effect: string, desc: string, kw: string, tag: string) => ({ id, name, effect, description: desc, searchKeyword: kw, tag });

  // 1. Check for specific low scores in the Radar Data
  const earthScore = radarData.find(d => d.label === '지기(Ground)')?.score || 50;
  const flowScore = radarData.find(d => d.label === '환기(Flow)')?.score || 50;
  const lightScore = radarData.find(d => d.label === '채광(Light)')?.score || 50;

  // Rule 1: Low Earth Energy (Bad Ground)
  if (earthScore < 60) {
    items.push(mkItem(1, "천연 숯 단지", "탁한 지기(Ground) 정화", "나쁜 기운을 흡착하여 터를 깨끗하게 만듭니다.", "천연 가습 숯", "필수비보"));
    items.push(mkItem(2, "붉은 팥 항아리", "액운 차단", "예로부터 잡귀를 쫓는 가장 강력한 비책입니다.", "국산 붉은 팥", "강력추천"));
  }

  // Rule 2: Low Flow/Ventilation
  if (flowScore < 60) {
    items.push(mkItem(3, "맑은 소리 풍경", "기운 순환 유도", "정체된 공기를 소리의 파동으로 깨웁니다.", "현관 풍경 종", "순환개선"));
  }

  // Rule 3: Low Light
  if (lightScore < 60) {
    items.push(mkItem(4, "장 스탠드 (웜톤)", "부족한 양기 보충", "인공 태양으로 집안의 음기를 몰아냅니다.", "인테리어 장스탠드", "양기충전"));
  }

  // Rule 4: Balance Five Elements (Always add one item for the user's element balance)
  if (items.length < 3) {
    switch (neededEl) {
      case FiveElement.Water:
        items.push(mkItem(5, "실내 미니 분수", "재물운(Water) 공급", "흐르는 물은 재물이 고이게 합니다.", "실내 분수대", "금전운"));
        break;
      case FiveElement.Fire:
        items.push(mkItem(6, "해바라기 액자", "화(Fire)의 기운 증폭", "강력한 양기로 성공운을 부릅니다.", "해바라기 그림", "성공운"));
        break;
      case FiveElement.Metal:
        items.push(mkItem(7, "황동(Brass) 오브제", "결단력(Metal) 강화", "흩어지는 기운을 단단하게 잡습니다.", "황동 인테리어 소품", "관운상승"));
        break;
      case FiveElement.Wood:
        items.push(mkItem(8, "대형 관엽식물", "성장(Wood) 에너지", "생명력을 불어넣어 활기를 줍니다.", "거실 여인초", "생기부여"));
        break;
      default:
        items.push(mkItem(9, "크리스탈 썬캐쳐", "기운 확산", "좋은 기운을 집안 구석구석 퍼뜨립니다.", "썬캐쳐", "기운증폭"));
    }
  }

  return items.slice(0, 3); // Return top 3
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
  const userElement = getUserElement(month);
  const neededElement = getNeededElement(userElement);

  // --- 1. Calculate 6-Axis Scores ---
  
  // A. 지기 (Ground Energy) - Based on location hash
  let earthScore = 50;
  if (coordinates) {
    const hash = getGeoHash(coordinates.lat, coordinates.lng);
    // Random but deterministic based on coords
    earthScore = 40 + (hash % 50); // 40 ~ 90
  } else {
    earthScore = 45; // Manual input penalty
  }

  // B. 방향 (Direction) - Direction vs User Element
  const dirMap: Record<string, FiveElement> = { 'N': FiveElement.Water, 'S': FiveElement.Fire, 'E': FiveElement.Wood, 'W': FiveElement.Metal };
  const houseEl = Object.entries(dirMap).find(([k]) => houseDirection.includes(k))?.[1] || FiveElement.Earth;
  let dirScore = 50;
  if (houseEl === neededElement) dirScore = 90; // Best match
  else if (houseEl === userElement) dirScore = 40; // Too much of same
  else dirScore = 70; // Neutral

  // C. 오행 (Balance) - Birth date analysis simulation
  const balanceScore = 60 + (month % 4) * 10; // Simple simulation

  // D. 수맥 (Water Vein) - Random simulation
  const waterVeinScore = coordinates ? (getGeoHash(coordinates.lng, coordinates.lat) % 40) + 60 : 50; // 60~100

  // E. 채광 (Light) - Direction based
  let lightScore = 50;
  if (houseDirection.includes('S')) lightScore = 95;
  else if (houseDirection.includes('E')) lightScore = 80;
  else if (houseDirection.includes('W')) lightScore = 70;
  else lightScore = 40;

  // F. 환기 (Flow) - Image based or random
  const flowScore = hasImage ? 85 : 50; // Image upload bonus

  const radarData: CompatibilityDetail[] = [
    { label: '지기(Ground)', score: earthScore, description: earthScore > 70 ? '땅의 기운이 단단하고 안정적입니다.' : '지반의 기운이 다소 불안정합니다.' },
    { label: '방향(Dir)', score: dirScore, description: dirScore > 80 ? '당신에게 부족한 기운을 채워주는 대길(大吉)의 방향입니다.' : '방향이 귀하의 기운과 충돌할 수 있습니다.' },
    { label: '오행(Balance)', score: balanceScore, description: '집과 거주자의 오행 조화도입니다.' },
    { label: '수맥(Safe)', score: waterVeinScore, description: waterVeinScore > 80 ? '수맥의 간섭이 거의 없는 깨끗한 터입니다.' : '미세한 수맥 파장이 감지됩니다.' },
    { label: '채광(Light)', score: lightScore, description: '양기(햇빛)의 유입량입니다.' },
    { label: '환기(Flow)', score: flowScore, description: '기의 순환이 원활한지 나타냅니다.' },
  ];

  // --- 2. Total Calculation ---
  const totalScore = Math.round(radarData.reduce((acc, curr) => acc + curr.score, 0) / 6);
  
  let tier = HouseTier.B;
  let mainCopy = "무난하지만 2% 부족합니다.";
  let subCopy = "당신의 운을 크게 해치지는 않지만, 대박을 터뜨리기엔 약합니다.";

  if (totalScore >= 85) {
    tier = HouseTier.S;
    mainCopy = `"${name}"님, 여기는 놓치면 안 될 명당입니다!`;
    subCopy = "천기(날씨)와 지기(땅)가 완벽하게 조화를 이루고 있습니다.";
  } else if (totalScore >= 70) {
    tier = HouseTier.A;
    mainCopy = "재물운이 트이는 좋은 집입니다.";
    subCopy = "약간의 비보(보완)만 한다면 훌륭한 보금자리가 될 것입니다.";
  } else if (totalScore <= 50) {
    tier = HouseTier.C;
    mainCopy = "잠깐! 계약 전에 다시 생각해보세요.";
    subCopy = "나와 상극인 기운이 감지됩니다. 이대로 입주하면 건강이나 재물을 잃을 수 있습니다.";
  }

  // --- 3. Items & Premium Report ---
  const items = getStrategicItems(radarData, neededElement);

  const premiumReport = {
    title: `${name}님을 위한 프리미엄 정밀 풍수 리포트`,
    price: "3,900원",
    content: [
      `🗝️ **핵심 진단**: 현재 이 집은 ${radarData.find(d=>d.score < 60)?.label || '오행 균형'} 부분이 가장 취약합니다. 이는 거주자의 피로도를 높이고 예민하게 만들 수 있습니다.`,
      `💡 **가구 배치 처방**: 부족한 '${neededElement}' 기운을 보강해야 합니다. 침대 헤드는 반드시 ${houseDirection === 'S' ? '북쪽(안정)' : '동쪽(성장)'}으로 배치하여 수면 중 기운을 충전하세요.`,
      `💰 **재물운 활성화**: 현관에 들어서자마자 대각선 안쪽 모서리가 집안의 '재물존'입니다. 이곳은 항상 비워두거나 '${items[0].name}'을(를) 두어 돈이 머물게 하세요.`,
      `🛡️ **비보 풍수(흉살 방지)**: ${tier === HouseTier.C ? '현재 터의 기운이 너무 셉니다. 반드시 소금 단지를 현관 신발장 안에 두어 나쁜 기운을 정화하세요.' : '전반적인 기운은 좋습니다. 현관 조명을 밝게 유지하면 들어오던 복이 나가지 않습니다.'}`
    ]
  };

  return {
    totalScore,
    tier,
    radarData,
    mainCopy,
    subCopy,
    premiumReport,
    items
  };
};