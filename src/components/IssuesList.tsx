import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  ArrowUp, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Loader2, 
  CornerDownRight, 
  TrendingUp, 
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';

interface IssuesListProps {
  onSelectIssue: (issue: Issue) => void;
  activeCategoryFilter: string;
  activeStatusFilter: string;
}

export const IssuesList: React.FC<IssuesListProps> = ({ 
  onSelectIssue, 
  activeCategoryFilter, 
  activeStatusFilter 
}) => {
  const { issues, toggleUpvote, currentUser } = useApp();
  const [sortMethod, setSortMethod] = useState<'votes' | 'recent' | 'severity'>('votes');

  // Colors for Category Badges
  const catBadgeColors: Record<IssueCategory, string> = {
    pothole: 'bg-red-500/10 text-red-400 border-red-500/20',
    water_leakage: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    streetlight: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    waste_garbage: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    other: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  // Severity labels
  const severityLabels: Record<string, { label: string; style: string }> = {
    low: { label: 'Low Severity', style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
    medium: { label: 'Medium Severity', style: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
    critical: { label: 'Critical / High Risk', style: 'text-rose-400 border-rose-500/30 bg-rose-500/5 animate-pulse' }
  };

  // Filter & Sort Logic
  const processedIssues = React.useMemo(() => {
    let result = issues.filter(is => {
      // Hide child duplicates from main feed (they can be examined inside the parent issue modal)
      if (is.duplicateOf) return false;

      const matchCat = activeCategoryFilter === 'all' || is.category === activeCategoryFilter;
      const matchStat = activeStatusFilter === 'all' || is.status === activeStatusFilter;
      return matchCat && matchStat;
    });

    if (sortMethod === 'votes') {
      result.sort((a, b) => b.upvotes.length - a.upvotes.length);
    } else if (sortMethod === 'recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortMethod === 'severity') {
      const severityMap = { critical: 3, medium: 2, low: 1 };
      result.sort((a, b) => (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0));
    }

    return result;
  }, [issues, activeCategoryFilter, activeStatusFilter, sortMethod]);

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'Reported': return 'bg-rose-500';
      case 'Verified': return 'bg-blue-500';
      case 'In Progress': return 'bg-amber-500';
      case 'Resolved': return 'bg-emerald-500';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 3600));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  };

  return (
    <div id="container-ledger" className="space-y-4">
      {/* List Sort Controllers */}
      <div id="sort-bar" className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Ledger Index ({processedIssues.length} Items Listed)
        </span>
        
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800/80 rounded-lg">
          {(['votes', 'recent', 'severity'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setSortMethod(method)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded capitalize transition-all duration-200 ${
                sortMethod === method 
                  ? 'bg-slate-900 border border-slate-700/80 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {method === 'votes' ? 'Highest Votes' : method === 'recent' ? 'Most Recent' : 'Priority'}
            </button>
          ))}
        </div>
      </div>

      {processedIssues.length === 0 ? (
        <div className="py-20 text-center border border-slate-800/50 bg-slate-900/10 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No active reports hit these coordinates</p>
          <p className="text-xs text-slate-500 mt-1">Try toggling filters or submit the first report</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedIssues.map((issue) => {
            const hasUpvoted = currentUser && issue.upvotes.includes(currentUser.uid);
            const severityObj = severityLabels[issue.severity];

            // Render status line indicator
            const statuses: IssueStatus[] = ['Reported', 'Verified', 'In Progress', 'Resolved'];
            const currentIndex = statuses.indexOf(issue.status);

            return (
              <motion.div
                key={issue.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectIssue(issue)}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col gap-3 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 bg-slate-950/20 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${catBadgeColors[issue.category]}`}>
                        {issue.category.replace('_', ' ')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${severityObj.style}`}>
                        {severityObj.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-1 mt-1">
                      {issue.title}
                    </h4>
                  </div>

                  {/* Thumbnail */}
                  {issue.imageUrl && (
                    <div className="w-16 h-16 sm:w-14 sm:h-14 md:w-12 md:h-12 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex-shrink-0 relative shadow-lg">
                      <img src={issue.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Body paragraph */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>

                {/* Horizontal progress tracker - Reported -> Verified -> Progress -> Resolved */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 pb-1 border-b border-slate-900/40">
                    <span>Ledger State</span>
                    <span className="text-slate-400 font-extrabold">{issue.status}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {statuses.map((st, sIdx) => {
                      const isPastOrCurrent = sIdx <= currentIndex;
                      const isCurrent = sIdx === currentIndex;
                      return (
                        <div key={st} className="flex items-center flex-1 last:flex-none">
                          <div className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full border transition-all ${
                              isCurrent 
                                ? `${getStatusColor(st)} border-white shadow-[0_0_8px_rgba(249,115,22,0.8)]`
                                : isPastOrCurrent
                                  ? `${getStatusColor(st)} border-slate-800`
                                  : 'bg-slate-900 border-slate-800'
                            }`} />
                            <span className={`text-[8.5px] font-bold tracking-tight hidden lg:inline ${
                              isCurrent ? 'text-white' : 'text-slate-500'
                            }`}>
                              {st}
                            </span>
                          </div>
                          {sIdx < 3 && (
                            <div className={`h-0.5 flex-1 mx-2 rounded-full ${
                              sIdx < currentIndex ? getStatusColor(statuses[sIdx + 1]) : 'bg-slate-800'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Points achievement upvote progress tracker */}
                {issue.upvotes.length < 3 ? (
                  <div className="flex items-center gap-1.5 p-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg text-[9px] font-semibold text-orange-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <span>Need {3 - issue.upvotes.length} more vote{3 - issue.upvotes.length !== 1 ? 's' : ''} to earn points</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 p-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>★ +50 Pts earned by Author!</span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 mt-auto border-t border-slate-800/40 text-slate-500 text-[10px]">
                  {/* Location & Time markers */}
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-400 truncate">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span>{issue.location.address?.split(',')[0]}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(issue.createdAt)} by {issue.reportedBy.name.split(' ')[0]}</span>
                    </span>
                  </div>

                  {/* Actions (Upvote, Read Details) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUpvote(issue.id);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold text-[10px] tracking-wide transition-colors ${
                        hasUpvoted
                          ? 'bg-gradient-to-r from-orange-600 to-amber-500 border-orange-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <ArrowUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'text-white' : 'text-orange-500'}`} />
                      <span>{issue.upvotes.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue(issue);
                      }}
                      className="flex items-center px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Inspect issue ledger detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
