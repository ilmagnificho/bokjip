import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, MapPin, Sparkles, RefreshCw, Share2, 
  ShoppingBag, Camera, CheckCircle2, 
  AlertTriangle, Lock, Search, Map as MapIcon, X,
  ChevronRight, ArrowRight, Ghost, Star, ChevronLeft, Unlock, ShieldCheck, TrendingUp, CreditCard, Bug
} from 'lucide-react';
import { UserData, AnalysisResult, Coordinates, HouseTier } from './types';
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
  { value: 'S', label: '남향 (South)' },
  { value: 'E', label: '동향 (East)' },
  { value: 'W', label: '서향 (West)' },
  { value: 'N', label: '북향 (North)' },
  { value: 'SE', label: '남동향 (SE)' },
  { value: 'SW', label: '남서향 (SW)' },
  { value: 'NW', label: '북서향 (NW)' },
  { value: 'NE', label: '북동향 (NE)' },
];

const TESTIMONIALS = [
    { text: "이사 가려던 집이 흉가인 걸 알고 피했어요.", user: "김OO님 (32세)", icon: "🔥" },
    { text: "추천해주신 소품 두고 일이 술술 풀려요.", user: "이OO님 (28세)", icon: "🍀" },
    { text: "우리 집 방향이랑 제 사주가 상극이었네요.", user: "박OO님 (45세)", icon: "🏠" },
    { text: "재미로 봤는데 소름돋게 잘 맞아요.", user: "최OO님 (24세)", icon: "✨" },
];

type AppState = 'LANDING' | 'DISCLAIMER_CHECK' | 'SURVEY_IDENTITY' | 'SURVEY_LOCATION' | 'SURVEY_DETAILS' | 'LOADING' | 'RESULT';

// --- Helper Functions ---
const getClientId = () => {
    let key = null;
    let source = '';

    // 1. Try Vite (Most likely for this project structure)
    try {
        // @ts-ignore
        if (import.meta?.env?.VITE_NAVER_CLIENT_ID) {
            // @ts-ignore
            key = import.meta.env.VITE_NAVER_CLIENT_ID;
            source = 'Vite (VITE_NAVER_CLIENT_ID)';
        }
    } catch (e) {}

    // 2. Try Next.js / Standard Process
    if (!key) {
        try {
            if (typeof process !== 'undefined' && process.env) {
                 if (process.env.NEXT_PUBLIC_NAVER_CLIENT_ID) {
                     key = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
                     source = 'Next.js (NEXT_PUBLIC_NAVER_CLIENT_ID)';
                 }
                 else if (process.env.REACT_APP_NAVER_CLIENT_ID) {
                     key = process.env.REACT_APP_NAVER_CLIENT_ID;
                     source = 'CRA (REACT_APP_NAVER_CLIENT_ID)';
                 }
            }
        } catch (e) {}
    }

    if (key) {
        console.log(`✅ Loaded Naver Client ID from [${source}]`);
    } else {
        console.warn("🚨 No Client ID found in env vars. Check Vercel settings. Variable must start with VITE_ or NEXT_PUBLIC_");
    }
    
    return key;
};

// --- Components ---

// 1. Radar Chart Component (SVG)
const HexagonRadar = ({ data }: { data: { label: string; score: number }[] }) => {
    const size = 200;
    const center = size / 2;
    const radius = 70;
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
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    return (
        <div className="relative w-[200px] h-[200px] mx-auto my-4">
            <svg width={size} height={size} className="overflow-visible">
                <polygon points={getPoints(radius)} fill="rgba(255,255,255,0.05)" stroke="rgba(226,194,117,0.2)" strokeWidth="1" />
                <polygon points={getPoints(radius * 0.66)} fill="none" stroke="rgba(226,194,117,0.1)" strokeWidth="1" />
                <polygon points={getPoints(radius * 0.33)} fill="none" stroke="rgba(226,194,117,0.1)" strokeWidth="1" />
                <polygon points={dataPoints} fill="rgba(226, 194, 117, 0.4)" stroke="#E2C275" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(226,194,117,0.5)] animate-in zoom-in duration-1000" />
                {data.map((d, i) => {
                    const angle = (Math.PI / 180) * (i * (360 / sides) - 90);
                    const r = radius * (d.score / 100);
                    const x = center + r * Math.cos(angle);
                    const y = center + r * Math.sin(angle);
                    return <circle key={i} cx={x} cy={y} r="3" fill="#fff" />;
                })}
            </svg>
            {data.map((d, i) => {
                const angle = (Math.PI / 180) * (i * (360 / sides) - 90);
                const labelR = radius + 25; 
                const x = center + labelR * Math.cos(angle);
                const y = center + labelR * Math.sin(angle);
                return (
                    <div key={i} className="absolute text-[10px] text-gray-300 font-bold whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
                        {d.label}
                        <div className="text-[#E2C275] text-[9px] text-center">{d.score}</div>
                    </div>
                );
            })}
        </div>
    );
};

// 2. Testimonial
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

// 3. Location Picker
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (addr: string, coords: Coordinates | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize Map Logic
  useEffect(() => {
    if (!isOpen) return;

    // 1. Env Var Check
    const clientId = getClientId();
    if (!clientId && !window.naver) {
        setLoadError(true);
        return;
    }

    // 2. Global Auth Failure Handler
    window.navermap_authFailure = function () {
        console.error("🚨 Naver Maps Auth Failure");
        alert("지도 인증 실패: Client ID와 웹 서비스 URL 설정을 확인하세요.");
        setLoadError(true);
    };

    // 3. Init Function
    const initMap = () => {
        if (!mapRef.current || mapInitialized) return;
        
        try {
            if (!window.naver || !window.naver.maps) {
                // Not loaded yet, retry shortly
                return; 
            }

            const center = new window.naver.maps.LatLng(37.5665, 126.9780);
            const map = new window.naver.maps.Map(mapRef.current, {
                center: center, zoom: 16, scaleControl: false, logoControl: false, mapDataControl: false,
            });
            mapInstance.current = map;
            const marker = new window.naver.maps.Marker({ position: center, map: map });
            markerInstance.current = marker;
            
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
            console.error("Map Init Exception:", e);
            setLoadError(true);
        }
    };

    // 4. Load Script if needed
    if (window.naver && window.naver.maps) {
        setTimeout(initMap, 100);
    } else {
        const scriptId = 'naver-map-script';
        if (!document.getElementById(scriptId)) {
            window.initMap = initMap; // Callback
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder&callback=initMap`;
            script.async = true;
            script.onerror = () => {
                console.error("🚨 Naver Script Load Error (Network/Block)");
                setLoadError(true);
            };
            document.head.appendChild(script);
        }
        
        // Polling fallback in case callback misses
        const interval = setInterval(() => {
            if (window.naver && window.naver.maps) {
                initMap();
                clearInterval(interval);
            }
        }, 300);

        // Timeout fallback
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
      
      // Manual Fallback
      if (loadError || !window.naver || !window.naver.maps) {
          onLocationSelect(searchQuery, null);
          setIsOpen(false);
          return;
      }

      setIsLoadingLocation(true);
      try {
          window.naver.maps.Service.geocode({ query: searchQuery }, (status: any, response: any) => {
              setIsLoadingLocation(false);
              if (status !== window.naver.maps.Service.Status.OK) { 
                  alert('검색 결과가 없습니다.'); 
                  return; 
              }
              const item = response.v2.addresses[0];
              if (item) {
                  const newLat = parseFloat(item.y);
                  const newLng = parseFloat(item.x);
                  const newCenter = new window.naver.maps.LatLng(newLat, newLng);
                  mapInstance.current.setCenter(newCenter);
                  markerInstance.current.setPosition(newCenter);
                  setTempCoords({ lat: newLat, lng: newLng });
              } else {
                  alert("정확한 주소를 찾을 수 없습니다.");
              }
          });
      } catch (err) {
          console.error("Geocode error", err);
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
          // Allow manual confirm even if map failed
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
                                <MapPin className="w-4 h-4 text-[#E2C275]" /> 
                                {loadError ? "주소 직접 입력 (지도 로드 실패)" : "위치 설정"}
                            </h3>
                            <button onClick={() => setIsOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        {loadError && (
                            <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg mb-3 flex gap-2 items-start">
                                <Bug className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">지도 연결 불가</p>
                                    <p>Vercel 환경변수(VITE_NAVER_CLIENT_ID)를 확인해주세요. 주소만 입력해도 분석 가능합니다.</p>
                                </div>
                            </div>
                        )}
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
                            {isLoadingLocation && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E2C275]"></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 bg-[#0A1224] flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <div className="w-20 h-20 bg-[#151c32] rounded-full flex items-center justify-center mb-2">
                                <MapPin className="w-10 h-10 text-gray-500" />
                            </div>
                            <h4 className="text-white font-bold">수동 주소 입력 모드</h4>
                            <p className="text-gray-400 text-sm">
                                상세 주소를 입력하고 상단의<br/>
                                <span className="text-[#E2C275] font-bold">'확인'</span> 버튼을 눌러주세요.
                            </p>
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
  
  const [formData, setFormData] = useState<UserData>({
    name: '', gender: null, calendarType: 'solar', birthDate: '', birthTime: '',
    address: '', coordinates: null, houseDirection: 'S', roomImage: null
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setAppState('LOADING');
    setTimeout(async () => {
        const res = await analyzeFortune(
            formData.name, formData.birthDate,
            DIRECTIONS.find(d => d.value === formData.houseDirection)?.label || '남향',
            formData.coordinates, !!formData.roomImage
        );
        setResult(res);
        setAppState('RESULT');
    }, 2500);
  };

  const handlePurchase = () => {
      // Test Mode: Immediate Unlock
      setIsPremiumUnlocked(true);
      setShowPaymentModal(false);
      alert("✅ [테스트 모드] 리포트가 무료로 잠금 해제되었습니다.\n실제 결제 시스템 연동 전 단계입니다.");
  };
  
  const resetApp = () => {
    setAppState('LANDING');
    setResult(null);
    setIsPremiumUnlocked(false);
    setShowPaymentModal(false);
    setFormData({ name: '', gender: null, calendarType: 'solar', birthDate: '', birthTime: '', address: '', coordinates: null, houseDirection: 'S', roomImage: null });
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
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-[#E2C275]/10 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        
        {/* Header */}
        {(appState !== 'LANDING' && appState !== 'DISCLAIMER_CHECK') && (
            <div className="px-6 pt-6 pb-2 sticky top-0 bg-[#050B18]/80 backdrop-blur-md z-40">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={resetApp} className="text-gray-400 hover:text-white"><Compass className="w-6 h-6" /></button>
                    {appState !== 'RESULT' && <span className="text-xs font-bold text-[#E2C275] tracking-widest">복집 (LUCKY HOUSE)</span>}
                    <div className="w-6" /> 
                </div>
                {appState.startsWith('SURVEY') && (
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#B8934D] to-[#E2C275] transition-all duration-500" style={{width: progressWidth()}} />
                    </div>
                )}
            </div>
        )}

        {/* 1. Landing */}
        {appState === 'LANDING' && (
            <div className="flex-1 flex flex-col justify-center px-6 animate-in fade-in duration-1000 relative">
                <div className="absolute top-10 right-10 animate-bounce delay-700 duration-3000">
                    <Star className="w-4 h-4 text-[#E2C275] opacity-60" />
                </div>
                
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E2C275]/10 border border-[#E2C275]/30 text-[#E2C275] text-xs font-bold mb-6 tracking-wide backdrop-blur-md">
                        <Sparkles className="w-3 h-3" /> 국내 최초 풍수 AI
                    </div>
                    <h1 className="text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight">
                        집이<br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C275] via-[#F5E3B3] to-[#E2C275]">당신의 운명</span>을<br/>
                        바꾼다면?
                    </h1>
                    <p className="text-gray-400 text-lg leading-relaxed font-light">
                        좋은 터는 사람을 살리고, 나쁜 터는 재물을 앗아갑니다.<br/>
                        3초 만에 우리 집 기운을 확인하세요.
                    </p>
                </div>

                <div className="space-y-4">
                    <TestimonialCarousel />
                    <button 
                        onClick={() => setAppState('DISCLAIMER_CHECK')}
                        className="w-full py-5 bg-gradient-to-r from-[#B8934D] via-[#E2C275] to-[#B8934D] text-[#050B18] font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(226,194,117,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        내 집과 궁합 보기 <ArrowRight className="w-6 h-6" />
                    </button>
                    <div className="text-center space-y-2 mt-4">
                        <p className="text-[10px] text-gray-600">30년 경력 풍수 전문가 자문 알고리즘 적용</p>
                    </div>
                </div>
            </div>
        )}

        {/* Disclaimer */}
        {appState === 'DISCLAIMER_CHECK' && (
            <div className="flex-1 flex flex-col justify-center px-6 animate-in zoom-in-95 duration-300 bg-black/40 backdrop-blur-sm">
                 <div className="bg-[#0A1224] border border-[#E2C275]/20 p-8 rounded-3xl shadow-2xl max-w-sm mx-auto w-full">
                     <div className="flex justify-center mb-6">
                         <div className="w-16 h-16 bg-[#E2C275]/10 rounded-full flex items-center justify-center">
                             <AlertTriangle className="w-8 h-8 text-[#E2C275]" />
                         </div>
                     </div>
                     <h2 className="text-xl font-bold text-white text-center mb-4">잠깐! 확인해주세요</h2>
                     <p className="text-gray-400 text-sm leading-relaxed text-center mb-8">
                         이 서비스는 명리학 통계와 풍수 이론을 기반으로 하지만,<br/>
                         <span className="text-[#E2C275] font-bold">과학적 근거는 없습니다.</span><br/><br/>
                         맹신하지 말고 재미로만 즐겨주세요.
                     </p>
                     <div className="space-y-3">
                         <button onClick={() => setAppState('SURVEY_IDENTITY')} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl hover:bg-[#c2a661] transition-all">네, 이해했습니다 (시작)</button>
                         <button onClick={() => setAppState('LANDING')} className="w-full py-4 bg-transparent border border-gray-700 text-gray-400 font-bold rounded-xl hover:bg-gray-800 transition-all">나가기</button>
                     </div>
                 </div>
            </div>
        )}

        {/* Identity Survey */}
        {appState === 'SURVEY_IDENTITY' && (
            <div className="flex-1 px-6 pt-4 pb-8 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-2xl font-bold text-white mb-2">본인을 알려주세요.</h2>
                <p className="text-gray-400 text-sm mb-8">사주 기운에 따라 맞는 집이 다릅니다.</p>
                <div className="space-y-6 flex-1">
                    <div><label className="block text-xs font-bold text-[#E2C275] mb-2">이름</label><input type="text" className="w-full bg-[#151c32] border-none rounded-xl p-4 text-white text-lg outline-none" placeholder="홍길동" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus /></div>
                    <div>
                        <label className="block text-xs font-bold text-[#E2C275] mb-2">성별</label>
                        <div className="flex gap-3">
                            {['male', 'female'].map((g) => (<button key={g} onClick={() => setFormData({...formData, gender: g as any})} className={`flex-1 py-4 rounded-xl font-bold transition-all border ${formData.gender === g ? 'bg-[#E2C275] text-[#050B18] border-[#E2C275]' : 'bg-[#151c32] text-gray-400 border-transparent'}`}>{g === 'male' ? '남성' : '여성'}</button>))}
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold text-[#E2C275] mb-2">생년월일</label><input type="date" className="w-full bg-[#151c32] rounded-xl p-4 text-white outline-none" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
                </div>
                <button onClick={() => setAppState('SURVEY_LOCATION')} disabled={!formData.name || !formData.gender || !formData.birthDate} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl disabled:opacity-30 mt-6">다음 <ChevronRight className="inline w-4 h-4" /></button>
            </div>
        )}

        {/* Location Survey */}
        {appState === 'SURVEY_LOCATION' && (
             <div className="flex-1 px-6 pt-4 pb-8 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <button onClick={() => setAppState('SURVEY_IDENTITY')} className="self-start text-gray-500 mb-4 flex items-center text-xs"><ChevronLeft className="w-3 h-3"/> 이전</button>
                <h2 className="text-2xl font-bold text-white mb-2">어디를 분석할까요?</h2>
                <p className="text-gray-400 text-sm mb-8">풍수지리는 집의 위치가 핵심입니다.</p>
                <div className="flex-1 space-y-6">
                    <LocationPicker onLocationSelect={(addr, coords) => setFormData({...formData, address: addr, coordinates: coords})} />
                    {!formData.address && <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 text-blue-200 text-xs leading-relaxed">정확한 주소는 지기(Ground Energy) 분석에 필수입니다.</div>}
                </div>
                <button onClick={() => setAppState('SURVEY_DETAILS')} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl hover:bg-[#c2a661] transition-all mt-6">{formData.address ? "위치 확인 완료" : "위치 없이 진행하기"}</button>
            </div>
        )}

        {/* Details Survey */}
        {appState === 'SURVEY_DETAILS' && (
             <div className="flex-1 px-6 pt-4 pb-8 flex flex-col animate-in slide-in-from-right-8 duration-500">
                <button onClick={() => setAppState('SURVEY_LOCATION')} className="self-start text-gray-500 mb-4 flex items-center text-xs"><ChevronLeft className="w-3 h-3"/> 이전</button>
                <h2 className="text-2xl font-bold text-white mb-2">마지막 확인입니다.</h2>
                <div className="flex-1 space-y-8">
                    <div>
                        <label className="block text-xs font-bold text-[#E2C275] mb-3">현관 방향</label>
                        <div className="grid grid-cols-2 gap-3">
                            {DIRECTIONS.slice(0, 4).map(d => (
                                <button key={d.value} onClick={() => setFormData({...formData, houseDirection: d.value})} className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.houseDirection === d.value ? 'bg-[#E2C275] text-[#050B18] border-[#E2C275]' : 'bg-[#151c32] text-gray-400 border-transparent'}`}>{d.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={handleAnalyze} className="w-full py-4 bg-gradient-to-r from-[#B8934D] via-[#E2C275] to-[#B8934D] text-[#050B18] font-black text-lg rounded-xl shadow-[0_0_20px_rgba(226,194,117,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-6">운명 분석 시작하기</button>
            </div>
        )}

        {/* Loading */}
        {appState === 'LOADING' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700 px-6 text-center">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-t-4 border-[#E2C275] rounded-full animate-spin" />
                    <Compass className="absolute inset-0 m-auto w-10 h-10 text-[#E2C275]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">천기(天氣)와 지기(地氣)를<br/>대조하고 있습니다...</h2>
            </div>
        )}

        {/* Result View */}
        {appState === 'RESULT' && result && (
            <div className="flex-1 animate-in slide-in-from-bottom-8 duration-700 pb-10">
                {/* Result Hero */}
                <div className="relative bg-[#0A1224] pt-8 pb-12 px-6 rounded-b-[3rem] shadow-2xl z-20 border-b border-[#E2C275]/10 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(226,194,117,0.15),transparent_70%)] pointer-events-none" />
                    <div className="text-center relative z-10">
                        <h2 className="text-3xl font-black text-white mb-2 leading-tight">{result.mainCopy}</h2>
                        <p className="text-gray-400 text-sm mb-6 px-4">{result.subCopy}</p>
                        
                        {/* Hexagon Radar Chart */}
                        <HexagonRadar data={result.radarData} />
                        
                        <div className="text-center mt-4">
                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E2C275] to-[#B8934D]">{result.totalScore}</div>
                            <div className="text-sm font-bold text-gray-500 mt-1">종합 궁합 점수</div>
                        </div>

                        <div className={`mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-xl text-lg font-black border ${result.tier === HouseTier.S ? 'bg-purple-600 text-white border-purple-400' : 'bg-[#E2C275] text-[#050B18] border-[#B8934D]'}`}>
                            <span>TIER</span>
                            <span className="text-2xl">{result.tier}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 mt-8 space-y-6">
                    
                    {/* Item Recommendations */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#E2C275]"/> 부족한 기운 채우기</h3>
                        <div className="space-y-3">
                            {result.items.map((item, i) => (
                                <div key={i} onClick={() => window.open(`https://m.search.shopping.naver.com/search/all?query=${encodeURIComponent(item.searchKeyword)}`, '_blank')} className="flex items-center gap-4 p-4 bg-[#151c32] rounded-xl border border-white/5 cursor-pointer hover:border-[#E2C275]/50 transition-all group relative overflow-hidden">
                                    {/* Effect Badge */}
                                    <div className="absolute top-0 right-0 bg-[#E2C275] text-[#050B18] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                        {item.effect}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[#E2C275]/10 flex items-center justify-center text-[#E2C275] font-bold text-lg">{i+1}</div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm mb-1">{item.name}</h4>
                                        <p className="text-gray-400 text-xs">{item.description}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Premium Report Section */}
                    <div className="relative rounded-2xl overflow-hidden border border-[#E2C275]/20 shadow-lg transition-all duration-700">
                        <div className={`p-6 bg-[#0A1224] space-y-4 ${!isPremiumUnlocked ? 'blur-md opacity-60 grayscale-[80%] select-none h-[250px]' : ''}`}>
                             <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-bold">{result.premiumReport.title}</h3>
                             </div>
                             {result.premiumReport.content.map((line, i) => (
                                 <p key={i} className="text-sm text-gray-300 leading-relaxed py-2 border-b border-white/5 last:border-0">
                                     {line}
                                 </p>
                             ))}
                        </div>
                        
                        {!isPremiumUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-10 p-6 text-center">
                                <Lock className="w-10 h-10 text-[#E2C275] mb-3 animate-bounce" />
                                <h3 className="text-white font-bold text-lg mb-1">상세 분석 리포트 잠금</h3>
                                <p className="text-xs text-gray-400 mb-6">
                                    정확한 흉살 위치와 이를 막는<br/>
                                    비보(裨補) 솔루션이 포함되어 있습니다.
                                </p>
                                <button 
                                    onClick={() => setShowPaymentModal(true)} 
                                    className="w-full py-3 bg-gradient-to-r from-[#B8934D] to-[#E2C275] text-[#050B18] font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(226,194,117,0.4)]"
                                >
                                    {result.premiumReport.price}에 전체 확인
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pb-8">
                        <button onClick={resetApp} className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:bg-white/5 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4"/> 다시하기</button>
                        <button className="flex-1 py-3 bg-[#FAE100] text-[#3B1E1E] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ffe600]"><Share2 className="w-4 h-4"/> 공유하기</button>
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
                            <p className="text-gray-400 text-xs">상품명</p>
                            <p className="text-white font-bold">복집 프리미엄 리포트</p>
                        </div>
                        <div className="ml-auto text-lg font-black text-[#E2C275]">3,900원</div>
                    </div>
                    
                    <p className="text-center text-xs text-gray-500 mb-6">
                        나쁜 기운을 미리 막는 비보 풍수,<br/>
                        지금 확인하면 평생의 운이 바뀝니다.
                    </p>

                    <button onClick={handlePurchase} className="w-full py-4 bg-[#E2C275] text-[#050B18] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#c2a661]">
                        <CreditCard className="w-4 h-4"/> 테스트 모드: 무료로 전체 확인
                    </button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}