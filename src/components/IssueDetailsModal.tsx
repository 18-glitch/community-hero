import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Issue, IssueStatus } from '../types';
import { 
  X, 
  MapPin, 
  Clock, 
  ArrowUp, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  MessageSquare,
  Send,
  AlertTriangle,
  Camera,
  ShieldAlert,
  ArrowRight,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IssueDetailsModalProps {
  issue: Issue;
  onClose: () => void;
}

const STOCK_RESOLVED_IMAGES = [
  { name: 'Freshly Patched Asphalt', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600' },
  { name: 'Cleared Tidy Footpath', url: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?q=80&w=600' }
];

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({ issue, onClose }) => {
  const { 
    toggleUpvote, 
    addComment, 
    resolveIssueWithProof, 
    submitProofForVerification,
    adminApproveResolution,
    adminTransitionStatus, 
    currentUser 
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Verification Proof Upload states
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [base64Proof, setBase64Proof] = useState<string | null>(null);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<{
    success: boolean;
    confidence: number;
    explanation: string;
  } | null>(null);

  const proofInputRef = useRef<HTMLInputElement>(null);

  const hasUpvoted = currentUser && issue.upvotes.includes(currentUser.uid);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(issue.id, commentText);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProofPreview(base64);
        setBase64Proof(base64);
      };
    }
  };

  // Convert and run preset resolved picture
  const loadPresetProofImage = (presetUrl: string) => {
    setProofPreview(presetUrl);
    
    // Quick load conversion using canvas
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setBase64Proof(canvas.toDataURL('image/jpeg'));
        }
      };
      img.src = presetUrl;
    } catch (e) {
      setBase64Proof(presetUrl); // silent fallback URL String representation
    }
  };

  const executeResolutionProofVerification = async () => {
    if (!base64Proof) return;

    setVerifyingProof(true);
    try {
      // Send base64 representation of original issue and verified proof
      const beforeStr = issue.imageUrl || base64Proof; // fallback to proof if none
      await submitProofForVerification(issue.id, beforeStr, base64Proof);
      
      setVerificationOutcome({
        success: true,
        confidence: 100,
        explanation: 'Your proof photo has been submitted successfully! The issue status has changed to "Pending Verification" and is awaiting administrator approval.'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingProof(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Reported': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Verified': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'Pending Verification': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse';
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div id="details-modal-window" className="fixed inset-0 z-[11000] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-950">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusBadgeStyle(issue.status)}`}>
              {issue.status}
            </span>
            <span className="text-xs text-slate-500 font-medium">Issue Index Code: {issue.id}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Hand: Visual evidence photo & general descriptions */}
            <div className="md:col-span-7 space-y-4">
              {issue.imageUrl && (
                <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <img src={issue.imageUrl} alt="Incident File" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-bold text-white uppercase border border-slate-800/60 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-500" />
                    <span>Before Snapshot</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{issue.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1 text-orange-500 font-bold uppercase text-[10px] tracking-wider">
                    {issue.category.replace('_', ' ')}
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {issue.location.address}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Specifications</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{issue.description}</p>
                
                <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 border-t border-slate-900">
                  <span>Reported by: <strong className="text-white">{issue.reportedBy.name}</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(issue.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Duplicate Information Banner if applicable */}
              {issue.duplicateOf && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs flex gap-3">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 animate-pulse" />
                  <div>
                    <h5 className="font-bold">Duplicate Incident Warning</h5>
                    <p className="text-slate-400 mt-0.5">
                      This incident is recognized as a duplicate of issue <strong className="text-white">#{issue.duplicateOf}</strong> located under 100 meters, and shares vote allocation totals.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Hand: Action timelines, comments, and AI Resolving widgets */}
            <div className="md:col-span-5 space-y-4">
              
              {/* Dynamic Upvote Button action */}
              <div className="flex flex-col gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resolve urgency index</span>
                    <p className="text-xs font-bold text-slate-200">★ {issue.upvotes.length} Citizens Upvoted</p>
                  </div>

                  <button
                    onClick={() => toggleUpvote(issue.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-xs transition-colors ${
                      hasUpvoted
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 border-orange-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 text-orange-500" />
                    <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                  </button>
                </div>

                {issue.upvotes.length < 3 ? (
                  <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg text-xs font-semibold text-orange-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <span>Need {3 - issue.upvotes.length} more vote{3 - issue.upvotes.length !== 1 ? 's' : ''} to earn points</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>★ +50 Pts earned by Author!</span>
                  </div>
                )}
              </div>

              {/* Comments & Conversation Docket */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col h-60">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Civic Discord ({issue.comments?.length || 0})
                </span>

                <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1">
                  {!issue.comments || issue.comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] text-slate-600 text-center">No commentary filed yet. Start the conversation!</span>
                    </div>
                  ) : (
                    issue.comments.map((comment) => (
                      <div key={comment.id} className="text-[11px] space-y-1 p-2 bg-slate-900 rounded-lg border border-slate-850/40">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-300">{comment.userName}</strong>
                          <span className="text-[9px] text-slate-600">{new Date(comment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-400 font-sans">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input form */}
                <form onSubmit={handleCommentSubmit} className="relative mt-2">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Contribute civic feedback..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="absolute right-1 top-1 text-orange-500 hover:text-orange-400 p-1"
                  >
                    {submittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </form>
              </div>

            </div>
          </div>

          {/* AI-POWERED RESOLUTION PROOF MANAGER */}
          <div className="border-t border-slate-850 pt-6">
            {issue.status === 'Resolved' && issue.verification ? (
              // -------------------------------------------------------------
              // RESOLVED METRICS VIEW
              // -------------------------------------------------------------
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">AI-Verified Resolution Complete</h4>
                      <p className="text-[10px] text-slate-500">Subject resolved in accordance with municipal SLAs.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 text-xs font-bold rounded-lg font-mono">
                    {issue.verification.aiConfidence}% match confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Side-by-Side */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Before Reporting state</span>
                    <div className="h-40 rounded-xl overflow-hidden border border-slate-900 relative">
                      <img src={issue.verification.proofBeforeUrl || issue.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* After Side-by-Side */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      After Resolved proof
                    </span>
                    <div className="h-40 rounded-xl overflow-hidden border border-emerald-500/20 relative">
                      <img src={issue.verification.proofAfterUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Vision audits comparison:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    "{issue.verification.aiExplanation}"
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold pt-1">
                    Signatory: {issue.verification.verifiedBy} | Verified Date: {new Date(issue.verification.verifiedAt || '').toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ) : issue.status === 'Pending Verification' && issue.verification ? (
              // -------------------------------------------------------------
              // PENDING VERIFICATION STATE (ADMIN & CITIZEN PANELS)
              // -------------------------------------------------------------
              <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Pending Verification</h4>
                      <p className="text-[10px] text-slate-500">Citizen submitted a fix. Awaiting admin review and Gemini analysis.</p>
                    </div>
                  </div>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 text-xs font-bold rounded-lg font-mono">
                    Awaiting Admin Approval
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Side-by-Side */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Before Reporting state</span>
                    <div className="h-40 rounded-xl overflow-hidden border border-slate-900 relative">
                      <img src={issue.verification.proofBeforeUrl || issue.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* After Side-by-Side */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      After Resolved proof (Proposed)
                    </span>
                    <div className="h-40 rounded-xl overflow-hidden border border-amber-500/20 relative">
                      <img src={issue.verification.proofAfterUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {/* Info and Admin Actions panel */}
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Resolver:
                    </span>
                    <p className="text-xs text-slate-200">
                      {issue.verification.resolvedByName || issue.reportedBy.name}
                    </p>
                  </div>

                  {currentUser?.email?.toLowerCase() === 'rohithboyini181@gmail.com' ? (
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      <p className="text-xs text-amber-300 font-semibold">
                        As system administrator, you can run Gemini Vision verification to approve this repair and award points.
                      </p>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          setVerifyingProof(true);
                          try {
                            const res = await adminApproveResolution(issue.id);
                            setVerificationOutcome({
                              success: res.verified,
                              confidence: res.confidence,
                              explanation: res.explanation
                            });
                          } catch (err: any) {
                            console.error(err);
                          } finally {
                            setVerifyingProof(false);
                          }
                        }}
                        disabled={verifyingProof}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 border border-emerald-500 font-bold text-xs text-white hover:opacity-95 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shadow-[0_5px_12px_rgba(16,185,129,0.2)]"
                      >
                        {verifyingProof ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gemini Comparing Visual Evidence...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Resolution & Award Points</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Admin review in progress. If you are the system administrator, please sign in with rohithboyini181@gmail.com to access approval controls.
                    </p>
                  )}
                </div>

                {/* Show verification outcome immediately after run if any */}
                {verificationOutcome && (
                  <div className={`p-4 rounded-xl border space-y-2.5 ${
                    verificationOutcome.success 
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-100' 
                      : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-extrabold uppercase flex items-center gap-1.5">
                        {verificationOutcome.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Resolution Approved & Verified!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span className="text-rose-400">Match Discrepancy</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-mono tracking-wider font-extrabold bg-white/5 px-2 py-0.5 rounded">
                        Score: {verificationOutcome.confidence}%
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                      {verificationOutcome.explanation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // -------------------------------------------------------------
              // RESOLVE INTERACTIVE AI SUBMISSION WIDGET
              // -------------------------------------------------------------
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      Citizen repair resolution channel
                    </h4>
                    <p className="text-xs text-slate-400">Did you clean/repair this hazard? Submit proof photo to let Gemini matching confirm it!</p>
                  </div>
                  
                  {currentUser && (currentUser.uid === 'user-admin' || issue.reportedBy.uid === currentUser.uid) && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => adminTransitionStatus(issue.id, 'In Progress')}
                        className={`text-[10px] px-2.5 py-1.5 border rounded font-semibold transition-all ${
                          issue.status === 'In Progress' 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Start Repair (In Progress)
                      </button>
                      <button
                        onClick={() => adminTransitionStatus(issue.id, 'Verified')}
                        className={`text-[10px] px-2.5 py-1.5 border rounded font-semibold transition-all ${
                          issue.status === 'Verified' 
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Verify (Citizen Patrol)
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Photo selector for fix */}
                  <div className="space-y-3">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Submit visual proof of fix</span>
                    
                    <div 
                      onClick={() => proofInputRef.current?.click()}
                      className="border border-dashed border-slate-800 hover:border-orange-500/40 rounded-xl p-4 bg-slate-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer h-40 relative overflow-hidden group transition-all"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={proofInputRef} 
                        onChange={handleProofFileChange} 
                        className="hidden" 
                      />

                      {proofPreview ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img src={proofPreview} alt="Proof report" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-1 flex flex-col items-center">
                          <Camera className="w-6 h-6 text-slate-400 group-hover:text-orange-400 transition-colors" />
                          <p className="text-xs font-semibold text-slate-300">Choose Resolved Picture</p>
                          <p className="text-[10px] text-slate-500">Before & After will match side-by-side</p>
                        </div>
                      )}
                    </div>


                  </div>

                  {/* Verification Run Trigger or Outcomes panel */}
                  <div className="space-y-4">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Comparison Ledger Run</span>
                    
                    <AnimatePresence mode="wait">
                      {!verificationOutcome ? (
                        <motion.div 
                          key="form-verifier"
                          className="space-y-3 p-4 border border-slate-850 bg-slate-900/30 rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Once your after-repair photo is loaded, click below. Gemini AI compares both snapshots, conducting comparative pixel pattern audits. Positive match immediately transfers the status to **Resolved**, awarding you <strong className="text-white">+150 points</strong> and increasing your citizen trust index.
                          </p>
                          <button
                            type="button"
                            onClick={executeResolutionProofVerification}
                            disabled={!base64Proof || verifyingProof}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500 font-bold text-xs text-white hover:opacity-95 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shadow-[0_5px_12px_rgba(249,115,22,0.2)]"
                          >
                            {verifyingProof ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Gemini Comparing Visual Evidence...</span>
                              </>
                            ) : (
                              <>
                                <span>Verify Repair Resolution Proof</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="outcome-verified"
                          className={`p-4 rounded-xl border space-y-2.5 ${
                            verificationOutcome.success 
                              ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-100' 
                              : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
                          }`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-xs font-extrabold uppercase flex items-center gap-1.5">
                              {verificationOutcome.success ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  <span className="text-emerald-400">Resolution Verified!</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  <span className="text-rose-400">Match Discrepancy</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] font-mono tracking-wider font-extrabold bg-white/5 px-2 py-0.5 rounded">
                              Score: {verificationOutcome.confidence}%
                            </span>
                          </div>

                          <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                            {verificationOutcome.explanation}
                          </p>

                          {verificationOutcome.success && (
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 p-2 rounded text-center">
                              ✓ Awarded +150 points! Trust score increased.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 border-t border-slate-850 bg-slate-950 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
};
