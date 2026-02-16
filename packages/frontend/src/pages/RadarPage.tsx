import { useEffect, useState, useCallback, useMemo, FormEvent } from "react";
import { api } from "../services/api";
import {
  Radar, Plus, X, Trash2, History, ArrowUpRight, ArrowDownRight,
  Calendar, ArrowLeft,
  Minus, ChevronRight, Pencil, Loader2, Zap, Search
} from "lucide-react";

// Types
interface BlipHistory {
  id: number;
  blipId: number;
  fromRing: string | null;
  toRing: string;
  note: string | null;
  createdAt: string;
}

interface CompetencyArea {
  id: number;
  name: string;
  category: string | null;
}

interface RadarBlip {
  id: number;
  name: string;
  quadrant: string;
  ring: string;
  description: string | null;
  rationale: string | null;
  competencyAreaId: number | null;
  competencyArea: CompetencyArea | null;
  history: BlipHistory[];
  createdAt: string;
  updatedAt: string;
}

type BlipStatus = "new" | "moved-in" | "moved-out" | "unchanged";

const QUADRANTS = [
  { key: "Nettverksteknologi", label: "Nettverksteknologi", icon: "◈", angle: 0 },
  { key: "Plattformer/systemer", label: "Plattformer", icon: "◉", angle: 90 },
  { key: "Verktøy", label: "Verktøy", icon: "◆", angle: 180 },
  { key: "Metoder/prosesser", label: "Metoder", icon: "◇", angle: 270 },
] as const;

const RINGS = [
  { key: "adopt", label: "Adopt", color: "#059669", desc: "Anbefalt – bruk dette" },
  { key: "trial", label: "Trial", color: "#0284c7", desc: "Prøves ut, lovende" },
  { key: "assess", label: "Assess", color: "#d97706", desc: "Verdt å undersøke" },
  { key: "hold", label: "Hold", color: "#dc2626", desc: "Avvent / utdatert" },
] as const;

const QUADRANT_COLORS: Record<string, string> = {
  "Nettverksteknologi": "#0284c7",
  "Plattformer/systemer": "#059669",
  "Verktøy": "#d97706",
  "Metoder/prosesser": "#4f46e5",
};

const TIME_PERIODS = [
  { days: 30, label: "30 dager" },
  { days: 60, label: "60 dager" },
  { days: 90, label: "90 dager" },
  { days: 180, label: "180 dager" },
];

const STATUS_META: Record<BlipStatus, { label: string; color: string; icon: string }> = {
  "new": { label: "Ny", color: "#059669", icon: "▲" },
  "moved-in": { label: "Flyttet inn", color: "#0284c7", icon: "◄" },
  "moved-out": { label: "Flyttet ut", color: "#dc2626", icon: "►" },
  "unchanged": { label: "Uendret", color: "#6b7a94", icon: "●" },
};

function ringIndex(ring: string): number {
  return RINGS.findIndex(r => r.key === ring);
}

function ringColor(ring: string): string {
  return RINGS.find(r => r.key === ring)?.color || "#888";
}

// Compute blip status from history within a time window
function computeBlipStatus(blip: RadarBlip, periodDays: number): BlipStatus {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const createdAt = new Date(blip.createdAt);
  if (createdAt >= cutoff) return "new";

  // Find most recent ring change within the period
  const recentChanges = blip.history
    .filter(h => h.fromRing !== null && new Date(h.createdAt) >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (recentChanges.length > 0) {
    const latest = recentChanges[0];
    const fromIdx = ringIndex(latest.fromRing!);
    const toIdx = ringIndex(latest.toRing);
    // Lower index = closer to center = moved in (toward adopt)
    return toIdx < fromIdx ? "moved-in" : "moved-out";
  }

  return "unchanged";
}

// Deterministic blip position within its quadrant+ring sector
function blipPosition(blip: RadarBlip, allBlips: RadarBlip[], size: number): { x: number; y: number } {
  const center = size / 2;
  const maxR = center - 36;

  const ri = ringIndex(blip.ring);
  const ringInner = ri === 0 ? 0 : (ri / 4) * maxR;
  const ringOuter = ((ri + 1) / 4) * maxR;
  const ringMid = (ringInner + ringOuter) / 2;
  const ringWidth = ringOuter - ringInner;

  const qi = QUADRANTS.findIndex(q => q.key === blip.quadrant);
  const startAngle = qi * 90 + 6;
  const endAngle = (qi + 1) * 90 - 6;

  const sameGroup = allBlips.filter(b => b.quadrant === blip.quadrant && b.ring === blip.ring);
  const idx = sameGroup.indexOf(blip);
  const count = sameGroup.length;
  const angleSpread = endAngle - startAngle;
  const angle = startAngle + (count === 1 ? angleSpread / 2 : (idx / (count - 1)) * angleSpread);

  // Dynamic radial jitter: spread across ring width to avoid overlap
  const jitterRange = Math.min(ringWidth * 0.35, 18);
  let rJitter = 0;
  if (count > 1) {
    // Distribute evenly across ring band using 3 lanes
    const lane = idx % 3;
    rJitter = lane === 0 ? -jitterRange : lane === 1 ? jitterRange : 0;
  }
  const r = ringMid + rJitter;

  const rad = (angle * Math.PI) / 180;
  return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
}

// Half-arc blip positions (for quadrant detail view)
function halfArcBlipPosition(blip: RadarBlip, allBlips: RadarBlip[], width: number, height: number): { x: number; y: number } {
  const centerX = 50;
  const centerY = height / 2;
  const maxR = Math.min(width - 80, height / 2 - 20);

  const ri = ringIndex(blip.ring);
  const ringInner = ri === 0 ? 0 : (ri / 4) * maxR;
  const ringOuter = ((ri + 1) / 4) * maxR;
  const ringMid = (ringInner + ringOuter) / 2;
  const ringWidth = ringOuter - ringInner;

  const sameGroup = allBlips.filter(b => b.ring === blip.ring);
  const idx = sameGroup.indexOf(blip);
  const count = sameGroup.length;

  const startAngle = -80;
  const endAngle = 80;
  const angleSpread = endAngle - startAngle;
  const angle = startAngle + (count === 1 ? angleSpread / 2 : (idx / (count - 1)) * angleSpread);

  const jitterRange = Math.min(ringWidth * 0.3, 14);
  let rJitter = 0;
  if (count > 1) {
    const lane = idx % 3;
    rJitter = lane === 0 ? -jitterRange : lane === 1 ? jitterRange : 0;
  }
  const r = ringMid + rJitter;

  const rad = (angle * Math.PI) / 180;
  return { x: centerX + r * Math.cos(rad), y: centerY + r * Math.sin(rad) };
}

// SVG shape for a blip based on its status
function BlipShape({ x, y, status, color, isSelected, ringKey }: {
  x: number; y: number; status: BlipStatus; color: string;
  isSelected: boolean; ringKey: string;
}) {
  const s = isSelected ? 10 : 7;
  const statusColor = STATUS_META[status].color;

  switch (status) {
    case "new":
      // Filled triangle pointing up
      return (
        <g>
          {isSelected && (
            <polygon
              points={`${x},${y - s - 5} ${x + s + 4},${y + s + 2} ${x - s - 4},${y + s + 2}`}
              fill="none" stroke={color} strokeWidth="1" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </polygon>
          )}
          <polygon
            points={`${x},${y - s} ${x + s},${y + s * 0.6} ${x - s},${y + s * 0.6}`}
            fill={color} opacity={isSelected ? 1 : 0.9}
            stroke={statusColor} strokeWidth="1.5"
            filter={isSelected ? `url(#glow-${ringKey})` : undefined}
          />
        </g>
      );
    case "moved-in":
      // Diamond / rotated square pointing inward
      return (
        <g>
          {isSelected && (
            <circle cx={x} cy={y} r={s + 5} fill="none" stroke={color} strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values={`${s + 3};${s + 7};${s + 3}`} dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          <polygon
            points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
            fill={color} opacity={isSelected ? 1 : 0.9}
            stroke={statusColor} strokeWidth="1.5"
            filter={isSelected ? `url(#glow-${ringKey})` : undefined}
          />
        </g>
      );
    case "moved-out":
      // Square
      return (
        <g>
          {isSelected && (
            <rect x={x - s - 4} y={y - s - 4} width={(s + 4) * 2} height={(s + 4) * 2}
              fill="none" stroke={color} strokeWidth="1" opacity="0.3" rx="1">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </rect>
          )}
          <rect x={x - s + 1} y={y - s + 1} width={(s - 1) * 2} height={(s - 1) * 2}
            fill={color} opacity={isSelected ? 1 : 0.9} rx="1"
            stroke={statusColor} strokeWidth="1.5"
            filter={isSelected ? `url(#glow-${ringKey})` : undefined}
          />
        </g>
      );
    default:
      // Circle for unchanged
      return (
        <g>
          {isSelected && (
            <circle cx={x} cy={y} r={s + 5} fill="none" stroke={color} strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values={`${s + 3};${s + 7};${s + 3}`} dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={x} cy={y} r={s}
            fill={color} opacity={isSelected ? 1 : 0.85}
            filter={isSelected ? `url(#glow-${ringKey})` : undefined}
          />
        </g>
      );
  }
}

// Glow filter definitions (shared between full radar and half-arc)
function GlowFilters() {
  return <>
    {RINGS.map(r => (
      <filter id={`glow-${r.key}`} key={r.key} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor={r.color} floodOpacity="0.4" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    ))}
  </>;
}

// Full Radar SVG
function RadarSvg({
  blips, statusMap, selectedBlip, onSelectBlip, highlightQuadrant, highlightRing,
  onQuadrantClick,
}: {
  blips: RadarBlip[]; statusMap: Map<number, BlipStatus>;
  selectedBlip: RadarBlip | null; onSelectBlip: (b: RadarBlip) => void;
  highlightQuadrant: string | null; highlightRing: string | null;
  onQuadrantClick: (q: string) => void;
}) {
  const size = 700;
  const center = size / 2;
  const maxR = center - 36;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="select-none w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(2,132,199,0.04)" />
          <stop offset="100%" stopColor="rgba(2,132,199,0.01)" />
        </radialGradient>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,132,199,0)" />
          <stop offset="50%" stopColor="rgba(2,132,199,0.1)" />
          <stop offset="100%" stopColor="rgba(2,132,199,0)" />
        </linearGradient>
        <GlowFilters />
      </defs>

      {/* Background */}
      <circle cx={center} cy={center} r={maxR} fill="url(#radarBg)" />

      {/* Quadrant background wedges – subtle colored fills */}
      {QUADRANTS.map((q, i) => {
        const startA = (i * 90 * Math.PI) / 180;
        const endA = ((i + 1) * 90 * Math.PI) / 180;
        const isHighlighted = highlightQuadrant === q.key;
        const qColor = QUADRANT_COLORS[q.key];
        const x1 = center + maxR * Math.cos(startA);
        const y1 = center + maxR * Math.sin(startA);
        const x2 = center + maxR * Math.cos(endA);
        const y2 = center + maxR * Math.sin(endA);
        return (
          <path key={`qbg-${q.key}`}
            d={`M ${center} ${center} L ${x1} ${y1} A ${maxR} ${maxR} 0 0 1 ${x2} ${y2} Z`}
            fill={qColor} opacity={isHighlighted ? 0.06 : 0.02}
            style={{ cursor: "pointer", transition: "opacity 0.3s" }}
            onClick={() => onQuadrantClick(q.key)}
          />
        );
      })}

      {/* Ring circles */}
      {RINGS.map((ring, i) => {
        const r = ((i + 1) / 4) * maxR;
        const isHighlighted = highlightRing === ring.key;
        return (
          <circle key={ring.key} cx={center} cy={center} r={r}
            fill="none" stroke={isHighlighted ? ring.color : "rgba(180,195,215,0.5)"}
            strokeWidth={isHighlighted ? 1.5 : 0.8}
            strokeDasharray={isHighlighted ? "none" : "4 8"}
            opacity={isHighlighted ? 0.7 : 0.4}
          />
        );
      })}

      {/* Ring labels along diagonal */}
      {RINGS.map((ring, i) => {
        const r = (i === 0 ? 0.5 : i + 0.5) / 4 * maxR;
        const angle = -45 * Math.PI / 180;
        return (
          <text key={`rl-${ring.key}`}
            x={center + r * Math.cos(angle)} y={center + r * Math.sin(angle)}
            fill={ring.color} opacity={0.6} fontSize="10"
            fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="middle"
            style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {ring.label}
          </text>
        );
      })}

      {/* Quadrant divider lines – gradient stroke */}
      {QUADRANTS.map((_q, i) => {
        const angle = (i * 90 * Math.PI) / 180;
        return (
          <line key={`div-${i}`}
            x1={center} y1={center}
            x2={center + maxR * Math.cos(angle)} y2={center + maxR * Math.sin(angle)}
            stroke="rgba(180,195,215,0.6)" strokeWidth="1"
          />
        );
      })}

      {/* Quadrant labels – larger, positioned in outer band */}
      {QUADRANTS.map((q, i) => {
        const midAngle = ((i * 90 + 45) * Math.PI) / 180;
        const lr = maxR * 0.85;
        const lx = center + lr * Math.cos(midAngle);
        const ly = center + lr * Math.sin(midAngle);
        const isHighlighted = highlightQuadrant === q.key;
        const qColor = QUADRANT_COLORS[q.key];
        return (
          <g key={`ql-${q.key}`} onClick={() => onQuadrantClick(q.key)} style={{ cursor: "pointer" }}>
            {/* Label background pill */}
            <rect x={lx - 56} y={ly - 10} width={112} height={20} rx={5}
              fill={isHighlighted ? `${qColor}18` : "rgba(244,246,250,0.8)"}
              stroke={isHighlighted ? `${qColor}40` : "transparent"} strokeWidth="0.5"
            />
            <text x={lx} y={ly}
              fill={isHighlighted ? qColor : "rgba(107,122,148,0.8)"}
              fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="600"
              textAnchor="middle" dominantBaseline="middle"
              style={{ textTransform: "uppercase", letterSpacing: "0.06em", transition: "fill 0.3s" }}>
              {q.label.length > 14 ? q.label.substring(0, 14) + "…" : q.label}
            </text>
          </g>
        );
      })}

      {/* Scan sweep */}
      <g opacity="0.25">
        <line x1={center} y1={center} x2={center + maxR} y2={center}
          stroke="url(#scanGrad)" strokeWidth="1"
          style={{ transformOrigin: `${center}px ${center}px`, animation: "radar-sweep 10s linear infinite" }}
        />
        <path
          d={`M ${center} ${center} L ${center + maxR} ${center} A ${maxR} ${maxR} 0 0 0 ${center + maxR * Math.cos(-0.12)} ${center + maxR * Math.sin(-0.12)} Z`}
          fill="rgba(2,132,199,0.02)"
          style={{ transformOrigin: `${center}px ${center}px`, animation: "radar-sweep 10s linear infinite" }}
        />
      </g>

      {/* Center dot */}
      <circle cx={center} cy={center} r="3.5" fill="var(--color-fiber)" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Blips */}
      {blips.map(blip => {
        const pos = blipPosition(blip, blips, size);
        const isSelected = selectedBlip?.id === blip.id;
        const isDimmed = (highlightQuadrant && blip.quadrant !== highlightQuadrant) ||
          (highlightRing && blip.ring !== highlightRing);
        const color = ringColor(blip.ring);
        const status = statusMap.get(blip.id) || "unchanged";

        return (
          <g key={blip.id} onClick={(e) => { e.stopPropagation(); onSelectBlip(blip); }}
            style={{ cursor: "pointer", transition: "opacity 0.3s" }}
            opacity={isDimmed ? 0.12 : 1}>
            <BlipShape x={pos.x} y={pos.y} status={status} color={color}
              isSelected={isSelected} ringKey={blip.ring} />
            {/* Label */}
            <text x={pos.x} y={pos.y - 13} fill="var(--color-heading)"
              fontSize="10" fontFamily="var(--font-mono)" fontWeight="600"
              textAnchor="middle" dominantBaseline="auto"
              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.6)" }}>
              {blip.name.length > 16 ? blip.name.substring(0, 14) + "…" : blip.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Half-Arc SVG for single quadrant detail
function HalfArcSvg({
  blips, statusMap, quadrant, selectedBlip, onSelectBlip,
}: {
  blips: RadarBlip[]; statusMap: Map<number, BlipStatus>; quadrant: string;
  selectedBlip: RadarBlip | null; onSelectBlip: (b: RadarBlip) => void;
}) {
  const width = 800;
  const height = 560;
  const centerX = 60;
  const centerY = height / 2;
  const maxR = Math.min(width - 100, height / 2 - 20);
  const qColor = QUADRANT_COLORS[quadrant];
  const quadrantBlips = blips.filter(b => b.quadrant === quadrant);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="select-none w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <GlowFilters />
        <radialGradient id="halfArcBg" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor={`${qColor}08`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Background arc */}
      <path d={`M ${centerX} ${centerY - maxR} A ${maxR} ${maxR} 0 0 1 ${centerX} ${centerY + maxR}`}
        fill="url(#halfArcBg)" stroke="none" />

      {/* Ring arcs */}
      {RINGS.map((ring, i) => {
        const r = ((i + 1) / 4) * maxR;
        const topY = centerY - r;
        const botY = centerY + r;
        return (
          <g key={ring.key}>
            <path d={`M ${centerX} ${topY} A ${r} ${r} 0 0 1 ${centerX} ${botY}`}
              fill="none" stroke={`${ring.color}50`} strokeWidth="1"
              strokeDasharray="4 8"
            />
            {/* Ring label on right side */}
            <text x={centerX + r + 6} y={centerY}
              fill={ring.color} opacity="0.7" fontSize="10"
              fontFamily="var(--font-mono)" fontWeight="500"
              textAnchor="start" dominantBaseline="middle"
              style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {ring.label}
            </text>
          </g>
        );
      })}

      {/* Center line */}
      <line x1={centerX} y1={centerY - maxR} x2={centerX} y2={centerY + maxR}
        stroke={`${qColor}35`} strokeWidth="1" />

      {/* Blips */}
      {quadrantBlips.map(blip => {
        const pos = halfArcBlipPosition(blip, quadrantBlips, width, height);
        const isSelected = selectedBlip?.id === blip.id;
        const color = ringColor(blip.ring);
        const status = statusMap.get(blip.id) || "unchanged";
        const sm = STATUS_META[status];

        return (
          <g key={blip.id} onClick={() => onSelectBlip(blip)} style={{ cursor: "pointer" }}>
            <BlipShape x={pos.x} y={pos.y} status={status} color={color}
              isSelected={isSelected} ringKey={blip.ring} />
            {/* Name label – more space in half-arc */}
            <text x={pos.x + 12} y={pos.y - 2} fill="var(--color-heading)"
              fontSize="10" fontFamily="var(--font-mono)" fontWeight="600"
              textAnchor="start" dominantBaseline="auto"
              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(255,255,255,0.8)" }}>
              {blip.name}
            </text>
            {/* Status label */}
            <text x={pos.x + 12} y={pos.y + 10} fill={sm.color}
              fontSize="7" fontFamily="var(--font-mono)" fontWeight="400"
              textAnchor="start" dominantBaseline="auto" opacity="0.7"
              style={{ pointerEvents: "none" }}>
              {sm.icon} {sm.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Movement icon helper
function MovementIcon({ from, to }: { from: string | null; to: string }) {
  if (!from) return <Plus size={12} className="text-signal" />;
  const fi = ringIndex(from);
  const ti = ringIndex(to);
  if (ti < fi) return <ArrowUpRight size={12} className="text-signal" />;
  if (ti > fi) return <ArrowDownRight size={12} className="text-danger" />;
  return <Minus size={12} className="text-muted" />;
}

// Status badge component
function StatusBadge({ status, size = "sm" }: { status: BlipStatus; size?: "sm" | "xs" }) {
  const meta = STATUS_META[status];
  const isSmall = size === "xs";
  return (
    <span className={`inline-flex items-center gap-1 font-mono rounded ${
      isSmall ? "text-[0.55rem] px-1 py-0" : "text-[0.6rem] px-1.5 py-0.5"
    }`}
      style={{ color: meta.color, background: `${meta.color}10`, border: `1px solid ${meta.color}20` }}>
      <span className={isSmall ? "text-[0.5rem]" : "text-[0.55rem]"}>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

// Blip Detail Panel
function BlipDetailPanel({
  blip, status, onClose, onEdit, onDelete,
}: {
  blip: RadarBlip; status: BlipStatus;
  onClose: () => void; onEdit: (b: RadarBlip) => void; onDelete: (id: number) => void;
}) {
  const color = ringColor(blip.ring);
  const linkedArea = blip.competencyArea;

  return (
    <div className="card-panel p-5 animate-slide-in-up space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}40` }} />
          <div>
            <h3 className="font-display text-xl text-heading leading-tight">{blip.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{
                background: `${color}15`, color, border: `1px solid ${color}30`
              }}>
                {RINGS.find(r => r.key === blip.ring)?.label}
              </span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{blip.quadrant}</span>
              <span className="text-xs text-muted">·</span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(blip)}
            className="p-1.5 rounded hover:bg-surface transition-colors text-muted hover:text-fiber">
            <Pencil size={14} />
          </button>
          <button onClick={() => { if (confirm("Slette denne blip?")) onDelete(blip.id); }}
            className="p-1.5 rounded hover:bg-surface transition-colors text-muted hover:text-danger">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded hover:bg-surface transition-colors text-muted hover:text-text-bright">
            <X size={14} />
          </button>
        </div>
      </div>

      {blip.description && (
        <p className="text-sm text-text leading-relaxed">{blip.description}</p>
      )}

      {blip.rationale && (
        <div className="text-xs text-muted bg-deep/50 rounded-md px-3 py-2 border border-border-subtle">
          <span className="text-fiber/60 font-mono text-[0.65rem] uppercase tracking-wider">Begrunnelse</span>
          <p className="mt-1 text-text/80">{blip.rationale}</p>
        </div>
      )}

      {linkedArea && (
        <div className="flex items-center gap-2 text-xs">
          <Zap size={12} className="text-signal" />
          <span className="text-muted">Kompetanse:</span>
          <span className="text-signal font-mono">{linkedArea.name}</span>
        </div>
      )}

      {blip.history && blip.history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={12} className="text-muted" />
            <span className="font-mono text-xs text-muted uppercase tracking-wider">Historikk</span>
          </div>
          <div className="space-y-0 relative ml-2">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border-subtle" />
            {blip.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(h => (
              <div key={h.id} className="flex items-start gap-3 py-1.5 relative">
                <div className="w-[11px] h-[11px] rounded-full border-2 bg-deep flex-shrink-0 mt-0.5 z-10"
                  style={{ borderColor: ringColor(h.toRing) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <MovementIcon from={h.fromRing} to={h.toRing} />
                    {h.fromRing ? (
                      <span className="text-text/70">
                        <span style={{ color: ringColor(h.fromRing) }}>{h.fromRing}</span>
                        {" → "}
                        <span style={{ color: ringColor(h.toRing) }}>{h.toRing}</span>
                      </span>
                    ) : (
                      <span className="text-signal/80">Lagt til som {h.toRing}</span>
                    )}
                    <span className="text-muted/50 font-mono text-[0.6rem] ml-auto">
                      {new Date(h.createdAt).toLocaleDateString("nb-NO")}
                    </span>
                  </div>
                  {h.note && <p className="text-[0.7rem] text-muted mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Create/Edit Modal
function BlipModal({
  blip, competencyAreas, onSave, onClose,
}: {
  blip: RadarBlip | null; competencyAreas: CompetencyArea[];
  onSave: (data: any) => void; onClose: () => void;
}) {
  const [name, setName] = useState(blip?.name || "");
  const [quadrant, setQuadrant] = useState(blip?.quadrant || QUADRANTS[0].key);
  const [ring, setRing] = useState(blip?.ring || "assess");
  const [description, setDescription] = useState(blip?.description || "");
  const [rationale, setRationale] = useState(blip?.rationale || "");
  const [competencyAreaId, setCompetencyAreaId] = useState<number | "">(blip?.competencyAreaId || "");
  const [historyNote, setHistoryNote] = useState("");
  const isEdit = !!blip;
  const ringChanged = isEdit && blip.ring !== ring;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name, quadrant, ring, description: description || null,
      rationale: rationale || null,
      competencyAreaId: competencyAreaId || null,
      historyNote: ringChanged ? historyNote || null : undefined,
    });
  };

  const selectClass = "w-full bg-deep border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-fiber transition-colors";
  const inputClass = "w-full bg-deep border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-fiber transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card-panel w-full max-w-lg p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-heading">
            {isEdit ? "Rediger teknologi" : "Ny teknologi"}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface text-muted hover:text-text-bright">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className={inputClass} placeholder="F.eks. XGS-PON" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">Kategori</label>
              <select value={quadrant} onChange={e => setQuadrant(e.target.value)} className={selectClass}>
                {QUADRANTS.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">Ring</label>
              <select value={ring} onChange={e => setRing(e.target.value)} className={selectClass}>
                {RINGS.map(r => (
                  <option key={r.key} value={r.key}>{r.label} – {r.desc}</option>
                ))}
              </select>
            </div>
          </div>

          {ringChanged && (
            <div className="bg-warn/5 border border-warn/20 rounded-md p-3">
              <label className="block text-xs font-mono text-warn uppercase tracking-wider mb-1.5">
                Notat for ringendring ({blip.ring} → {ring})
              </label>
              <input type="text" value={historyNote} onChange={e => setHistoryNote(e.target.value)}
                className={inputClass} placeholder="Hvorfor flyttes denne?" />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">Beskrivelse</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className={inputClass + " resize-none"} rows={2} placeholder="Kort beskrivelse..." />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">Begrunnelse</label>
            <textarea value={rationale} onChange={e => setRationale(e.target.value)}
              className={inputClass + " resize-none"} rows={2} placeholder="Hvorfor denne plasseringen?" />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">
              Koble til kompetanseområde (valgfritt)
            </label>
            <select value={competencyAreaId} onChange={e => setCompetencyAreaId(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}>
              <option value="">Ingen kobling</option>
              {competencyAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-text transition-colors">
              Avbryt
            </button>
            <button type="submit" className="btn-fiber px-5 py-2 text-sm">
              {isEdit ? "Lagre endringer" : "Legg til"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Blip list row with status badge
function BlipListRow({ blip, status, isSelected, onClick }: {
  blip: RadarBlip; status: BlipStatus; isSelected: boolean; onClick: () => void;
}) {
  const color = ringColor(blip.ring);
  const sm = STATUS_META[status];
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2.5 transition-all group ${
        isSelected ? "bg-surface border border-border" : "hover:bg-surface/50"
      }`}>
      {/* Status shape indicator */}
      <span className="text-[0.6rem] flex-shrink-0 w-3 text-center" style={{ color: sm.color }}>
        {sm.icon}
      </span>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: isSelected ? `0 0 8px ${color}50` : "none" }} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isSelected ? "text-heading font-medium" : "text-text group-hover:text-heading"}`}>
          {blip.name}
        </p>
        <p className="text-[0.6rem] text-muted truncate font-mono">{blip.quadrant}</p>
      </div>
      <ChevronRight size={12} className={`text-muted transition-transform ${isSelected ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
    </button>
  );
}

export default function RadarPage() {
  const [blips, setBlips] = useState<RadarBlip[]>([]);
  const [competencyAreas, setCompetencyAreas] = useState<CompetencyArea[]>([]);
  const [selectedBlip, setSelectedBlip] = useState<RadarBlip | null>(null);
  const [editBlip, setEditBlip] = useState<RadarBlip | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [highlightQuadrant, setHighlightQuadrant] = useState<string | null>(null);
  const [highlightRing, setHighlightRing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodDays, setPeriodDays] = useState(90);
  const [statusFilter, setStatusFilter] = useState<BlipStatus | "all">("all");
  const [focusedQuadrant, setFocusedQuadrant] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [blipsData, areasData] = await Promise.all([
        api.getRadarBlips(), api.getCompetencyAreas(),
      ]);
      setBlips(blipsData);
      setCompetencyAreas(areasData);
    } catch (err) {
      console.error("Failed to load radar data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute status for all blips
  const statusMap = useMemo(() => {
    const map = new Map<number, BlipStatus>();
    blips.forEach(b => map.set(b.id, computeBlipStatus(b, periodDays)));
    return map;
  }, [blips, periodDays]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { new: 0, "moved-in": 0, "moved-out": 0, unchanged: 0 };
    statusMap.forEach(s => counts[s]++);
    return counts;
  }, [statusMap]);

  const handleSave = async (data: any) => {
    try {
      if (editBlip) {
        await api.updateRadarBlip(editBlip.id, data);
      } else {
        await api.createRadarBlip(data);
      }
      setEditBlip(undefined);
      setSelectedBlip(null);
      await loadData();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRadarBlip(id);
      if (selectedBlip?.id === id) setSelectedBlip(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredBlips = useMemo(() => {
    let result = blips;
    if (focusedQuadrant) result = result.filter(b => b.quadrant === focusedQuadrant);
    else if (highlightQuadrant) result = result.filter(b => b.quadrant === highlightQuadrant);
    if (highlightRing) result = result.filter(b => b.ring === highlightRing);
    if (statusFilter !== "all") result = result.filter(b => statusMap.get(b.id) === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(term) || b.description?.toLowerCase().includes(term));
    }
    return result;
  }, [blips, focusedQuadrant, highlightQuadrant, highlightRing, statusFilter, statusMap, searchTerm]);

  const stats = useMemo(() => ({
    total: blips.length,
    adopt: blips.filter(b => b.ring === "adopt").length,
    trial: blips.filter(b => b.ring === "trial").length,
    assess: blips.filter(b => b.ring === "assess").length,
    hold: blips.filter(b => b.ring === "hold").length,
  }), [blips]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-fiber" size={28} />
      </div>
    );
  }

  return (
    <div className="radar-light space-y-5">
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between animate-slide-in-up">
        <div>
          {focusedQuadrant ? (
            <div className="flex items-center gap-3">
              <button onClick={() => { setFocusedQuadrant(null); setSelectedBlip(null); }}
                className="p-1.5 rounded-md hover:bg-surface transition-colors text-muted hover:text-fiber">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="font-display text-3xl tracking-tight"
                  style={{ color: QUADRANT_COLORS[focusedQuadrant] }}>
                  {QUADRANTS.find(q => q.key === focusedQuadrant)?.label}
                </h1>
                <p className="text-muted mt-0.5 text-sm">
                  {blips.filter(b => b.quadrant === focusedQuadrant).length} teknologier i denne kategorien
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-heading tracking-tight">Teknologiradar</h1>
              <p className="text-muted mt-1">Kartlegg teknologier etter modenhet og kategori</p>
            </>
          )}
          <div className="fiber-line mt-3 w-36" />
        </div>
        <div className="flex items-center gap-3">
          {/* Time period selector */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-panel border border-border-subtle text-xs text-muted">
              <Calendar size={12} />
              <select value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))}
                className="bg-transparent text-text text-xs focus:outline-none cursor-pointer font-mono">
                {TIME_PERIODS.map(p => (
                  <option key={p.days} value={p.days}>Siste {p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={() => setEditBlip(null)}
            className="btn-fiber px-4 py-2 text-sm flex items-center gap-2">
            <Plus size={15} /> Ny teknologi
          </button>
        </div>
      </div>

      {/* Status + Ring legend bar */}
      <div className="flex items-center gap-2.5 flex-wrap animate-slide-in-up stagger-1">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 mr-2">
          <button
            onClick={() => setStatusFilter(statusFilter === "all" ? "all" : "all")}
            className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all ${
              statusFilter === "all" ? "bg-surface border border-border text-heading" : "text-muted hover:text-text hover:bg-surface/50"
            }`}>
            Alle
          </button>
          {(Object.keys(STATUS_META) as BlipStatus[]).map(s => {
            const meta = STATUS_META[s];
            const count = statusCounts[s];
            const isActive = statusFilter === s;
            return (
              <button key={s}
                onClick={() => setStatusFilter(isActive ? "all" : s)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono transition-all ${
                  isActive ? "bg-surface border border-border" : "hover:bg-surface/50"
                }`}
                style={{ color: isActive ? meta.color : undefined }}>
                <span className="text-sm">{meta.icon}</span>
                <span className={isActive ? "" : "text-muted"}>{meta.label}</span>
                <span className="text-muted/50">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-border-subtle mx-1" />

        {/* Ring filters */}
        {RINGS.map(r => {
          const count = stats[r.key as keyof typeof stats] as number;
          const isActive = highlightRing === r.key;
          return (
            <button key={r.key}
              onClick={() => setHighlightRing(isActive ? null : r.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm ${
                isActive ? "bg-surface border border-border" : "hover:bg-surface/50"
              }`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
              <span className={`font-mono ${isActive ? "text-heading" : "text-muted"}`}>{r.label}</span>
              <span className="font-mono text-muted/50">{count}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-muted text-sm font-mono">
          <Radar size={16} /> {stats.total}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 animate-slide-in-up stagger-2">
        {/* Radar / Half-arc visualization */}
        <div className="flex-1 card-panel p-3 overflow-hidden"
          style={{ minHeight: focusedQuadrant ? "480px" : "600px" }}>
          {focusedQuadrant ? (
            <HalfArcSvg
              blips={blips} statusMap={statusMap} quadrant={focusedQuadrant}
              selectedBlip={selectedBlip}
              onSelectBlip={b => setSelectedBlip(selectedBlip?.id === b.id ? null : b)}
            />
          ) : (
            <RadarSvg blips={blips} statusMap={statusMap}
              selectedBlip={selectedBlip}
              onSelectBlip={b => setSelectedBlip(selectedBlip?.id === b.id ? null : b)}
              highlightQuadrant={highlightQuadrant} highlightRing={highlightRing}
              onQuadrantClick={q => { setFocusedQuadrant(q); setHighlightQuadrant(null); setSelectedBlip(null); }}
            />
          )}
        </div>

        {/* Side panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Quadrant filter (only in full radar view) */}
          {!focusedQuadrant && (
            <div className="card-panel p-3 space-y-1">
              <span className="font-mono text-[0.6rem] text-muted uppercase tracking-widest px-2">
                Kategorier <span className="text-muted/40">· klikk for detalj</span>
              </span>
              {QUADRANTS.map(q => {
                const count = blips.filter(b => b.quadrant === q.key).length;
                const isActive = highlightQuadrant === q.key;
                const qColor = QUADRANT_COLORS[q.key];
                return (
                  <div key={q.key} className="flex items-center gap-1">
                    <button
                      onClick={() => setHighlightQuadrant(isActive ? null : q.key)}
                      className={`flex-1 text-left px-3 py-1.5 rounded-md flex items-center gap-2 transition-all text-sm ${
                        isActive ? "bg-surface border border-border" : "hover:bg-surface/50"
                      }`}>
                      <span className="text-xs" style={{ color: qColor }}>{q.icon}</span>
                      <span className={isActive ? "text-heading" : "text-text"}>{q.label}</span>
                      <span className="ml-auto font-mono text-xs text-muted/60">{count}</span>
                    </button>
                    <button onClick={() => { setFocusedQuadrant(q.key); setHighlightQuadrant(null); setSelectedBlip(null); }}
                      className="p-1 rounded hover:bg-surface text-muted/40 hover:text-fiber transition-colors"
                      title="Vis detaljvisning">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Symbol legend */}
          <div className="card-panel p-3">
            <span className="font-mono text-[0.6rem] text-muted uppercase tracking-widest px-2">Symbolforklaring</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 px-2">
              {(Object.entries(STATUS_META) as [BlipStatus, typeof STATUS_META[BlipStatus]][]).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span style={{ color: meta.color }} className="text-[0.7rem] w-3 text-center">{meta.icon}</span>
                  <span className="text-muted">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Søk teknologier..."
              className="w-full bg-panel border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm text-text placeholder:text-muted/40 focus:outline-none focus:border-fiber transition-colors" />
          </div>

          {/* Blip list */}
          <div className="card-panel p-2 max-h-[320px] overflow-y-auto space-y-0.5">
            {filteredBlips.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Ingen treff</p>
            ) : (
              filteredBlips.map(b => (
                <BlipListRow key={b.id} blip={b}
                  status={statusMap.get(b.id) || "unchanged"}
                  isSelected={selectedBlip?.id === b.id}
                  onClick={() => setSelectedBlip(selectedBlip?.id === b.id ? null : b)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedBlip && (
        <BlipDetailPanel blip={selectedBlip}
          status={statusMap.get(selectedBlip.id) || "unchanged"}
          onClose={() => setSelectedBlip(null)}
          onEdit={b => setEditBlip(b)}
          onDelete={handleDelete} />
      )}

      {/* Create/Edit modal */}
      {editBlip !== undefined && (
        <BlipModal blip={editBlip} competencyAreas={competencyAreas}
          onSave={handleSave} onClose={() => setEditBlip(undefined)} />
      )}
    </div>
  );
}
