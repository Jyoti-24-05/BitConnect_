// client/src/pages/explore/ExploreBITPage.jsx
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  MapPin, Plus, X, Building2, FlaskConical, UtensilsCrossed,
  Library, Dumbbell, Bus, Trees, Pencil, Trash2, Save,
  AlertCircle, Navigation, Search
} from "lucide-react";
import toast from "react-hot-toast";

// ── Default BIT Mesra places ──────────────────────────────────────────────────
const DEFAULT_PLACES = [
  { id:"d1", name:"Computer Science & Engg",   category:"department", lat:23.4125, lng:85.4405, description:"Main CS department block", isDefault:true },
  { id:"d2", name:"Electronics & Comm Engg",   category:"department", lat:23.4130, lng:85.4410, description:"ECE department", isDefault:true },
  { id:"d3", name:"Mechanical Engineering",    category:"department", lat:23.4118, lng:85.4395, description:"Mech dept block", isDefault:true },
  { id:"d4", name:"Civil Engineering",         category:"department", lat:23.4122, lng:85.4400, description:"Civil dept block", isDefault:true },
  { id:"d5", name:"Electrical Engineering",    category:"department", lat:23.4135, lng:85.4415, description:"EEE department", isDefault:true },
  { id:"d6", name:"Applied Mathematics",       category:"department", lat:23.4120, lng:85.4408, description:"Mathematics dept", isDefault:true },
  { id:"l1", name:"Central Research Lab",      category:"lab",        lat:23.4140, lng:85.4420, description:"Main research facility", isDefault:true },
  { id:"l2", name:"Computer Centre",           category:"lab",        lat:23.4128, lng:85.4398, description:"24/7 computer lab", isDefault:true },
  { id:"l3", name:"Physics Lab",              category:"lab",        lat:23.4115, lng:85.4390, description:"Applied physics laboratory", isDefault:true },
  { id:"f1", name:"Main Canteen",              category:"food",       lat:23.4112, lng:85.4385, description:"Central canteen, open 7am–10pm", isDefault:true },
  { id:"f2", name:"Boys Hostel Mess",          category:"food",       lat:23.4145, lng:85.4430, description:"Hostel dining hall", isDefault:true },
  { id:"f3", name:"Tea Stall (Gate 1)",        category:"food",       lat:23.4108, lng:85.4378, description:"Popular chai point near main gate", isDefault:true },
  { id:"f4", name:"Girls Hostel Mess",         category:"food",       lat:23.4138, lng:85.4425, description:"Girls hostel dining hall", isDefault:true },
  { id:"b1", name:"Admin Block",               category:"building",   lat:23.4123, lng:85.4402, description:"Administrative offices", isDefault:true },
  { id:"b2", name:"Auditorium",                category:"building",   lat:23.4133, lng:85.4413, description:"Main auditorium & seminar hall", isDefault:true },
  { id:"b3", name:"Central Library",           category:"library",    lat:23.4127, lng:85.4396, description:"Library open 8am–10pm", isDefault:true },
  { id:"b4", name:"Gymnasium",                 category:"sports",     lat:23.4148, lng:85.4435, description:"Indoor sports & gym facility", isDefault:true },
  { id:"b5", name:"Football Ground",           category:"sports",     lat:23.4155, lng:85.4440, description:"Main sports ground", isDefault:true },
  { id:"b6", name:"Boys Hostel Block A",       category:"building",   lat:23.4143, lng:85.4428, description:"Hostel A", isDefault:true },
  { id:"b7", name:"Boys Hostel Block B",       category:"building",   lat:23.4147, lng:85.4432, description:"Hostel B", isDefault:true },
  { id:"b8", name:"Medical Centre",            category:"building",   lat:23.4119, lng:85.4393, description:"On-campus health centre", isDefault:true },
  { id:"t1", name:"Main Gate",                 category:"transit",    lat:23.4105, lng:85.4375, description:"Primary entrance", isDefault:true },
  { id:"t2", name:"Bus Stand",                 category:"transit",    lat:23.4103, lng:85.4372, description:"Campus bus terminus", isDefault:true },
];

const CATEGORIES = [
  { key:"all",        label:"All",         icon:MapPin,          color:"#7c3aed", bg:"#ede9fe" },
  { key:"department", label:"Departments", icon:Building2,       color:"#2563eb", bg:"#dbeafe" },
  { key:"lab",        label:"Labs",        icon:FlaskConical,    color:"#0891b2", bg:"#cffafe" },
  { key:"food",       label:"Food",        icon:UtensilsCrossed, color:"#ea580c", bg:"#ffedd5" },
  { key:"library",    label:"Library",     icon:Library,         color:"#7c3aed", bg:"#ede9fe" },
  { key:"sports",     label:"Sports",      icon:Dumbbell,        color:"#16a34a", bg:"#dcfce7" },
  { key:"building",   label:"Buildings",   icon:Building2,       color:"#9333ea", bg:"#f3e8ff" },
  { key:"transit",    label:"Transit",     icon:Bus,             color:"#b45309", bg:"#fef3c7" },
  { key:"other",      label:"Other",       icon:Trees,           color:"#0f766e", bg:"#ccfbf1" },
];

const getCat = (key) => CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length-1];

const STORAGE_KEY = "bitconnect_explore_places";

const loadPlaces = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const custom = saved ? JSON.parse(saved) : [];
    return [...DEFAULT_PLACES, ...custom];
  } catch { return [...DEFAULT_PLACES]; }
};

const saveCustomPlaces = (places) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places.filter(p => !p.isDefault)));
};

// ── Place Modal ───────────────────────────────────────────────────────────────
const PlaceModal = ({ place, onSave, onClose }) => {
  const [form, setForm] = useState(place ?? { name:"", category:"other", description:"", lat:23.4123, lng:85.4399 });
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    onSave({ ...form, id: form.id ?? `custom_${Date.now()}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl scale-in overflow-hidden"
           style={{ background:"var(--card)", border:"1.5px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
             style={{ background:"linear-gradient(135deg,var(--p50),var(--p100))", borderBottom:"1px solid var(--border)" }}>
          <h3 className="font-bold text-sm" style={{ fontFamily:"Syne, sans-serif", color:"var(--tx-h)" }}>
            {place ? "Edit Place" : "Add New Place"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition" style={{ color:"var(--tx-muted)" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--p100)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--tx-muted)" }}>
              Place Name *
            </label>
            <input value={form.name} onChange={e=>set("name",e.target.value)}
                   placeholder="e.g. Innovation Lab, Gate 2 Canteen"
                   className="input-base w-full px-4 py-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--tx-muted)" }}>
              Category
            </label>
            <select value={form.category} onChange={e=>set("category",e.target.value)}
                    className="input-base w-full px-4 py-2.5 text-sm">
              {CATEGORIES.filter(c=>c.key!=="all").map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--tx-muted)" }}>
              Description
            </label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)}
                      placeholder="Hours, what's available, tips for students..."
                      rows={2} className="input-base w-full px-4 py-2.5 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--tx-muted)" }}>Latitude</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e=>set("lat",parseFloat(e.target.value))}
                     className="input-base w-full px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--tx-muted)" }}>Longitude</label>
              <input type="number" step="0.0001" value={form.lng} onChange={e=>set("lng",parseFloat(e.target.value))}
                     className="input-base w-full px-4 py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
               style={{ background:"var(--p50)", color:"var(--p600)", border:"1px solid var(--p200)" }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Google Maps → right-click any point → copy coordinates
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Place
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExploreBITPage = () => {
  const { isAdmin } = useAuth();
  const [places, setPlaces]            = useState(loadPlaces);
  const [activeCategory, setActiveCat] = useState("all");
  const [selectedPlace, setSelected]   = useState(null);
  const [showModal, setShowModal]      = useState(false);
  const [editingPlace, setEditing]     = useState(null);
  const [search, setSearch]            = useState("");

  const filtered = places.filter(p => {
    const matchCat  = activeCategory === "all" || p.category === activeCategory;
    const matchSrch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  const handleSave = (place) => {
    setPlaces(prev => {
      const next = prev.some(p => p.id === place.id)
        ? prev.map(p => p.id === place.id ? place : p)
        : [...prev, place];
      saveCustomPlaces(next);
      return next;
    });
    toast.success(editingPlace ? "Place updated! ✏️" : "Place added! 📍");
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Remove this place?")) return;
    setPlaces(prev => { const next = prev.filter(p=>p.id!==id); saveCustomPlaces(next); return next; });
    if (selectedPlace?.id === id) setSelected(null);
    toast.success("Place removed");
  };

  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (place) => { setEditing(place); setShowModal(true); };

  // embed URL for BIT Mesra
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29756.37890648316!2d85.41327!3d23.41235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4fb53f0c27be7%3A0x66180c1cf3c5e704!2sBirla%20Institute%20of%20Technology%20-%20Mesra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";

  return (
    <div className="space-y-5 fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"
              style={{ fontFamily:"Syne, sans-serif", color:"var(--tx-h)" }}>
            <MapPin className="w-6 h-6" style={{ color:"var(--p500)" }} />
            Explore BIT Mesra
          </h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--tx-muted)" }}>
            Birla Institute of Technology · Mesra, Ranchi, Jharkhand 835215
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0">
            <Plus className="w-4 h-4" /> Add Place
          </button>
        )}
      </div>

      {/* Map embed */}
      <div className="rounded-2xl overflow-hidden relative" style={{ border:"1.5px solid var(--border)" }}>
        <iframe title="BIT Mesra Campus Map" src={embedUrl}
                width="100%" height="420" style={{ border:0, display:"block" }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        {/* Campus label — top LEFT
        <div className="absolute bottom-3 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
             style={{ background:"rgba(255,255,255,0.95)", color:"var(--tx-h)", backdropFilter:"blur(8px)", border:"1px solid rgba(0,0,0,0.08)" }}>
          <Navigation className="w-3.5 h-3.5" style={{ color:"var(--p500)" }} />
          BIT Mesra
        </div> */}
        {/* Open in maps — top RIGHT, far from label */}
        <a href="https://maps.google.com/maps?q=Birla+Institute+of+Technology+Mesra+Ranchi"
           target="_blank" rel="noopener noreferrer"
           className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-transform hover:scale-105"
           style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff" }}>
          <MapPin className="w-3 h-3" /> Open in Google Maps
        </a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Total Places", value: places.length,                            color:"var(--p500)" },
          { label:"Departments",  value: places.filter(p=>p.category==="department").length, color:"#2563eb" },
          { label:"Food Spots",   value: places.filter(p=>p.category==="food").length,       color:"#ea580c" },
          { label:"Custom Added", value: places.filter(p=>!p.isDefault).length,              color:"#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card rounded-2xl p-3 text-center" style={{ background:"var(--card)" }}>
            <p className="text-xl font-bold" style={{ fontFamily:"Syne, sans-serif", color }}>{value}</p>
            <p className="text-[11px] mt-0.5" style={{ color:"var(--tx-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ key, label, icon:Icon, color, bg }) => {
          const count = key === "all" ? places.length : places.filter(p=>p.category===key).length;
          const isActive = activeCategory === key;
          return (
            <button key={key} onClick={()=>setActiveCat(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      borderRadius:"99px",
                      background: isActive ? color : bg,
                      color: isActive ? "#fff" : color,
                      border:`1.5px solid ${isActive ? color : "transparent"}`,
                      boxShadow: isActive ? `0 2px 12px ${color}50` : "none",
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                    }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:"var(--p400)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)}
               placeholder="Search departments, labs, food spots..."
               className="input-base w-full pl-10 pr-4 py-2.5 text-sm"
               style={{ borderRadius:"99px" }} />
      </div>

      {/* Places grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(place => {
          const cat = getCat(place.category);
          const Icon = cat.icon;
          const isSelected = selectedPlace?.id === place.id;

          return (
            <div key={place.id}
                 onClick={() => setSelected(isSelected ? null : place)}
                 className="rounded-2xl p-4 cursor-pointer transition-all"
                 style={{
                   background: isSelected ? cat.bg : "var(--card)",
                   border: `${isSelected ? "2px" : "1.5px"} solid ${isSelected ? cat.color : "var(--border)"}`,
                   boxShadow: isSelected ? `0 4px 20px ${cat.color}25` : "var(--shadow-sm)",
                   transform: isSelected ? "translateY(-2px)" : "none",
                 }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: cat.bg }}>
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm leading-tight"
                       style={{ color:"var(--tx-h)", fontFamily:"Syne, sans-serif" }}>
                      {place.name}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize"
                          style={{ background:cat.bg, color:cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                  {place.description && (
                    <p className="text-xs line-clamp-2" style={{ color:"var(--tx-muted)" }}>
                      {place.description}
                    </p>
                  )}
                  <a href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
                     target="_blank" rel="noopener noreferrer"
                     onClick={e=>e.stopPropagation()}
                     className="inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5 hover:underline"
                     style={{ color: cat.color }}>
                    <Navigation className="w-3 h-3" /> Get Directions
                  </a>
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={e=>{ e.stopPropagation(); openEdit({...place, isDefault:false}); }}
                            className="p-1.5 rounded-lg transition"
                            style={{ color:"var(--p400)" }}
                            onMouseEnter={e=>e.currentTarget.style.background="var(--p100)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                            title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!place.isDefault && (
                      <button onClick={e=>{ e.stopPropagation(); handleDelete(place.id); }}
                              className="p-1.5 rounded-lg transition"
                              style={{ color:"var(--tx-muted)" }}
                              onMouseEnter={e=>{ e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.color="var(--danger)"; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--tx-muted)"; }}
                              title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 card rounded-2xl text-center py-14" style={{ background:"var(--card)" }}>
            <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color:"var(--border)" }} />
            <p className="font-semibold" style={{ color:"var(--tx-h)", fontFamily:"Syne, sans-serif" }}>No places found</p>
            <p className="text-sm mt-1" style={{ color:"var(--tx-muted)" }}>
              {isAdmin ? 'Click "Add Place" to mark a new location' : "Try a different filter or search"}
            </p>
          </div>
        )}
      </div>

      {/* Admin info banner */}
      {isAdmin && (
        <div className="card rounded-2xl p-4 flex items-center gap-3"
             style={{ background:"linear-gradient(135deg,var(--p50),var(--p100))", border:"1.5px solid var(--p200)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color:"var(--p700)", fontFamily:"Syne, sans-serif" }}>
              Admin · Campus Map Manager
            </p>
            <p className="text-xs mt-0.5" style={{ color:"var(--p500)" }}>
              {places.filter(p=>!p.isDefault).length} custom places added · Use ✏️ to edit any place · 🗑️ to remove custom ones · Custom places persist in browser storage
            </p>
          </div>
        </div>
      )}

      {showModal && (
        <PlaceModal
          place={editingPlace}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
};

export default ExploreBITPage;
