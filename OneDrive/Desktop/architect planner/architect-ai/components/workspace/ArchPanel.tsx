"use client";

import { useState, useRef, useEffect } from "react";
import MermaidDiagram from "@/components/MermaidDiagram";
import type { SystemDesign, CostEstimate } from "@/lib/types";
import styles from "./ArchPanel.module.css";

interface ArchPanelProps {
  design: SystemDesign | null;
}

const METHOD_CLASS: Record<string, string> = {
  GET: styles.methodGet, POST: styles.methodPost,
  PUT: styles.methodPut, DELETE: styles.methodDelete,
  PATCH: styles.methodPatch,
};

const DB_CLASS: Record<string, string> = {
  sql: styles.badgeSql, nosql: styles.badgeNosql,
  cache: styles.badgeCache, search: styles.badgeSearch,
  graph: styles.badgeGraph,
};

type TabKey = "components" | "databases" | "apis" | "techStack" | "scalability" | "tradeoffs" | "cost" | "terraform";
type ViewMode = "developer" | "student";

export default function ArchPanel({ design }: ArchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("components");
  const [mode, setMode] = useState<ViewMode>("developer");

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [dauScale, setDauScale] = useState(1);
  const [storageScale, setStorageScale] = useState(1);

  const [terraformCode, setTerraformCode] = useState<string | null>(null);
  const [isGeneratingTf, setIsGeneratingTf] = useState(false);

  // Clear cost estimate when a new design is loaded
  useEffect(() => {
    setCostEstimate(null);
    setDauScale(1);
    setStorageScale(1);
    setTerraformCode(null);
  }, [design]);

  const isStudent = mode === "student";

  const handleExport = (format: "markdown" | "json") => {
    if (!design) return;
    const content = format === "json"
      ? JSON.stringify(design, null, 2)
      : generateMd(design);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.title.replace(/\s+/g, "_").toLowerCase()}.${format === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEstimateCost = async () => {
    if (!design) return;
    setIsEstimating(true);
    setCostEstimate(null);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design }),
      });
      if (!response.ok) throw new Error("Failed to fetch estimate");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Default to 'fixed' if scalingFactor is missing from the LLM response
      if (data.breakdown) {
        data.breakdown = data.breakdown.map((item: any) => ({
          ...item,
          scalingFactor: item.scalingFactor || "fixed"
        }));
      }

      setCostEstimate(data);
      setDauScale(1);
      setStorageScale(1);
      setActiveTab("cost");
    } catch (error) {
      console.error(error);
      alert("Failed to estimate costs. Please try again.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleGenerateTerraform = async () => {
    if (!design) return;
    setIsGeneratingTf(true);
    setTerraformCode(null);
    try {
      const response = await fetch("/api/terraform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design }),
      });
      if (!response.ok) throw new Error("Failed to generate Terraform");
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setTerraformCode(data.terraform);
      setActiveTab("terraform");
    } catch (error) {
      console.error(error);
      alert("Failed to generate Terraform code.");
    } finally {
      setIsGeneratingTf(false);
    }
  };

  if (!design) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📐</div>
          <div className={styles.emptyTitle}>Architecture preview</div>
          <div className={styles.emptyDesc}>Your diagram and components will appear here</div>
        </div>
      </div>
    );
  }

  const TABS = ([
    { key: "components" as const, label: "Components", count: design.components.length },
    { key: "databases" as const, label: "Databases", count: design.databases.length },
    { key: "apis" as const, label: "APIs", count: design.apis.length },
    { key: "techStack" as const, label: "Tech Stack", count: design.techStack.length },
    { key: "scalability" as const, label: "Scalability", count: design.scalability.length },
    { key: "tradeoffs" as const, label: "Tradeoffs", count: design.tradeoffs.length },
    ...(costEstimate ? [{ key: "cost" as const, label: "Cost Estimate", count: 1 }] : []),
    ...(terraformCode ? [{ key: "terraform" as const, label: "Terraform", count: 1 }] : []),
  ] satisfies { key: TabKey; label: string; count: number }[]).filter(t => t.count > 0);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>{design.title}</span>
        <div className={styles.headerActions}>
          <button 
            className={`${styles.exportBtn} ${styles.terraformBtn}`}
            onClick={handleGenerateTerraform}
            disabled={isGeneratingTf}
          >
            {isGeneratingTf ? "⏳ Loading..." : "🏗️ Generate Terraform"}
          </button>
          <button 
            className={`${styles.exportBtn} ${styles.estimateBtn}`}
            onClick={handleEstimateCost}
            disabled={isEstimating}
          >
            {isEstimating ? "⏳ Estimating..." : "💰 Estimate Cost"}
          </button>
          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === "developer" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("developer")}
            >
              🛠 Dev
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "student" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("student")}
            >
              🎓 Learn
            </button>
          </div>
          <button className={styles.exportBtn} onClick={() => handleExport("markdown")}>📝 MD</button>
          <button className={styles.exportBtn} onClick={() => handleExport("json")}>📦 JSON</button>
        </div>
      </div>

      {/* Student mode: architecture summary */}
      {isStudent && (
        <div className={styles.studentSummary}>
          <div className={styles.studentSummaryLabel}>🎓 Architecture Overview</div>
          <p className={styles.studentSummaryText}>{design.summary}</p>
          <p className={styles.studentSummaryHint}>
            This system has <strong>{design.components.length}</strong> components,{" "}
            <strong>{design.databases.length}</strong> databases, and{" "}
            <strong>{design.apis.length}</strong> API endpoints. Below you&apos;ll find
            each explained with WHY it was chosen.
          </p>
        </div>
      )}

      {/* Diagram (hero) */}
      <div className={styles.diagramSection}>
        {design.dataFlow ? (
          <MermaidDiagram chart={design.dataFlow} />
        ) : (
          <div className={styles.diagramEmpty}>No diagram generated</div>
        )}
      </div>

      {/* Tabs */}
      {TABS.length > 0 && (
        <>
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className={styles.tabCount}>{t.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {/* ── COMPONENTS ── */}
            {activeTab === "components" && (
              <div className={styles.grid}>
                {design.components.map(c => (
                  <div key={c.name} className={styles.card}>
                    <div className={styles.cardName}>{c.name}</div>
                    <div className={styles.cardDesc}>{c.description}</div>
                    <div className={styles.cardMeta}>
                      <span className={`${styles.badge} ${styles.badgeType}`}>{c.type}</span>
                      <span className={`${styles.badge} ${styles.badgeTech}`}>{c.technology}</span>
                    </div>
                    {/* Student extras */}
                    {isStudent && (
                      <div className={styles.studentExtra}>
                        {c.purpose && (
                          <div className={styles.studentBlock}>
                            <span className={styles.studentLabel}>💡 Why this exists</span>
                            <p>{c.purpose}</p>
                          </div>
                        )}
                        {c.connections.length > 0 && (
                          <div className={styles.studentBlock}>
                            <span className={styles.studentLabel}>🔗 Connects to</span>
                            <p>{c.connections.join(" → ")}</p>
                          </div>
                        )}
                        <div className={styles.studentBlock}>
                          <span className={styles.studentLabel}>🤔 What if we removed it?</span>
                          <p>Without the {c.name}, {c.type === "database" ? "data would have nowhere to persist" : c.type === "cache" ? "every request would hit the database directly, causing slowdowns" : c.type === "queue" ? "the system couldn't handle tasks asynchronously" : c.type === "frontend" ? "users would have no way to interact with the system" : "this functionality would need to be handled by another component, increasing complexity"}.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── DATABASES ── */}
            {activeTab === "databases" && (
              <div className={styles.grid}>
                {design.databases.map(db => (
                  <div key={db.name} className={styles.card}>
                    <div className={styles.cardName}>{db.name}</div>
                    <div className={styles.cardMeta}>
                      <span className={`${styles.badge} ${DB_CLASS[db.type] || styles.badgeType}`}>{db.type}</span>
                      <span className={`${styles.badge} ${styles.badgeTech}`}>{db.technology}</span>
                    </div>
                    <div className={styles.cardDesc}>📊 {db.dataStored}</div>
                    {isStudent ? (
                      <div className={styles.studentExtra}>
                        <div className={styles.studentBlock}>
                          <span className={styles.studentLabel}>💡 Why {db.technology}?</span>
                          <p>{db.justification}</p>
                        </div>
                        <div className={styles.studentBlock}>
                          <span className={styles.studentLabel}>📖 {db.type.toUpperCase()} explained</span>
                          <p>{db.type === "sql" ? "SQL databases use tables with rows and columns, like a spreadsheet. Great for structured data with relationships between tables." : db.type === "nosql" ? "NoSQL databases store data as flexible documents (like JSON). Great when data structure changes frequently or you need horizontal scaling." : db.type === "cache" ? "A cache stores frequently accessed data in memory (RAM) for ultra-fast reads. Like keeping your most-used tools on your desk instead of in the drawer." : db.type === "search" ? "Search databases are optimized for full-text search, like finding a word in millions of documents instantly." : "Graph databases store data as nodes and edges, perfect for modeling relationships (social networks, recommendations)."}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.cardDesc} style={{ fontStyle: "italic" }}>&ldquo;{db.justification}&rdquo;</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── APIs ── */}
            {activeTab === "apis" && (
              <>
                {isStudent && (
                  <div className={styles.studentBanner}>
                    💡 APIs (Application Programming Interfaces) are the &quot;doors&quot; that other programs use to communicate
                    with this system. Each endpoint has a <strong>method</strong> (what action to take) and a <strong>path</strong> (where to send the request).
                  </div>
                )}
                <table className={styles.apiTable}>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Description</th>
                      <th>Handler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {design.apis.map((api, i) => (
                      <tr key={i}>
                        <td><span className={`${styles.methodBadge} ${METHOD_CLASS[api.method] || ""}`}>{api.method}</span></td>
                        <td className={styles.apiPath}>{api.path}</td>
                        <td>{api.description}</td>
                        <td>{api.handler}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isStudent && (
                  <div className={styles.studentBanner} style={{ marginTop: 12 }}>
                    <strong>GET</strong> = read data · <strong>POST</strong> = create new data · <strong>PUT</strong> = update existing · <strong>DELETE</strong> = remove · <strong>PATCH</strong> = partial update
                  </div>
                )}
              </>
            )}

            {/* ── TECH STACK ── */}
            {activeTab === "techStack" && (
              <div className={styles.techGrid}>
                {design.techStack.map(t => (
                  <div key={t.name} className={styles.techChip}>
                    <div className={styles.techCategory}>{t.category}</div>
                    <div className={styles.techName}>{t.name}</div>
                    <div className={styles.techJust}>{t.justification}</div>
                    {isStudent && (
                      <div className={styles.studentBlock} style={{ marginTop: 8 }}>
                        <span className={styles.studentLabel}>📖 Category: {t.category}</span>
                        <p style={{ fontSize: 11 }}>{getCategoryExplanation(t.category)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── SCALABILITY ── */}
            {activeTab === "scalability" && (
              <>
                {isStudent && (
                  <div className={styles.studentBanner}>
                    🎓 Scalability means &quot;can this system handle more users?&quot; Below are potential bottlenecks and strategies to address them as your system grows.
                  </div>
                )}
                {design.scalability.map((s, i) => (
                  <div key={i} className={styles.scaleCard}>
                    <div className={styles.scaleConcern}>{s.concern}</div>
                    <span className={styles.scaleStrategy}>{s.strategy}</span>
                    <div className={styles.scaleExplanation}>{s.explanation}</div>
                    {isStudent && (
                      <div className={styles.studentBlock} style={{ marginTop: 8 }}>
                        <span className={styles.studentLabel}>📖 {s.strategy} explained</span>
                        <p style={{ fontSize: 11 }}>{getStrategyExplanation(s.strategy)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── COST ESTIMATING ── */}
            {activeTab === "cost" && costEstimate && (
              <div className={styles.costTab}>
                <div className={styles.costControls}>
                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      <span>🚀 Daily Active Users: {Math.round((costEstimate.baseScale?.dau || 10000) * dauScale).toLocaleString()}</span>
                      <span className={styles.sliderValue}>{dauScale.toFixed(1)}x</span>
                    </label>
                    <input 
                      type="range" 
                      min="0.1" max="50" step="0.1" 
                      value={dauScale} 
                      onChange={(e) => setDauScale(parseFloat(e.target.value))}
                      className={styles.slider}
                    />
                  </div>
                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      <span>🗄️ Database Storage: {Math.round((costEstimate.baseScale?.storageGB || 100) * storageScale).toLocaleString()} GB</span>
                      <span className={styles.sliderValue}>{storageScale.toFixed(1)}x</span>
                    </label>
                    <input 
                      type="range" 
                      min="0.1" max="50" step="0.1" 
                      value={storageScale} 
                      onChange={(e) => setStorageScale(parseFloat(e.target.value))}
                      className={styles.slider}
                    />
                  </div>
                </div>

                <div className={styles.costTotal}>
                  <div className={styles.costTotalLabel}>Estimated Monthly Cost</div>
                  <div className={styles.costTotalValue}>
                    ${Math.round(costEstimate.breakdown.reduce((sum, item) => {
                      let multiplier = 1;
                      if (item.scalingFactor === "traffic") multiplier = dauScale;
                      if (item.scalingFactor === "storage") multiplier = storageScale;
                      return sum + item.monthlyCost * multiplier;
                    }, 0)).toLocaleString()} <span className={styles.costCurrency}>{costEstimate.currency}</span>
                  </div>
                </div>

                <table className={styles.apiTable}>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costEstimate.breakdown.map((item, i) => {
                      let multiplier = 1;
                      let scaleIcon = "🔧";
                      if (item.scalingFactor === "traffic") { multiplier = dauScale; scaleIcon = "🚀"; }
                      if (item.scalingFactor === "storage") { multiplier = storageScale; scaleIcon = "🗄️"; }
                      const scaledCost = item.monthlyCost * multiplier;
                      return (
                        <tr key={i}>
                          <td className={styles.costComponent}>
                            <span title={item.scalingFactor + " scaling"} className={styles.scaleIcon}>{scaleIcon}</span> 
                            {item.component}
                          </td>
                          <td style={{ color: "var(--text-gray)" }}>{item.description}</td>
                          <td className={styles.costValue}>${Math.round(scaledCost).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* ── TRADEOFFS ── */}
            {activeTab === "tradeoffs" && (
              <>
                {isStudent && (
                  <div className={styles.studentBanner}>
                    🎓 Every architecture involves tradeoffs — there&apos;s no perfect design. Understanding WHAT you give up is as important as knowing what you gain.
                  </div>
                )}
                {design.tradeoffs.map((t, i) => (
                  <div key={i} className={styles.tradeoffCard}>
                    <div className={styles.tradeoffDecision}>{t.decision}</div>
                    <div className={styles.tradeoffCols}>
                      <div>
                        <div className={`${styles.tradeoffLabel} ${styles.tradeoffProsLabel}`}>✅ Pros</div>
                        <ul className={styles.tradeoffList}>
                          {t.pros.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className={`${styles.tradeoffLabel} ${styles.tradeoffConsLabel}`}>⚠️ Cons</div>
                        <ul className={styles.tradeoffList}>
                          {t.cons.map((c, j) => <li key={j}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className={styles.tradeoffReason}>{t.reasoning}</div>
                  </div>
                ))}
              </>
            )}

            {/* ── TERRAFORM ── */}
            {activeTab === "terraform" && terraformCode && (
              <div className={`${styles.terraformTab} ${styles.animateFadeIn}`}>
                <div className={styles.tfHeader}>
                  <div className={styles.tfHeaderTitle}>
                    <span className={styles.tfIcon}>🏗️</span>
                    <span>main.tf</span>
                  </div>
                  <button 
                    className={styles.tfDownloadBtn}
                    onClick={() => {
                      const blob = new Blob([terraformCode], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `main_${Date.now()}.tf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    ⬇️ Download
                  </button>
                </div>
                <pre className={styles.tfCode}>
                  <code>{terraformCode}</code>
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* Helper: explain tech categories for students */
function getCategoryExplanation(cat: string): string {
  const map: Record<string, string> = {
    language: "The programming language used to write the code.",
    framework: "A toolkit that provides structure and common functionality so you don't build everything from scratch.",
    database: "Where your data lives permanently, even when the server restarts.",
    cache: "Ultra-fast temporary storage in memory. Like a sticky note vs a filing cabinet.",
    queue: "A waiting line for tasks. Lets the system handle things one at a time without losing requests.",
    search: "Specialized for finding text within large amounts of data, like Google but for your app.",
    monitoring: "Tools that watch your system's health — are servers running? Are responses fast?",
    deployment: "How your code gets from your computer to servers that users can access.",
    cdn: "Content Delivery Network — copies of your files stored worldwide so users load things faster.",
    auth: "Handles who users are (authentication) and what they're allowed to do (authorization).",
  };
  return map[cat] || "A supporting technology in the architecture.";
}

/* Helper: explain scaling strategies for students */
function getStrategyExplanation(strategy: string): string {
  const map: Record<string, string> = {
    horizontal: "Add more servers to share the load. Like opening more checkout lanes when the store gets busy.",
    vertical: "Make one server more powerful (more CPU, RAM). Like upgrading your computer instead of buying a second one.",
    caching: "Store frequently accessed data in fast memory so you don't recalculate it every time.",
    sharding: "Split your database into smaller pieces across multiple servers. Each piece handles a subset of data.",
    cdn: "Serve static files (images, CSS, JS) from servers close to the user instead of from one central location.",
    async: "Move slow tasks to a background queue. The user doesn't wait — the system processes it later.",
  };
  return map[strategy] || "A strategy to handle increasing system load.";
}

function generateMd(d: SystemDesign): string {
  let md = `# ${d.title}\n\n${d.summary}\n\n`;
  if (d.dataFlow) md += `## Diagram\n\n\`\`\`mermaid\n${d.dataFlow}\n\`\`\`\n\n`;
  if (d.components.length) {
    md += `## Components\n\n`;
    d.components.forEach(c => { md += `### ${c.name} (${c.type})\n- **Tech:** ${c.technology}\n- ${c.description}\n- **Purpose:** ${c.purpose}\n\n`; });
  }
  if (d.databases.length) {
    md += `## Databases\n\n`;
    d.databases.forEach(db => { md += `### ${db.name} (${db.type})\n- **Tech:** ${db.technology}\n- **Data:** ${db.dataStored}\n- **Why:** ${db.justification}\n\n`; });
  }
  if (d.apis.length) {
    md += `## API Endpoints\n\n| Method | Path | Description | Handler |\n|--------|------|-------------|--------|\n`;
    d.apis.forEach(a => { md += `| ${a.method} | \`${a.path}\` | ${a.description} | ${a.handler} |\n`; });
    md += "\n";
  }
  if (d.techStack.length) {
    md += `## Tech Stack\n\n`;
    d.techStack.forEach(t => { md += `- **${t.name}** (${t.category}): ${t.justification}\n`; });
    md += "\n";
  }
  return md;
}
