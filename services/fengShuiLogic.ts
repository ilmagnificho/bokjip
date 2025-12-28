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
  return FiveElement.Water; 
};

const getNeededElement = (userEl: FiveElement): FiveElement => {
  switch (userEl) {
    case FiveElement.Wood: return FiveElement.Metal;
    case FiveElement.Fire: return FiveElement.Water;
    case FiveElement.Earth: return FiveElement.Wood;
    case FiveElement.Metal: return FiveElement.Fire;
    case FiveElement.Water: return FiveElement.Earth;
    default: return FiveElement.Fire;
  }
};

const getStrategicItems = (
  radarData: CompatibilityDetail[], 
  neededEl: FiveElement
): RecommendationItem[] => {
  const items: RecommendationItem[] = [];
  const mkItem = (id: number, name: string, effect: string, desc: string, kw: string, tag: string) => ({ id, name, effect, description: desc, searchKeyword: kw, tag });

  const earthScore = radarData.find(d => d.label === '지기(땅)')?.score || 50;
  const flowScore = radarData.find(d => d.label === '통풍')?.score || 50;
  const lightScore = radarData.find(d => d.label === '채광')?.score || 50;

  if (earthScore < 60) {
    items.push(mkItem(1, "천연 숯 단지", "탁한 땅의 기운 정화", "나쁜 기운을 흡착하여 터를 깨끗하게 만듭니다.", "천연 가습 숯", "필수비보"));
    items.push(mkItem(2, "붉은 팥 항아리", "액운 차단", "예로부터 잡귀를 쫓는 가장 강력한 비책입니다.", "국산 붉은 팥", "강력추천"));
  }

  if (flowScore < 60) {
    items.push(mkItem(3, "맑은 소리 풍경", "기운 순환 유도", "정체된 공기를 소리의 파동으로 깨웁니다.", "현관 풍경 종", "순환개선"));
  }

  if (lightScore < 60) {
    items.push(mkItem(4, "장 스탠드 (웜톤)", "부족한 양기 보충", "인공 태양으로 집안의 음기를 몰아냅니다.", "인테리어 장스탠드", "양기충전"));
  }

  if (items.length < 3) {
    switch (neededEl) {
      case FiveElement.Water:
        items.push(mkItem(5, "실내 미니 분수", "재물운(수) 공급", "흐르는 물은 재물이 고이게 합니다.", "실내 분수대", "금전운"));
        break;
      case FiveElement.Fire:
        items.push(mkItem(6, "해바라기 액자", "화(불)의 기운 증폭", "강력한 양기로 성공운을 부릅니다.", "해바라기 그림", "성공운"));
        break;
      case FiveElement.Metal:
        items.push(mkItem(7, "황동 오브제", "결단력(금) 강화", "흩어지는 기운을 단단하게 잡습니다.", "황동 인테리어 소품", "관운상승"));
        break;
      case FiveElement.Wood:
        items.push(mkItem(8, "대형 관엽식물", "성장(목) 에너지", "생명력을 불어넣어 활기를 줍니다.", "거실 여인초", "생기부여"));
        break;
      default:
        items.push(mkItem(9, "크리스탈 썬캐쳐", "기운 확산", "좋은 기운을 집안 구석구석 퍼뜨립니다.", "썬캐쳐", "기운증폭"));
    }
  }

  return items.slice(0, 3);
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

  // --- 1. Calculate Scores based on Input ---
  
  // A. 지기 (Ground)
  let earthScore = 50;
  let terrainType = "평지형";
  if (coordinates) {
    const hash = getGeoHash(coordinates.lat, coordinates.lng);
    earthScore = 40 + (hash % 50); // 40 ~ 90
    // Simulate terrain analysis based on hash
    const terrains = ["배산임수형(명당)", "평지형(안정)", "골바람형(주의)", "습지형(보완필요)"];
    terrainType = terrains[hash % 4];
  } else {
    earthScore = 45;
  }

  // B. 방향 (Direction)
  const dirMap: Record<string, FiveElement> = { 'N': FiveElement.Water, 'S': FiveElement.Fire, 'E': FiveElement.Wood, 'W': FiveElement.Metal };
  const houseEl = Object.entries(dirMap).find(([k]) => houseDirection.includes(k))?.[1] || FiveElement.Earth;
  let dirScore = 50;
  if (houseEl === neededElement) dirScore = 90; 
  else if (houseEl === userElement) dirScore = 40; 
  else dirScore = 70; 

  // C. 오행 (Balance)
  const balanceScore = 60 + (month % 4) * 10;

  // D. 수맥 (Water Vein)
  const waterVeinScore = coordinates ? (getGeoHash(coordinates.lng, coordinates.lat) % 40) + 60 : 50; 

  // E. 채광 (Light)
  let lightScore = 50;
  if (houseDirection.includes('S')) lightScore = 95;
  else if (houseDirection.includes('E')) lightScore = 80;
  else if (houseDirection.includes('W')) lightScore = 70;
  else lightScore = 40;

  // F. 통풍 (Flow)
  const flowScore = hasImage ? 85 : 55;

  const radarData: CompatibilityDetail[] = [
    { label: '지기(땅)', score: earthScore, description: '땅의 생명력과 안정성', detailQuote: earthScore > 70 ? '단단한 암반 위에 위치하여 기운이 힘차게 솟구칩니다.' : '지반이 다소 무르고 습하여 기운을 북돋아야 합니다.' },
    { label: '방향', score: dirScore, description: '나의 사주와 현관의 궁합', detailQuote: dirScore > 80 ? '귀인과 재물을 불러오는 대길(大吉)의 방향입니다.' : '거주자의 본래 기운과 충돌하는 방향입니다.' },
    { label: '오행조화', score: balanceScore, description: '기운의 균형 상태', detailQuote: '부족한 오행을 채워주는 구조인지 분석합니다.' },
    { label: '수맥안전', score: waterVeinScore, description: '유해 파장의 유무', detailQuote: waterVeinScore > 80 ? '수맥 파장이 감지되지 않는 청정한 터입니다.' : '미세한 지하 수맥이 흐를 가능성이 있습니다.' },
    { label: '채광', score: lightScore, description: '양기(햇빛)의 유입량', detailQuote: lightScore > 80 ? '양기가 집안 깊숙이 들어와 음기를 몰아냅니다.' : '일조량이 부족하여 인위적인 조명이 필수적입니다.' },
    { label: '통풍', score: flowScore, description: '기의 순환', detailQuote: '바람길이 막히지 않고 기가 잘 도는 구조입니다.' },
  ];

  const totalScore = Math.round(radarData.reduce((acc, curr) => acc + curr.score, 0) / 6);
  
  let tier = HouseTier.B;
  let mainCopy = "무난하지만 2% 부족합니다.";
  let subCopy = "당신의 운을 크게 해치지는 않지만, 대박을 터뜨리기엔 약합니다.";

  if (totalScore >= 85) {
    tier = HouseTier.S;
    mainCopy = `"${name}"님, 놓치면 후회할 명당입니다!`;
    subCopy = "천기(날씨)와 지기(땅)가 완벽하게 조화를 이루어 재물이 쌓이는 구조입니다.";
  } else if (totalScore >= 70) {
    tier = HouseTier.A;
    mainCopy = "재물운이 트이는 좋은 집입니다.";
    subCopy = "약간의 비보(보완)만 한다면 훌륭한 보금자리가 될 것입니다.";
  } else if (totalScore <= 50) {
    tier = HouseTier.C;
    mainCopy = "계약 전 신중한 판단이 필요합니다.";
    subCopy = "나와 상극인 기운이 감지됩니다. 거주 시 피로감이 누적될 수 있습니다.";
  }

  const items = getStrategicItems(radarData, neededElement);

  const premiumReport = {
    title: `${name}님을 위한 프리미엄 정밀 풍수 리포트`,
    price: "3,900원",
    sections: [
        {
            title: "지리적 형국 분석",
            icon: "Map",
            content: [
                `📍 **위치 분석**: 위도 ${coordinates?.lat.toFixed(4) || '??'}, 경도 ${coordinates?.lng.toFixed(4) || '??'} 지점의 지자기 데이터 분석 결과, 현재 터는 **'${terrainType}'**에 해당합니다.`,
                `⛰️ **지형 특성**: ${earthScore > 60 ? '주변 지세가 안정적이고 기운이 모이는 형상입니다.' : '지대가 낮거나 습하여 음기가 고일 수 있는 지형입니다.'}`,
                `🔍 **결론**: 땅의 힘(Earth Energy)이 ${earthScore}점으로 측정되었습니다. ${earthScore < 50 ? '따라서 반드시 숯이나 소금을 두어 지기를 정화해야 합니다.' : '기운이 맑아 거주자의 건강운을 올려줍니다.'}`
            ]
        },
        {
            title: "실내 배치 & 개운 처방",
            icon: "Layout",
            content: [
                `🛏️ **침대 방향**: 사용자님은 '${userElement}' 기운을 타고났습니다. 부족한 '${neededElement}' 기운을 얻기 위해 침대 머리는 **${houseDirection === 'S' ? '북쪽(안정)' : '동쪽(성장)'}**으로 두세요.`,
                `💰 **숨겨진 재물존**: 현관에 들어서서 집 안을 바라볼 때, 대각선 가장 안쪽 모서리가 '재물존'입니다. 이곳에 물건을 쌓아두지 말고 **조명**이나 **${items[0].name}**을 두어 기운을 활성화하세요.`,
                `🚪 **현관 관리**: ${tier === HouseTier.C ? '현재 현관으로 들어오는 기운이 거칩니다. 중문이나 커튼으로 한번 걸러주는 것이 좋습니다.' : '현관이 밝아야 복이 들어옵니다. 신발장 거울은 현관문을 마주보지 않게 하세요.'}`
            ]
        },
        {
            title: "나만의 행운 코드",
            icon: "Star",
            content: [
                `🎨 **행운의 컬러**: ${neededElement === FiveElement.Water ? '블랙, 네이비' : neededElement === FiveElement.Fire ? '레드, 퍼플' : '화이트, 골드'} 계열의 소품을 활용하세요.`,
                `🔢 **행운의 숫자**: ${Math.floor(Math.random() * 9) + 1}, ${Math.floor(Math.random() * 9) + 1}`,
                `🍀 **총평**: 이 집은 ${totalScore}점짜리 인연입니다. ${totalScore > 70 ? '귀하의 운을 2배로 증폭시켜줄 좋은 터입니다.' : '부족한 점은 비보 풍수로 충분히 보완 가능하니 걱정 마세요.'}`
            ]
        }
    ]
  };

  const locationAnalysis = coordinates 
    ? `분석 위치: 위도 ${coordinates.lat.toFixed(4)}, 경도 ${coordinates.lng.toFixed(4)}`
    : `주소지 기반 지형 및 방향 분석 완료`;

  return {
    totalScore,
    tier,
    radarData,
    mainCopy,
    subCopy,
    locationAnalysis,
    premiumReport,
    items
  };
};