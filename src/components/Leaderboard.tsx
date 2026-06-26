import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { 
  Trophy, 
  MapPin, 
  ShieldCheck, 
  ChevronUp, 
  Heart, 
  Sparkles, 
  UserPlus, 
  Crown,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

// Seed active developer citizens representing India sectors
const CIVIC_AVATARS = [
  {
    uid: 'u-1',
    displayName: 'Priya Sharma',
    email: 'priya.sharma@community.in',
    points: 890,
    trustScore: 99,
    locality: 'Indiranagar, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150'
  },
  {
    uid: 'u-2',
    displayName: 'Aman Patel',
    email: 'aman.patel@muni.org',
    points: 750,
    trustScore: 96,
    locality: 'HSR Layout, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'
  },
  {
    uid: 'u-3',
    displayName: 'Sneha Reddy',
    email: 'sneha.r88@gmail.com',
    points: 620,
    trustScore: 94,
    locality: 'Salt Lake Sector V, Kolkata',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
  },
  {
    uid: 'u-4',
    displayName: 'Vikram Singh',
    email: 'viksin@civils.org.in',
    points: 510,
    trustScore: 92,
    locality: 'Connaught Place, New Delhi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150'
  }
];

export const Leaderboard: React.FC = () => {
  const { currentUser, localityScores } = useApp();
  const [tabType, setTabType] = useState<'citizens' | 'localities'>('citizens');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine currentUser and mock seed profiles to calculate active rank roster
  const citizensList: User[] = React.useMemo(() => {
    const list = [...CIVIC_AVATARS];
    
    if (currentUser) {
      // Avoid duplicate current user if they match seed profiles
      const exists = list.find(c => c.uid === currentUser.uid || c.email === currentUser.email);
      if (!exists) {
        list.push({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          points: currentUser.points,
          trustScore: currentUser.trustScore,
          locality: currentUser.locality,
          photoURL: currentUser.photoURL
        } as any);
      } else {
        // update score representation inside seed
        const index = list.findIndex(c => c.uid === currentUser.uid || c.email === currentUser.email);
        list[index].points = currentUser.points;
        list[index].trustScore = currentUser.trustScore;
        list[index].locality = currentUser.locality;
      }
    }

    return list.sort((a, b) => b.points - a.points);
  }, [currentUser]);

  const filteredLocalities = localityScores.filter(item => 
    item.locality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCitizens = citizensList.filter(citizen => 
    citizen.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    citizen.locality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="wrapper-gamification" className="space-y-6">
      
      {/* Category selector panel */}
      <div id="tabs-leader" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500 animate-bounce" />
            Civic engagement honor roster
          </h3>
          <p className="text-xs text-slate-400">See leading citizens and neighborhoods resolving hyperlocal disputes.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800/80 rounded-xl max-w-fit">
          <button
            onClick={() => { setTabType('citizens'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabType === 'citizens'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Top Citizens
          </button>
          <button
            onClick={() => { setTabType('localities'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabType === 'localities'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Locality Pride Index
          </button>
        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tabType === 'citizens' ? 'Search champions or city sectors...' : 'Search neighborhood names...'}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-500 transition-colors"
        />
      </div>

      {tabType === 'citizens' ? (
        <div id="roster" className="space-y-3.5">
          {/* Champion Podium Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
            {filteredCitizens.slice(0, 3).map((citizen, index) => {
              const ringColors = [
                'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]', // Gold
                'border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.2)]', // Silver
                'border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.2)]' // Bronze
              ];
              const podiumPositions = ['1st', '2nd', '3rd'];

              return (
                <div 
                  key={citizen.uid} 
                  className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800/80 p-5 rounded-2xl text-center space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{podiumPositions[index]} place</div>
                  
                  <div className="relative inline-block">
                    <img 
                      src={citizen.photoURL || (citizen as any).avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${citizen.displayName}`} 
                      alt="" 
                      className={`w-14 h-14 rounded-full mx-auto object-cover border-2 ${ringColors[index]}`} 
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">
                      {index === 0 ? '👑' : index === 1 ? '🌟' : '🥈'}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-sm font-extrabold text-white flex items-center justify-center gap-1">
                      {citizen.displayName}
                      {citizen.uid === currentUser?.uid && (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0.2 rounded uppercase font-bold">You</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {citizen.locality?.split(',')[0]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                    <div className="text-center">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase">Points</span>
                      <strong className="text-xs text-orange-400 font-mono">{citizen.points} Citizen Pts</strong>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase">Trust score</span>
                      <strong className="text-xs text-emerald-400 font-mono">{citizen.trustScore}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Citizens listed vertically */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5 md:col-span-6 pl-2">Citizen Name</div>
              <div className="col-span-3 items-center">Trust Index</div>
              <div className="col-span-3 md:col-span-2 text-right">Ledger Score</div>
            </div>

            <div className="divide-y divide-slate-850">
              {filteredCitizens.map((citizen, offset) => {
                const rank = offset + 1;
                const isCurUser = citizen.uid === currentUser?.uid;

                return (
                  <div 
                    key={citizen.uid} 
                    className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors ${
                      isCurUser ? 'bg-orange-500/5' : 'hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="col-span-1 font-bold text-slate-500 text-center font-mono">#{rank}</div>
                    
                    <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                      <img 
                        src={citizen.photoURL || (citizen as any).avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${citizen.displayName}`} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-slate-800 object-cover" 
                      />
                      <div className="space-y-0.5 truncate">
                        <p className="font-bold text-slate-100 flex items-center gap-1.5">
                          {citizen.displayName}
                          {isCurUser && (
                            <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 py-0.2 rounded uppercase font-bold">You</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span>{citizen.locality}</span>
                        </p>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-medium text-slate-300">{citizen.trustScore}%</span>
                      </div>
                    </div>

                    <div className="col-span-3 md:col-span-2 text-right font-mono font-extrabold text-orange-400">
                      {citizen.points} Pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Locality Scores list */
        <div id="localities-deck" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLocalities.map((item, idx) => (
            <div 
              key={item.locality} 
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <h4 className="font-bold text-sm text-white">{item.locality}</h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>Reports filed: <strong>{item.reportCount}</strong></span>
                  <span>Resolved: <strong className="text-emerald-400">{item.resolvedCount}</strong></span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="text-xs font-bold text-amber-400 font-mono tracking-wide bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  ★ {item.points} Points
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">Index Rank #{idx+1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
