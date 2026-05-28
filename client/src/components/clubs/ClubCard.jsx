// client/src/components/clubs/ClubCard.jsx
import { Link }       from "react-router-dom";
import { Users, Lock } from "lucide-react";
import { ClubLogo }   from "@/pages/clubs/ClubsPage";
import cn             from "@/utils/cn";

const CATEGORY_STYLES = {
  technical:  { cls: "badge-blue",   emoji: "💻" },
  cultural:   { cls: "badge-pink",   emoji: "🎭" },
  sports:     { cls: "badge-green",  emoji: "⚽" },
  academic:   { cls: "badge-amber",  emoji: "📚" },
  social:     { cls: "badge-purple", emoji: "👥" },
  other:      { cls: "badge",        emoji: "📌" },
};

const ClubCard = ({ club, status, onJoin, onLeave }) => {
  const isJoined  = status === "joined";
  const isPending = status === "pending";
  const clubPath  = `/clubs/${club.slug ?? club._id}`;
  const catStyle  = CATEGORY_STYLES[club.category] ?? CATEGORY_STYLES.other;

  return (
    <article className="card card-lift rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
      {/* Banner */}
      <div className="h-20 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, var(--p100), var(--p200))" }}>
        {club.banner?.url && (
          <img src={club.banner.url} alt="" className="w-full h-full object-cover" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.12))" }} />
        {/* Logo */}
        <div className="absolute -bottom-5 left-4">
          <ClubLogo club={club} size="md" />
        </div>
        {/* Private badge */}
        {club.isPrivate && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
               style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
            <Lock className="w-3 h-3" />
            <span className="text-[10px] font-semibold">Private</span>
          </div>
        )}
      </div>

      <div className="pt-8 px-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={clubPath}
                className="font-bold text-sm line-clamp-1 hover:text-purple-600 transition-colors flex items-center gap-1"
                style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
            {club.name}
            {club.isVerified && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px]"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>✓</span>
            )}
          </Link>
          <span className={`badge ${catStyle.cls} capitalize shrink-0`}>
            {catStyle.emoji} {club.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5" style={{ color: "var(--tx-muted)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--tx-muted)" }}>
            {club.memberCount ?? 0} members
          </span>
        </div>

        <p className="text-xs line-clamp-2 mb-3 leading-relaxed" style={{ color: "var(--tx-muted)" }}>
          {club.description}
        </p>

        {club.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {club.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag-chip text-[10px] py-0.5">#{tag}</span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {isJoined ? (
          <div className="flex gap-2">
            <Link to={clubPath}
                  className="flex-1 text-center py-2 text-xs font-semibold transition-colors btn-ghost"
                  style={{ textDecoration: "none" }}>
              View club
            </Link>
            <button onClick={() => onLeave(club)}
                    className="px-3 py-2 text-xs transition-all"
                    style={{
                      borderRadius: "var(--r)",
                      border: "1.5px solid var(--border)",
                      color: "var(--tx-muted)",
                      background: "transparent",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--tx-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              Leave
            </button>
          </div>
        ) : isPending ? (
          <button disabled
                  className="w-full py-2 text-xs font-semibold cursor-not-allowed"
                  style={{ background: "#fef3c7", color: "#92400e", borderRadius: "var(--r)", border: "1.5px solid #fde68a" }}>
             Request pending
          </button>
        ) : (
          <button onClick={() => onJoin(club)}
                  className="btn-primary w-full py-2 text-xs">
            {club.isPrivate ? "🔒 Request to join" : "Join club"}
          </button>
        )}
      </div>
    </article>
  );
};
export default ClubCard;
