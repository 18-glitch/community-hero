import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { IssueCategory, IssueSeverity } from '../types';
import { 
  Camera, 
  Mic, 
  MapPin, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  HelpCircle,
  X,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_MOCK_IMAGES = [
  {
    name: 'Road Potholes',
    category: 'pothole',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600'
  },
  {
    name: 'Sewage Leak',
    category: 'water_leakage',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600'
  },
  {
    name: 'Sidewalk Garbage',
    category: 'waste_garbage',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600'
  },
  {
    name: 'Broken Streetlight',
    category: 'streetlight',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=600'
  }
];

export const IssueReportForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { reportCivicIssue, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('other');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [loading, setLoading] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);

  // Localization settings
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'searching' | 'success' | 'failed'>('idle');

  // Photo uploads
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Inputs
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const recognitionRef = useRef<any>(null);

  // Success overlay state
  const [reportResult, setReportResult] = useState<{ merged: boolean; duplicateId?: string } | null>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Fetch coordinates on mount automatically
  useEffect(() => {
    requestGPSLocation(false);
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by this browser. English and Hindi voice inputs require Chrome, Safari, or Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = voiceLang;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setDescription(prev => (prev ? prev.trim() + ' ' + text : text));
        }
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          alert('Microphone permission was denied. Please allow microphone access in your browser settings to dictate your issue.');
        } else if (e.error !== 'no-speech') {
          alert(`Speech recognition issue: ${e.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error('Failed to trigger speech recognition:', err);
      alert('Could not start speech recording. Please verify microphone connections.');
      setIsListening(false);
    }
  };

  const requestGPSLocation = (explicitClick = false) => {
    setLocationStatus('fetching');
    if (!navigator.geolocation) {
      setLocationStatus('failed');
      if (explicitClick) {
        alert('Geolocation is not supported by your browser.');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            const displayName = data.display_name || '';
            setAddress(displayName);
            
            const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.neighbourhood || data.address?.state_district || '';
            const state = data.address?.state || '';
            const locStr = [city, state].filter(Boolean).join(', ');
            setLocality(locStr || 'Captured Coordinates');
            setLocationStatus('success');
          } else {
            throw new Error('Reverse geocoding response not ok');
          }
        } catch (err) {
          console.warn('Reverse geocoding failed, keeping Coordinates:', err);
          setAddress(`Latitude Location: ${latitude.toFixed(5)}, Longitude: ${longitude.toFixed(5)}`);
          setLocality('GPS Location Pin');
          setLocationStatus('success');
        }
      },
      (err) => {
        console.warn('Geolocation coordinate capture denied/failed:', err);
        setLocationStatus('failed');
        
        // Never set mock hardcoded values like Indiranagar, Bengaluru.
        setLat(null);
        setLng(null);
        setAddress('');
        setLocality('');

        // If permission denied or other failures, show an error message
        let errMsg = 'Failed to retrieve your GPS coordinates. Please enter a location name/address manually or try again.';
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = 'Location access permission denied. Please allow location access in your browser settings to automatically capture your GPS coordinates.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errMsg = 'Location position info is unavailable on this device.';
        } else if (err.code === err.TIMEOUT) {
          errMsg = 'Location request timed out. Please try again.';
        }

        if (explicitClick) {
          alert(errMsg);
        } else {
          console.error(errMsg);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualGeocode = async () => {
    const searchString = `${address} ${locality}`.trim();
    if (!searchString) {
      alert('Please enter an address or locality to search.');
      return;
    }

    setGeocodingStatus('searching');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchString)}&format=json&limit=1`
      );
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const firstResult = results[0];
          const latitude = parseFloat(firstResult.lat);
          const longitude = parseFloat(firstResult.lon);
          setLat(latitude);
          setLng(longitude);
          
          setAddress(firstResult.display_name || address);
          setGeocodingStatus('success');
        } else {
          setGeocodingStatus('failed');
          alert('No coordinates found for this exact location. Please refine your query.');
        }
      } else {
        throw new Error('Geocoding search failed');
      }
    } catch (err) {
      console.error(err);
      setGeocodingStatus('failed');
      alert('Address look-up failed. Please connect to internet or check input fields.');
    }
  };

  // Convert File object to Base64
  const transformFileToBase64 = (file: File) => {
    console.log('Converting file to base64...', file.name, file.type, file.size);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      console.log('File successfully converted to base64 string. Length:', resultStr.length);
      setImagePreview(resultStr);
      setBase64Image(resultStr);
      setImageValidationError(null);
    };
    reader.onerror = (err) => {
      console.error('FileReader error while reading uploaded photo:', err);
      setImageValidationError('Failed to process image file. Please try another photo.');
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      transformFileToBase64(e.target.files[0]);
    }
  };

  // Safe canvas operation to generate base64 of public Unsplash images with CORS handled
  const loadPresetMockImage = async (presetUrl: string) => {
    console.log('Loading preset image URL:', presetUrl);
    setImagePreview(presetUrl);
    setImageValidationError(null);

    const fallbackToUrl = () => {
      console.log('Falling back to direct preset URL representation on server-side. Url:', presetUrl);
      setBase64Image(presetUrl);
    };

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg');
            console.log('Canvas conversion succeeded. base64 string length:', base64.length);
            setBase64Image(base64);
          } else {
            console.warn('Could not get 2D canvas context for preset image, using fallback');
            fallbackToUrl();
          }
        } catch (canvasErr) {
          console.warn('Canvas operations failed (likely CORS restrictions on third party domains), using direct URL fallback:', canvasErr);
          fallbackToUrl();
        }
      };
      img.onerror = (err) => {
        console.warn('Image loading failed (network error or CORS block), using direct URL fallback:', err);
        fallbackToUrl();
      };
      img.src = presetUrl;
    } catch (e) {
      console.error('Error starting image load:', e);
      fallbackToUrl();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageValidationError) {
      alert('Please upload a photo of a civic issue');
      return;
    }
    if (!title || !description || !locality) return;

    if (lat === null || lng === null) {
      alert('Location coordinates are required. Please click "Detect My Location" or search for a location to pin it on the map.');
      return;
    }

    setLoading(true);
    try {
      const result = await reportCivicIssue({
        title,
        description,
        category,
        severity,
        location: {
          lat,
          lng,
          address,
          locality
        },
        imageUrl: base64Image || undefined
      });

      setReportResult(result);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="wrapper-form-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      <AnimatePresence mode="wait">
        {!reportResult ? (
          <motion.form 
            key="form-edit"
            onSubmit={handleFormSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header section with orange glowing bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                  Report Hyperlocal Issue
                </h3>
                <p className="text-xs text-slate-400 mt-1">Provide incident details and location to file a civic report</p>
              </div>
              <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Civic Action Enabled</span>
              </div>
            </div>

            {/* Photo Uploader */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Issue Snapshot</label>
              
              <div 
                className="relative border-2 border-dashed border-slate-800 hover:border-orange-500/40 rounded-xl p-4 bg-slate-950 flex flex-col items-center justify-center cursor-pointer group transition-all duration-350"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="w-full relative h-48 rounded-lg overflow-hidden group">
                    <img src={imagePreview} alt="Issue preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white animate-pulse" />
                      <span className="text-xs text-white ml-2 font-medium">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-full group-hover:border-orange-500/30 group-hover:text-orange-400 text-slate-400 transition-colors">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-200">Drag or click to choose snapshot</p>
                    <p className="text-[11px] text-slate-500 mt-1">Accepts PNG, JPG, JPEG</p>
                  </div>
                )}
              </div>

              {imageValidationError && (
                <div id="image-validation-error" className="mt-2.5 flex items-center gap-1.5 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{imageValidationError}</span>
                </div>
              )}

            </div>

            {/* Coordinates / Map Location info */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Locality (City / Town)</label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g., Indiranagar, Bengaluru"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Precise Address / Neighborhood</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street road, sector details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>
              </div>

              {/* Action Coordinates row with Detect My Location & Convert Address buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Map Pin Lock Coordinates</div>
                  {lat && lng ? (
                    <div className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Ready: [{lat.toFixed(5)}, {lng.toFixed(5)}]</span>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-400 font-mono font-bold">Unassigned Coordinates</div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => requestGPSLocation(true)}
                    disabled={locationStatus === 'fetching'}
                    className="px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {locationStatus === 'fetching' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        <span>Detect My Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleManualGeocode}
                    disabled={geocodingStatus === 'searching'}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {geocodingStatus === 'searching' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Finding Address...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Search Location on Map</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Incident Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe issue (e.g., Broken streetlight leaking wires)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-600 transition-colors"
              />
            </div>

            {/* Voice and description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Detailed Description</label>
                </div>
                
                {/* Voice Toggle Actions */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">
                  <select
                    value={voiceLang}
                    onChange={(e: any) => setVoiceLang(e.target.value)}
                    className="bg-transparent border-none text-[10px] text-slate-400 font-bold outline-none focus:ring-0"
                  >
                    <option value="en-IN" className="bg-slate-950 font-sans">English 🇬🇧</option>
                    <option value="hi-IN" className="bg-slate-950 font-sans">Hindi 🇮🇳</option>
                  </select>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 py-0.5 px-2.5 rounded text-[10px] font-bold border transition-all ${
                      isListening
                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] animate-pulse'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-orange-400'
                    }`}
                  >
                    <Mic className={`w-3 h-3 ${isListening ? 'text-white' : 'text-orange-500'}`} />
                    <span>{isListening ? 'Listening...' : 'Speak'}</span>
                  </button>
                </div>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 p-2 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-xs animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>System is listening ({voiceLang === 'en-IN' ? 'English' : 'Hindi'}). Speak directly into your microphone...</span>
                </div>
              )}

              <div className="relative">
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue. What safety hazards exist? Tips to locate... (Use English, Hindi, or voice dictation)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            {/* Category and Severity Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Issue Category</label>
                </div>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none transition-colors"
                  >
                    <option value="pothole">Pothole / Road Damage</option>
                    <option value="water_leakage">Water Leakage / Drainage</option>
                    <option value="streetlight">Streetlight Malfunction</option>
                    <option value="waste_garbage">Waste & Garbage Pile</option>
                    <option value="other">Other Civic Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Civic Severity Level</label>
                </div>
                <div className="relative">
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-xl transition-all">
                    {(['low', 'medium', 'critical'] as IssueSeverity[]).map((level) => {
                      const colorClasses: Record<IssueSeverity, string> = {
                        low: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 focus-within:border-emerald-500',
                        medium: 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 focus-within:border-amber-500',
                        critical: 'border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 focus-within:border-rose-500'
                      };
                      const selectedColors: Record<IssueSeverity, string> = {
                        low: 'border-emerald-500 text-white bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
                        medium: 'border-amber-500 text-white bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
                        critical: 'border-rose-500 text-white bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      };

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSeverity(level)}
                          className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                            severity === level ? selectedColors[level] : colorClasses[level]
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">Reporting as <strong className="text-white">{currentUser?.displayName || 'Guest User'}</strong></span>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:hover:opacity-100 disabled:opacity-40 select-none shadow-[0_5px_15px_rgba(249,115,22,0.3)] flex items-center gap-1.5 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Incident...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            key="success-overlay"
            className="py-12 px-6 text-center space-y-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Report Published Successfully!</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Your report has been uploaded to the community ledger. GPS anchors are set, and neighboring citizens will receive alerting beacons.
              </p>
            </div>

            {reportResult.merged ? (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs text-left max-w-sm flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <div className="space-y-1">
                  <p className="font-bold">Gemini Duplicate Detection Triggered!</p>
                  <p className="text-slate-400 leading-normal">
                    This report has been identified within 100 meters of an active dispute of the same category, and has been merged into it to maximize civic resolution priority.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-orange-500/15 bg-orange-500/5 text-orange-300 text-xs text-left max-w-sm flex gap-3">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-orange-400" />
                <div className="space-y-1">
                  <p className="font-bold">Citizen Points Earned!</p>
                  <p className="text-slate-400 leading-normal">
                    You earned <strong className="text-white">+50 points</strong> for filing this incident. Your trust score is protected as long as the photo remains verified.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setReportResult(null);
                setTitle('');
                setDescription('');
                setImagePreview(null);
                setBase64Image(null);
                onSuccess();
              }}
              className="px-6 py-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-bold text-slate-300 hover:text-white transition-all duration-300"
            >
              Close & Go to Map
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
