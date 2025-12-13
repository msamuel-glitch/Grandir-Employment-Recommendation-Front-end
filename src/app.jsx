import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AlertTriangle, Users, Target, Activity, MessageSquare, Phone, Briefcase, Filter, Sparkles, Lock, ArrowRight, CheckCircle, Heart, MapPin, Star, Calendar, Mail, Search, Clock, TrendingUp, FileText, Download, FileSpreadsheet, X, Loader2, RefreshCw, Layers, Zap, BarChart3, Send, Info, AlertCircle, Command } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://grandir-employment-os.onrender.com/api";

// --- GENERATE MOCK NURSERIES ---
const generateNurseries = () => {
    const nurseries = [];
    const hubs = [
        { name: "Paris", lat: 48.8566, lng: 2.3522, count: 80 },
        { name: "Lyon", lat: 45.75, lng: 4.85, count: 15 },
        { name: "Marseille", lat: 43.30, lng: 5.40, count: 12 },
        { name: "Bordeaux", lat: 44.83, lng: -0.57, count: 10 },
        { name: "Lille", lat: 50.62, lng: 3.05, count: 8 },
        { name: "Nantes", lat: 47.21, lng: -1.55, count: 8 }
    ];
    
    let id = 1;
    hubs.forEach(hub => {
        for (let i = 0; i < hub.count; i++) {
            const urgRand = Math.random();
            nurseries.push({
                id: id++,
                name: `${hub.name} District ${Math.floor(i/4) + 1} #${i % 4 + 1}`,
                lat: hub.lat + (Math.random() - 0.5) * (hub.name === "Paris" ? 0.25 : 0.15),
                lng: hub.lng + (Math.random() - 0.5) * (hub.name === "Paris" ? 0.35 : 0.2),
                urgency: urgRand > 0.85 ? "Red" : urgRand > 0.6 ? "Orange" : "Green",
                location: hub.name,
                staffing: Math.floor(Math.random() * 40) + 60
            });
        }
    });
    return nurseries;
};

const mockNurseries = generateNurseries();

// --- LEAFLET SETUP ---
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const createIcon = (color, size = 10) => L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
});

const urgencyColor = (u) => {
    const s = String(u || "").toLowerCase();
    if (s.includes("red") || s.includes("rouge")) return "#ef4444";
    if (s.includes("orange")) return "#f97316";
    return "#10b981";
};

// --- TOAST NOTIFICATION ---
const Toast = ({ message, type = "info", onClose }) => {
  const colors = {
    success: "from-green-500 to-emerald-600",
    error: "from-red-500 to-rose-600",
    info: "from-blue-500 to-indigo-600",
    warning: "from-orange-500 to-amber-600"
  };
  
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-8 z-[9999] bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right`}>
      {type === "success" && <CheckCircle size={20}/>}
      {type === "error" && <AlertCircle size={20}/>}
      {type === "info" && <Info size={20}/>}
      {type === "warning" && <AlertTriangle size={20}/>}
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onClose} className="ml-auto hover:bg-white/20 p-1 rounded"><X size={16}/></button>
    </div>
  );
};

// --- MAP HELPER ---
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
        map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// --- REPORT MODAL ---
const ReportModal = ({ isOpen, onClose, data }) => {
  const [type, setType] = useState("pdf");
  const [category, setCategory] = useState("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    const interval = setInterval(() => {
      setProgress(p => p >= 100 ? 100 : p + 10);
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      const csv = `Metric,Value\nCandidates,${data?.total_candidates || 0}\nCritical,${data?.red_alert_count || 0}\nVIP,${data?.vip_candidates || 0}`;
      const link = document.createElement("a");
      link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      link.download = `BloomPath_${category}_${Date.now()}.csv`;
      link.click();
      setIsGenerating(false);
      setProgress(0);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 flex justify-between items-center text-white">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2"><FileText size={20}/>Report Generator</h3>
            <p className="text-indigo-200 text-xs mt-1">Export your analytics</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full"><X size={18}/></button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {['Overview', 'Candidates', 'Nurseries', 'Performance'].map(cat => (
                <button key={cat} onClick={() => setCategory(cat.toLowerCase())} className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${category === cat.toLowerCase() ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setType('pdf')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'pdf' ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <FileText size={24}/>
                <span className="text-xs font-bold">PDF</span>
              </button>
              <button onClick={() => setType('csv')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'csv' ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <FileSpreadsheet size={24}/>
                <span className="text-xs font-bold">CSV</span>
              </button>
            </div>
          </div>

          <button disabled={isGenerating} onClick={handleGenerate} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${isGenerating ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {isGenerating ? <><Loader2 size={20} className="animate-spin"/>Generating {progress}%</> : <><Download size={20}/>Generate Report</>}
          </button>
          
          {isGenerating && (
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 transition-all duration-300" style={{width: `${progress}%`}}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- CANDIDATE DETAIL MODAL ---
const CandidateDetailModal = ({ isOpen, onClose, candidate, onSave }) => {
  const [editedData, setEditedData] = useState(candidate || {});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (candidate) setEditedData(candidate);
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleSave = () => {
    onSave(editedData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              Candidate Profile #{candidate.ref}
            </h3>
            <p className="text-indigo-100 text-sm mt-1">Complete candidate information</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600"/> Basic Information
                </h4>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-600 hover:text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100">
                      Cancel
                    </button>
                    <button onClick={handleSave} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg">
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference</label>
                  {isEditing ? (
                    <input type="text" value={editedData.ref || ''} onChange={e => setEditedData({...editedData, ref: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.ref || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Name</label>
                  {isEditing ? (
                    <input type="text" value={editedData.name || ''} onChange={e => setEditedData({...editedData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.name || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                  {isEditing ? (
                    <input type="email" value={editedData.email || ''} onChange={e => setEditedData({...editedData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.email || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
                  {isEditing ? (
                    <input type="tel" value={editedData.phone || ''} onChange={e => setEditedData({...editedData, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.phone || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City</label>
                  {isEditing ? (
                    <input type="text" value={editedData.ville || ''} onChange={e => setEditedData({...editedData, ville: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.ville || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                  {isEditing ? (
                    <select value={editedData.grandir_status || ''} onChange={e => setEditedData({...editedData, grandir_status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Status</option>
                      <option value="NOUVEAU">NOUVEAU</option>
                      <option value="A QUALIFIER">A QUALIFIER</option>
                      <option value="ENTRETIEN">ENTRETIEN</option>
                      <option value="URGENT">URGENT</option>
                      <option value="PLACE">PLACE</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${candidate.vip ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {candidate.grandir_status || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Qualifications Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-600"/> Qualifications
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diplomas</label>
                  {isEditing ? (
                    <input type="text" value={editedData.diplomas || ''} onChange={e => setEditedData({...editedData, diplomas: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g., Auxiliaire de Puériculture"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.diplomas || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Experience</label>
                  {isEditing ? (
                    <input type="text" value={editedData.experience || ''} onChange={e => setEditedData({...editedData, experience: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Years of experience"/>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{candidate.experience || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Section */}
            {candidate.assignedNursery && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600"/> Current Assignment
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Nursery</span>
                    <span className="text-sm font-bold text-slate-800">{candidate.assignedNursery.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Location</span>
                    <span className="text-sm font-bold text-slate-800">{candidate.assignedNursery.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Commute Time</span>
                    <span className={`text-sm font-bold ${candidate.commute.time < 20 ? 'text-green-600' : 'text-orange-600'}`}>
                      {candidate.commute.time} minutes
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-slate-600"/> Notes
              </h4>
              {isEditing ? (
                <textarea value={editedData.notes || ''} onChange={e => setEditedData({...editedData, notes: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows="4" placeholder="Add internal notes about this candidate..."/>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidate.notes || 'No notes added yet.'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between items-center">
          <div className="flex gap-3">
            <button onClick={() => alert('Calling candidate...')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
              <Phone size={16}/> Call
            </button>
            <button onClick={() => alert('Sending email...')} className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              <Mail size={16}/> Email
            </button>
          </div>
          <button onClick={onClose} className="text-sm font-bold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AI RECOMMENDATIONS ---
const AIRecommendations = () => {
  const recommendations = [
    { candidate: "Marie D.", nursery: "Paris District 1 #2", match: 96, reason: "5min commute, CAP PE" },
    { candidate: "Ahmed K.", nursery: "Lyon District 2 #1", match: 92, reason: "Experience + availability" },
    { candidate: "Sophie L.", nursery: "Marseille District 1 #3", match: 89, reason: "VIP candidate, urgent" }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="relative z-10">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap size={20}/>AI Smart Match</h3>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-sm">{rec.candidate} → {rec.nursery}</p>
                  <p className="text-xs text-purple-200 mt-1">{rec.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-300">{rec.match}%</p>
                  <p className="text-[10px] uppercase font-bold text-purple-200">Match</p>
                </div>
              </div>
              <button className="w-full bg-white text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors">
                Auto-Match Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- LOGIN ---
const LoginPage = ({ onLogin }) => {
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(id);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white shadow-lg ring-4 ring-white/10">
                <Heart fill="currentColor" size={40} className="animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl font-black text-white mb-2">BloomPath</h1>
            <p className="text-indigo-200 text-sm font-semibold tracking-widest uppercase">AI-Powered Recruitment OS</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-indigo-100 mb-2 uppercase tracking-wider ml-1">Secure ID</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-indigo-300" />
                <input type="text" value={id} onChange={(e) => setId(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 font-medium text-lg outline-none" placeholder="Enter your ID" />
              </div>
            </div>
            <button onClick={handleSubmit} className="w-full flex items-center justify-center py-4 rounded-2xl shadow-xl text-base font-bold text-indigo-900 bg-white hover:bg-indigo-50 transition-all hover:scale-[1.02]">
              Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const GrandirDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [hqMode, setHqMode] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [nurseries, setNurseries] = useState([]);
  const [messages, setMessages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [mapZoom, setMapZoom] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, candRes, nursRes, msgRes, matchRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/candidates`),
        fetch(`${API_BASE}/nurseries`),
        fetch(`${API_BASE}/messages`),
        fetch(`${API_BASE}/matches`)
      ]);
      setStats(await statsRes.json());
      setCandidates((await candRes.json()).candidates || []);
      setNurseries((await nursRes.json()).nurseries || []);
      setMessages((await msgRes.json()).messages || []);
      setMatches((await matchRes.json()).matches || []);
      showToast("Dashboard loaded", "success");
    } catch (e) {
      showToast("Using offline mode", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const filteredJobs = useMemo(() => {
    let jobs = hqMode ? matches.filter(j => j.owner?.includes("Leslie")) : matches;
    if (searchTerm) {
      jobs = jobs.filter(j => 
        j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.creche?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return jobs;
  }, [matches, hqMode, searchTerm]);

  const validNurseries = useMemo(() => {
    let filtered = mockNurseries;
    if (filters.urgency) filtered = filtered.filter(n => n.urgency === filters.urgency);
    if (filters.location) filtered = filtered.filter(n => n.location === filters.location);
    return filtered;
  }, [filters]);

  const qualifiedCandidates = useMemo(() => {
    return candidates.filter(c => 
      (c.grandir_status?.includes("ENTRETIEN")) || (c.diplomas?.includes("Auxiliaire"))
    ).map(c => ({
      ...c,
      vip: c.grandir_status?.includes("URGENT"),
      assignedNursery: mockNurseries[Math.floor(Math.random() * mockNurseries.length)],
      commute: { time: Math.floor(Math.random() * 30) + 5, type: Math.random() > 0.5 ? "transit" : "bike" }
    }));
  }, [candidates]);

  const handleLocate = (lat, lng) => {
    setMapCenter([lat, lng]);
    setMapZoom(14);
    setActiveTab("map");
    showToast("Location found", "success");
  };

  const handleOpenCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = (updatedData) => {
    // Update the candidate in your candidates array
    setCandidates(prev => prev.map(c => c.ref === updatedData.ref ? updatedData : c));
    showToast("Candidate updated successfully", "success");
  };

  const funnelData = [
    { name: 'Applications', value: stats?.total_candidates || 250, color: '#6366f1' },
    { name: 'Qualified', value: stats?.cat1Qualified || 180, color: '#8b5cf6' },
    { name: 'Interviewing', value: stats?.vip_candidates || 75, color: '#ec4899' },
    { name: 'Hired', value: 28, color: '#10b981' }
  ];

  const performanceData = [
    { month: 'Jan', hired: 12, target: 15 },
    { month: 'Feb', hired: 18, target: 15 },
    { month: 'Mar', hired: 22, target: 20 },
    { month: 'Apr', hired: 28, target: 25 },
    { month: 'May', hired: 24, target: 25 }
  ];

  if (!user) return <LoginPage onLogin={(id) => { setUser(id); if (id.toLowerCase().includes("leslie")) setHqMode(true); }} />;
  
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-indigo-900 font-bold text-lg mt-6 animate-pulse">Initializing AI Engine...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* HEADER */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-2 rounded-lg shadow-md">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600">BloomPath</h1>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {user}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => showToast("Refreshing...", "info")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw size={18} className="text-slate-600"/>
          </button>
          <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">
            <Download size={16}/> Export
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setHqMode(false)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!hqMode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Global</button>
            <button onClick={() => setHqMode(true)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${hqMode ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>HQ</button>
          </div>
          <button onClick={() => setUser(null)} className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50">Exit</button>
        </div>
      </div>

      {/* TABS */}
      <div className="px-8 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex gap-8">
          {['overview', 'analytics', 'workload', 'qualified', 'communication', 'map'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-sm font-extrabold uppercase tracking-wide border-b-[3px] transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Export Button for Overview */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time recruitment metrics</p>
              </div>
              <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Download size={18}/> Export Data
              </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 w-fit mb-4"><Users size={24}/></div>
                <h3 className="text-4xl font-extrabold text-slate-800">{stats?.total_candidates || 0}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">Candidates</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <AlertTriangle size={24} className="mb-4"/>
                <h3 className="text-4xl font-extrabold">{stats?.red_alert_count || 0}</h3>
                <p className="text-xs font-bold uppercase mt-1 opacity-90">Critical</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <Sparkles size={24} className="mb-4"/>
                <h3 className="text-4xl font-extrabold">{stats?.vip_candidates || 0}</h3>
                <p className="text-xs font-bold uppercase mt-1 opacity-90">VIP Pipeline</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <Target size={24} className="mb-4"/>
                <h3 className="text-4xl font-extrabold">92%</h3>
                <p className="text-xs font-bold uppercase mt-1 opacity-90">Match Rate</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={20} className="text-indigo-500"/>Live Recruitment Progress</h3>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Real-time</span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer>
                    <AreaChart data={funnelData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}}/>
                      <ReTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}/>
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <AIRecommendations/>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500"/>Performance vs Target</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="month" axisLine={false} tickLine={false}/>
                      <YAxis axisLine={false} tickLine={false}/>
                      <ReTooltip/>
                      <Line type="monotone" dataKey="hired" stroke="#6366f1" strokeWidth={3}/>
                      <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Target size={20} className="text-purple-500"/>Skills Radar</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <RadarChart data={[
                      { skill: 'CAP PE', value: 85 },
                      { skill: 'Experience', value: 72 },
                      { skill: 'Availability', value: 90 },
                      { skill: 'Location', value: 68 },
                      { skill: 'Motivation', value: 88 }
                    ]}>
                      <PolarGrid stroke="#e2e8f0"/>
                      <PolarAngleAxis dataKey="skill" tick={{fontSize: 12, fontWeight: 600}}/>
                      <PolarRadiusAxis angle={90} domain={[0, 100]}/>
                      <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKLOAD */}
        {activeTab === 'workload' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search jobs..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"/>
              </div>
              <div className="flex gap-3">
                {selectedItems.size > 0 && (
                  <button onClick={() => { showToast(`Exported ${selectedItems.size} items`, "success"); setSelectedItems(new Set()); }} className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm">
                    <Download size={16}/> Export ({selectedItems.size})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs uppercase text-slate-500 font-bold">
                    <th className="px-6 py-4">
                      <input type="checkbox" className="rounded"/>
                    </th>
                    <th className="px-6 py-4">Urgency</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Nursery</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.slice(0, 50).map((job, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded"/>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.urgency?.includes('Red') ? 'bg-red-100 text-red-700' : job.urgency?.includes('Orange') ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {job.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{job.title}</td>
                      <td className="px-6 py-4 text-slate-500">{job.creche}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleLocate(48.8566, 2.3522)} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                          <MapPin size={12}/> Locate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUALIFIED */}
        {activeTab === 'qualified' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Qualified Talent Pool</h2>
              <p className="text-slate-500 text-sm mt-1">{qualifiedCandidates.length} high-priority candidates</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qualifiedCandidates.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all relative cursor-pointer" onClick={() => handleOpenCandidate(c)}>
                  {c.vip && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <Star size={12} fill="currentColor"/>VIP
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md ${i % 3 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : i % 3 === 1 ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                      {c.ref?.substring(0,2) || "C"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">#{c.ref}</h3>
                      <button onClick={(e) => { e.stopPropagation(); handleLocate(c.assignedNursery.lat, c.assignedNursery.lng); }} className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline mt-1">
                        <MapPin size={10}/> {c.assignedNursery.location}
                      </button>
                      <p className="text-xs text-slate-500 mt-1">Click to view full profile</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl mb-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${c.commute.time < 20 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Clock size={16}/>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Commute</p>
                      <p className={`text-sm font-bold ${c.commute.time < 20 ? 'text-green-700' : 'text-slate-700'}`}>{c.commute.time} mins</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={(e) => { e.stopPropagation(); showToast("Calling...", "info"); }} className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700">
                      <Phone size={14}/> Call
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); showToast("Email sent", "success"); }} className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50">
                      <Mail size={14}/> Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNICATION */}
        {activeTab === 'communication' && (
          <div className="flex h-[680px] gap-6">
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <MessageSquare size={20} className="text-indigo-600" /> AI Inbox
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mt-1">{messages.length} conversations</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> LIVE
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">No messages yet</div>
                ) : messages.map((m, i) => (
                  <div key={i} className={`p-4 cursor-pointer transition-all border-b border-slate-50 relative ${i === 0 ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                    {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>}
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${i === 0 ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        {m.name?.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`font-bold text-sm truncate ${i===0 ? 'text-indigo-900':'text-slate-700'}`}>{m.name}</span>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">10:30 AM</span>
                        </div>
                        <p className={`text-xs truncate leading-relaxed ${i===0 ? 'text-indigo-700 font-medium':'text-slate-500'}`}>{m.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-2/3 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col relative overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur-md z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                      {messages[0]?.name?.substring(0,2).toUpperCase() || "AB"}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{messages[0]?.name || "Candidate"}</h2>
                    <p className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                      <Sparkles size={10}/> AI-Matched Candidate
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast("Scheduling interview...", "info")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <Calendar size={14}/> Schedule Interview
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto space-y-6">
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">TODAY 10:29 AM</span>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-indigo-600"/>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-md">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Bonjour,<br/><br/>Félicitations ! Votre profil correspond parfaitement à un poste urgent. Souhaitez-vous un entretien ?
                    </p>
                    <span className="text-[10px] font-bold text-indigo-300 mt-2 block">BLOOMPATH AI</span>
                  </div>
                </div>

                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {messages[0]?.name?.substring(0,2).toUpperCase() || "AB"}
                  </div>
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-xs">
                    <p className="text-sm font-medium leading-relaxed">Oui, je suis disponible !</p>
                    <span className="text-[10px] text-indigo-200 mt-2 block text-right">Read 10:35 AM</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative">
                  <input type="text" placeholder="Type a message..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"/>
                  <button className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    <Send size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAP */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 h-[700px] overflow-hidden relative">
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-slate-100 max-w-xs">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm"><Layers size={16} className="text-indigo-500"/>Network Overview</h4>
              <div className="space-y-3 text-xs font-bold uppercase">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-100"></span>
                    <span>Critical</span>
                  </div>
                  <span className="text-slate-400 font-mono">{validNurseries.filter(n => n.urgency === 'Red').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-100"></span>
                    <span>High</span>
                  </div>
                  <span className="text-slate-400 font-mono">{validNurseries.filter(n => n.urgency === 'Orange').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-100"></span>
                    <span>Stable</span>
                  </div>
                  <span className="text-slate-400 font-mono">{validNurseries.filter(n => n.urgency === 'Green').length}</span>
                </div>
              </div>
            </div>

            <MapContainer center={mapCenter} zoom={6} style={{height: "100%", width: "100%"}} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <MapFlyTo center={mapCenter} zoom={mapZoom}/>
              
              {validNurseries.map((n, i) => (
                <Marker key={i} position={[n.lat, n.lng]} icon={createIcon(urgencyColor(n.urgency), 10)}>
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <h5 className="font-bold text-sm mb-1">{n.name}</h5>
                      <p className="text-xs text-slate-500 mb-2">{n.location}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${n.urgency === 'Red' ? 'bg-red-100 text-red-700' : n.urgency === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {n.urgency}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">{n.staffing}%</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} data={stats}/>
      <CandidateDetailModal 
        isOpen={isCandidateModalOpen} 
        onClose={() => setIsCandidateModalOpen(false)} 
        candidate={selectedCandidate} 
        onSave={handleSaveCandidate}
      />
    </div>
  );
};

export default GrandirDashboard;