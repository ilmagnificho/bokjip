import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, MapPin, User, Sparkles, RefreshCw, Share2, 
  ShoppingBag, Camera, CheckCircle2, 
  AlertTriangle, Lock, Search, Map as MapIcon, X,
  ChevronRight, ArrowRight, Sun, Moon, Clock
} from 'lucide-react';
import { UserData, AnalysisResult, Coordinates } from './types';
import { analyzeFortune } from './services/fengShuiLogic';

declare global {
  interface Window {
    naver: any;
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
];

type Step = 'input' | 'loading' | 'result';

// --- Components ---

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (addr: string, coords: Coordinates) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Initialize Naver Map
  useEffect(() => {
    if (isOpen && !isMapLoaded && window.naver && mapRef.current) {
        const initMap = (lat: number, lng: number) => {
             const center = new window.naver.maps.LatLng(lat, lng);
             const map = new window.naver.maps.Map(mapRef.current, {
                center: center,
                zoom: 16,
                scaleControl: false,
                logoControl: false,
                mapDataControl: false,
            });
            
            mapInstance.current = map;

            const marker = new window.naver.maps.Marker({
                position: center,
                map: map
            });
            markerInstance.current = marker;

            window.naver.maps.Event.addListener(map, 'click', (e: any) => {
                marker.setPosition(e.coord);
                setTempCoords({ lat: e.coord.lat(), lng: e.coord.lng() });
            });
            
            // Set initial temp coords
            setTempCoords({ lat, lng });
            setIsLoadingLocation(false);
        };

        setIsLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    console.error(err);
                    initMap(37.5665, 126.9780); // Fallback: Seoul City Hall
                }
            );
        } else {
            initMap(37.5665, 126.9780);
        }
        
        setIsMapLoaded(true);
    }
  }, [isOpen, isMapLoaded]);

  // Address Search Handler (Updated to use Naver Geocoder)
  const handleAddressSearch = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchQuery.trim()) return;

      // Check if Naver Maps and Geocoder are loaded
      if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
          alert("지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
          return;
      }

      setIsSearching(true);
      
      try {
          // Use Naver Geocoding API
          window.naver.maps.Service.geocode({
              query: searchQuery
          }, (status: any, response: any) => {
              setIsSearching(false);

              if (status !== window.naver.maps.Service.Status.OK) {
                  alert('검색 중 오류가 발생했습니다.');
                  return;
              }

              const result = response.v2;
              const items = result.addresses;

              if (items.length > 0) {
                  const item = items[0];
                  const newLat = parseFloat(item.y);
                  const newLng = parseFloat(item.x);
                  
                  if (mapInstance.current) {
                      const newCenter = new window.naver.maps.LatLng(newLat, newLng);
                      mapInstance.current.setCenter(newCenter);
                      markerInstance.current.setPosition(newCenter);
                      setTempCoords({ lat: newLat, lng: newLng });
                  }
              } else {
                  alert("주소를 찾을 수 없습니다. 도로명 주소를 정확히 입력해주세요.");
              }
          });
      } catch (err) {
          console.error("Search failed", err);
          setIsSearching(false);
          alert("검색 중 오류가 발생했습니다.");
      }
  };

  const handleConfirm = () => {
      if (tempCoords) {
          const addrText = searchQuery ? searchQuery : `위도 ${tempCoords.lat.toFixed(4)}, 경도 ${tempCoords.lng.toFixed(4)}`;
          onLocationSelect(addrText, tempCoords);
          setIsOpen(false);
      }
  };

  return (
    <>
        <div 
            onClick={() => setIsOpen(true)}
            className="w-full bg-[#0A1224] border border-[#E2C275]/20 rounded-xl py-3 px-4 text-sm flex items-center justify-between cursor-pointer hover:border-[#E2C275] transition-colors group"
        >
            <span className={`flex items-center gap-2 truncate ${tempCoords ? 'text-white' : 'text-gray-400'}`}>
                <MapIcon className={`w-4 h-4 flex-shrink-0 ${tempCoords ? 'text-[#E2C275]' : ''}`} /> 
                {tempCoords ? (searchQuery || "위치 선택 완료") : "주소 검색 / 지도에서 찾기 (선택)"}
            </span>
            {tempCoords ? (
                <CheckCircle2 className="w-4 h-4 text-[#E2C275]" />
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#E2C275]/10 text-[#E2C275] px-1.5 py-0.5 rounded hidden sm:inline-block">정확도 +30%</span>
                    <Search className="w-4 h-4 text-gray-500 group-hover:text-[#E2C275]" />
                </div>
            )}
        </div>

        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
                <div className="bg-[#0A1224] w-full max-w-md rounded-2xl overflow-hidden border border-[#E2C275]/20 flex flex-col h-[85vh]">
                    
                    {/* Header with Search */}
                    <div className="p-4 border-b border-[#E2C275]/10 bg-[#0A1224] z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#E2C275]" /> 위치 설정
                            </h3>
                            <button onClick={() => setIsOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        
                        <form onSubmit={handleAddressSearch} className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="예: 서울시 강남구 언주로 117"
                                className="flex-1 bg-[#151c32] text-white text-sm rounded-lg px-4 py-3 border border-gray-700 focus:border-[#E2C275] outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={isSearching}
                                className="bg-[#E2C275] text-[#050B18] font-bold rounded-lg px-4 flex items-center justify-center disabled:opacity-50"
                            >
                                {isSearching ? <div className="w-4 h-4 border-2 border-[#050B18] border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                    
                    <div className="flex-1 relative bg-gray-900">
                        <div ref={mapRef} className="w-full h-full" />
                        
                        {/* Center Marker Overlay Hint */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white shadow-lg pointer-events-none z-10">
                            지도를 움직여 핀을 맞춰주세요
                        </div>

                        {isLoadingLocation && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E2C275]"></div>
                             </div>
                        )}

                        {!window.naver && !isLoadingLocation && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-900/95 text-gray-300 z-20">
                                <AlertTriangle className="w-10 h-10 text-[#E2C275] mb-4" />
                                <h4 className="font-bold text-lg mb-2">지도를 불러올 수 없습니다</h4>
                                <p className="text-sm text-gray-400 mb-4">
                                    인증 실패 원인:<br/>
                                    네이버 클라우드 Console의 <b>Web 서비스 URL</b>에<br/>
                                    <span className="text-[#E2C275]">현재 접속한 도메인</span>이 등록되지 않았습니다.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-[#0A1224] border-t border-[#E2C275]/10">
                        <button 
                            onClick={handleConfirm}
                            disabled={!tempCoords}
                            className="w-full py-3 bg-[#E2C275] text-[#050B18] font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c2a661] transition-colors"
                        >
                            이 위치로 확인 완료
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
  const [step, setStep] = useState<Step>('input');
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    name: '',
    gender: null,
    calendarType: 'solar',
    birthDate: '',
    birthTime: '',
    address: '',
    coordinates: null,
    houseDirection: 'S',
    roomImage: null
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Dynamic Script Loader for Naver Maps
  useEffect(() => {
    // @ts-ignore
    const clientId = import.meta.env?.VITE_NAVER_CLIENT_ID;

    if (clientId && !window.naver) {
      const script = document.createElement('script');
      // Updated: oapi -> openapi and added &submodules=geocoder
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
      script.async = true;
      script.onload = () => {
          console.log("Naver Maps loaded with Geocoder");
      };
      document.head.appendChild(script);
    }
  }, []);

  const resetApp = () => {
    setStep('input');
    setResult(null);
    setIsPremiumUnlocked(false);
    setFormData({
        name: '',
        gender: null,
        calendarType: 'solar',
        birthDate: '',
        birthTime: '',
        address: '',
        coordinates: null,
        houseDirection: 'S',
        roomImage: null
    });
    window.scrollTo(0,0);
  };

  const handleAnalyze = async () => {
    if (!formData.name || !formData.birthDate || !formData.gender) return;
    setStep('loading');
    
    // Simulate processing time
    const waitTime = formData.coordinates ? 3500 : 2500;

    setTimeout(async () => {
        const res = await analyzeFortune(
            formData.name,
            formData.birthDate,
            DIRECTIONS.find(d => d.value === formData.houseDirection)?.label || '남향',
            formData.coordinates,
            !!formData.roomImage
        );
        setResult(res);
        setStep('result');
    }, waitTime);
  };

  const handleSearchLink = (keyword: string) => {
      const url = `https://m.search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`;
      window.open(url, '_blank');
  };

  const unlockPremium = () => {
      if (confirm("프리미엄 정밀 분석 리포트를 확인하시겠습니까? (테스트: 무료)")) {
          setIsPremiumUnlocked(true);
      }
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-[#E2C275] font-sans selection:bg-[#E2C275] selection:text-[#050B18] pb-10">
      {/* Background Aurora */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-[#1a237e]/20 blur-[100px] rounded-full animate-pulse-slow" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-6 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <button onClick={resetApp} className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E2C275] to-[#B8934D] p-[1px] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#050B18] rounded-lg flex items-center justify-center">
                    <Compass className="w-5 h-5 text-[#E2C275]" />
                </div>
            </div>
            <span className="font-bold text-lg text-white tracking-tight group-hover:text-[#E2C275] transition-colors">복집</span>
          </button>
          <div className="px-3 py-1 rounded-full bg-[#E2C275]/10 text-[10px] text-[#E2C275] font-bold border border-[#E2C275]/20 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E2C275] animate-pulse"></div>
            Beta
          </div>
        </header>

        {step === 'input' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8">
                    {/* Copywriting Update */}
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E2C275]/10 border border-[#E2C275]/20 text-[#E2C275] text-xs font-bold mb-4">
                        <Sparkles className="w-3 h-3" /> 
                        <span>30년 경력 풍수지리 전문가 AI</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                        이 집, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5E3B3] to-[#d97706]">당신과 진짜 잘 맞는지</span><br/>
                        딱 3초면 알아봐 줄게
                    </h1>
                    <p className="text-[#8A94A8] text-sm leading-relaxed">
                        겉보기엔 좋아 보여도, 당신과 안 맞는 집은 따로 있다?<br/>
                        지도 정밀 분석으로 숨겨진 기운까지 확인하세요.
                    </p>
                </div>

                <div className="bg-[#0A1224]/50 backdrop-blur-md border border-[#E2C275]/10 rounded-3xl p-6 shadow-2xl space-y-6">
                    {/* User Info - Expanded */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-[#8A94A8] uppercase tracking-wider ml-1">내 정보 입력 (필수)</label>
                        
                        <input 
                            type="text" placeholder="이름을 입력하세요"
                            className="w-full bg-[#0A1224] border border-[#E2C275]/10 rounded-xl p-3 pl-4 text-white focus:border-[#E2C275] outline-none transition-colors placeholder-gray-600 text-sm"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />

                        {/* Gender & Calendar Type Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex bg-[#0A1224] rounded-xl p-1 border border-[#E2C275]/10">
                                <button 
                                    onClick={() => setFormData({...formData, gender: 'male'})}
                                    className={`flex-1 rounded-lg text-xs font-bold py-2 transition-all ${formData.gender === 'male' ? 'bg-[#E2C275] text-[#050B18]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    남
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, gender: 'female'})}
                                    className={`flex-1 rounded-lg text-xs font-bold py-2 transition-all ${formData.gender === 'female' ? 'bg-[#E2C275] text-[#050B18]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    여
                                </button>
                            </div>
                             <div className="flex bg-[#0A1224] rounded-xl p-1 border border-[#E2C275]/10">
                                <button 
                                    onClick={() => setFormData({...formData, calendarType: 'solar'})}
                                    className={`flex-1 rounded-lg text-xs font-bold py-2 flex items-center justify-center gap-1 transition-all ${formData.calendarType === 'solar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Sun className="w-3 h-3" /> 양력
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, calendarType: 'lunar'})}
                                    className={`flex-1 rounded-lg text-xs font-bold py-2 flex items-center justify-center gap-1 transition-all ${formData.calendarType === 'lunar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Moon className="w-3 h-3" /> 음력
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="date"
                                    className="w-full bg-[#0A1224] border border-[#E2C275]/10 rounded-xl p-3 text-white [color-scheme:dark] text-sm focus:border-[#E2C275] outline-none transition-colors uppercase"
                                    value={formData.birthDate} 
                                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* Optional Time Input */}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <Clock className="w-4 h-4" />
                            </div>
                            <input 
                                type="time"
                                placeholder="태어난 시간 (선택)"
                                className="w-full bg-[#0A1224] border border-[#E2C275]/10 rounded-xl p-3 pl-10 text-white [color-scheme:dark] text-sm focus:border-[#E2C275] outline-none transition-colors"
                                value={formData.birthTime}
                                onChange={e => setFormData({...formData, birthTime: e.target.value})}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#E2C275] bg-[#E2C275]/10 px-1.5 py-0.5 rounded pointer-events-none">
                                정확도 +10%
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-[#E2C275]/10" />

                    {/* Location Info */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-[#8A94A8] uppercase tracking-wider flex justify-between ml-1">
                            <span>이사 갈 집 정보</span>
                        </label>
                        
                        <LocationPicker onLocationSelect={(addr, coords) => setFormData({...formData, address: addr, coordinates: coords})} />
                        
                        <div className="relative">
                            <select 
                                className="w-full bg-[#0A1224] border border-[#E2C275]/10 rounded-xl p-3 px-4 text-white appearance-none text-sm focus:border-[#E2C275] outline-none transition-colors cursor-pointer hover:bg-[#E2C275]/5"
                                value={formData.houseDirection} onChange={e => setFormData({...formData, houseDirection: e.target.value})}
                            >
                                {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label} (현관 기준)</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-[#8A94A8] uppercase tracking-wider flex items-center gap-1 ml-1">
                            방 사진 (선택) <Sparkles className="w-3 h-3 text-[#E2C275]" />
                        </label>
                        <label className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${formData.roomImage ? 'border-[#E2C275] bg-[#E2C275]/5' : 'border-[#E2C275]/20 hover:bg-[#0A1224] hover:border-[#E2C275]/50'}`}>
                            <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setFormData({...formData, roomImage: e.target.files[0]})} />
                            {formData.roomImage ? (
                                <div className="flex flex-col items-center gap-1 text-[#E2C275]">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-xs font-medium">사진 입력 완료</span>
                                </div>
                            ) : (
                                <div className="text-center text-[#8A94A8]">
                                    <Camera className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                    <span className="text-xs">침대/가구 배치 사진 올리기</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <button 
                        onClick={handleAnalyze}
                        disabled={!formData.name || !formData.birthDate || !formData.gender}
                        className="w-full py-4 bg-gradient-to-r from-[#B8934D] via-[#E2C275] to-[#B8934D] text-[#050B18] font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(226,194,117,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
                    >
                        결과 확인하기 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {!formData.coordinates && (
                        <p className="text-[10px] text-center text-gray-500">
                            * 주소를 입력하지 않으면 지리적 분석이 제외됩니다.
                        </p>
                    )}
                </div>
            </div>
        )}

        {step === 'loading' && (
             <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
                <div className="relative w-40 h-40 mb-8">
                    <div className="absolute inset-0 border-4 border-[#E2C275]/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-[#E2C275] rounded-full animate-spin duration-1000" />
                    <div className="absolute inset-4 border-2 border-[#E2C275]/20 rounded-full animate-pulse" />
                    <Compass className="absolute inset-0 m-auto w-10 h-10 text-[#E2C275]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                    {formData.coordinates ? '지형과 사주를 정밀 분석 중...' : '사주 오행을 분석 중...'}
                </h2>
                <div className="text-xs text-[#8A94A8] font-mono space-y-2 text-center">
                    <p className="animate-pulse">
                        {formData.calendarType === 'solar' ? '양력' : '음력'} 생년월일 {formData.birthDate} / {formData.birthTime ? '시주(時柱) 적용' : '시주 추정'}
                    </p>
                    {formData.coordinates ? (
                        <p className="text-[#E2C275] animate-pulse delay-75">위도 {formData.coordinates.lat.toFixed(2)} 지기(地氣) 스캔 중...</p>
                    ) : (
                        <p className="text-gray-600">위치 정보 없음 - 지기 분석 생략</p>
                    )}
                    {formData.roomImage && <p className="animate-pulse delay-150">AI Vision 가구 배치 분석 중...</p>}
                </div>
            </div>
        )}

        {step === 'result' && result && (
            <div className="flex-1 animate-in slide-in-from-bottom-8 duration-700">
                {/* Free Score Header */}
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1.5 bg-[#E2C275]/10 text-[#E2C275] text-[10px] font-bold rounded-full mb-4 border border-[#E2C275]/20 tracking-widest">
                        {formData.coordinates ? 'PREMIUM REPORT' : 'BASIC REPORT'}
                    </div>
                    <div className="relative inline-block">
                        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E2C275] to-[#B8934D] mb-2">{result.score}</h1>
                        <span className="text-2xl font-normal text-[#8A94A8] absolute top-2 -right-8">점</span>
                    </div>
                    <p className="text-[#8A94A8] text-sm mt-2">
                        {formData.name}님과 이 집의 궁합 점수입니다.
                        {!formData.coordinates && <br/>}
                        {!formData.coordinates && <span className="text-xs text-red-400">* 위치 미입력으로 정확도가 낮을 수 있습니다.</span>}
                    </p>
                </div>

                {/* Free Summary */}
                <div className="bg-[#0A1224] p-6 rounded-2xl border-l-4 border-[#E2C275] shadow-lg mb-8 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-[#E2C275]/5 rounded-bl-full pointer-events-none" />
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#E2C275]" /> 사주 오행 분석
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{result.basicSummary}</p>
                </div>

                {/* Premium Blurred Section */}
                <div className="relative rounded-2xl overflow-hidden border border-[#E2C275]/20 mb-10 shadow-2xl">
                    {/* Content Layer */}
                    <div className={`p-6 bg-[#0A1224] space-y-6 transition-all duration-700 ${!isPremiumUnlocked ? 'blur-md opacity-60 scale-95 select-none grayscale-[50%]' : 'scale-100 opacity-100'}`}>
                        <div>
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-400" /> 지기(地氣) 정밀 분석
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">{result.geoAnalysis}</p>
                            <div className="mt-3 inline-flex items-center gap-2 bg-red-900/20 border border-red-500/20 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-300 font-bold">{result.badLuckWarning}</span>
                            </div>
                        </div>
                        {result.visionAnalysis && (
                            <div className="pt-4 border-t border-[#E2C275]/10">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" /> AI 공간 투시 진단
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed">{result.visionAnalysis}</p>
                            </div>
                        )}
                    </div>

                    {/* Lock Overlay */}
                    {!isPremiumUnlocked && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-[#050B18]/80 to-[#050B18]">
                            <div className="p-4 rounded-full bg-[#E2C275]/10 mb-4 animate-bounce">
                                <Lock className="w-6 h-6 text-[#E2C275]" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-1">프리미엄 리포트 잠금</h3>
                            <p className="text-xs text-[#8A94A8] mb-6">지도 정밀 분석과 AI 진단을 확인하세요</p>
                            <button 
                                onClick={unlockPremium}
                                className="px-8 py-3 bg-[#E2C275] text-[#050B18] font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                전체 내용 무료 확인하기
                            </button>
                        </div>
                    )}
                </div>

                {/* Recommendation Items (Actionable) */}
                <div className="mb-12">
                    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 px-1">
                        <ShoppingBag className="w-5 h-5 text-[#E2C275]" />
                        행운의 인테리어 처방전
                    </h3>
                    <div className="space-y-4">
                        {result.items.map((item, idx) => (
                            <div 
                                key={item.id} 
                                onClick={() => handleSearchLink(item.searchKeyword)}
                                className="bg-[#0A1224] border border-[#E2C275]/10 rounded-xl p-4 flex gap-4 hover:border-[#E2C275]/50 hover:bg-[#E2C275]/5 transition-all cursor-pointer group"
                            >
                                <div className="w-14 h-14 bg-[#151c32] rounded-lg flex items-center justify-center flex-shrink-0 text-[#8A94A8] group-hover:text-[#E2C275] transition-colors font-bold text-lg">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white text-sm truncate pr-2">{item.name}</h4>
                                        <span className="text-[10px] bg-[#E2C275]/10 text-[#E2C275] px-2 py-0.5 rounded flex-shrink-0">최저가 검색</span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                                </div>
                                <div className="self-center p-2 rounded-full group-hover:bg-[#E2C275] group-hover:text-[#050B18] transition-all">
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#050B18]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={resetApp}
                        className="py-4 border border-[#E2C275]/20 text-[#E2C275] rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-[#E2C275]/5 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> 다른 집 분석
                    </button>
                    <button className="py-4 bg-[#1a233c] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-[#252d4b] transition-colors">
                        <Share2 className="w-4 h-4" /> 결과 공유
                    </button>
                </div>

                {/* Disclaimer */}
                <div className="border-t border-gray-800 pt-8 pb-4">
                    <p className="font-bold text-xs text-gray-500 mb-2">⚠️ 서비스 이용 약관 및 면책 조항</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed text-justify">
                        본 서비스에서 제공하는 풍수지리 및 사주 분석 결과는 명리학적 이론과 통계, 그리고 AI 기술을 활용한 엔터테인먼트 정보입니다. 이는 과학적으로 검증된 사실이 아니며, 실제 부동산의 가치나 개인의 운명에 확정적인 영향을 미치지 않습니다. 부동산 계약, 인테리어 시공 등 금전적/법적 책임이 따르는 중요한 결정의 근거로 활용될 수 없으며, 이에 따른 모든 결과의 책임은 사용자 본인에게 있습니다. 추천 상품은 검색 편의를 위해 제공되며 판매처와 무관합니다.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}