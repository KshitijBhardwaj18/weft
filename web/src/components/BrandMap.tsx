"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const ForceGraph = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export type MapNode = { id: string; label: string; name: string };
export type MapLink = { source: string; target: string; type: string };

const COLOR: Record<string, string> = {
  Drop: "#FF6C4C", Style: "#FFA946", SKU: "#F5C987", PO: "#B9B89E", Supplier: "#034F46", Creator: "#E88AD6",
  CreatorPost: "#FFBCF2", Person: "#8A8880", Teammate: "#C9A3E8", Decision: "#7F1C34", Message: "#D9D7CC",
  CheckIn: "#5FC4B4", Sample: "#E8B65C", Call: "#E08A1E",
};

export default function BrandMap({ nodes, links, focus, path }: { nodes: MapNode[]; links: MapLink[]; focus: string[]; path: string[] }) {
  const [hover, setHover] = useState<MapNode | null>(null);
  const lit = useMemo(() => new Set([...focus, ...path]), [focus, path]);
  const data = useMemo(() => ({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) }), [nodes, links]);
  const any = lit.size > 0;

  return (
    <div style={{ position: "relative", borderRadius: 20, border: "1px solid var(--line)", overflow: "hidden", background: "var(--surface-2)" }}>
      <ForceGraph
        graphData={data}
        height={640}
        backgroundColor="#FBFAF4"
        nodeRelSize={5}
        cooldownTicks={120}
        linkColor={(l) => {
          const s = typeof l.source === "object" ? (l.source as MapNode).id : (l.source as string);
          const t = typeof l.target === "object" ? (l.target as MapNode).id : (l.target as string);
          return any && lit.has(s) && lit.has(t) ? "#7F1C34" : "rgba(26,26,26,0.14)";
        }}
        linkWidth={(l) => {
          const s = typeof l.source === "object" ? (l.source as MapNode).id : (l.source as string);
          const t = typeof l.target === "object" ? (l.target as MapNode).id : (l.target as string);
          return any && lit.has(s) && lit.has(t) ? 2.5 : 1;
        }}
        linkDirectionalParticles={(l) => {
          const s = typeof l.source === "object" ? (l.source as MapNode).id : (l.source as string);
          const t = typeof l.target === "object" ? (l.target as MapNode).id : (l.target as string);
          return any && lit.has(s) && lit.has(t) ? 3 : 0;
        }}
        onNodeHover={(n) => setHover((n as MapNode) ?? null)}
        nodeCanvasObject={(node, ctx, scale) => {
          const n = node as MapNode & { x: number; y: number };
          const on = !any || lit.has(n.id);
          const r = n.label === "Drop" ? 9 : n.label === "Supplier" || n.label === "Style" ? 7 : 5;
          ctx.globalAlpha = on ? 1 : 0.18;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = COLOR[n.label] ?? "#999";
          ctx.fill();
          if (any && lit.has(n.id)) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#1A1A1A";
            ctx.stroke();
          }
          if (on && (scale > 1.4 || ["Drop", "Supplier", "Style", "Creator"].includes(n.label) || lit.has(n.id))) {
            ctx.font = `${11 / Math.max(scale, 0.8)}px Figtree, sans-serif`;
            ctx.fillStyle = "#1A1A1A";
            ctx.textAlign = "center";
            ctx.fillText(n.name, n.x, n.y + r + 10 / Math.max(scale, 0.8));
          }
          ctx.globalAlpha = 1;
        }}
      />
      <div className="row" style={{ position: "absolute", top: 12, left: 12, gap: 6, maxWidth: "70%" }}>
        {Object.entries(COLOR).map(([k, c]) => (
          <span key={k} className="chip" style={{ background: "rgba(255,254,248,0.9)", border: "1px solid var(--line)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{k}
          </span>
        ))}
      </div>
      {hover && (
        <div className="card" style={{ position: "absolute", bottom: 12, right: 12, padding: 12, gap: 4, maxWidth: 320 }}>
          <span className="label">{hover.label}</span>
          <b style={{ fontSize: 14 }}>{hover.name}</b>
          <span className="mono muted" style={{ fontSize: 12 }}>{hover.id}</span>
        </div>
      )}
    </div>
  );
}
