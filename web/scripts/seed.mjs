// Seeds the Weft demo: the 15-SKU "Black Drop" as a Countdown plan (graph `weft`)
// and a Live day-9 snapshot (graph `weft_live`). Run: pnpm seed
import { FalkorDB } from "falkordb";

const url = process.env.FALKORDB_URL ?? "falkor://localhost:6380";
const db = await FalkorDB.connect({ url });

const STYLES = [
  { id: "leggings", name: "Core Leggings", price: 2499, fabric: "Nylon-spandex 78/22, 260 GSM, 4-way stretch" },
  { id: "bra", name: "Sculpt Sports Bra", price: 1799, fabric: "Nylon-spandex 75/25, 240 GSM, double-layer" },
  { id: "tank", name: "Everyday Tank", price: 1299, fabric: "Recycled poly-elastane, 160 GSM" },
];
// [style, colour, code, {S,M,L} planned]
const LINES = [
  ["leggings", "Black", "LEG-BLK", [150, 300, 150]],
  ["leggings", "Olive", "LEG-OLV", [100, 200, 100]],
  ["bra", "Black", "BRA-BLK", [75, 150, 75]],
  ["tank", "Black", "TNK-BLK", [100, 200, 100]],
  ["tank", "Olive", "TNK-OLV", [100, 200, 100]],
];
const SIZES = ["S", "M", "L"];
// Live (day 9) sell-through per line, same order as SIZES
const SOLD = {
  "LEG-BLK": [130, 300, 120],
  "LEG-OLV": [55, 124, 50],
  "BRA-BLK": [52, 114, 48],
  "TNK-BLK": [45, 110, 48],
  "TNK-OLV": [25, 60, 26],
};
const RETURNS = {
  "LEG-BLK-M": [6, "runs small"],
  "TNK-OLV-S": [2, "too short"],
  "TNK-OLV-M": [5, "too short"],
  "TNK-OLV-L": [2, "too short"],
  "BRA-BLK-M": [3, "straps too long"],
};
const POS = [
  // id, supplier, line, unit price, eta, countdown stage
  ["PO-014", "sri", "LEG-BLK", 420, "2026-11-20", "Fabric"],
  ["PO-015", "sri", "BRA-BLK", 380, "2026-11-24", "QC"],
  ["PO-017", "sri", "LEG-OLV", 420, "2026-11-24", "Cutting"],
  ["PO-018", "kavya", "TNK-BLK", 260, "2026-11-25", "Stitching"],
  ["PO-019", "kavya", "TNK-OLV", 260, "2026-11-26", "Fabric"],
];

function skus() {
  const out = [];
  for (const [style, colour, code, planned] of LINES) {
    SIZES.forEach((size, i) => {
      const id = `${code}-${size}`;
      const sold = SOLD[code][i];
      const [returns, returnReason] = RETURNS[id] ?? [0, null];
      out.push({ id, code: `WA-${id}`, style, colour, size, line: code, planned: planned[i], sold, returns, returnReason });
    });
  }
  return out;
}

async function build(name, phase) {
  if ((await db.list()).includes(name)) await db.selectGraph(name).delete();
  const g = db.selectGraph(name);
  const run = (cypher, params = {}) => g.query(cypher, { params });
  const live = phase === "live";

  await run(`
    CREATE (:Person {id:'kshitij', name:'Kshitij', role:'Owner'}),
           (:Person {id:'rohan', name:'Rohan', role:'Manager'}),
           (:Person {id:'priya', name:'Priya', role:'Member'}),
           (:Teammate {id:'weft', name:'Weft', role:'Chief of staff'}),
           (:Teammate {id:'shuttle', name:'Shuttle', role:'Production lead'}),
           (:Teammate {id:'pattern', name:'Pattern', role:'Sales analyst'}),
           (:Supplier {id:'sri', name:'Sri Lakshmi Knits', type:'Factory', city:'Tiruppur', leadDays:14, contact:'Murugan'}),
           (:Supplier {id:'kavya', name:'Kavya Garments', type:'Factory', city:'Bengaluru', leadDays:10, contact:'Kavya'}),
           (:Supplier {id:'ananya', name:'Ananya Fabrics', type:'Mill', city:'Surat', leadDays:7, contact:'Ananya'}),
           (:Drop {id:'black-drop', name:'Black Drop', date:'2026-12-01', phase:$phase, today:$today, orders:$orders})`,
    { phase, today: live ? "2026-12-10" : "2026-11-18", orders: live ? 958 : 0 });

  await run(`UNWIND $styles AS s MATCH (d:Drop {id:'black-drop'})
             CREATE (:Style {id:s.id, name:s.name, price:s.price, fabric:s.fabric})-[:IN_DROP]->(d)`, { styles: STYLES });

  await run(`UNWIND $skus AS k MATCH (s:Style {id:k.style})
             CREATE (:SKU {id:k.id, code:k.code, line:k.line, colour:k.colour, size:k.size, planned:k.planned,
                           sold: CASE WHEN $live THEN k.sold ELSE 0 END,
                           onHand: CASE WHEN $live THEN k.planned - k.sold ELSE 0 END,
                           returns: CASE WHEN $live THEN k.returns ELSE 0 END,
                           returnReason: CASE WHEN $live THEN k.returnReason ELSE null END})-[:OF_STYLE]->(s)`,
    { skus: skus(), live });

  for (const [id, supplier, line, unitPrice, eta, stage] of POS) {
    const moved = live && id === "PO-014";
    const qty = LINES.find((l) => l[2] === line)[3].reduce((a, b) => a + b, 0);
    await run(`MATCH (sup:Supplier {id:$supplier}), (owner:Person {id:'rohan'})
               CREATE (po:PO {id:$id, qty:$qty, unitPrice:$unitPrice, eta:$eta, stage:$stage, status:$status})-[:MADE_BY]->(sup),
                      (owner)-[:OWNS]->(po)
               WITH po MATCH (k:SKU {line:$line}) CREATE (po)-[:SUPPLIES]->(k)`,
      { id, supplier: moved ? "kavya" : supplier, qty, line,
        unitPrice: moved ? 440 : unitPrice, eta: moved ? "2026-11-28" : eta,
        stage: live ? "Received" : stage, status: live ? "received" : "accepted" });
  }

  await run(`
    MATCH (leg:Style {id:'leggings'}), (bra:Style {id:'bra'}), (tank:Style {id:'tank'})
    CREATE (leg)-[:HAS_SAMPLE]->(:Sample {id:'s-leg-fit', kind:'Fit', status:'approved', date:'2026-10-03', note:'Waistband +1 cm'}),
           (leg)-[:HAS_SAMPLE]->(:Sample {id:'s-leg-pp', kind:'Pre-production', status:'approved', date:'2026-10-28', note:'Approved as is'}),
           (bra)-[:HAS_SAMPLE]->(:Sample {id:'s-bra-fit', kind:'Fit', status:'approved', date:'2026-10-06', note:'Straps +0.5 cm'}),
           (tank)-[:HAS_SAMPLE]->(:Sample {id:'s-tank-fit', kind:'Fit', status:'approved', date:'2026-10-09', note:'Body length -2 cm to match the bra hem'})`);

  // Messages that facts and decisions trace back to
  await run(`
    CREATE (m1:Message {id:'m-sri-compare', author:'Rohan', channel:'#ops', at:'2026-09-12', text:'Sri Lakshmi is ₹40 cheaper per piece than Tiruppur Tex, and the stitching on their fit samples was cleaner.'}),
           (m2:Message {id:'m-sri-go', author:'Kshitij', channel:'#ops', at:'2026-09-14', text:'Go with Sri Lakshmi for the leggings and the bra.'}),
           (m3:Message {id:'m-creators', author:'Priya', channel:'#marketing', at:'2026-11-11', text:'Ria, Dev and Tara are posting the Black Drop on 25 Nov: "live 1 Dec".'}),
           (m4:Message {id:'m-drop-date', author:'Kshitij', channel:'#ops', at:'2026-10-02', text:'Black Drop goes live on 1 Dec.'})
    WITH m1, m2, m3, m4
    MATCH (sri:Supplier {id:'sri'}), (k:Person {id:'kshitij'}), (d:Drop {id:'black-drop'})
    CREATE (dec:Decision {id:'d-choose-sri', text:'Chose Sri Lakshmi Knits for leggings and sports bra', at:'2026-09-14', by:'Kshitij'})-[:ABOUT]->(sri),
           (dec)-[:SOURCED_FROM]->(m1), (dec)-[:SOURCED_FROM]->(m2), (k)-[:DECIDED]->(dec),
           (d)-[:SOURCED_FROM]->(m4)`);

  await run(`
    MATCH (d:Drop {id:'black-drop'}), (m:Message {id:'m-creators'})
    UNWIND $creators AS c
    CREATE (cr:Creator {id:c.id, handle:c.handle, code:c.code, orders:c.orders, repeatRate:c.repeat})
    CREATE (cr)-[:POSTED]->(p:CreatorPost {id:c.id + '-post', date:'2026-11-25', says:'Black Drop, live 1 Dec'})-[:PROMOTES]->(d),
           (p)-[:SOURCED_FROM]->(m)`,
    { creators: [
      { id: "runwithria", handle: "@runwithria", code: "RIA15", orders: live ? 393 : 0, repeat: live ? 0.38 : 0 },
      { id: "liftwithdev", handle: "@liftwithdev", code: "DEV10", orders: live ? 211 : 0, repeat: live ? 0.21 : 0 },
      { id: "yogawithtara", handle: "@yogawithtara", code: "TARA10", orders: live ? 86 : 0, repeat: live ? 0.09 : 0 },
    ] });

  if (live) {
    // Which SKUs each creator's code drove (Shopify discount-code attribution)
    await run(`
      MATCH (r:Creator {id:'runwithria'}), (dv:Creator {id:'liftwithdev'}), (t:Creator {id:'yogawithtara'})
      MATCH (lbm:SKU {id:'LEG-BLK-M'}), (lbs:SKU {id:'LEG-BLK-S'}), (lol:SKU {id:'LEG-OLV-M'}), (brm:SKU {id:'BRA-BLK-M'}), (tbm:SKU {id:'TNK-BLK-M'})
      CREATE (r)-[:DROVE {orders:190}]->(lbm), (r)-[:DROVE {orders:120}]->(lbs), (r)-[:DROVE {orders:83}]->(lol),
             (dv)-[:DROVE {orders:120}]->(brm), (dv)-[:DROVE {orders:91}]->(tbm),
             (t)-[:DROVE {orders:86}]->(lol)`);
    await run(`
      MATCH (k:Person {id:'kshitij'}), (po:PO {id:'PO-014'}), (kav:Supplier {id:'kavya'})
      CREATE (dec:Decision {id:'d-move-po014', text:"Moved PO-014 to Kavya Garments after Sri Lakshmi's fabric delay (scenario: on time, +₹12,000)", at:'2026-11-18', by:'Kshitij'})-[:ABOUT]->(po),
             (dec)-[:ABOUT]->(kav), (k)-[:DECIDED]->(dec)`);
    await run(`
      MATCH (p:Teammate {id:'pattern'}), (sku:SKU {id:'LEG-BLK-M'})
      CREATE (c:Call {id:'call-restock-legblkm', kind:'restock', status:'open', at:'2026-12-10T09:12',
                      title:'Pattern drafted a restock', summary:'Black leggings M sold out on day 4. Restock from Sri Lakshmi Knits, 14-day lead time.'})-[:ABOUT]->(sku),
             (c)-[:RAISED_BY]->(p)`);
    await run(`
      MATCH (s:Teammate {id:'shuttle'}), (po:PO {id:'PO-018'})
      CREATE (c:Call {id:'call-kavya-date', kind:'date', status:'open', at:'2026-12-10T08:40',
                      title:'Kavya asked to change a date', summary:'Black tank restock moves from 16 Dec to 19 Dec. 41 days of stock left, no impact.'})-[:ABOUT]->(po),
             (c)-[:RAISED_BY]->(s)`);
  } else {
    // Countdown: Shuttle's open check-in on PO-014, and a lab dip that has gone quiet
    await run(`
      MATCH (po:PO {id:'PO-014'}), (po19:PO {id:'PO-019'}), (an:Supplier {id:'ananya'})
      CREATE (po)-[:HAS_CHECKIN]->(:CheckIn {id:'ci-po014-fabric', question:'Is the fabric in for PO-014?', due:'2026-11-18', status:'open'}),
             (po19)-[:HAS_CHECKIN]->(ci:CheckIn {id:'ci-po019-labdip', question:'Is the olive lab dip approved for PO-019?', due:'2026-11-15', status:'quiet'}),
             (ci)-[:ASKED]->(an)`);
    await run(`
      MATCH (s:Teammate {id:'shuttle'}), (ci:CheckIn {id:'ci-po019-labdip'})
      CREATE (c:Call {id:'call-followup-ananya', kind:'followup', status:'open', at:'2026-11-18T09:00',
                      title:'Shuttle drafted a follow-up', summary:'To Ananya Fabrics: the olive lab dip was due 15 Nov. Any update?'})-[:ABOUT]->(ci),
             (c)-[:RAISED_BY]->(s)`);
  }

  for (const [label, ...props] of [["SKU", "code", "colour", "line"], ["Style", "name"], ["Supplier", "name"], ["PO", "id"], ["Creator", "handle"]]) {
    await g.createNodeFulltextIndex(label, ...props);
  }
  for (const label of ["SKU", "Style", "Supplier", "PO", "Drop", "Creator", "Message", "Call", "Decision", "CheckIn"]) {
    await g.createNodeRangeIndex(label, "id");
  }
  const [{ n }] = (await g.query("MATCH (n) RETURN count(n) AS n")).data;
  console.log(`${name}: ${n} nodes (${phase})`);
}

await build("weft", "countdown");
await build("weft_live", "live");
const meta = db.selectGraph("weft_meta");
await meta.query("MERGE (s:Setting {key:'phase'}) SET s.value = 'countdown'");
await db.close();
