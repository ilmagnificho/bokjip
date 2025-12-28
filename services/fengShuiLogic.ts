import { FiveElement, AnalysisResult, RecommendationItem, Coordinates, HouseTier, CompatibilityDetail, MoveStatus } from '../types';

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

// --- 10 Feng Shui Items Pool ---
const ITEM_POOL: RecommendationItem[] = [
  { id: 1, name: "천연 대나무 숯", effect: "지기(땅) 정화", description: "습기와 탁한 기운을 흡착하여 터를 명당으로 바꿉니다.", searchKeyword: "천연 제습 숯", tag: "필수비보" },
  { id: 2, name: "국산 붉은 팥", effect: "액운 차단", description: "현관이나 베란다 구석에 두어 잡귀의 침입을 막습니다.", searchKeyword: "국산 붉은 팥", tag: "전통비책" },
  { id: 3, name: "황동 풍경 종", effect: "기운 순환", description: "맑은 소리가 정체된 공기를 깨우고 생기를 불어넣습니다.", searchKeyword: "현관 황동 풍경", tag: "순환개선" },
  { id: 4, name: "장 스탠드 (웜톤)", effect: "양기(Sun) 보충", description: "부족한 햇빛을 대신하여 집안의 음기를 태워 없앱니다.", searchKeyword: "인테리어 장스탠드", tag: "양기충전" },
  { id: 5, name: "크리스탈 썬캐쳐", effect: "기운 확산", description: "빛을 산란시켜 집안 구석구석 좋은 기운을 퍼뜨립니다.", searchKeyword: "크리스탈 썬캐쳐", tag: "생기증폭" },
  { id: 6, name: "황금 거북이/두꺼비", effect: "재물운(Metal) 강화", description: "재물이 들어오는 길목에 두어 금전운을 꽉 잡습니다.", searchKeyword: "풍수 황금 두꺼비", tag: "재물운" },
  { id: 7, name: "해바라기 액자", effect: "화(Fire) 기운", description: "강렬한 태양의 기운이 성공과 명예를 가져다줍니다.", searchKeyword: "해바라기 그림 액자", tag: "성공운" },
  { id: 8, name: "실내 미니 분수", effect: "수(Water) 기운", description: "흐르는 물은 곧 재물의 회전을 의미합니다.", searchKeyword: "탁상용 분수대", tag: "금전유통" },
  { id: 9, name: "몬스테라/여인초", effect: "목(Wood) 기운", description: "살아있는 식물의 생명력이 집안에 활력을 줍니다.", searchKeyword: "대형 공기정화 식물", tag: "생기부여" },
  { id: 10, name: "히말라야 소금단지", effect: "나쁜 기운 중화", description: "소금의 정화 능력이 흉한 기운을 흡수합니다.", searchKeyword: "풍수 소금 항아리", tag: "액막이" },
];

const getStrategicItems = (
  radarData: CompatibilityDetail[], 
  neededEl: FiveElement
): RecommendationItem[] => {
  const selectedItems: RecommendationItem[] = [];
  const selectedIds = new Set<number>();

  const add = (id: number) => {
    if (!selectedIds.has(id)) {
      selectedIds.add(id);
      selectedItems.push(ITEM_POOL.find(i => i.id === id)!);
    }
  };

  const earthScore = radarData.find(d => d.label === '지기(땅)')?.score || 50;
  const flowScore = radarData.find(d => d.label === '통풍')?.score || 50;
  const lightScore = radarData.find(d => d.label === '채광')?.score || 50;

  // 1. Weakness Based Recommendations (Priority)
  if (earthScore < 60) add(1); // Charcoal
  if (flowScore < 60) add(3); // Wind Chime
  if (lightScore < 60) {
      if (Math.random() > 0.5) add(4); // Lamp
      else add(5); // Suncatcher
  }

  // 2. Element Based Recommendations
  if (selectedItems.length < 3) {
    switch (neededEl) {
      case FiveElement.Water: add(8); break; // Fountain
      case FiveElement.Fire: 
        if (Math.random() > 0.5) add(7); // Sunflower
        else add(4); // Lamp
        break;
      case FiveElement.Metal: 
        if (Math.random() > 0.5) add(6); // Gold Toad
        else add(3); // Wind Chime
        break;
      case FiveElement.Wood: add(9); break; // Plant
      case FiveElement.Earth: 
        if (Math.random() > 0.5) add(10); // Salt
        else add(1); // Charcoal
        break;
    }
  }

  // 3. Fillers (General Good Luck)
  if (selectedItems.length < 3) add(2); // Red Beans (General Protection)
  if (selectedItems.length < 3) add(10); // Salt (General Protection)
  if (selectedItems.length < 3) add(5); // Suncatcher (General Good)

  return selectedItems.slice(0, 3);
};

export const analyzeFortune = async (
  name: string, 
  birthDateStr: string, 
  houseDirection: string, 
  coordinates: Coordinates | null,
  hasImage: boolean,
  moveStatus: MoveStatus
): Promise<AnalysisResult> => {
  const birthDate = new Date(birthDateStr);
  const month = birthDate.getMonth() + 1;
  const userElement = getUserElement(month);
  const neededElement = getNeededElement(userElement);

  // Use name+birthdate as a seed for randomness to keep it consistent for the same user but different across users
  let seed = name.length + month;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // --- 1. Calculate Scores based on Input ---
  
  // A. 지기 (Ground)
  let earthScore = 50;
  let terrainType = "평지형";
  if (coordinates) {
    const hash = getGeoHash(coordinates.lat, coordinates.lng);
    earthScore = 40 + (hash % 50); // 40 ~ 90
    const terrains = ["배산임수형(명당)", "평지형(안정)", "골바람형(주의)", "습지형(보완필요)", "매립지형(지기약함)"];
    terrainType = terrains[hash % terrains.length];
  } else {
    earthScore = 45;
    terrainType = "정보없음(기본)";
  }

  // B. 방향 (Direction) - Handle UNKNOWN
  let dirScore = 50;
  const dirMap: Record<string, FiveElement> = { 'N': FiveElement.Water, 'S': FiveElement.Fire, 'E': FiveElement.Wood, 'W': FiveElement.Metal };
  
  if (houseDirection === 'UNKNOWN') {
      dirScore = 50; // Neutral score for unknown
  } else {
      const houseEl = Object.entries(dirMap).find(([k]) => houseDirection.includes(k))?.[1] || FiveElement.Earth;
      if (houseEl === neededElement) dirScore = 90; 
      else if (houseEl === userElement) dirScore = 40; // Same element clash (e.g., Fire vs Fire can be too strong)
      else dirScore = 70; 
  }

  // C. 오행 (Balance)
  const balanceScore = 60 + (month % 4) * 10;

  // D. 수맥 (Water Vein)
  const waterVeinScore = coordinates ? (getGeoHash(coordinates.lng, coordinates.lat) % 40) + 60 : 50; 

  // E. 채광 (Light)
  let lightScore = 50;
  if (houseDirection === 'UNKNOWN') lightScore = 50;
  else if (houseDirection.includes('S')) lightScore = 95;
  else if (houseDirection.includes('E')) lightScore = 80;
  else if (houseDirection.includes('W')) lightScore = 70;
  else lightScore = 40;

  // F. 통풍 (Flow)
  const flowScore = hasImage ? 85 : 55;

  const radarData: CompatibilityDetail[] = [
    { label: '지기(땅)', score: earthScore, description: '땅의 생명력과 안정성', detailQuote: earthScore > 70 ? '단단한 암반 위에 위치하여 기운이 힘차게 솟구칩니다.' : '지반이 다소 무르고 습하여 기운을 북돋아야 합니다.' },
    { label: '방향', score: dirScore, description: houseDirection === 'UNKNOWN' ? '방향 정보 없음' : `${name}님의 사주(${userElement})와 현관의 궁합`, detailQuote: dirScore > 80 ? '귀인과 재물을 불러오는 대길(大吉)의 방향입니다.' : '본래 기운과 충돌하는 방향이므로 비보가 필요합니다.' },
    { label: '오행조화', score: balanceScore, description: '거주자와 집의 에너지 균형', detailQuote: '부족한 오행을 채워주는 구조인지 분석합니다.' },
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
    mainCopy = `"${name}"님, 여기는 놓치면 안 될 명당입니다!`;
    subCopy = moveStatus === 'moving' 
        ? "이사 예정이라면 계약을 서두르세요. 천기(날씨)와 지기(땅)가 완벽하게 조화를 이루고 있습니다."
        : "현재 아주 좋은 터에 살고 계십니다. 이 집에서의 기운을 유지하는 것이 중요합니다.";
  } else if (totalScore >= 70) {
    tier = HouseTier.A;
    mainCopy = "재물운이 트이는 좋은 집입니다.";
    subCopy = moveStatus === 'moving'
        ? "약간의 비보(보완)만 한다면 훌륭한 보금자리가 될 것입니다. 거주하기에 부족함이 없습니다."
        : "거주 만족도가 높으실 겁니다. 약간의 인테리어 변화로 기운을 더 높일 수 있습니다.";
  } else if (totalScore <= 50) {
    tier = HouseTier.C;
    mainCopy = moveStatus === 'moving' ? "계약 전에 신중히 생각해보세요." : "현재 집의 기운 점검이 필요합니다.";
    subCopy = `${name}님과 상극인 기운이 감지됩니다. ${moveStatus === 'moving' ? '다른 곳을 더 둘러보시거나, 입주 시 비보 처방이 필수입니다.' : '최근 일이 잘 안 풀린다면 집터의 영향일 수 있습니다.'}`;
  }

  const items = getStrategicItems(radarData, neededElement);

  // Helper variables for template strings
  const latStr = coordinates ? coordinates.lat.toFixed(4) : "미상";
  const lngStr = coordinates ? coordinates.lng.toFixed(4) : "미상";
  const terrainDesc = coordinates ? `이 터는 풍수학적으로 **'${terrainType}'**에 해당합니다.` : "주소지 미입력으로 정밀 지형 분석이 제한적입니다.";

  // Dynamic Text Logic based on MoveStatus and UserElement
  const section1Content = [
    `📍 **GPS 정밀 진단**: 입력하신 좌표(위도 ${latStr}, 경도 ${lngStr}) 일대의 등고선과 수맥 파장을 분석한 결과, ${terrainDesc}`,
    `⛰️ **지기(Earth Energy) 심층 분석**: 현재 땅의 점수는 **${earthScore}점**입니다. ${earthScore > 60 ? (pseudoRandom() > 0.5 ? '지반이 매우 안정적이며, 긍정적인 에너지가 뿌리 깊게 박혀 있는 터입니다.' : '이곳은 기가 모이는 형국으로, 거주자의 건강운을 크게 북돋아줍니다.') : '지반이 다소 약하고 습기가 많아, 거주자가 쉽게 피로감을 느낄 수 있는 터입니다. 바닥에 러그를 깔아 지기를 보완하세요.'}`,
    moveStatus === 'moving' 
        ? `🌪 **이사 조언**: ${flowScore > 70 ? '통풍이 원활하여 새 출발을 하기에 아주 좋은 기운을 가지고 있습니다.' : '골바람이 칠 수 있는 구조이니, 입주 청소 시 환기에 각별히 신경 써야 나쁜 기운이 빠져나갑니다.'}`
        : `🌪 **거주 조언**: ${flowScore > 70 ? '현재 집은 기가 잘 순환되고 있어 큰 걱정이 없습니다.' : '집안 공기가 정체되면 운도 정체됩니다. 하루 2번 이상 맞통풍을 시켜주세요.'}`
  ];

  const section2Content = [
    `🏠 **${moveStatus === 'moving' ? '이사 결정' : '거주 지속'} 가이드**: 현재 점수(${totalScore}점)를 고려할 때, ${totalScore > 70 ? '이곳은 귀하에게 재물과 안정을 가져다줄 **길지(吉地)**입니다.' : '터의 기운이 약해 거주자의 에너지를 소모시킬 수 있으니 비보(풍수적 보완)가 시급합니다.'}`,
    `🛏️ **${name}님 맞춤 침대 방향**: ${name}님은 **'${userElement}'** 기운을 타고났습니다. 이를 돕기 위해 침대 헤드는 **${houseDirection === 'S' || houseDirection === 'UNKNOWN' ? '북쪽(North)' : '동쪽(East)'}** 벽면으로 배치하세요. ${pseudoRandom() > 0.5 ? '이 방향은 귀하의 수면 중 회복력을 극대화합니다.' : '머리를 이쪽으로 두면 복잡한 생각이 정리되고 숙면을 취할 수 있습니다.'}`,
    houseDirection === 'UNKNOWN' 
        ? `🧭 **방향 확인 요망**: 현관 방향을 정확히 알면 더 정밀한 분석이 가능합니다. 스마트폰 나침반 앱으로 현관 밖을 바라보고 측정해보세요.` 
        : `🛋️ **가구 배치 핵심**: 현관이 ${houseDirection}향이므로, 소파는 현관을 대각선으로 바라보는 위치가 가장 좋습니다.`,
    `💰 **절대 재물존(Money Zone)**: ${moveStatus === 'moving' ? '이사 들어갈 때,' : '지금 당장,'} 현관 대각선 가장 안쪽 모서리를 확인하세요. 이곳에 **${items[0]?.name || '금고'}**를 두면 재산이 불어납니다.`
  ];

  const section3Content = [
    `🎨 **퍼스널 럭키 컬러**: ${name}님의 부족한 기운(${neededElement})을 채워줄 색상은 **${neededElement === FiveElement.Water ? '딥 블루, 블랙' : neededElement === FiveElement.Fire ? '레드, 퍼플' : '화이트, 골드'}**입니다. ${moveStatus === 'moving' ? '새 집의 커튼이나 이불 커버로 이 색상을 적극 활용하세요.' : '현재 집의 인테리어 소품을 이 색상으로 교체해보세요. 분위기와 운세가 달라집니다.'}`,
    `🛡️ **비보(裨補) 솔루션**: ${tier === HouseTier.C ? '현재 터의 기운이 다소 흉합니다. 현관 신발장 안에 굵은 소금을 종이컵에 담아두어 나쁜 기운을 흡수하게 하세요.' : '전반적인 기운은 훌륭하나, 화장실 문과 변기 뚜껑은 항상 닫아두어야 재물운이 새어나가지 않습니다.'}`,
    `🔢 **행운의 숫자**: ${name}님의 귀인 숫자는 **${Math.floor(pseudoRandom() * 9) + 1}, ${Math.floor(Math.random() * 9) + 1}**입니다. ${moveStatus === 'moving' ? '이사 날짜나 계약일,' : '통장 비밀번호나 도어락에'} 이 숫자를 활용하면 길운이 깃듭니다.`
  ];

  // Generate Richer Content
  const premiumReport = {
    title: `${name}님을 위한 프리미엄 정밀 풍수 리포트`,
    price: "1,500원", 
    originalPrice: "3,900원",
    sections: [
        {
            title: "1. 지리적 형국 정밀 분석",
            icon: "Map",
            content: section1Content
        },
        {
            title: moveStatus === 'moving' ? "2. 이사 및 가구 배치 가이드" : "2. 현재 거주지 개운 가이드",
            icon: "Layout",
            content: section2Content
        },
        {
            title: "3. 나만을 위한 처방 (비보풍수)",
            icon: "Star",
            content: section3Content
        }
    ]
  };

  const locationAnalysis = coordinates 
    ? `📍 위도: ${coordinates.lat.toFixed(4)}, 경도: ${coordinates.lng.toFixed(4)}`
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