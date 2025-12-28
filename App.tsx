import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, MapPin, Sparkles, RefreshCw, Share2, 
  ShoppingBag, Camera, CheckCircle2, 
  AlertTriangle, Lock, Search, Map as MapIcon, X,
  ChevronRight, ArrowRight, Ghost, Star, ChevronLeft, Unlock, ShieldCheck, TrendingUp, CreditCard, Bug, Info, MousePointerClick, Edit2, ExternalLink, HelpCircle
} from 'lucide-react';
import { UserData, AnalysisResult, Coordinates, HouseTier, CompatibilityDetail, MoveStatus } from './types';
import { analyzeFortune } from './services/fengShuiLogic';

declare global {
  interface Window {
    naver: any;
    initMap?: () => void;
    navermap_authFailure?: () => void;
  }
}

// --- Constants ---
const DIRECTIONS = [
  { value: 'S', label: '남향' },
  { value: 'E', label: '동향' },
  { value: 'W', label: '서향' },
  { value: 'N', label: '북향' },
  { value: 'SE', label: '남동향' },
  { value: 'SW', label: '남서향' },
  { value: 'NW', label: '북서향' },
  { value: 'NE', label: '북동향' },
  { value: 'UNKNOWN', label: '모름' }, // Added Unknown option
];

const TESTIMONIALS = [
    { text: "이사 가려던 집이 흉가인 걸 알고 피했어요.", user: "김OO님 (32세/이사준비)", icon: "🔥" },
    { text: "추천해주신 가구 배치로 바꾸고 승진했어요.", user: "이OO님 (28세/거주중)", icon: "🍀" },
    { text: "계약 직전에 확인했는데 안하길 잘했네요.", user: "박OO님 (45세/매매)", icon: "🏠" },
    { text: "원룸 침대 방향만 바꿨는데 잠이 잘 와요.", user: "최OO님 (24세/자취)", icon: "✨" },
];

type AppState = 'LANDING' | 'DISCLAIMER_CHECK' | 'SURVEY_IDENTITY' | 'SURVEY_LOCATION' | 'SURVEY_DETAILS' | 'LOADING' | 'RESULT';

// --- Helper Functions ---
const getClientId = () => {
    let key = null;
    try {
        // @ts-ignore
        if (import.meta?.env?.VITE_NAVER_CLIENT_ID) key = import.meta.env.VITE_NAVER_CLIENT_ID;
    } catch (e) {}
    if (!key && typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NAVER_CLIENT_ID) {
        key = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    }
    return key;
};

// --- Components ---

// 1. Loading Screen Component
const LoadingScreen = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "위성 GPS 좌표 수신 중...",
        "해당 지역 수맥 및 지기(Earth Energy) 분석 중...",
        "사용자 사주 오행 대조 중...",
        "최종 맞춤형 리포트 생성 중..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700 px-6 text-center">
            <div className="relative w-32 h-32 mb-8">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-4 border-[#E2C275]/20 rounded-full" />
                {/* Spinning Ring */}
                <div className="absolute inset-0 border-t-4 border-[#E2C275] rounded-full animate-spin" />
                {/* Inner Pulse */}
                <div className="absolute inset-4 bg-[#E2C275]/10 rounded-full animate-pulse-slow" />
                <Compass className="absolute inset-0 m-auto w-12 h-12 text-[#E2C275] animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{steps[step]}</h2>
            <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-4">
                <div 
                    className="h-full bg-[#E2C275] transition-all duration-500 ease-out" 
                    style={{ width: `${((step + 1) / steps.length) * 100}%` }} 
                />
            </div>
            <p className="text-gray-500 text-xs mt-3">30년 경력 풍수 알고리즘 가동 중</p>
        </div>
    );
};

// 2. Liquid Glass Hexagon Radar
const HexagonRadar = ({ data }: { data: CompatibilityDetail[] }) => {
    const [selectedMetric, setSelectedMetric] = useState<CompatibilityDetail | null>(null);
    const size = 200; // Slightly smaller for mobile
    const center = size / 2;
    const radius = 60; // Reduced radius to make room for external labels
    const sides = 6;
    
    const getPoints = (r: number) => {
        return new Array(sides).fill(0).map((_, i) => {
            const angle = (Math.PI / 180) * (i * (360 / sides) - 90);
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
    };

    const dataPoints = data.map((d, i) => {
        const angle = (Math.PI / 180) * (i * (360 / sides) - 90);
        const r = radius * (d.score / 100);
        return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), data: d };
    });

    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="relative w-[200px] h-[200px] mx-auto my-0 group">
            <svg width={size} height={size} className="overflow-visible filter drop-shadow-[0_0_15px_rgba(226,194,117,0.3)]">
                <defs>
                    <linearGradient id="liquidGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(226,194,117,0.7)" />
                        <stop offset="100%" stopColor="rgba(184,147,77,0.3)" />
                    </linearGradient>
                </defs>
                
                {/* Background Grid */}
                <polygon points={getPoints(radius)} fill="rgba(255,255,255,0.03)" stroke="rgba(226,194,117,0.1)" strokeWidth="1" />
                <polygon points={getPoints(radius * 0.66)} fill="none" stroke="rgba(226,194,117,0.05)" strokeWidth="1" />
                
                {/* Data Shape */}
                <polygon 
                    points={polygonPoints} 
                    fill="url(#liquidGold)" 
                    stroke="#E2C275" 
                    strokeWidth="2" 
                    className="transition-all duration-1000 ease-out"
                />
                
                {/* Points */}
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2" fill="white" />
                ))}
            </svg>
            
            {/* Labels - Positioned Outside */}
            {data.map((d, i) => {
                const angle = (Math.PI / 180) * (i * (360 / sides) - 90);
                // Push labels far out so they don't overlap with score points
                const labelR = radius + 35; 
                const x = center + labelR * Math.cos(angle);
                const y = center + labelR * Math.sin(angle);
                
                return (
                    <div 
                        key={i} 
                        onClick={() => setSelectedMetric(d)}
                        className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10" 
                        style={{ left: x, top: y }}
                    >
                        <span className="text-[11px] text-gray-300 font-bold whitespace-nowrap shadow-black drop-shadow-md">{d.label}</span>
                        <span className="text-[#E2C275] text-[10px] font-bold bg-[#050B18]/80 px-1 rounded-sm border border-[#E2C275]/30">{d.score}</span>
                    </div>
                );
            })}

            {/* Glass Bubble Tooltip */}
            {selectedMetric && (
                <div className="absolute inset-0 z-20 flex items-center justify-center animate-in fade-in zoom-in duration-200" onClick={() => setSelectedMetric(null)}>
                    <div className="bg-[#050B18]/90 backdrop-blur-xl border border-[#E2C275]/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] text-center max-w-[90%] relative">
                        <h4 className="text-[#E2C275] font-bold text-lg mb-1">{selectedMetric.label} {selectedMetric.score}점</h4>
                        <p className="text-white text-xs mb-2">{selectedMetric.description}</p>
                        <p className="text-gray-300 text-xs italic leading-relaxed">"{selectedMetric.detailQuote}"</p>
                        <p className="text-[10px] text-gray-500 mt-2">(탭하여 닫기)</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. Testimonial
const TestimonialCarousel = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 4000); 
        return () => clearInterval(interval);
    }, []);
    const current = TESTIMONIALS[index];
    return (
        <div className="bg-[#0A1224]/80 p-5 rounded-2xl border border-white/5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 key={index}">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                {current.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs italic mb-1 truncate">"{current.text}"</p>
                <p className="text-white font-bold text-xs text-[#E2C275]">{current.user}</p>
            </div>
        </div>
    );
};

// 4. Location Picker
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (addr: string, coords: Coordinates | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapInstance = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const clientId = getClientId();
    if (!clientId && !window.naver) { setLoadError(true); return; }

    window.navermap_authFailure = function () {
        setLoadError(true);
    };

    const initMap = () => {
        if (!mapRef.current || mapInitialized) return;
        try {
            if (!window.naver || !window.naver.maps) return; 

            const center = new window.naver.maps.LatLng(37.5665, 126.9780);
            const map = new window.naver.maps.Map(mapRef.current, {
                center: center, zoom: 16, scaleControl: false, logoControl: false, mapDataControl: false,
            });
            mapInstance.current = map;
            const marker = new window.naver.maps.Marker({ position: center, map: map });
            
            window.naver.maps.Event.addListener(map, 'click', (e: any) => {
                marker.setPosition(e.coord);
                setTempCoords({ lat: e.coord.lat(), lng: e.coord.lng() });
            });
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const newCenter = new window.naver.maps.LatLng(lat, lng);
                    map.setCenter(newCenter);
                    marker.setPosition(newCenter);
                    setTempCoords({ lat, lng });
                });
            }
            setMapInitialized(true);
            setLoadError(false);
        } catch (e) {
            setLoadError(true);
        }
    };

    if (window.naver && window.naver.maps) {
        setTimeout(initMap, 100);
    } else {
        const scriptId = 'naver-map-script';
        if (!document.getElementById(scriptId)) {
            window.initMap = initMap; 
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder&callback=initMap`;
            script.async = true;
            script.onerror = () => setLoadError(true);
            document.head.appendChild(script);
        }
        const interval = setInterval(() => {
            if (window.naver && window.naver.maps) {
                initMap();
                clearInterval(interval);
            }
        }, 300);
        setTimeout(() => {
            if (!mapInitialized && !window.naver) {
                clearInterval(interval);
                setLoadError(true);
            }
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleAddressSearch = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchQuery.trim()) return;
      if (loadError || !window.naver || !window.naver.maps) {
          onLocationSelect(searchQuery, null);
          setIsOpen(false);
          return;
      }
      setIsLoadingLocation(true);
      try {
          window.naver.maps.Service.geocode({ query: searchQuery }, (status: any, response: any) => {
              setIsLoadingLocation(false);
              if (status !== window.naver.maps.Service.Status.OK) { alert('검색 결과가 없습니다.'); return; }
              const item = response.v2.addresses[0];
              if (item) {
                  const newLat = parseFloat(item.y);
                  const newLng = parseFloat(item.x);
                  const newCenter = new window.naver.maps.LatLng(newLat, newLng);
                  mapInstance.current.setCenter(newCenter);
                  setTempCoords({ lat: newLat, lng: newLng });
              } else { alert("정확한 주소를 찾을 수 없습니다."); }
          });
      } catch (err) {
          setIsLoadingLocation(false);
          onLocationSelect(searchQuery, null);
          setIsOpen(false);
      }
  };

  const handleConfirm = () => {
      if (tempCoords) {
          const addrText = searchQuery || `좌표 (${tempCoords.lat.toFixed(4)}, ${tempCoords.lng.toFixed(4)})`;
          onLocationSelect(addrText, tempCoords);
          setIsOpen(false);
      } else if (searchQuery) {
          onLocationSelect(searchQuery, null);
          setIsOpen(false);
      }
  };

  return (
    <>
        <div onClick={() => setIsOpen(true)} className="w-full bg-[#151c32] border border-[#E2C275]/30 rounded-2xl py-5 px-5 flex items-center justify-between cursor-pointer hover:border-[#E2C275] hover:shadow-[0_0_15px_rgba(226,194,117,0.1)] transition-all group">
            <span className={`flex items-center gap-3 truncate font-medium text-lg ${tempCoords || (loadError && searchQuery) ? 'text-white' : 'text-gray-400'}`}>
                <MapIcon className={`w-5 h-5 flex-shrink-0 ${(tempCoords || (loadError && searchQuery)) ? 'text-[#E2C275]' : ''}`} /> 
                {tempCoords ? (searchQuery || "위치 설정 완료") : (loadError && searchQuery) ? searchQuery : "지도에서 집 찾기"}
            </span>
            <div className="bg-[#050B18] p-2 rounded-full border border-gray-700 group-hover:border-[#E2C275]">
                {(tempCoords || (loadError && searchQuery)) ? <CheckCircle2 className="w-5 h-5 text-[#E2C275]" /> : <Search className="w-5 h-5 text-gray-400" />}
            </div>
        </div>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
                <div className="bg-[#0A1224] w-full max-w-md rounded-2xl overflow-hidden border border-[#E2C275]/20 flex flex-col h-[85vh]">
                    <div className="p-4 border-b border-[#E2C275]/10 bg-[#0A1224] z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-[#E2C275]" /> 
                                {loadError ? "주소 직접 입력" : "위치 설정"}
                            </h3>
                            <button onClick={() => setIsOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddressSearch} className="flex gap-2">
                            <input type="text" placeholder="예: 한남동 유엔빌리지" className="flex-1 bg-[#151c32] text-white text-sm rounded-lg px-4 py-3 border border-gray-700 focus:border-[#E2C275] outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button type="submit" className="bg-[#E2C275] text-[#050B18] font-bold rounded-lg px-4 flex items-center justify-center">
                                {loadError ? "확인" : <Search className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                    
                    {!loadError ? (
                        <div className="flex-1 relative bg-gray-900 overflow-hidden">
                            <div ref={mapRef} className="w-full h-full" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white shadow-lg pointer-events-none z-10">지도를 움직여 핀을 집에 맞춰주세요</div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-[#0A1224] flex flex-col items-center justify-center p-6 text-center space-y-4">
                             <div className="w-20 h-20 bg-[#151c32] rounded-full flex items-center justify-center mb-2">
                                <MapPin className="w-10 h-10 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm">상세 주소를 입력하고 상단의 '확인'을 눌러주세요.</p>
                        </div>
                    )}

                    <div className="p-4 bg-[#0A1224] border-t border-[#E2C275]/10">
                        <button onClick={handleConfirm} disabled={(!loadError && !tempCoords)} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl disabled:opacity-50 hover:bg-[#c2a661]">
                            {loadError ? "이 주소로 진행" : "이 위치로 풍수 확인"}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

// --- Main App ---

export default function App() {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSharedMode, setIsSharedMode] = useState(false);
  
  const [formData, setFormData] = useState<UserData>({
    name: '', gender: null, calendarType: 'solar', birthDate: '', birthTime: '',
    address: '', coordinates: null, houseDirection: 'S', roomImage: null, moveStatus: 'living'
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Check for Share URL Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') === 'true' && params.get('score')) {
        setIsSharedMode(true);
        const score = parseInt(params.get('score') || '0');
        const tier = (params.get('tier') || 'B') as HouseTier;
        const name = params.get('name') || '방문자';
        
        setResult({
            totalScore: score,
            tier: tier,
            radarData: [
                { label: '지기(땅)', score: 60, description: '공유된 결과', detailQuote: '' }, 
                { label: '방향', score: 60, description: '공유된 결과', detailQuote: '' }, 
                { label: '오행조화', score: 60, description: '공유된 결과', detailQuote: '' }, 
                { label: '수맥안전', score: 60, description: '공유된 결과', detailQuote: '' }, 
                { label: '채광', score: 60, description: '공유된 결과', detailQuote: '' }, 
                { label: '통풍', score: 60, description: '공유된 결과', detailQuote: '' }
            ],
            mainCopy: `${name}님의 풍수 점수는 ${score}점입니다.`,
            subCopy: "복집 AI가 분석한 결과입니다.",
            locationAnalysis: "공유된 위치 데이터 분석",
            premiumReport: { title: "", price: "", originalPrice: "", sections: [] },
            items: []
        });
        setAppState('RESULT');
    }
  }, []);

  const handleAnalyze = async () => {
    setAppState('LOADING');
    setTimeout(async () => {
        const res = await analyzeFortune(
            formData.name, formData.birthDate,
            DIRECTIONS.find(d => d.value === formData.houseDirection)?.label || '남향',
            formData.coordinates, !!formData.roomImage,
            formData.moveStatus
        );
        setResult(res);
        setAppState('RESULT');
    }, 3200); // Extended loading time for effect
  };

  const handleShare = async () => {
    if (!result) return;
    const url = `${window.location.origin}?share=true&score=${result.totalScore}&tier=${result.tier}&name=${encodeURIComponent(formData.name)}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: '복집 - AI 풍수지리 분석',
                text: `${formData.name}님의 우리집 풍수 점수는 ${result.totalScore}점!`,
                url: url
            });
        } catch (err) { console.log('Share canceled'); }
    } else {
        await navigator.clipboard.writeText(url);
        alert("결과 링크가 복사되었습니다!");
    }
  };

  const handlePurchase = () => {
      setIsPremiumUnlocked(true);
      setShowPaymentModal(false);
      alert("✅ [테스트] 프리미엄 리포트가 해금되었습니다.");
  };
  
  const resetApp = () => {
    window.history.pushState({}, '', window.location.pathname);
    setIsSharedMode(false);
    setAppState('LANDING');
    setResult(null);
    setIsPremiumUnlocked(false);
    setShowPaymentModal(false);
    setFormData({ name: '', gender: null, calendarType: 'solar', birthDate: '', birthTime: '', address: '', coordinates: null, houseDirection: 'S', roomImage: null, moveStatus: 'living' });
    window.scrollTo(0,0);
  };

  const progressWidth = () => {
      switch(appState) {
          case 'SURVEY_IDENTITY': return '33%';
          case 'SURVEY_LOCATION': return '66%';
          case 'SURVEY_DETAILS': return '100%';
          default: return '0%';
      }
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-[#E2C275] font-sans overflow-x-hidden selection:bg-[#E2C275] selection:text-[#050B18]">
      <main className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        
        {/* Header - Branding Logo Updated */}
        {(appState !== 'LANDING' && appState !== 'DISCLAIMER_CHECK') && (
            <div className="px-5 pt-4 pb-2 sticky top-0 bg-[#050B18]/95 backdrop-blur-md z-40">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={resetApp} className="text-gray-400 hover:text-white"><Compass className="w-5 h-5" /></button>
                    {/* Logo Area */}
                    {appState !== 'RESULT' && (
                        <div className="flex items-center gap-1.5 opacity-90">
                            {/* Simple SVG Logo */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E2C275" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                <path d="M12 2L2 9l10 7 10-7-10-7Z"/>
                                <path d="M2 12l10 7 10-7"/>
                                <path d="M2 17l10 7 10-7"/>
                            </svg>
                            <span className="text-xs font-black text-[#E2C275] tracking-widest uppercase">BokJip</span>
                        </div>
                    )}
                    <div className="w-5" /> 
                </div>
                {appState.startsWith('SURVEY') && (
                    <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#B8934D] to-[#E2C275] transition-all duration-500" style={{width: progressWidth()}} />
                    </div>
                )}
            </div>
        )}

        {/* 1. Landing */}
        {appState === 'LANDING' && (
            <div className="flex-1 flex flex-col justify-center px-6 animate-in fade-in duration-1000 relative">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2C275]/10 border border-[#E2C275]/30 text-[#E2C275] text-[10px] font-bold mb-4 tracking-wide backdrop-blur-md">
                        <Sparkles className="w-3 h-3" /> 국내 최초 풍수 AI
                    </div>
                    <h1 className="text-5xl font-black text-white leading-[1.1] mb-2 tracking-tight">
                        이사 갈 집?<br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C275] via-[#F5E3B3] to-[#E2C275]">지금 사는 집?</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-light mt-4">
                        계약 전 필수 체크. 당신의 운명을 바꿀 터인지<br/>
                        3초 만에 확인하세요.
                    </p>
                </div>

                <div className="space-y-4">
                    <TestimonialCarousel />
                    <button 
                        onClick={() => setAppState('DISCLAIMER_CHECK')}
                        className="w-full py-4 bg-gradient-to-r from-[#B8934D] via-[#E2C275] to-[#B8934D] text-[#050B18] font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(226,194,117,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        우리 집 기운 확인하기 <ArrowRight className="w-6 h-6" />
                    </button>
                    <div className="text-center space-y-2 mt-4">
                        <p className="text-[10px] text-gray-600">30년 경력 풍수 전문가 자문 알고리즘 적용</p>
                    </div>
                </div>
            </div>
        )}

        {/* Disclaimer & Surveys */}
        {appState === 'DISCLAIMER_CHECK' && (
            <div className="flex-1 flex flex-col justify-center px-6 animate-in zoom-in-95 duration-300 bg-black/40 backdrop-blur-sm">
                 <div className="bg-[#0A1224] border border-[#E2C275]/20 p-8 rounded-3xl shadow-2xl max-w-sm mx-auto w-full">
                     <AlertTriangle className="w-10 h-10 text-[#E2C275] mx-auto mb-4" />
                     <h2 className="text-xl font-bold text-white text-center mb-2">잠깐! 확인해주세요</h2>
                     <p className="text-gray-400 text-xs leading-relaxed text-center mb-6">
                         본 서비스는 통계와 풍수 이론을 기반으로 하나<br/>과학적 근거는 없으므로 재미로만 즐겨주세요.
                     </p>
                     <div className="space-y-2">
                        <button onClick={() => setAppState('SURVEY_IDENTITY')} className="w-full py-3 bg-[#E2C275] text-[#050B18] font-bold rounded-xl">네, 이해했습니다</button>
                        <button onClick={() => setAppState('LANDING')} className="w-full py-3 bg-[#151c32] text-gray-400 font-bold rounded-xl hover:text-white">나가기</button>
                     </div>
                 </div>
            </div>
        )}

        {appState === 'SURVEY_IDENTITY' && (
            <div className="flex-1 px-5 pt-2 pb-6 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-xl font-bold text-white mb-6">누구의 집을 볼까요?</h2>
                <div className="space-y-4 flex-1">
                    {/* Goal Selection Added */}
                    <div>
                        <label className="block text-xs font-bold text-[#E2C275] mb-2">분석 목적</label>
                        <div className="grid grid-cols-2 gap-2 bg-[#151c32] p-1 rounded-xl">
                            <button onClick={() => setFormData({...formData, moveStatus: 'living'})} className={`py-3 rounded-lg text-sm font-bold transition-all ${formData.moveStatus === 'living' ? 'bg-[#E2C275] text-[#050B18] shadow-lg' : 'text-gray-400 hover:text-white'}`}>지금 사는 집</button>
                            <button onClick={() => setFormData({...formData, moveStatus: 'moving'})} className={`py-3 rounded-lg text-sm font-bold transition-all ${formData.moveStatus === 'moving' ? 'bg-[#E2C275] text-[#050B18] shadow-lg' : 'text-gray-400 hover:text-white'}`}>이사 갈 집</button>
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold text-[#E2C275] mb-1">이름</label><input type="text" className="w-full bg-[#151c32] rounded-xl p-3 text-white outline-none" placeholder="홍길동" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div>
                        <label className="block text-xs font-bold text-[#E2C275] mb-1">성별</label>
                        <div className="flex gap-2">
                            {['male', 'female'].map((g) => (<button key={g} onClick={() => setFormData({...formData, gender: g as any})} className={`flex-1 py-3 rounded-xl font-bold text-sm border ${formData.gender === g ? 'bg-[#E2C275] text-[#050B18] border-[#E2C275]' : 'bg-[#151c32] text-gray-400 border-transparent'}`}>{g === 'male' ? '남성' : '여성'}</button>))}
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold text-[#E2C275] mb-1">생년월일</label><input type="date" className="w-full bg-[#151c32] rounded-xl p-3 text-white outline-none" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
                </div>
                <button onClick={() => setAppState('SURVEY_LOCATION')} disabled={!formData.name || !formData.gender || !formData.birthDate} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl disabled:opacity-30 mt-4">다음</button>
            </div>
        )}

        {appState === 'SURVEY_LOCATION' && (
             <div className="flex-1 px-5 pt-2 pb-6 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-xl font-bold text-white mb-6">어디를 분석할까요?</h2>
                <div className="flex-1 space-y-4">
                    <LocationPicker onLocationSelect={(addr, coords) => setFormData({...formData, address: addr, coordinates: coords})} />
                    {!formData.address && <div className="p-3 rounded-xl bg-blue-900/20 border border-blue-500/30 text-blue-200 text-xs">정확한 주소는 지기(땅의 기운) 분석에 필수입니다.</div>}
                </div>
                <div className="flex gap-2 mt-4">
                     <button onClick={() => setAppState('SURVEY_IDENTITY')} className="w-1/3 py-4 bg-[#151c32] text-gray-400 font-bold rounded-xl">이전</button>
                     <button onClick={() => setAppState('SURVEY_DETAILS')} className="w-2/3 py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl">{formData.address ? "위치 확인" : "건너뛰기"}</button>
                </div>
            </div>
        )}

        {appState === 'SURVEY_DETAILS' && (
             <div className="flex-1 px-5 pt-2 pb-6 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-xl font-bold text-white mb-6">마지막 확인입니다.</h2>
                <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[#E2C275] mb-2">현관 방향</label>
                        {/* 3 columns grid for better fit with unknown option */}
                        <div className="grid grid-cols-3 gap-2">
                            {DIRECTIONS.map(d => (
                                <button key={d.value} onClick={() => setFormData({...formData, houseDirection: d.value})} className={`py-3 rounded-xl text-sm font-bold border ${formData.houseDirection === d.value ? 'bg-[#E2C275] text-[#050B18] border-[#E2C275]' : 'bg-[#151c32] text-gray-400 border-transparent'} ${d.value === 'UNKNOWN' ? 'col-span-3 border-dashed border-gray-600' : ''}`}>{d.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setAppState('SURVEY_LOCATION')} className="w-1/3 py-4 bg-[#151c32] text-gray-400 font-bold rounded-xl">이전</button>
                    <button onClick={handleAnalyze} className="w-2/3 py-4 bg-gradient-to-r from-[#B8934D] via-[#E2C275] to-[#B8934D] text-[#050B18] font-black text-lg rounded-xl shadow-[0_0_20px_rgba(226,194,117,0.3)]">분석하기</button>
                </div>
            </div>
        )}

        {appState === 'LOADING' && (
            <LoadingScreen />
        )}

        {/* Result View - Optimized for Mobile */}
        {appState === 'RESULT' && result && (
            <div className="flex-1 animate-in slide-in-from-bottom-8 duration-700 pb-10">
                
                {/* Result Hero - Compressed Padding */}
                <div className="relative bg-[#0A1224] pt-4 pb-6 px-4 rounded-b-[2rem] shadow-2xl z-20 border-b border-[#E2C275]/10 overflow-visible">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(226,194,117,0.1),transparent_70%)] pointer-events-none" />
                    
                    <div className="text-center relative z-10">
                        {/* Location Badge with Edit */}
                        <div className="flex justify-center mb-3">
                             <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 border border-[#E2C275]/20 backdrop-blur-md">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] text-gray-300 tracking-tight truncate max-w-[150px]">{result.locationAnalysis}</span>
                                <button onClick={() => setAppState('SURVEY_LOCATION')} className="ml-1 p-1 bg-white/10 rounded-full hover:bg-white/20">
                                    <Edit2 className="w-2 h-2 text-[#E2C275]" />
                                </button>
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-1 leading-tight">{result.mainCopy}</h2>
                        <p className="text-gray-400 text-xs mb-2 px-2 break-keep leading-snug">{result.subCopy}</p>
                        
                        <HexagonRadar data={result.radarData} />
                        
                        <div className="flex justify-center items-end gap-3 mt-1">
                            <div className="text-center">
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E2C275] to-[#B8934D] tracking-tighter">{result.totalScore}</div>
                                <div className="text-[10px] font-bold text-gray-500 mt-0 uppercase tracking-widest">Total Score</div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-lg text-xl font-black border flex flex-col items-center justify-center h-[56px] min-w-[60px] ${result.tier === HouseTier.S ? 'bg-purple-600 text-white border-purple-400' : 'bg-[#E2C275] text-[#050B18] border-[#B8934D]'}`}>
                                <span className="text-[9px] font-bold opacity-70 mb-[-2px]">TIER</span>
                                {result.tier}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 mt-5 space-y-5">
                    
                    {/* Premium Report */}
                    {!isSharedMode && (
                        <div className="space-y-3">
                            <h3 className="text-white font-bold text-base flex items-center gap-2 px-1">
                                <ShieldCheck className="w-4 h-4 text-[#E2C275]"/> 상세 분석 리포트
                            </h3>
                            
                            {!isPremiumUnlocked ? (
                                <div className="relative rounded-2xl overflow-hidden border border-[#E2C275]/20 shadow-lg bg-[#0A1224]">
                                    <div className="p-5 space-y-4 blur-[3px] opacity-40 select-none grayscale-[50%] h-[180px]">
                                        <div className="w-2/3 h-4 bg-gray-700 rounded" />
                                        <div className="w-full h-2 bg-gray-800 rounded" />
                                        <div className="w-full h-2 bg-gray-800 rounded" />
                                        <div className="w-1/2 h-4 bg-gray-700 rounded mt-4" />
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] z-10 p-6 text-center">
                                        <Lock className="w-8 h-8 text-[#E2C275] mb-2 animate-bounce" />
                                        <h3 className="text-white font-bold text-base mb-1">상세 분석 & {formData.moveStatus === 'moving' ? '이사' : '거주'} 솔루션</h3>
                                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                                            정밀 지형 분석, 가구 배치, 계약 조언 등<br/>
                                            3단 구성의 프리미엄 리포트를 확인하세요.
                                        </p>
                                        <button 
                                            onClick={() => setShowPaymentModal(true)} 
                                            className="w-full py-3 bg-gradient-to-r from-[#B8934D] to-[#E2C275] text-[#050B18] font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(226,194,117,0.4)] text-sm"
                                        >
                                            <span className="line-through opacity-50 mr-2 text-xs">{result.premiumReport.originalPrice}</span>
                                            {result.premiumReport.price}에 잠금 해제
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {result.premiumReport.sections.map((section, i) => (
                                        <div key={i} className="bg-[#151c32] rounded-xl border border-white/10 p-5 shadow-lg">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                                {section.icon === 'Map' && <MapIcon className="w-5 h-5 text-blue-400" />}
                                                {section.icon === 'Layout' && <Compass className="w-5 h-5 text-green-400" />}
                                                {section.icon === 'Star' && <Star className="w-5 h-5 text-yellow-400" />}
                                                <h4 className="font-bold text-white text-base">{section.title}</h4>
                                            </div>
                                            <ul className="space-y-3">
                                                {section.content.map((line, j) => (
                                                    <li key={j} className="text-sm text-gray-200 leading-7 pl-3 relative">
                                                        <span className="absolute left-0 top-2.5 w-1 h-1 bg-[#E2C275] rounded-full"></span>
                                                        {line.split('**').map((part, k) => 
                                                            k % 2 === 1 ? <span key={k} className="text-[#E2C275] font-bold bg-[#E2C275]/10 px-1 rounded">{part}</span> : part
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Item Recommendations with Coupang Disclaimer */}
                    {!isSharedMode && (
                        <div>
                            <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2 px-1"><ShoppingBag className="w-4 h-4 text-[#E2C275]"/> 부족한 기운 채우기</h3>
                            
                            {/* Coupang Disclaimer Box */}
                            <div className="mb-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-[10px] text-gray-500 text-center leading-snug">
                                    이 포스팅은 쿠팡 파트너스 활동의 일환으로,<br/>이에 따른 일정액의 수수료를 제공받습니다.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {result.items.map((item, i) => (
                                    <div key={i} onClick={() => window.open(`https://www.coupang.com/np/search?component=&q=${encodeURIComponent(item.searchKeyword)}`, '_blank')} className="flex items-center gap-3 p-3 bg-[#151c32] rounded-xl border border-white/5 cursor-pointer hover:border-[#E2C275]/50 transition-all group relative overflow-hidden shadow-md">
                                        <div className="absolute top-0 right-0 bg-[#E2C275] text-[#050B18] text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">{item.effect}</div>
                                        <div className="w-10 h-10 rounded-full bg-[#E2C275]/10 flex items-center justify-center text-[#E2C275] font-bold text-sm">{i+1}</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold text-sm mb-0.5 truncate flex items-center gap-1">
                                                {item.name} <ExternalLink className="w-3 h-3 text-gray-500"/>
                                            </h4>
                                            <p className="text-gray-400 text-[10px] truncate">{item.description}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pb-8">
                        <button onClick={resetApp} className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-xs hover:bg-white/5 flex items-center justify-center gap-2"><RefreshCw className="w-3 h-3"/> 다시하기</button>
                        <button onClick={handleShare} className="flex-1 py-3 bg-[#FAE100] text-[#3B1E1E] rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ffe600]"><Share2 className="w-3 h-3"/> 결과 공유</button>
                    </div>
                </div>
            </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#151c32] w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-[#E2C275]/30">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold text-lg">결제 확인</h3>
                        <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-400"/></button>
                    </div>
                    
                    <div className="bg-[#050B18] p-4 rounded-xl mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E2C275]/20 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-[#E2C275]" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs line-through opacity-50">3,900원</p>
                            <p className="text-white font-bold text-lg">복집 프리미엄 리포트</p>
                        </div>
                        <div className="ml-auto text-xl font-black text-[#E2C275] animate-pulse">1,500원</div>
                    </div>
                    
                    <ul className="text-xs text-gray-400 mb-6 space-y-2 bg-white/5 p-4 rounded-lg">
                        <li className="flex gap-2">✅ <span className="text-gray-300">정밀 지형 분석 & 계약 조언</span></li>
                        <li className="flex gap-2">✅ <span className="text-gray-300">내 사주 맞춤형 침대/가구 배치도</span></li>
                        <li className="flex gap-2">✅ <span className="text-gray-300">흉살을 막는 비보(裨補) 솔루션</span></li>
                    </ul>

                    <button onClick={handlePurchase} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#c2a661]">
                        <CreditCard className="w-4 h-4"/> [테스트] 무료 확인하기
                    </button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}