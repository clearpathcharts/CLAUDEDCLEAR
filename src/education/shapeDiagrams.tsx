"use client";

import { useState, type ReactNode } from "react";

export type ShapeId =
  | "rising-wedge"
  | "falling-wedge"
  | "ascending-triangle"
  | "descending-triangle";

const PINK = "#FF1493";
const PURPLE = "#9D00FF";
const MAGENTA = "#FF00CC";
const PRICE = "#E8EDF5";
const UP = "#00F5D4";
const DOWN = "#FF6B6B";
const MUTED = "#9FB3C8";
const BG = "#06121A";

type Pt = { x: number; y: number };

type Geom = {
  topLabel: string;
  botLabel: string;
  topA: Pt;
  topB: Pt;
  botA: Pt;
  botB: Pt;
  wall?: "top" | "bottom";
  swings: Pt[];
  breakout: Pt;
  breakLabel: string;
  breakUp: boolean;
};

const SHAPE_COPY: Record<
  ShapeId,
  { name: string; kid: string; bias: string }
> = {
  "rising-wedge": {
    name: "Rising wedge",
    kid: "Both lines tilt up. They meet at a point. Usually goes down.",
    bias: "Usually down",
  },
  "falling-wedge": {
    name: "Falling wedge",
    kid: "Both lines tilt down. They meet at a point. Usually goes up.",
    bias: "Usually up",
  },
  "ascending-triangle": {
    name: "Ascending triangle",
    kid: "Top is a flat wall. Bottom is a ramp. Usually goes up.",
    bias: "Usually up",
  },
  "descending-triangle": {
    name: "Descending triangle",
    kid: "Bottom is a flat wall. Top is a ramp. Usually goes down.",
    bias: "Usually down",
  },
};

function geom(id: ShapeId): Geom {
  if (id === "rising-wedge") {
    return {
      topLabel: "RAMP",
      botLabel: "RAMP",
      topA: { x: 48, y: 78 },
      topB: { x: 340, y: 52 },
      botA: { x: 48, y: 168 },
      botB: { x: 340, y: 88 },
      swings: [
        { x: 56, y: 160 },
        { x: 92, y: 86 },
        { x: 128, y: 142 },
        { x: 164, y: 76 },
        { x: 200, y: 124 },
        { x: 236, y: 68 },
        { x: 272, y: 108 },
        { x: 308, y: 62 },
        { x: 332, y: 90 },
      ],
      breakout: { x: 400, y: 168 },
      breakLabel: "USUALLY DOWN",
      breakUp: false,
    };
  }
  if (id === "falling-wedge") {
    return {
      topLabel: "RAMP",
      botLabel: "RAMP",
      topA: { x: 48, y: 38 },
      topB: { x: 340, y: 108 },
      botA: { x: 48, y: 128 },
      botB: { x: 340, y: 148 },
      swings: [
        { x: 56, y: 46 },
        { x: 92, y: 122 },
        { x: 128, y: 58 },
        { x: 164, y: 128 },
        { x: 200, y: 72 },
        { x: 236, y: 134 },
        { x: 272, y: 88 },
        { x: 308, y: 140 },
        { x: 332, y: 118 },
      ],
      breakout: { x: 400, y: 42 },
      breakLabel: "USUALLY UP",
      breakUp: true,
    };
  }
  if (id === "ascending-triangle") {
    return {
      topLabel: "WALL",
      botLabel: "RAMP",
      wall: "top",
      topA: { x: 48, y: 52 },
      topB: { x: 340, y: 52 },
      botA: { x: 48, y: 170 },
      botB: { x: 340, y: 70 },
      swings: [
        { x: 56, y: 162 },
        { x: 96, y: 54 },
        { x: 136, y: 138 },
        { x: 176, y: 54 },
        { x: 216, y: 118 },
        { x: 256, y: 54 },
        { x: 296, y: 96 },
        { x: 328, y: 54 },
      ],
      breakout: { x: 400, y: 24 },
      breakLabel: "USUALLY UP",
      breakUp: true,
    };
  }
  return {
    topLabel: "RAMP",
    botLabel: "WALL",
    wall: "bottom",
    topA: { x: 48, y: 40 },
    topB: { x: 340, y: 148 },
    botA: { x: 48, y: 168 },
    botB: { x: 340, y: 168 },
    swings: [
      { x: 56, y: 48 },
      { x: 96, y: 166 },
      { x: 136, y: 70 },
      { x: 176, y: 166 },
      { x: 216, y: 92 },
      { x: 256, y: 166 },
      { x: 296, y: 118 },
      { x: 328, y: 166 },
    ],
    breakout: { x: 400, y: 204 },
    breakLabel: "USUALLY DOWN",
    breakUp: false,
  };
}

function ShapeSvg({
  id,
  showBreak = true,
  hideName = false,
  height = 220,
}: {
  id: ShapeId;
  showBreak?: boolean;
  hideName?: boolean;
  height?: number;
}) {
  const g = geom(id);
  const copy = SHAPE_COPY[id];
  const area = `${g.topA.x},${g.topA.y} ${g.topB.x},${g.topB.y} ${g.botB.x},${g.botB.y} ${g.botA.x},${g.botA.y}`;
  const path = g.swings.map((p) => `${p.x},${p.y}`).join(" ");
  const last = g.swings[g.swings.length - 1];
  const full = showBreak ? `${path} ${g.breakout.x},${g.breakout.y}` : path;
  const topColor = g.wall === "top" ? MAGENTA : PINK;
  const botColor = g.wall === "bottom" ? MAGENTA : PURPLE;

  return (
    <svg
      viewBox="0 0 440 230"
      width="100%"
      height={height}
      role="img"
      aria-label={
        hideName
          ? "Unnamed chart shape. Look at whether the lines are ramps or a wall."
          : `${copy.name}. ${copy.kid}`
      }
    >
      <rect x="0" y="0" width="440" height="230" fill={BG} rx="12" />
      <polygon points={area} fill={g.breakUp ? "rgba(0,245,212,0.08)" : "rgba(255,107,107,0.08)"} />
      <line
        x1={g.topA.x}
        y1={g.topA.y}
        x2={g.topB.x}
        y2={g.topB.y}
        stroke={topColor}
        strokeWidth={g.wall === "top" ? 5 : 3.5}
      />
      <line
        x1={g.botA.x}
        y1={g.botA.y}
        x2={g.botB.x}
        y2={g.botB.y}
        stroke={botColor}
        strokeWidth={g.wall === "bottom" ? 5 : 3.5}
      />
      <polyline points={full} fill="none" stroke={PRICE} strokeWidth={2.4} />
      {showBreak && (
        <line
          x1={last.x}
          y1={last.y}
          x2={g.breakout.x}
          y2={g.breakout.y}
          stroke={g.breakUp ? UP : DOWN}
          strokeWidth={3.5}
        />
      )}
      <text x={g.topA.x} y={Math.max(18, g.topA.y - 10)} fill={topColor} fontSize={13} fontWeight={800}>
        {g.topLabel}
      </text>
      <text x={g.botA.x} y={Math.min(222, g.botA.y + 18)} fill={botColor} fontSize={13} fontWeight={800}>
        {g.botLabel}
      </text>
      {showBreak && (
        <text
          x={Math.max(250, g.breakout.x - 118)}
          y={g.breakUp ? g.breakout.y + 4 : g.breakout.y + 14}
          fill={g.breakUp ? UP : DOWN}
          fontSize={13}
          fontWeight={800}
        >
          {g.breakLabel}
        </text>
      )}
      <text x={36} y={224} fill={MUTED} fontSize={10}>
        Time →
      </text>
    </svg>
  );
}

function PosterFrame({
  title,
  kid,
  children,
}: {
  title?: string;
  kid?: string;
  children: ReactNode;
}) {
  return (
    <figure
      style={{
        margin: "0 0 22px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        overflow: "hidden",
        background: BG,
      }}
    >
      {children}
      {(title || kid) && (
        <figcaption style={{ padding: "12px 14px 14px" }}>
          {title && (
            <div style={{ fontSize: 18, fontWeight: 800, color: PRICE, marginBottom: 4 }}>
              {title}
            </div>
          )}
          {kid && (
            <div style={{ fontSize: 15, lineHeight: 1.45, color: MUTED }}>{kid}</div>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export function ShapePoster({
  id,
  showBreak = true,
  hideName = false,
}: {
  id: ShapeId;
  showBreak?: boolean;
  hideName?: boolean;
}) {
  const copy = SHAPE_COPY[id];
  return (
    <PosterFrame title={hideName ? undefined : copy.name} kid={hideName ? undefined : copy.kid}>
      <ShapeSvg id={id} showBreak={showBreak} hideName={hideName} height={240} />
    </PosterFrame>
  );
}

export function ComparePosters({
  left,
  right,
}: {
  left: ShapeId;
  right: ShapeId;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <ShapePoster id={left} />
      <ShapePoster id={right} />
    </div>
  );
}

export function RulePoster() {
  const cells: Array<{ id: ShapeId; stamp: string }> = [
    { id: "rising-wedge", stamp: "POINT" },
    { id: "falling-wedge", stamp: "POINT" },
    { id: "ascending-triangle", stamp: "WALL" },
    { id: "descending-triangle", stamp: "WALL" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 10,
        marginBottom: 22,
      }}
    >
      {cells.map((cell) => (
        <PosterFrame
          key={cell.id}
          title={`${SHAPE_COPY[cell.id].name} · ${cell.stamp}`}
          kid={SHAPE_COPY[cell.id].kid}
        >
          <ShapeSvg id={cell.id} showBreak height={160} />
        </PosterFrame>
      ))}
    </div>
  );
}

const PRACTICE_ORDER: ShapeId[] = [
  "falling-wedge",
  "descending-triangle",
  "rising-wedge",
  "ascending-triangle",
];

export function PracticeNamer() {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<ShapeId | "">("");
  const id = PRACTICE_ORDER[index % PRACTICE_ORDER.length];
  const revealed = guess !== "";
  const correct = guess === id;

  return (
    <div style={{ marginBottom: 22 }}>
      <ShapePoster id={id} showBreak={revealed} hideName={!revealed} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {(Object.keys(SHAPE_COPY) as ShapeId[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setGuess(opt)}
            style={{
              background: guess === opt ? "#22D3EE" : "rgba(255,255,255,0.06)",
              color: guess === opt ? "#06121A" : PRICE,
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {SHAPE_COPY[opt].name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setIndex((n) => n + 1);
            setGuess("");
          }}
          style={{
            background: "none",
            color: MUTED,
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Next picture
        </button>
      </div>
      {revealed && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            border: `1px solid ${correct ? UP : DOWN}66`,
            color: PRICE,
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: correct ? UP : DOWN }}>
            {correct ? "Yes." : `That picture is a ${SHAPE_COPY[id].name}.`}
          </strong>{" "}
          {SHAPE_COPY[id].kid}
        </div>
      )}
    </div>
  );
}

export function MiniShapePreview() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        margin: "10px 0 4px",
      }}
    >
      <ShapeSvg id="falling-wedge" showBreak height={88} />
      <ShapeSvg id="descending-triangle" showBreak height={88} />
    </div>
  );
}

export function LessonVisual({ visual }: { visual: LessonVisualSpec }) {
  if (visual.kind === "shape") return <ShapePoster id={visual.id} />;
  if (visual.kind === "compare") {
    return <ComparePosters left={visual.left} right={visual.right} />;
  }
  if (visual.kind === "rule") return <RulePoster />;
  return <PracticeNamer />;
}

export type LessonVisualSpec =
  | { kind: "shape"; id: ShapeId }
  | { kind: "compare"; left: ShapeId; right: ShapeId }
  | { kind: "rule" }
  | { kind: "practice" };

export { SHAPE_COPY };
