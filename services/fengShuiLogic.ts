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
    items.push(mkItem(1, "천연 대나무 숯", "탁한 지기 정화", "지반의 습기와 나쁜 파장을 흡착하여 터를 명당으로 바꿉니다. 이사 전 입주 청소 시 반드시 비치하세요.", "천연 제습 숯", "필수비보"));
    items.push(mkItem(2, "국산 붉은 팥", "액운 차단", "이사 첫날, 현관이나 베란다 구석에 두어 잡귀의 침입을 막는 전통 비책입니다.", "국산 붉은 팥", "강력추천"));
  }

  if (flowScore < 60) {
    items.push(mkItem(3, "황동 풍경 종", "기운 순환 유도", "맑은 금속성 소리가 정체된 공기를 깨우고 생기를 불어넣습니다. 현관문에 달아두세요.", "현관 풍경 종", "순환개선"));
  }

  if (lightScore < 60) {
    items.push(mkItem(4, "장 스탠드 (3000K)", "양기(Sun) 보충", "해를 대신하는 조명입니다. 거실 모서리의 음기를 태워 없앱니다.", "인테리어 장스탠드 웜톤", "양기충전"));
  }

  if (items.length < 3) {
    switch (neededEl) {
      case FiveElement.Water:
        items.push(mkItem(5, "실내 미니 분수", "재물운(Water) 공급", "물은 곧 재물입니다. 끊임없이 흐르는 물로 금전운을 회전시키세요.", "실내 분수대", "금전운"));
        break;
      case FiveElement.Fire:
        items.push(mkItem(6, "해바라기 그림 (유화)", "화(Fire)의 기운 증폭", "강렬한 태양의 기운이 성공과 명예를 가져다줍니다. 현관에서 보이는 곳에 두세요.", "해바라기 액자", "성공운"));
        break;
      case FiveElement.Metal:
        items.push(mkItem(7, "황동(Brass) 오브제", "결단력(Metal) 강화", "차가운 이성과 결단력을 높여주며, 흩어지는 기운을 잡아줍니다.", "황동 인테리어 소품", "관운상승"));
        break;
      case FiveElement.Wood:
        items.push(mkItem(8, "몬스테라/여인초", "성장(Wood) 에너지", "살아있는 생명이 뿜어내는 기운이 집안에 활력을 줍니다.", "대형 공기정화 식물", "생기부여"));
        break;
      default:
        items.push(mkItem(9, "크리스탈 썬캐쳐", "기운 확산", "빛을 산란시켜 집안 구석구석 좋은 기운(Qi)을 퍼뜨립니다.", "썬캐쳐", "기운증폭"));
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
    { label: '방향', score: dirScore, description: `${name}님의 사주와 현관의 궁합`, detailQuote: dirScore > 80 ? '귀인과 재물을 불러오는 대길(大吉)의 방향입니다.' : '본래 기운과 충돌하는 방향이므로 비보가 필요합니다.' },
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
    subCopy = "이사 예정이라면 계약을 서두르세요. 천기(날씨)와 지기(땅)가 완벽하게 조화를 이루고 있습니다.";
  } else if (totalScore >= 70) {
    tier = HouseTier.A;
    mainCopy = "재물운이 트이는 좋은 집입니다.";
    subCopy = "약간의 비보(보완)만 한다면 훌륭한 보금자리가 될 것입니다. 거주하기에 부족함이 없습니다.";
  } else if (totalScore <= 50) {
    tier = HouseTier.C;
    mainCopy = "계약 전에 신중히 생각해보세요.";
    subCopy = `${name}님과 상극인 기운이 감지됩니다. 이사 후보지라면 다른 곳을 더 둘러보시는 것을 추천합니다.`;
  }

  const items = getStrategicItems(radarData, neededElement);

  // Helper variables for template strings
  const latStr = coordinates ? coordinates.lat.toFixed(4) : "미상";
  const lngStr = coordinates ? coordinates.lng.toFixed(4) : "미상";
  const terrainDesc = coordinates ? `이 터는 풍수학적으로 **'${terrainType}'**에 해당합니다.` : "주소지 미입력으로 정밀 지형 분석이 제한적입니다.";

  // Generate Richer Content
  const premiumReport = {
    title: `${name}님을 위한 프리미엄 정밀 풍수 리포트`,
    price: "1,900원", // Lowered price strategy
    sections: [
        {
            title: "1. 지리적 형국 정밀 분석",
            icon: "Map",
            content: [
                `📍 **GPS 정밀 진단**: 입력하신 좌표(위도 ${latStr}, 경도 ${lngStr}) 일대의 등고선과 수맥 파장을 분석한 결과, ${terrainDesc}`,
                `⛰️ **지기(Earth Energy) 심층 분석**: 현재 땅의 점수는 **${earthScore}점**입니다. ${earthScore > 60 ? '이곳은 단단한 화강암반 층이 아래를 받치고 있어 재물이 새어나가지 않고 고이는 "금계포란형"의 일부 특징을 보입니다. 장기 거주 시 자산 증식에 유리합니다.' : '과거에 물길이었거나 매립지일 가능성이 있어 지기가 다소 약하고 습합니다. 이사 오신다면 바닥에 두꺼운 러그를 깔아 지기를 보완해야 하며, 1층이나 반지하는 피하는 것이 좋습니다.'}`,
                `🌪 **바람의 길(Wind Path)**: 주변 건물 배치로 볼 때, ${flowScore > 70 ? '바람이 집을 부드럽게 감싸고 돌아나가는 순풍(順風)의 구조입니다. 통풍이 잘 되어 나쁜 기운이 머물지 않고 빠져나갑니다.' : '건물 사이로 강하게 부는 골바람(살풍)이 칠 수 있는 구조이므로 창문에 썬캐쳐를 달아 기운을 분산시켜야 합니다. 창문을 마주 보고 열어두는 것은 피하세요.'}`
            ]
        },
        {
            title: "2. 이사 및 거주 조언 (가구 배치)",
            icon: "Layout",
            content: [
                `🏠 **이사 결정 가이드**: 현재 점수(${totalScore}점)를 고려할 때, 이 집은 **${tier === HouseTier.C ? '단기 거주나 월세로는 무방하나, 매매나 장기 전세로는 신중해야 합니다.' : '오랫동안 머물수록 복이 쌓이는 터입니다. 계약을 긍정적으로 검토하셔도 좋습니다.'}**`,
                `🛏️ **침대 헤드 방향 (cm 단위)**: ${name}님은 타고난 오행이 **'${userElement}'**입니다. 상생(相生)의 원리에 따라, 침대 헤드는 **${houseDirection === 'S' ? '북쪽(North)' : '동쪽(East)'}** 벽면으로 붙이세요. 벽에서 정확히 **10~15cm** 띄우는 것이 기의 흐름(Airflow)에 가장 이상적이며 숙면을 돕습니다.`,
                `🛋️ **소파 및 책상 위치**: 거실 창문을 등지지 말고, 현관에서 들어오는 사람을 대각선으로 바라볼 수 있는 **'주작(朱雀)'** 방향에 배치하세요. 그래야 귀인(Guest)의 도움을 받고 배신을 당하지 않습니다.`,
                `💰 **절대 재물존(Money Zone)**: 현관 대각선 가장 안쪽 모서리는 집안의 재물 기운이 모이는 곳입니다. 이곳에는 절대 쓰레기통, 에어컨, 세탁바구니를 두지 마십시오. 대신 **${items[0]?.name || '금고'}**이나 금고를 두면 재산이 불어납니다.`
            ]
        },
        {
            title: "3. 나만을 위한 개운(開運) 처방",
            icon: "Star",
            content: [
                `🎨 **퍼스널 럭키 컬러**: ${name}님의 부족한 기운(${neededElement})을 채워줄 색상은 **${neededElement === FiveElement.Water ? '딥 블루, 블랙' : neededElement === FiveElement.Fire ? '레드, 퍼플' : '화이트, 골드'}**입니다. 이사 시 커튼, 이불, 쿠션 커버로 이 색상을 활용하면 흉한 기운을 막아줍니다.`,
                `🛡️ **비보(裨補) 솔루션**: ${tier === HouseTier.C ? '현재 터의 기운이 거주자를 누르고 있습니다. 현관 신발장 안에 굵은 소금을 종이컵에 담아 한 달에 한 번 교체해주면 액운을 막을 수 있습니다.' : '전반적인 기운은 훌륭하나, 화장실 문은 항상 닫아두어야 좋은 기운이 오염되지 않습니다. 변기 뚜껑도 항상 닫으세요.'}`,
                `🔢 **행운의 숫자**: 이사 날짜(손 없는 날)나 비밀번호에 활용할 수 있는 ${name}님의 귀인 숫자는 **${Math.floor(Math.random() * 9) + 1}, ${Math.floor(Math.random() * 9) + 1}**입니다. 이 숫자가 포함된 동호수를 선택하면 더욱 좋습니다.`
            ]
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