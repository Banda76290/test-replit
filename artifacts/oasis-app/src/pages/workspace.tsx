import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetPrestation, useRunAnalysis, useSubmitFeedback, type AnalysisResult } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import {
  Cpu, FileText, Sparkles, AlertTriangle, CheckCircle2,
  Server, ThumbsUp, ThumbsDown, Loader2, ArrowLeft,
  Globe, ChevronDown, ChevronRight as ChevronRightIcon, Search,
  Folder, FolderOpen, File, LayoutGrid, List, GitBranch,
  SortAsc, Filter, Home, ExternalLink, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  { id: "analyze-need", label: "Analyser un besoin" },
  { id: "propose-implementation", label: "Proposer une implémentation" },
  { id: "analyze-impact", label: "Analyse d'impact" },
  { id: "generate-plan", label: "Générer un plan technique" },
  { id: "generate-docs", label: "Générer la documentation" },
  { id: "prepare-response", label: "Préparer une réponse technique" },
  { id: "propose-fix", label: "Proposer un correctif" },
  { id: "produce-diff", label: "Produire un diff de code" },
];

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  ext?: string;
  size?: string;
  modified?: string;
  children?: FileNode[];
};

function buildTree(id: string, name: string, type: "folder" | "file", children?: FileNode[], opts?: { size?: string; modified?: string }): FileNode {
  return { id, name, type, children, ext: name.includes(".") ? name.split(".").pop() : undefined, ...opts };
}

function f(name: string, modified = "28/03/2026", size?: string): FileNode {
  return buildTree(name, name, "file", undefined, { modified, size: size || `${Math.floor(Math.random() * 90 + 10)} Ko` });
}
function d(name: string, children: FileNode[] = []): FileNode {
  return buildTree(name, name, "folder", children);
}

const PRESTASHOP_TREE: FileNode[] = [
  d("admin", [
    d("autoupgrade"), d("backup"), d("controllers", [d("modules"), d("upgrade")]),
    d("filemanager"), d("help"), d("import"), d("themes"),
    f("index.php"), f("functions.php"),
  ]),
  d("api", [f("dispatcher.php"), f("WebserviceOutputBuilder.php")]),
  d("cache", [d("cachefs"), d("feeds"), d("smarty", [d("cache"), d("compile")])]),
  d("classes", [
    d("helper"), d("module"), d("pdf"), d("webservice"),
    f("Address.php"), f("Cart.php"), f("Category.php"), f("Currency.php"),
    f("Customer.php"), f("Order.php"), f("Product.php"), f("Tools.php"),
  ]),
  d("config", [
    f("alias.php"), f("autoload.php"), f("bootstrap.php"), f("config.inc.php"),
    f("defines.inc.php"), f("settings.inc.php"),
  ]),
  d("controllers", [
    d("admin"), d("front", [
      f("CartController.php"), f("CheckoutController.php"),
      f("OrderController.php"), f("ProductController.php"),
      f("SearchController.php"),
    ]),
  ]),
  d("css", [f("global.css"), f("fonts.css")]),
  d("img", [d("c"), d("p"), d("m"), d("logo.jpg", [])]),
  d("js", [f("jquery.min.js"), f("bootstrap.min.js"), f("checkout.js")]),
  d("mails", [d("fr", [f("order_conf.html"), f("payment.html")])]),
  d("modules", [
    d("blockbanner"), d("blockcart"), d("blocksearch"),
    d("ps_checkout", [
      f("ps_checkout.php"), f("composer.json"), d("src", [
        f("PayPalClient.php"), f("CheckoutChecker.php"),
      ]),
    ]),
    d("ps_emailsubscription"), d("ps_facetedsearch"),
    d("ps_searchbar"), d("ps_shoppingcart"),
  ]),
  d("override", [d("classes"), d("controllers")]),
  d("src", [
    d("Adapter"), d("Core", [d("Cart"), d("Checkout"), d("Product")]),
    d("PrestaShopBundle"), d("Repository"),
  ]),
  d("themes", [
    d("classic", [
      d("assets", [d("css"), d("img"), d("js")]),
      d("modules"), d("templates", [d("catalog"), d("checkout"), d("layouts")]),
      f("config", "."),
      f("preview.jpg"),
    ]),
  ]),
  d("translations", [d("fr-FR")]),
  d("upload"),
  d("var", [d("cache"), d("logs")]),
  d("vendor", [d("composer"), d("doctrine"), d("symfony"), d("twig")]),
  f(".htaccess", "27/03/2026", "3 Ko"),
  f("composer.json", "15/03/2026", "2 Ko"),
  f("composer.lock", "15/03/2026", "120 Ko"),
  f("index.php", "01/01/2026", "1 Ko"),
  f("robots.txt", "01/01/2026", "1 Ko"),
  f("sitemap.xml", "28/03/2026", "45 Ko"),
  f("CHANGELOG.md", "10/03/2026", "22 Ko"),
];

const MAGENTO_TREE: FileNode[] = [
  d("app", [
    d("code", [d("Magento"), d("Vendor")]),
    d("design", [d("frontend"), d("adminhtml")]),
    d("etc", [f("config.php"), f("env.php")]),
    d("i18n"),
  ]),
  d("bin", [f("magento")]),
  d("dev", [d("tests")]),
  d("generated", [d("code"), d("metadata")]),
  d("lib", [d("internal"), d("web")]),
  d("pub", [d("errors"), d("media"), d("static"), f("index.php"), f(".htaccess")]),
  d("setup", [d("src"), d("pub")]),
  d("var", [d("cache"), d("log"), d("session"), d("tmp")]),
  d("vendor", [d("magento"), d("phpunit"), d("symfony")]),
  f(".gitignore", "01/01/2026", "1 Ko"),
  f("auth.json", "15/03/2026", "1 Ko"),
  f("composer.json", "15/03/2026", "3 Ko"),
  f("composer.lock", "15/03/2026", "450 Ko"),
  f("index.php", "01/01/2026", "1 Ko"),
  f("nginx.conf.sample", "01/01/2026", "5 Ko"),
  f("php.ini.sample", "01/01/2026", "2 Ko"),
  f("robots.txt", "01/01/2026", "1 Ko"),
];

function getTreeForUrl(url: string): FileNode[] {
  if (url.includes("techflow") || url.includes("b2b")) return MAGENTO_TREE;
  return PRESTASHOP_TREE;
}

function getFileIcon(node: FileNode) {
  if (node.type === "folder") return null;
  const ext = node.ext?.toLowerCase();
  if (["php", "ts", "tsx", "js", "jsx"].includes(ext || "")) return "text-blue-500";
  if (["html", "htm"].includes(ext || "")) return "text-orange-500";
  if (["css", "scss", "sass"].includes(ext || "")) return "text-pink-500";
  if (["json", "xml", "yaml", "yml"].includes(ext || "")) return "text-amber-500";
  if (["jpg", "jpeg", "png", "gif", "svg", "ico"].includes(ext || "")) return "text-green-500";
  if (["md", "txt"].includes(ext || "")) return "text-muted-foreground";
  return "text-muted-foreground";
}

type ViewMode = "icon" | "list" | "tree";

function FileExplorer({ tree }: { tree: FileNode[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("icon");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("type");
  const [path, setPath] = useState<{ name: string; nodes: FileNode[] }[]>([{ name: "ROOT_DIR", nodes: tree }]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const currentNodes = path[path.length - 1].nodes;

  const sorted = [...currentNodes].sort((a, b) => {
    if (sortBy === "type") {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const filtered = filter
    ? sorted.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()))
    : sorted;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const navigateInto = (node: FileNode) => {
    if (node.type === "folder") {
      setPath(p => [...p, { name: node.name, nodes: node.children || [] }]);
    }
  };

  const navigateTo = (index: number) => {
    setPath(p => p.slice(0, index + 1));
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="border-b border-border/60 px-4 py-2.5 flex flex-col gap-2 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Recherche de fichier ou mots clés..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-1 border border-border rounded overflow-hidden bg-card">
            <button
              onClick={() => setViewMode("icon")}
              title="Icônes"
              className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors", viewMode === "icon" ? "bg-primary text-white" : "hover:bg-muted/60 text-muted-foreground")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Icône</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Liste"
              className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors border-x border-border", viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted/60 text-muted-foreground")}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              onClick={() => setViewMode("tree")}
              title="Arborescence"
              className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors", viewMode === "tree" ? "bg-primary text-white" : "hover:bg-muted/60 text-muted-foreground")}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Arbo</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SortAsc className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "name" | "type")}
              className="bg-card border border-border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
            >
              <option value="type">Type</option>
              <option value="name">Nom</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {path.map((segment, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRightIcon className="w-3 h-3 text-muted-foreground" />}
              <button
                onClick={() => navigateTo(i)}
                className={cn(
                  "flex items-center gap-1 font-mono transition-colors hover:text-primary",
                  i === path.length - 1 ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                {i === 0 && <Home className="w-3 h-3" />}
                {segment.name}
              </button>
            </span>
          ))}
          <span className="ml-2 text-muted-foreground">({filtered.length} élément{filtered.length > 1 ? "s" : ""})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {viewMode === "icon" && (
          <div className="flex flex-wrap gap-2">
            {filtered.map(node => (
              <button
                key={node.id}
                onDoubleClick={() => navigateInto(node)}
                onClick={() => node.type === "folder" && navigateInto(node)}
                title={node.name}
                className="flex flex-col items-center gap-1 p-2 w-20 rounded hover:bg-muted/60 group cursor-pointer text-center transition-colors"
              >
                {node.type === "folder" ? (
                  <Folder className="w-9 h-9 text-amber-400 group-hover:text-amber-500 fill-amber-100 group-hover:fill-amber-200 transition-colors" strokeWidth={1.5} />
                ) : (
                  <File className={cn("w-9 h-9 fill-blue-50", getFileIcon(node))} strokeWidth={1.5} />
                )}
                <span className="text-[10px] text-foreground/80 leading-tight break-all line-clamp-2">{node.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Filter className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Aucun fichier correspondant</p>
              </div>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <div className="w-full text-xs">
            <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-muted-foreground font-semibold border-b border-border/40 uppercase tracking-wide text-[10px]">
              <div className="col-span-5">Nom</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Taille</div>
              <div className="col-span-3">Modifié</div>
            </div>
            {filtered.map(node => (
              <div
                key={node.id}
                onClick={() => node.type === "folder" && navigateInto(node)}
                className={cn(
                  "grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-border/20 transition-colors",
                  node.type === "folder" ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20"
                )}
              >
                <div className="col-span-5 flex items-center gap-2 truncate">
                  {node.type === "folder"
                    ? <Folder className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} />
                    : <File className={cn("w-4 h-4 shrink-0", getFileIcon(node))} strokeWidth={1.5} />
                  }
                  <span className="truncate text-foreground/90">{node.name}</span>
                </div>
                <div className="col-span-2 text-muted-foreground">{node.type === "folder" ? "Dossier" : node.ext?.toUpperCase() || "—"}</div>
                <div className="col-span-2 text-muted-foreground">{node.type === "folder" ? `${node.children?.length || 0} él.` : node.size}</div>
                <div className="col-span-3 text-muted-foreground">{node.modified || "—"}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Aucun fichier correspondant</div>
            )}
          </div>
        )}

        {viewMode === "tree" && (
          <TreeView nodes={filtered} expandedIds={expandedIds} toggle={toggleExpand} depth={0} />
        )}
      </div>
    </div>
  );
}

function TreeView({ nodes, expandedIds, toggle, depth }: {
  nodes: FileNode[];
  expandedIds: Set<string>;
  toggle: (id: string) => void;
  depth: number;
}) {
  return (
    <div>
      {nodes.map(node => {
        const isExpanded = expandedIds.has(node.id);
        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-1.5 py-1 px-2 rounded text-xs hover:bg-muted/40 cursor-pointer group transition-colors",
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => node.type === "folder" && toggle(node.id)}
            >
              {node.type === "folder" ? (
                <>
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    : <ChevronRightIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                  }
                  {isExpanded
                    ? <FolderOpen className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} />
                    : <Folder className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} />
                  }
                </>
              ) : (
                <>
                  <span className="w-3 shrink-0" />
                  <File className={cn("w-4 h-4 shrink-0", getFileIcon(node))} strokeWidth={1.5} />
                </>
              )}
              <span className="text-foreground/90 truncate">{node.name}</span>
              {node.type === "folder" && node.children && (
                <span className="text-[10px] text-muted-foreground ml-auto">{node.children.length}</span>
              )}
              {node.type === "file" && (
                <span className="text-[10px] text-muted-foreground ml-auto opacity-0 group-hover:opacity-100">{node.size}</span>
              )}
            </div>
            {node.type === "folder" && isExpanded && node.children && (
              <TreeView nodes={node.children} expandedIds={expandedIds} toggle={toggle} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WorkspacePage() {
  const [, params] = useRoute("/workspace/:prestationId");
  const prestationId = params?.prestationId || "";
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!prestationId) navigate("/projets");
  }, [prestationId, navigate]);

  const { data: prestation } = useGetPrestation(prestationId);
  const runAnalysis = useRunAnalysis();

  const [taskType, setTaskType] = useState(TASK_TYPES[0].id);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "plan" | "sources">("summary");

  const [urlInput, setUrlInput] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [siteCollapsed, setSiteCollapsed] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const availableUrls: string[] = prestation
    ? [prestation.productionUrl, ...(prestation.saveUrls || [])].filter(Boolean)
    : [];

  const filteredSuggestions = availableUrls.filter(url =>
    url.toLowerCase().includes(urlInput.toLowerCase())
  );

  useEffect(() => {
    if (prestation?.productionUrl && !urlInput) {
      setUrlInput(prestation.productionUrl);
    }
  }, [prestation]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        urlInputRef.current && !urlInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback(() => {
    if (urlInput.trim()) {
      setSelectedUrl(urlInput.trim());
      setShowSuggestions(false);
      setSiteCollapsed(true);
    }
  }, [urlInput]);

  const handleSelectSuggestion = (url: string) => {
    setUrlInput(url);
    setSelectedUrl(url);
    setShowSuggestions(false);
    setSiteCollapsed(true);
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await runAnalysis.mutateAsync({
        data: {
          prestationId,
          projectId: prestation?.projectId || "",
          taskType,
          prompt,
        },
      });
      setResult(res);
      setActiveTab("summary");
    } catch (e) {
      console.error("Échec de l'analyse", e);
    }
  };

  const fileTree = selectedUrl ? getTreeForUrl(selectedUrl) : null;

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
              {prestation?.projectId ? (
                <Link href={`/projects/${prestation.projectId}/prestations`} className="hover:text-primary flex items-center transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour aux prestations
                </Link>
              ) : (
                <Link href="/projets" className="hover:text-primary flex items-center transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </Link>
              )}
              {prestation && (
                <>
                  <span>/</span>
                  <span className="font-medium text-foreground">{prestation.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">{prestation.ref}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Espace de travail OASIS</h1>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1 pb-6">
            <Card className="border-border/60 shadow-sm shrink-0 overflow-visible">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                onClick={() => setSiteCollapsed(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {selectedUrl ? "Site sélectionné" : "Sélectionner le site"}
                  </span>
                  {selectedUrl && (
                    <span className="text-xs text-muted-foreground truncate max-w-32">{selectedUrl}</span>
                  )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", siteCollapsed && "rotate-180")} />
              </div>

              {!siteCollapsed && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-border/40">
                  <div className="pt-3 space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                      URL du site courant
                    </label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            ref={urlInputRef}
                            type="url"
                            value={urlInput}
                            onChange={e => {
                              setUrlInput(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                            placeholder="https://..."
                            className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          {showSuggestions && filteredSuggestions.length > 0 && (
                            <div
                              ref={suggestionsRef}
                              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                            >
                              {filteredSuggestions.map(url => (
                                <button
                                  key={url}
                                  onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(url); }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                                >
                                  <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{url}</span>
                                  {url === prestation?.productionUrl && (
                                    <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">Prod</span>
                                  )}
                                  {prestation?.saveUrls?.includes(url) && (
                                    <span className="shrink-0 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">Save</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={handleSearch} className="shrink-0">
                          <Search className="w-3.5 h-3.5 mr-1.5" />
                          Charger
                        </Button>
                      </div>
                    </div>

                    {selectedUrl && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Arborescence chargée</span>
                        <a href={selectedUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Ouvrir
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border-border/60 shadow-sm shrink-0">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <CardTitle className="text-base flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-primary" />
                  Configurer l'analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Type de tâche</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {TASK_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setTaskType(type.id)}
                        className={cn(
                          "text-left px-3 py-2 rounded-md text-sm transition-all border",
                          taskType === type.id
                            ? "bg-primary/5 border-primary text-primary font-medium"
                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Requête / Demande</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Décrivez ce que vous souhaitez que l'IA analyse ou construise..."
                    className="w-full h-28 p-3 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  />
                </div>

                <div className="border-2 border-dashed border-border/60 rounded-md p-4 text-center bg-muted/10">
                  <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs text-muted-foreground">Glissez-déposez vos documents ici ou cliquez pour parcourir</p>
                </div>

                <Button
                  onClick={handleRunAnalysis}
                  disabled={runAnalysis.isPending || !prompt.trim()}
                  className="w-full h-11 text-base shadow-md"
                >
                  {runAnalysis.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement en cours...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Lancer l'analyse IA</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
            {runAnalysis.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-foreground mt-6">Analyse du contexte en cours...</h3>
                <p className="text-sm text-muted-foreground mt-2">Récupération du code source, de l'historique et des spécifications client.</p>
              </div>
            ) : result ? (
              <div className="flex flex-col h-full overflow-hidden animate-fade-in">
                <div className="bg-slate-900 text-white p-6 shrink-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-primary/20 text-primary-foreground rounded-full text-xs font-semibold border border-primary/30 uppercase tracking-wider">
                          {TASK_TYPES.find(t => t.id === result.taskType)?.label}
                        </span>
                        <span className="flex items-center text-xs text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                          Confiance : {Math.round((result.confidenceScore || 0) * 100)}%
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold leading-tight">{result.executiveSummary}</h2>
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Réinitialiser
                    </button>
                  </div>
                  <div className="flex gap-6 border-b border-slate-700/50">
                    <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>Synthèse</TabButton>
                    {result.technicalPlan && <TabButton active={activeTab === "plan"} onClick={() => setActiveTab("plan")}>Plan technique</TabButton>}
                    <TabButton active={activeTab === "sources"} onClick={() => setActiveTab("sources")}>Sources contextuelles</TabButton>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                  {activeTab === "summary" && <SummaryView result={result} />}
                  {activeTab === "plan" && result.technicalPlan && <PlanView plan={result.technicalPlan} />}
                  {activeTab === "sources" && <SourcesView analysisId={result.id} />}
                </div>
                <FeedbackPanel analysisId={result.id} />
              </div>
            ) : fileTree ? (
              <FileExplorer tree={fileTree} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Sélectionnez un site</h2>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  Renseignez l'URL du site dans le panneau de gauche pour charger son arborescence de fichiers, puis configurez votre analyse.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("pb-3 text-sm font-medium transition-colors relative", active ? "text-white" : "text-slate-400 hover:text-slate-200")}
    >
      {children}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}

function SummaryView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {result.requestUnderstanding && (
        <section>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Compréhension de la demande</h3>
          <p className="text-foreground/90 leading-relaxed bg-card p-4 rounded-lg border border-border shadow-sm">{result.requestUnderstanding}</p>
        </section>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.impactedComponents && (
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center">
              <Server className="w-4 h-4 mr-2 text-primary" />Composants impactés
            </h3>
            <ul className="space-y-2">
              {result.impactedComponents.map((comp, i) => (
                <li key={i} className="bg-card p-3 rounded border border-border shadow-sm text-sm text-foreground/90 flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-3 shrink-0" />{comp}
                </li>
              ))}
            </ul>
          </section>
        )}
        {result.identifiedRisks && (
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />Risques identifiés
            </h3>
            <ul className="space-y-2">
              {result.identifiedRisks.map((risk, i) => (
                <li key={i} className="bg-amber-500/10 p-3 rounded border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3 shrink-0" />{risk}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {result.recommendedApproach && (
        <section>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Approche recommandée</h3>
          <div className="bg-primary/5 p-5 rounded-lg border border-primary/20 text-foreground leading-relaxed">{result.recommendedApproach}</div>
        </section>
      )}
    </div>
  );
}

function PlanView({ plan }: { plan: any }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 mb-6">
        <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-sm flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Complexité</p>
          <p className="font-semibold text-foreground">{plan.complexityEstimate}</p>
        </div>
        <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-sm flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Effort estimé</p>
          <p className="font-semibold text-foreground">{plan.effortEstimate}</p>
        </div>
      </div>
      <section>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Séquence d'actions</h3>
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {plan.actionSequence.map((step: string, i: number) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted text-muted-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">{i + 1}</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-lg border border-border shadow-sm text-sm text-foreground/90">{step}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourcesView({ analysisId }: { analysisId: string }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-2 py-1 rounded">Code source</span>
          <span className="text-xs text-muted-foreground">Pertinence : 95%</span>
        </div>
        <h4 className="font-semibold text-foreground mb-2">classes/Cart.php</h4>
        <p className="text-sm text-foreground/80 font-mono bg-muted/50 p-2 rounded">Contexte extrait concernant l'implémentation actuelle du tunnel de paiement.</p>
      </div>
      <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-purple-600 bg-purple-100 px-2 py-1 rounded">Ticket Jira</span>
          <span className="text-xs text-muted-foreground">Pertinence : 88%</span>
        </div>
        <h4 className="font-semibold text-foreground mb-2">PROJ-482 : Mise à jour de la version API Stripe</h4>
        <p className="text-sm text-foreground/80 bg-muted/50 p-2 rounded">La tentative précédente de mise à jour de l'API a échoué en raison d'une incompatibilité de signature webhook.</p>
      </div>
    </div>
  );
}

function FeedbackPanel({ analysisId }: { analysisId: string }) {
  const submitFeedback = useSubmitFeedback();
  const [comment, setComment] = useState("");
  const handleAction = async (action: string) => {
    await submitFeedback.mutateAsync({ id: analysisId, data: { action, comment } });
    setComment("");
  };
  return (
    <div className="bg-card border-t border-border/60 p-4 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full">
        <input
          type="text"
          placeholder="Ajouter un commentaire ou une demande d'ajustement..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-muted/30 border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button variant="outline" onClick={() => handleAction("reject")} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 flex-1 md:flex-none">
          <ThumbsDown className="w-4 h-4 mr-2" /> Rejeter
        </Button>
        <Button variant="outline" onClick={() => handleAction("adjust")} className="flex-1 md:flex-none">Ajuster</Button>
        <Button onClick={() => handleAction("accept")} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none">
          <ThumbsUp className="w-4 h-4 mr-2" /> Accepter
        </Button>
      </div>
    </div>
  );
}
