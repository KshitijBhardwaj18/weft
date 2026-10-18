import { q, ro } from "./graph";
import { activeGraph, drop, nextPoId } from "./plan";

export type Split = { S: number; M: number; L: number };
export type StyleLesson = { id: string; name: string; price: number; fabric: string; colours: string[]; planned: number; sold: number; supplierId: string; unitPrice: number; returns: number; reason: string | null; note: string | null; suggested: number; why: string };
export type Lessons = { from: string; live: boolean; split: Split; styles: StyleLesson[]; soldOut: string[]; creator: string | null };

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

/** What the current collection taught: size split, which styles to grow or cut, and why things came back. */
export async function lessons(): Promise<Lessons> {
  const g = await activeGraph();
  const d = await drop(g);
  const rows = await ro<{ style: string; name: string; price: number; fabric: string; colour: string; size: string; planned: number; sold: number; returns: number; reason: string | null; sup: string; unitPrice: number }>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style)-[:IN_DROP]->(:Drop {id:$drop}), (po:PO)-[:SUPPLIES]->(k)
     WITH k, s, max(po.id) AS latest
     MATCH (p:PO {id:latest})-[:MADE_BY]->(sup:Supplier)
     RETURN s.id AS style, s.name AS name, s.price AS price, s.fabric AS fabric, k.colour AS colour, k.size AS size,
            k.planned AS planned, coalesce(k.sold, 0) AS sold, coalesce(k.returns, 0) AS returns, k.returnReason AS reason, sup.id AS sup, p.unitPrice AS unitPrice`,
    { drop: d.id },
    g,
  );
  const notes = await ro<{ style: string; note: string }>("MATCH (s:Style)-[:HAS_SAMPLE]->(x:Sample {kind:'Fit'}) RETURN s.id AS style, x.note AS note", {}, g);
  const [top] = await ro<{ handle: string }>("MATCH (c:Creator) WHERE c.orders > 0 RETURN c.handle AS handle ORDER BY c.orders DESC LIMIT 1", {}, g);
  const sold = rows.reduce((a, r) => a + r.sold, 0);
  const live = sold > 0;
  const by = (size: string) => rows.filter((r) => r.size === size).reduce((a, r) => a + (live ? r.sold : r.planned), 0);
  const total = by("S") + by("M") + by("L");
  const split = { S: pct(by("S"), total), M: pct(by("M"), total), L: 0 };
  split.L = 100 - split.S - split.M;

  const styles = [...new Set(rows.map((r) => r.style))].map((id) => {
    const r = rows.filter((x) => x.style === id);
    const planned = r.reduce((a, x) => a + x.planned, 0), s = r.reduce((a, x) => a + x.sold, 0), returns = r.reduce((a, x) => a + x.returns, 0);
    const reason = r.find((x) => x.reason)?.reason ?? null;
    const through = pct(s, planned);
    // Grow what sold through fast, trim what didn't; round to 50s.
    const factor = !live ? 1 : through >= 70 ? 1.3 : through >= 50 ? 1 : 0.7;
    const suggested = Math.max(100, Math.round((planned * factor) / 50) * 50);
    const why = !live ? "Same as this collection" : through >= 70 ? `Sold ${through}% by day 9: grow it` : through >= 50 ? `Sold ${through}%: keep it` : `Only ${through}% sold: trim it`;
    return { id, name: r[0].name, price: r[0].price, fabric: r[0].fabric, colours: [...new Set(r.map((x) => x.colour))], planned, sold: s, supplierId: r[0].sup, unitPrice: r[0].unitPrice, returns, reason, note: notes.find((n) => n.style === id)?.note ?? null, suggested, why };
  });
  const soldOut = rows.filter((r) => r.planned > 0 && r.sold >= r.planned).map((r) => `${r.name} · ${r.colour} · ${r.size}`);
  return { from: d.name, live, split, styles, soldOut, creator: top?.handle ?? null };
}

export type PlanInput = {
  name: string;
  date: string;
  split: Split;
  styles: { name: string; price: number; fabric: string; colours: string[]; units: number; supplierId: string; unitPrice: number }[];
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const code = (s: string) => s.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

/** Creates the collection: styles, SKUs by size, one PO per style and colour, and Shuttle's fabric check-ins. */
export async function planCollection(input: PlanInput, by: { id: string; name: string }) {
  const g = await activeGraph();
  const today = (await drop(g)).today;
  const dropId = `${slug(input.name)}-${Date.now().toString(36).slice(-4)}`;
  const prefix = code(input.name);
  await q(
    "CREATE (:Drop {id:$id, name:$name, date:$date, phase:'countdown', today:$today, orders:0, status:'planning'})",
    { id: dropId, name: input.name, date: input.date, today },
    g,
  );
  const pos: { id: string; supplierId: string; label: string; qty: number; eta: string }[] = [];
  for (const st of input.styles) {
    const styleId = `${dropId}-${slug(st.name)}`;
    await q(
      "MATCH (d:Drop {id:$drop}) CREATE (:Style {id:$id, name:$name, price:$price, fabric:$fabric})-[:IN_DROP]->(d)",
      { drop: dropId, id: styleId, name: st.name, price: st.price, fabric: st.fabric },
      g,
    );
    const [sup] = await ro<{ leadDays: number }>("MATCH (s:Supplier {id:$id}) RETURN s.leadDays AS leadDays", { id: st.supplierId }, g);
    const perColour = Math.round(st.units / Math.max(1, st.colours.length));
    for (const colour of st.colours) {
      const line = `${prefix}-${code(st.name)}-${code(colour)}`;
      const sizes = (["S", "M", "L"] as const).map((size) => ({ size, planned: Math.round((perColour * input.split[size]) / 100) }));
      await q(
        `MATCH (s:Style {id:$style}) UNWIND $sizes AS z
         CREATE (:SKU {id:$line + '-' + z.size, code:'WA-' + $line + '-' + z.size, line:$line, colour:$colour, size:z.size,
                       planned:z.planned, sold:0, onHand:0, returns:0, returnReason:null})-[:OF_STYLE]->(s)`,
        { style: styleId, sizes, line, colour },
        g,
      );
      const poId = await nextPoId(g);
      const qty = sizes.reduce((a, z) => a + z.planned, 0);
      const eta = addDays(today, sup?.leadDays ?? 14);
      await q(
        `MATCH (sup:Supplier {id:$sup}), (owner:Person {id:$owner})
         CREATE (po:PO {id:$po, qty:$qty, unitPrice:$unitPrice, eta:$eta, stage:'Fabric', status:'sent'})-[:MADE_BY]->(sup),
                (owner)-[:OWNS]->(po),
                (po)-[:HAS_CHECKIN]->(:CheckIn {id:'ci-' + toLower($po) + '-fabric', question:'Is the fabric in for ' + $po + '?', due:$due, status:'open'})-[:ASKED]->(sup)
         WITH po MATCH (k:SKU {line:$line}) CREATE (po)-[:SUPPLIES]->(k)`,
        { sup: st.supplierId, owner: by.id, po: poId, qty, unitPrice: st.unitPrice, eta, due: addDays(today, Math.max(2, Math.floor((sup?.leadDays ?? 14) / 2))), line },
        g,
      );
      pos.push({ id: poId, supplierId: st.supplierId, label: `${st.name} · ${colour}`, qty, eta });
    }
  }
  const units = pos.reduce((a, p) => a + p.qty, 0);
  await q(
    `MATCH (d:Drop {id:$drop}), (p:Person {id:$by})
     CREATE (p)-[:DECIDED]->(:Decision {id:'d-plan-' + $drop, text:$text, at:$at, by:$name})-[:ABOUT]->(d)`,
    { drop: dropId, by: by.id, name: by.name, at: new Date().toISOString(), text: `Planned ${input.name}: ${input.styles.length} styles, ${units} units, launching ${input.date}` },
    g,
  );
  return { dropId, pos };
}
