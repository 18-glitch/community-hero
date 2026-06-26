/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MapContainer } from './components/MapContainer';
import { IssueReportForm } from './components/IssueReportForm';
import { IssuesList } from './components/IssuesList';
import { ImpactDashboard } from './components/ImpactDashboard';
import { Leaderboard } from './components/Leaderboard';
import { IssueDetailsModal } from './components/IssueDetailsModal';
import { Issue, IssueCategory, IssueStatus } from './types';
import { 
  getActiveFirebaseConfig, 
  saveFirebaseConfig, 
  isFirebaseConfigured, 
  FirebaseConfig 
} from './firebase/client';
import { 
  Shield, 
  Flame, 
  FlameKindling, 
  Menu, 
  X, 
  SlidersHorizontal, 
  PlusCircle, 
  Map, 
  BarChart3, 
  Trophy, 
  Database, 
  RotateCcw, 
  ChevronRight,
  BookOpen,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function DashboardLayout() {
  const { currentUser, issues, resetToSeeds, logInWithGoogle, logInWithEmail, logOut } = useApp();
  
  // Navigation active view routing
  const [activeTab, setActiveTab] = useState<'home' | 'report' | 'ledger' | 'dashboard' | 'leaderboard'>(() => {
    const validTabs = ['home', 'report', 'ledger', 'dashboard', 'leaderboard'];
    
    // Try to read from URL hash
    const hash = window.location.hash.replace('#', '');
    if (validTabs.includes(hash)) {
      return hash as any;
    }
    
    // Try to read from localStorage
    const saved = localStorage.getItem('civic_hero_active_tab');
    if (saved && validTabs.includes(saved)) {
      return saved as any;
    }
    
    return 'home';
  });

  // Synchronize navigation state with browser history (for mobile/tablet back buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        console.log('Restoring tab from back/forward history navigation:', event.state.tab);
        setActiveTab(event.state.tab);
      } else {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['home', 'report', 'ledger', 'dashboard', 'leaderboard'];
        if (validTabs.includes(hash)) {
          setActiveTab(hash as any);
        } else {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial state
    window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Monitor activeTab changes to push states to browser history and sync persistence
  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState || currentState.tab !== activeTab) {
      console.log('Pushing state to browser history for activeTab:', activeTab);
      window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    } else {
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);
      }
    }
    localStorage.setItem('civic_hero_active_tab', activeTab);
  }, [activeTab]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Authentication custom state variables
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      await logInWithEmail(authEmail.trim(), authPassword);
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Focus and review states
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);

  // Global filters synchronized across map and index ledger
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');

  // Firebase integration manager
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbSenderId, setFbSenderId] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbSaveConfirmation, setFbSaveConfirmation] = useState(false);

  // Quick action setup to view connection settings
  const handleOpenSettings = () => {
    const active = getActiveFirebaseConfig();
    if (active) {
      setFbApiKey(active.apiKey || '');
      setFbProjectId(active.projectId || '');
      setFbAuthDomain(active.authDomain || '');
      setFbStorageBucket(active.storageBucket || '');
      setFbSenderId(active.messagingSenderId || '');
      setFbAppId(active.appId || '');
    }
    setSettingsOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (fbApiKey && fbProjectId) {
      const customConfig: FirebaseConfig = {
        apiKey: fbApiKey,
        projectId: fbProjectId,
        authDomain: fbAuthDomain,
        storageBucket: fbStorageBucket,
        messagingSenderId: fbSenderId,
        appId: fbAppId
      };
      saveFirebaseConfig(customConfig);
      setFbSaveConfirmation(true);
      setTimeout(() => {
        setFbSaveConfirmation(false);
        setSettingsOpen(false);
        window.location.reload(); // Hard reboot client to hook in new Firebase context parameters
      }, 1500);
    } else {
      // Clear configuration bypass to return to mockup mode
      saveFirebaseConfig(null);
      setSettingsOpen(false);
      window.location.reload();
    }
  };

  const selectIssueOnMapAndFocus = (issueStr: Issue) => {
    setSelectedIssue(issueStr);
    setFocusedIssueId(issueStr.id);
  };

  // Synchronize dynamic status metrics
  const unresolvedIssuesCount = issues.filter(i => i.status !== 'Resolved' && !i.duplicateOf).length;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col antialiased">
      
      {/* 1. Global Navigation Header */}
      <header className="fixed top-0 inset-x-0 z-[9999] border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1">
                  Community Hero <span className="text-[10px] bg-orange-500/20 text-orange-400 font-extrabold px-1.5 py-0.2 rounded border border-orange-500/20">India 🇮🇳</span>
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold leading-tight">Hyperlocal Civic Action</span>
              </div>
            </div>

            {/* Desktop Navigation Links (Nav Tabs) */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/40 p-1 border border-slate-900 rounded-xl">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'home' 
                    ? 'bg-slate-900 border border-slate-800 text-orange-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Hyperlocal Map</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ledger' 
                    ? 'bg-slate-900 border border-slate-800 text-orange-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Citizen Ledger</span>
                {unresolvedIssuesCount > 0 && (
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded-full">{unresolvedIssuesCount}</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'report' 
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>File Hazard</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-900 border border-slate-800 text-orange-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Impact Board</span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'leaderboard' 
                    ? 'bg-slate-900 border border-slate-800 text-orange-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>
            </nav>

            {/* Gamification Profile Status Indicators */}
            <div className="hidden lg:flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-900/40 p-1 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-1.5 border border-slate-850 rounded-xl shadow-lg">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                      <img 
                        src={currentUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUser.displayName)}`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="text-left leading-tight pr-1.5">
                      <span className="text-[10px] font-extrabold text-white block max-w-[100px] truncate">{currentUser.displayName}</span>
                      <span className="text-[9px] text-orange-400 font-bold uppercase font-mono tracking-wide">★ {currentUser.points} Pts</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-850"></div>
                    <div className="text-left font-mono pl-1 text-[9px] leading-tight pr-2">
                      <span className="text-slate-500 block uppercase font-extrabold text-[8px]">Trust score</span>
                      <span className="text-emerald-400 font-extrabold font-mono">{currentUser.trustScore}%</span>
                    </div>
                  </div>
                  <button
                    onClick={logOut}
                    className="px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[10px] font-bold transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-400/20 text-white font-bold text-xs flex items-center gap-1.5 hover:shadow-lg transition-all"
                >
                  <Shield className="w-4 h-4 text-orange-200" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Actions Drawer Toggler (database manual setup icon removed) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg border bg-slate-900 border-slate-850 text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-900 bg-slate-950 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1.5 pb-4">
                {currentUser ? (
                  <div className="flex flex-col gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl mb-2">
                    <div className="flex items-center gap-3">
                      <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUser.displayName)}`} alt="" className="w-8 h-8 rounded-full border border-slate-700" />
                      <div className="text-left leading-none">
                        <strong className="text-xs text-white block">{currentUser.displayName}</strong>
                        <span className="text-[10px] text-orange-400 font-bold font-mono">★ {currentUser.points} Pts | {currentUser.trustScore}% Trust</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { logOut(); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[10px] font-bold transition-all text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full py-2 mb-2 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-400/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                  >
                    <Shield className="w-4 h-4 text-orange-200" />
                    <span>Sign In</span>
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${
                    activeTab === 'home' ? 'bg-slate-900 text-orange-400' : 'text-slate-400'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Hyperlocal Map</span>
                </button>

                <button
                  onClick={() => { setActiveTab('ledger'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${
                    activeTab === 'ledger' ? 'bg-slate-900 text-orange-400' : 'text-slate-400'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Citizen Ledger</span>
                </button>

                <button
                  onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500 text-white flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>File Hazard Report</span>
                </button>

                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${
                    activeTab === 'dashboard' ? 'bg-slate-900 text-orange-400' : 'text-slate-400'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Impact Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${
                    activeTab === 'leaderboard' ? 'bg-slate-905 text-orange-400' : 'text-slate-400'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard Rankings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Primary Page Router Viewports */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16 py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            
            {/* VIEWPORT: HOME (MAP FEED INTEGRATED SIDE-BY-SIDE PANEL) */}
            {activeTab === 'home' && (
              <div id="homescreen-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Embedded Map Section */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  
                  {/* Map filter controls bar */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1">
                        <Map className="w-4 h-4 text-orange-500" />
                        Live Geo-Beacon Docket
                      </h3>
                      <p className="text-[11px] text-slate-400">Examine Indian localities on OpenStreetMap</p>
                    </div>

                    {/* Integrated Dropdowns Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={activeCategoryFilter}
                        onChange={(e) => setActiveCategoryFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-805/80 text-[11px] font-bold text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="pothole">Road Potholes</option>
                        <option value="water_leakage">Drainage/Leaks</option>
                        <option value="streetlight">Streetlamps</option>
                        <option value="waste_garbage">Waste/Garbage</option>
                        <option value="other">Other Hazards</option>
                      </select>

                      <select
                        value={activeStatusFilter}
                        onChange={(e) => setActiveStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-805/80 text-[11px] font-bold text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                      >
                        <option value="all">All States</option>
                        <option value="Reported">Reported</option>
                        <option value="Verified">Verified</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-[460px] w-full">
                    <MapContainer
                      onSelectIssue={selectIssueOnMapAndFocus}
                      selectedIssueId={focusedIssueId}
                      activeCategoryFilter={activeCategoryFilter}
                      activeStatusFilter={activeStatusFilter}
                    />
                  </div>
                </div>

                {/* Quick feed of reported incidents right of the map */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col h-[536px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-shrink-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                        Incident Bulletin
                      </h4>
                      <button
                        onClick={() => setActiveTab('ledger')}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-extrabold flex items-center gap-0.5"
                      >
                        <span>Examine Ledger</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 flex-shrink-0">
                      Highlighting citizen submissions. Tap any item to pan and center the map visualizer instantly.
                    </p>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {issues.filter(i => !i.duplicateOf).map((is) => (
                        <div
                          key={is.id}
                          onClick={() => {
                            setFocusedIssueId(is.id);
                            // Also scroll container to viewport focus
                          }}
                          className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex gap-3 ${
                            focusedIssueId === is.id
                              ? 'bg-orange-500/5 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.1)]'
                              : 'bg-slate-950 border-slate-900 hover:bg-slate-900/40 hover:border-slate-800'
                          }`}
                        >
                          {/* Left Icon Category Representation */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                            is.status === 'Resolved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : is.status === 'In Progress'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className="text-[10.5px] font-bold uppercase">
                              {is.category === 'pothole' ? '🕳️' : is.category === 'water_leakage' ? '💧' : is.category === 'streetlight' ? '💡' : '🗑️'}
                            </span>
                          </div>

                          <div className="space-y-0.5 leading-tight truncate">
                            <h5 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">{is.title}</h5>
                            <p className="text-[10.5px] text-slate-400 line-clamp-1 font-sans">{is.description}</p>
                            
                            <div className="flex items-center gap-2 pt-1 text-[9px] text-slate-500 font-medium">
                              <span>★ {is.upvotes.length} Votes</span>
                              <span>•</span>
                              <span>{is.location.locality?.split(',')[0]}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEWPORT: SUBMIT REPORT */}
            {activeTab === 'report' && (
              <div className="max-w-2xl mx-auto">
                <IssueReportForm onSuccess={() => setActiveTab('home')} />
              </div>
            )}

            {/* VIEWPORT: CITIZEN LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                {/* Filtering ribbon on ledger page */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                      Active Community Incident Registry
                    </h3>
                    <p className="text-xs text-slate-400">Perform filters or change sort indexes to analyze localized action items.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeCategoryFilter}
                      onChange={(e) => setActiveCategoryFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-305 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="pothole">Road Potholes</option>
                      <option value="water_leakage">Drainage/Leaks</option>
                      <option value="streetlight">Streetlamps</option>
                      <option value="waste_garbage">Waste/Garbage</option>
                      <option value="other">Other Hazards</option>
                    </select>

                    <select
                      value={activeStatusFilter}
                      onChange={(e) => setActiveStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-305 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">All States</option>
                      <option value="Reported">Reported</option>
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <IssuesList
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  activeCategoryFilter={activeCategoryFilter}
                  activeStatusFilter={activeStatusFilter}
                />
              </div>
            )}

            {/* VIEWPORT: IMPACT DASHBOARD */}
            {activeTab === 'dashboard' && <ImpactDashboard />}

            {/* VIEWPORT: LEADERBOARD */}
            {activeTab === 'leaderboard' && <Leaderboard />}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Global Information Notice Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-extrabold text-slate-400">Community Hero — Hyperlocal Public Action Platform</p>
            <p className="font-sans leading-relaxed">
              Designed as a premium, secure SaaS ledger mapping water leakages, streetlight outlays, garbage mounts, and pothole clusters across India.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className="font-sans tracking-wide">Developer Edition 2026</span>
          </div>
        </div>
      </footer>

      {/* 4. DETAILS LIGHTBOX INTERACTIVE MODAL COMPONENT */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </AnimatePresence>

      {/* 5. DATABASE CONFIG CONNECTION BYPASS MODAL (SETTINGS) */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-[22000] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-500" />
                  Firebase Connection Manual Setup
                </h4>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informative notice block */}
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 text-blue-300 text-[11px] rounded-lg leading-relaxed flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <p className="font-sans">
                  Paste your standard Firebase Web Client SDK parameters. Once specified, the app transitions seamlessly from local localStorage fallback to your live Firestore collections and Google Auth! Leave blank to revert strictly to offline sandbox mock database.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4.5">
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">API Key</label>
                    <input
                      type="password"
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      placeholder="AIzaSyA..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project ID</label>
                    <input
                      type="text"
                      value={fbProjectId}
                      onChange={(e) => setFbProjectId(e.target.value)}
                      placeholder="community-hero-india-123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Auth Domain (Optional)</label>
                    <input
                      type="text"
                      value={fbAuthDomain}
                      onChange={(e) => setFbAuthDomain(e.target.value)}
                      placeholder="community-hero-india-123.firebaseapp.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Storage Bucket (Optional)</label>
                    <input
                      type="text"
                      value={fbStorageBucket}
                      onChange={(e) => setFbStorageBucket(e.target.value)}
                      placeholder="community-hero-india-123.appspot.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sender ID (Optional)</label>
                    <input
                      type="text"
                      value={fbSenderId}
                      onChange={(e) => setFbSenderId(e.target.value)}
                      placeholder="719462..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">App ID (Optional)</label>
                    <input
                      type="text"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      placeholder="1:719462...:web:ca429..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      saveFirebaseConfig(null);
                      setFbApiKey('');
                      setFbProjectId('');
                      setSettingsOpen(false);
                      window.location.reload();
                    }}
                    className="text-[10px] font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/10"
                  >
                    Clear Config & Save offline mock db
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-lg"
                  >
                    {fbSaveConfirmation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Boot Database</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Authentic Elegant Login Portal Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Artistic decorative glowing gradient circles inside modal to not keep it plain */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthError(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all hover:scale-105"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Logo / Badge and Title */}
              <div className="flex flex-col items-center text-center mt-2 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 border border-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.5)]">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1">
                      Community Hero <span className="text-[10px] bg-orange-500/20 text-orange-400 font-extrabold px-1.5 py-0.2 rounded border border-orange-500/20">India 🇮🇳</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight animate-pulse">Hyperlocal Civic Action</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider font-sans">
                  Civic Hero Portal
                </h4>
                <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
                  Enter credentials below to access your localized civic dashboard. If you don't have an account, a profile will be created automatically!
                </p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="mb-4.5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] rounded-xl leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span className="font-medium">{authError}</span>
                </div>
              )}

              {/* Standard Email/Password Sign-In Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="sherlock@community.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="•••••••• (Min 6 chars)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-700 font-sans transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs tracking-wider rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2 uppercase"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Authentication...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In / Enter Portal</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Decorative Divider */}
              <div className="relative my-6 flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Google Sign In Auth Option */}
              <button
                type="button"
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    await logInWithGoogle();
                    setAuthModalOpen(false);
                  } catch (err: any) {
                    setAuthError(err.message || 'Google Auth process was interrupted.');
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2.5 hover:text-white transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Verify & Sign In with Google</span>
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardLayout />
    </AppProvider>
  );
}
