// client/src/components/clubs/ClubCard.jsx
import { Link }       from "react-router-dom";
import { Users, Lock } from "lucide-react";
import { ClubLogo }   from "@/pages/clubs/ClubsPage";
import cn             from "@/utils/cn";

const CATEGORY_COLORS = {
  technical:  "bg-blue-50   text-blue-700",
  cultural:   "bg-pink-50   text-pink-700",
  sports:     "bg-green-50  text-green-700",
  academic:   "bg-amber-50  text-amber-700",
  social:     "bg-purple-50 text-purple-700",
  other:      "bg-gray-100  text-gray-600",
};

const ClubCard = ({ club, status, onJoin, onLeave }) => {
  const isJoined  = status === "joined";
  const isPending = status === "pending";

  return (
    <article className="bg-white rounded-2xl border border-gray-100
                        shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Banner strip */}
      <div className="h-16 bg-gradient-to-r from-indigo-50 to-purple-50
                      relative">
        {club.banner?.url && (
          <img
            src={club.banner.url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        {/* Logo overlapping banner */}
        <div className="absolute -bottom-5 left-4">
          <ClubLogo club={club} size="md" />
        </div>
      </div>

      <div className="pt-8 px-4 pb-4">
        {/* Name + verified */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            to={`/clubs/${club.slug}`}
            className="font-semibold text-gray-900 hover:text-indigo-600
                       transition line-clamp-1"
          >
            {club.name}
            {club.isVerified && (
              <span className="ml-1 text-indigo-500 text-xs">✓</span>
            )}
          </Link>
          {club.isPrivate && (
            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Category badge + member count */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize",
            CATEGORY_COLORS[club.category] ?? CATEGORY_COLORS.other
          )}>
            {club.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {club.memberCount ?? 0} members
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {club.description}
        </p>

        {/* Tags */}
        {club.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {club.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-indigo-500 bg-indigo-50
                           px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Join / leave button */}
        {isJoined ? (
          <div className="flex gap-2">
            <Link
              to={`/clubs/${club.slug}`}
              className="flex-1 text-center py-2 bg-indigo-50 text-indigo-700
                         text-xs font-medium rounded-xl hover:bg-indigo-100
                         transition"
            >
              View club
            </Link>
            <button
              onClick={() => onLeave(club)}
              className="px-3 py-2 text-xs text-gray-400 border border-gray-200
                         rounded-xl hover:text-red-500 hover:border-red-200
                         transition"
            >
              Leave
            </button>
          </div>
        ) : isPending ? (
          <button
            disabled
            className="w-full py-2 bg-amber-50 text-amber-700 text-xs
                       font-medium rounded-xl border border-amber-100
                       cursor-not-allowed"
          >
            Request sent · Pending approval
          </button>
        ) : (
          <button
            onClick={() => onJoin(club)}
            className="w-full py-2 bg-indigo-600 text-white text-xs
                       font-medium rounded-xl hover:bg-indigo-700 transition"
          >
            {club.isPrivate ? "Request to join" : "Join club"}
          </button>
        )}
      </div>
    </article>
  );
};

export default ClubCard;