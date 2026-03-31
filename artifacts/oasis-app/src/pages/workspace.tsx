import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useGetPrestation, useRunAnalysis, useSubmitFeedback, type AnalysisResult } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import {
  Cpu, FileText, Sparkles, AlertTriangle, CheckCircle2,
  Server, ThumbsUp, ThumbsDown, Loader2, ArrowLeft,
  Globe, ChevronDown, ChevronRight as ChevronRightIcon, Search,
  Folder, FolderOpen, File, LayoutGrid, List,
  SortAsc, Filter, Home, ExternalLink, RefreshCw, Settings2,
  X, GitBranch, Code2, Copy, Check, Pencil, RotateCcw, Save,
  AlertCircle, Clock, ZapOff, ChevronLeft,
  Maximize2, Minimize2, Upload, Hash, FileUp, FolderSearch,
  MessageSquare, Briefcase, Bug, CalendarDays, BarChart2,
  TrendingUp, ShieldAlert, ShieldCheck, Info, ChevronRight,
  Zap, Users, Link2, CheckSquare,
  Paperclip, ImageIcon, FileText as FileTextIcon, X as XIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChatFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  preview?: string;
  content?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "ia";
  content: string;
  timestamp: Date;
  files?: ChatFile[];
};

function genererReponseMockIA(msg: string, fileName?: string | null): string {
  const m = msg.toLowerCase();
  const f = fileName ?? "ce fichier";
  if (m.includes("refactor") || m.includes("réfactor") || m.includes("réorganis")) {
    return `J'ai analysé \`${f}\`. Voici ce que je propose :\n\n**Refactoring suggéré :**\n- Extraire la logique métier dans un service dédié\n- Remplacer les variables temporaires par des constantes nommées\n- Décomposer les fonctions de plus de 30 lignes\n\nVoulez-vous que je génère le diff correspondant ?`;
  }
  if (m.includes("bug") || m.includes("erreur") || m.includes("problème") || m.includes("corrig")) {
    return `J'ai détecté un problème potentiel dans \`${f}\` :\n\n\`\`\`\n// Ligne ~42 : risque de null pointer\nconst value = data.items[0].price;\n// → À remplacer par :\nconst value = data?.items?.[0]?.price ?? 0;\n\`\`\`\n\nSouhaitez-vous que j'applique la correction ?`;
  }
  if (m.includes("explique") || m.includes("que fait") || m.includes("comprend") || m.includes("décris")) {
    return `**Analyse de \`${f}\` :**\n\nCe fichier gère la couche de présentation pour le module concerné. Il :\n\n1. Initialise les dépendances en haut du bloc\n2. Définit les handlers d'événements\n3. Expose une interface publique via les exports\n\nLa logique principale est concentrée dans le bloc central. Y a-t-il une section spécifique que vous voulez approfondir ?`;
  }
  if (m.includes("ajoute") || m.includes("génère") || m.includes("crée") || m.includes("implément")) {
    return `Je vais générer le code pour votre demande dans \`${f}\`.\n\n\`\`\`php\n// Nouveau bloc généré\nfunction handleNewFeature(array $params): array {\n    $validated = $this->validate($params);\n    if (!$validated) return ['error' => 'Paramètres invalides'];\n    return $this->service->process($validated);\n}\n\`\`\`\n\nCe code respecte les conventions du fichier. Confirmez-vous l'intégration ?`;
  }
  if (m.includes("optimis") || m.includes("performance") || m.includes("rapide") || m.includes("lent")) {
    return `**Audit de performance — \`${f}\` :**\n\n⚠️ Requête N+1 détectée dans la boucle principale\n⚠️ Cache non exploité pour les appels répétés\n✅ Indexation correcte des clés primaires\n\n**Gain estimé :** ~60% de réduction des temps de réponse en appliquant eager loading.\n\nJe peux générer le diff de correction si vous le souhaitez.`;
  }
  if (m.includes("test") || m.includes("spec") || m.includes("unitaire")) {
    return `Voici des tests unitaires pour \`${f}\` :\n\n\`\`\`php\npublic function testHandleValidInput(): void {\n    $result = $this->handler->process(['id' => 1]);\n    $this->assertEquals('success', $result['status']);\n}\n\npublic function testHandleInvalidInput(): void {\n    $result = $this->handler->process([]);\n    $this->assertArrayHasKey('error', $result);\n}\n\`\`\`\n\nCouverture estimée : 78%. Voulez-vous couvrir les cas limites supplémentaires ?`;
  }
  if (m.includes("document") || m.includes("comment") || m.includes("phpdoc") || m.includes("jsdoc")) {
    return `J'ai généré la documentation pour \`${f}\` :\n\n\`\`\`php\n/**\n * Traite la requête entrante et retourne le résultat formaté.\n *\n * @param array $params Paramètres validés\n * @return array Résultat avec status et data\n * @throws InvalidArgumentException si $params est vide\n */\n\`\`\`\n\nSouhaitez-vous que j'insère les blocs PHPDoc dans l'ensemble du fichier ?`;
  }
  return `J'analyse votre demande sur \`${f}\`.\n\nPourriez-vous préciser l'action souhaitée ? Par exemple :\n- **Refactoriser** une section spécifique\n- **Expliquer** le fonctionnement d'un bloc\n- **Corriger** un bug identifié\n- **Ajouter** une fonctionnalité\n- **Optimiser** les performances\n- **Générer des tests** unitaires`;
}

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

type TacheCode = {
  code: string;
  titre: string;
  url: string;
  prestation: string;
  client: string;
  type: "correctif" | "evolution" | "audit" | "migration";
  statut: "en-cours" | "a-faire" | "termine";
};

const MOCK_TC: TacheCode[] = [
  { code: "TC-2025-001", titre: "Correction bug panier — calcul des frais de port", url: "https://www.boutique-example.fr", prestation: "Migration PS 1.7 → 8.x", client: "Boutique Example", type: "correctif", statut: "en-cours" },
  { code: "TC-2025-002", titre: "Intégration module paiement CB Stripe", url: "https://staging.boutique-example.fr", prestation: "Migration PS 1.7 → 8.x", client: "Boutique Example", type: "evolution", statut: "a-faire" },
  { code: "TC-2025-003", titre: "Optimisation temps de chargement pages produit", url: "https://www.maison-deco.fr", prestation: "Refonte thème", client: "Maison Déco", type: "audit", statut: "en-cours" },
  { code: "TC-2025-004", titre: "Ajout filtres produits dynamiques AJAX", url: "https://preprod.maison-deco.fr", prestation: "Refonte thème", client: "Maison Déco", type: "evolution", statut: "a-faire" },
  { code: "TC-2025-005", titre: "Migration base de données PS 1.6 vers 1.7", url: "https://www.techshop-demo.fr", prestation: "Migration PS 1.6 → 1.7", client: "TechShop", type: "migration", statut: "en-cours" },
  { code: "TC-2025-006", titre: "Correction affichage mobile — responsive checkout", url: "https://www.techshop-demo.fr", prestation: "Migration PS 1.6 → 1.7", client: "TechShop", type: "correctif", statut: "a-faire" },
  { code: "TC-2024-089", titre: "Audit sécurité modules tiers", url: "https://www.luxmode-paris.com", prestation: "Audit & maintenance", client: "LuxMode Paris", type: "audit", statut: "termine" },
  { code: "TC-2024-112", titre: "Génération automatique sitemap XML", url: "https://recette.luxmode-paris.com", prestation: "Audit & maintenance", client: "LuxMode Paris", type: "evolution", statut: "termine" },
];

const TC_TYPE_LABELS: Record<TacheCode["type"], string> = {
  correctif: "Correctif", evolution: "Évolution", audit: "Audit", migration: "Migration",
};
const TC_TYPE_COLORS: Record<TacheCode["type"], string> = {
  correctif: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  evolution: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  audit: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  migration: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
};

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  ext?: string;
  size?: string;
  modified?: string;
  children?: FileNode[];
};

type AnalyseRapport = {
  resume: string;
  scoreImpact: number;
  fonctionnelle: {
    freshdeskTickets: Array<{ id: string; titre: string; statut: string; priorite: string; lien: string; impact: string }>;
    pipedriveDeals: Array<{ id: string; titre: string; valeur: string; statut: string; contact: string; impact: string }>;
    trackobugTK: Array<{ id: string; titre: string; type: string; statut: string; assignee: string; impact: string }>;
    timelines: Array<{ ref: string; type: "PRE" | "TC"; titre: string; echeance: string; avancement: number; impact: string }>;
  };
  revueCode: {
    problemes: Array<{ gravite: "critique" | "majeur" | "mineur" | "info"; ligne: number; message: string; suggestion: string }>;
    scoreQualite: number;
    points: string[];
  };
};

function genererRapportMock(fileName: string, editedContent: string): AnalyseRapport {
  const n = fileName.toLowerCase();
  const isCart = n.includes("cart");
  const isCheckout = n.includes("checkout");
  const isOrder = n.includes("order");
  const isProd = n.includes("product");
  const lignes = editedContent.split("\n").length;

  return {
    resume: isCart
      ? `La modification du gestionnaire de panier impacte directement le tunnel d'achat. ${lignes} lignes analysées. Des interactions critiques détectées avec le service client (12 tickets Freshdesk ouverts liés au panier), 2 opportunités commerciales Pipedrive en cours, et 5 TK Trackobug actifs sur ce périmètre.`
      : isCheckout
      ? `Les changements sur le contrôleur de checkout affectent le processus de commande complet. ${lignes} lignes analysées. Impact détecté sur 8 tickets Freshdesk, 3 deals Pipedrive à risque, et 3 tâches TC en cours sur ce module.`
      : `Analyse des modifications sur ${fileName} (${lignes} lignes). Impact modéré détecté — aucune régression critique identifiée. Vérification des dépendances effectuée via les sources RAG.`,
    scoreImpact: isCart ? 78 : isCheckout ? 65 : isProd ? 52 : 35,
    fonctionnelle: {
      freshdeskTickets: [
        { id: isCart ? "FD-14823" : "FD-14790", titre: isCart ? "Erreur de calcul des frais de port lors d'un ajout multiple" : "Page de confirmation commande — affichage incorrect", statut: "Ouvert", priorite: "Haute", lien: "#", impact: "Correction directe apportée par cette modification" },
        { id: isCart ? "FD-14756" : "FD-14710", titre: isCart ? "Le coupon de réduction ne s'applique pas sur le panier mobile" : "Délai de traitement commande anormalement long", statut: "En attente", priorite: "Normale", lien: "#", impact: "Impact indirect — surveiller après déploiement" },
        { id: "FD-14694", titre: "Question client : remboursement suite à double commande", statut: "Résolu", priorite: "Basse", lien: "#", impact: "Aucun impact — historique uniquement" },
      ],
      pipedriveDeals: [
        { id: "DEAL-2891", titre: "Boutique Example — Contrat maintenance premium", valeur: "4 800 €/an", statut: "Actif", contact: "Marie Leblanc", impact: "Ce client est directement affecté — notifier le commercial avant déploiement" },
        { id: "DEAL-3012", titre: "Maison Déco — Extension module panier", valeur: "1 200 €", statut: "Proposition envoyée", contact: "Thomas Garnier", impact: "Fonctionnalité concernée par cette évolution — opportunité de démonstration" },
      ],
      trackobugTK: [
        { id: isCart ? "TK-2025-047" : "TK-2025-031", titre: isCart ? "Bug panier — calcul TVA incorrect en mode invité" : "Checkout — Paiement en 3x non proposé sur mobile", type: "Bug", statut: "En cours", assignee: "Jean-Pierre M.", impact: "Cette modification corrige partiellement ce ticket" },
        { id: "TK-2025-038", titre: "Performance — Temps de réponse panier > 3s", type: "Performance", statut: "A faire", assignee: "Sophie L.", impact: "La modification peut améliorer ce point" },
        { id: "TK-2025-019", titre: "Sécurité — Validation des entrées formulaire", type: "Sécurité", statut: "En cours", assignee: "Ahmed B.", impact: "À vérifier : les nouvelles lignes respectent les règles de validation" },
      ],
      timelines: [
        { ref: "PRE-2025-003", type: "PRE", titre: "Migration PS 1.7 → 8.x — Phase 2 : Modules core", echeance: "15/04/2026", avancement: 62, impact: "Cette modification s'inscrit dans le périmètre de cette prestation" },
        { ref: "TC-2025-001", type: "TC", titre: "Correction bug panier — calcul des frais de port", echeance: "02/04/2026", avancement: 85, impact: "Modification directement liée à cette tâche — avancement à mettre à jour" },
        { ref: "TC-2025-005", type: "TC", titre: "Migration base de données PS 1.6 vers 1.7", echeance: "10/04/2026", avancement: 40, impact: "Dépendance indirecte — à surveiller lors de la recette" },
      ],
    },
    revueCode: {
      scoreQualite: isCart ? 71 : 82,
      problemes: [
        { gravite: "majeur" as const, ligne: Math.floor(lignes * 0.3), message: "Absence de vérification du type de retour sur getProducts()", suggestion: "Ajouter une vérification explicite : if (!is_array($products)) return [];" },
        { gravite: "mineur" as const, ligne: Math.floor(lignes * 0.6), message: "Variable $id_order utilisée sans initialisation par défaut", suggestion: "Initialiser à null et vérifier avant utilisation" },
        { gravite: "info" as const, ligne: Math.floor(lignes * 0.8), message: "Commentaire TODO en attente depuis > 30 jours", suggestion: "Implémenter ou supprimer le commentaire TODO orphelin" },
        ...(isCart ? [{ gravite: "critique" as const, ligne: Math.floor(lignes * 0.15), message: "Requête SQL sans préparation des paramètres", suggestion: "Utiliser Db::getInstance()->execute() avec des paramètres préparés pour éviter les injections SQL" }] : []),
      ],
      points: [
        "Structure de classe cohérente avec les conventions PrestaShop",
        "Bonne séparation des responsabilités dans les méthodes",
        "Gestion du cache bien implémentée avec les flags de rafraîchissement",
        ...(isCart ? [] : ["Pas de dette technique majeure détectée sur ce fichier"]),
      ],
    },
  };
}

function f(name: string, modified = "28/03/2026", size?: string): FileNode {
  return { id: name, name, type: "file", ext: name.includes(".") ? name.split(".").pop() : undefined, modified, size: size || `${Math.floor(Math.random() * 90 + 10)} Ko` };
}
function d(name: string, children: FileNode[] = []): FileNode {
  return { id: name, name, type: "folder", children };
}

const PRESTASHOP_TREE: FileNode[] = [
  d("admin", [d("autoupgrade"), d("backup"), d("controllers", [d("modules"), d("upgrade")]), d("filemanager"), d("help"), d("import"), d("themes"), f("index.php"), f("functions.php")]),
  d("api", [f("dispatcher.php"), f("WebserviceOutputBuilder.php")]),
  d("cache", [d("cachefs"), d("feeds"), d("smarty", [d("cache"), d("compile")])]),
  d("classes", [d("helper"), d("module"), d("pdf"), d("webservice"), f("Address.php"), f("Cart.php"), f("Category.php"), f("Currency.php"), f("Customer.php"), f("Order.php"), f("Product.php"), f("Tools.php")]),
  d("config", [f("alias.php"), f("autoload.php"), f("bootstrap.php"), f("config.inc.php"), f("defines.inc.php"), f("settings.inc.php")]),
  d("controllers", [d("admin"), d("front", [f("CartController.php"), f("CheckoutController.php"), f("OrderController.php"), f("ProductController.php"), f("SearchController.php")])]),
  d("css", [f("global.css"), f("fonts.css")]),
  d("img", [d("c"), d("p"), d("m")]),
  d("js", [f("jquery.min.js"), f("bootstrap.min.js"), f("checkout.js")]),
  d("mails", [d("fr", [f("order_conf.html"), f("payment.html")])]),
  d("modules", [
    d("blockbanner"), d("blockcart"), d("blocksearch"),
    d("ps_checkout", [f("ps_checkout.php"), f("composer.json"), d("src", [f("PayPalClient.php"), f("CheckoutChecker.php")])]),
    d("ps_emailsubscription"), d("ps_facetedsearch"), d("ps_searchbar"), d("ps_shoppingcart"),
  ]),
  d("override", [d("classes"), d("controllers")]),
  d("src", [d("Adapter"), d("Core", [d("Cart"), d("Checkout"), d("Product")]), d("PrestaShopBundle"), d("Repository")]),
  d("themes", [d("classic", [d("assets", [d("css"), d("img"), d("js")]), d("modules"), d("templates", [d("catalog"), d("checkout"), d("layouts")]), f("preview.jpg")])]),
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
  d("app", [d("code", [d("Magento"), d("Vendor")]), d("design", [d("frontend"), d("adminhtml")]), d("etc", [f("config.php"), f("env.php")]), d("i18n")]),
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
  f("robots.txt", "01/01/2026", "1 Ko"),
];

function getTreeForUrl(url: string): FileNode[] {
  if (url.includes("techflow") || url.includes("b2b")) return MAGENTO_TREE;
  return PRESTASHOP_TREE;
}


function getMockCode(name: string): string {
  const n = name.toLowerCase();
  if (n === "cart.php") return `<?php
/**
 * PrestaShop Cart model
 */
class Cart extends ObjectModel
{
    public $id_customer;
    public $id_address_delivery;
    public $id_currency;
    public $id_lang;
    public $secure_key;
    public $recyclable = 1;
    public $gift = 0;
    public $gift_message;
    public $mobile_theme = false;
    public $delivery_option;

    public static function getCartByOrderId($id_order)
    {
        if (!$id_order = (int) $id_order) {
            return false;
        }
        $sql = 'SELECT id_cart FROM ' . _DB_PREFIX_ . 'orders
                WHERE id_order = ' . $id_order;
        return Db::getInstance()->getValue($sql);
    }

    public function getProducts($refresh = false, $id_product = false)
    {
        if (!$this->id) {
            return [];
        }
        // Cache management
        if ($refresh === true) {
            unset($this->_products);
        }
        if (isset($this->_products) && $this->_products) {
            if ($id_product) {
                foreach ($this->_products as $product) {
                    if ($product['id_product'] == $id_product) {
                        return [$product];
                    }
                }
                return [];
            }
            return $this->_products;
        }
        // TODO: complete implementation
        return $this->_products ?? [];
    }
}`;

  if (n === "checkoutcontroller.php" || n.includes("checkout") && n.endsWith(".php")) return `<?php
/**
 * Front checkout controller
 */
class CheckoutControllerCore extends FrontController
{
    public $php_self = 'checkout';
    public $ssl = true;
    protected $checkoutProcess;

    public function init()
    {
        parent::init();
        if (!$this->context->customer->isLogged()
            && !$this->context->customer->isGuest()) {
            $this->redirectWithNotifications(
                $this->context->link->getPageLink('authentication')
            );
        }
    }

    public function initContent()
    {
        parent::initContent();
        $this->checkoutProcess = new CheckoutProcess(
            $this->context,
            new CheckoutSession($this->context)
        );
        $this->checkoutProcess->setNextStepReachable();
        $this->assignAll();
        $this->setTemplate('checkout/checkout');
    }

    protected function assignAll()
    {
        $this->context->smarty->assign([
            'checkout_process' => $this->checkoutProcess,
            'cart' => $this->context->cart,
        ]);
    }
}`;

  if (n === ".htaccess") return `# Apache rewrite configuration
# Generated by PrestaShop

Options -Indexes
Options +FollowSymLinks

<IfModule mod_rewrite.c>
    RewriteEngine on
    RewriteRule . - [E=REWRITEBASE:/]
    RewriteRule ^api/?(.*)$ /webservice/dispatcher.php?url=$1 [QSA,L]
    RewriteRule ^([a-z0-9]+(-[a-z0-9]+)*)/[a-z0-9]+-[a-z]{2}(-[a-z]{2})?-\\d+(-[a-z0-9]+)*/([a-z0-9_-]+)$
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*) index.php [QSA,L]
</IfModule>

<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Cache-Control "no-cache, must-revalidate" "expr=%{CONTENT_TYPE} =~ m|text/html|"
</IfModule>

<FilesMatch "\\.(log|sql|bak|old|orig|save|tmp)$">
    Order allow,deny
    Deny from all
</FilesMatch>`;

  if (n === "composer.json") return `{
    "name": "prestashop/prestashop",
    "description": "Open Source E-commerce Solution",
    "type": "project",
    "license": "AFL-3.0",
    "require": {
        "php": ">=8.1",
        "ext-curl": "*",
        "ext-gd": "*",
        "ext-intl": "*",
        "ext-json": "*",
        "ext-pdo": "*",
        "ext-zip": "*",
        "prestashop/decimal": "^1.5",
        "symfony/dependency-injection": "^5.4",
        "symfony/http-kernel": "^5.4",
        "symfony/routing": "^5.4",
        "twig/twig": "^3.7",
        "doctrine/orm": "^2.15"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "phpstan/phpstan": "^1.10"
    },
    "autoload": {
        "classmap": ["classes/", "controllers/"],
        "psr-4": {
            "PrestaShop\\\\PrestaShop\\\\": "src/"
        }
    }
}`;

  if (n === "global.css" || n === "fonts.css") return `/* PrestaShop Global Stylesheet */
:root {
  --primary-color: #0096C3;
  --secondary-color: #f5f5f5;
  --text-color: #333;
  --border-color: #ddd;
  --success-color: #4caf50;
  --error-color: #f44336;
  --font-family: 'Montserrat', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  color: var(--text-color);
  line-height: 1.6;
  background-color: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

/* Cart styles */
.cart-summary {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.cart-item:last-child {
  border-bottom: none;
}`;

  if (n === "checkout.js") return `/**
 * Checkout page JS - Maison Eclat
 * @version 2.1.4
 */
'use strict';

$(document).ready(function() {

    /**
     * Step validation handling
     */
    prestashop.on('updatedDeliveryForm', function(data) {
        if (data.deliveryOption !== undefined) {
            updateDeliverySummary(data.deliveryOption);
        }
    });

    prestashop.on('updateCart', function(event) {
        if (event.reason.linkAction === 'delete-from-cart') {
            handleCartUpdate(event);
        }
    });

    function updateDeliverySummary(option) {
        const $summary = $('.delivery-summary');
        $.ajax({
            url: prestashop.urls.base_url + 'cart?ajax=1',
            method: 'POST',
            data: { action: 'updateDelivery', delivery_option: option },
            success: function(response) {
                $summary.html(response.cart_summary_html);
                prestashop.emit('updatedCart', { reason: 'delivery-updated' });
            }
        });
    }

    function handleCartUpdate(event) {
        if (!event.resp || event.resp.hasError) {
            showError(event.resp ? event.resp.errors[0] : 'Erreur inconnue');
        }
    }

    function showError(msg) {
        const $alert = $('<div class="alert alert-danger">' + msg + '</div>');
        $('.checkout-process').prepend($alert);
        setTimeout(() => $alert.fadeOut(400, function() { $(this).remove(); }), 5000);
    }
});`;

  if (n === "index.php") return `<?php
/**
 * PrestaShop entry point
 */
use Symfony\\Component\\HttpFoundation\\Request;

if (!defined('_PS_VERSION_')) {
    // Direct access protection
    if (PHP_SAPI !== 'cli') {
        header('HTTP/1.1 403 Forbidden');
        exit;
    }
}

require_once __DIR__ . '/config/config.inc.php';
require_once __DIR__ . '/config/alias.php';

$kernel = new AppKernel(_PS_MODE_DEV_ ? 'dev' : 'prod', _PS_MODE_DEV_);
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);`;

  if (n === "robots.txt") return `User-agent: *
Disallow: /admin/
Disallow: /config/
Disallow: /var/
Disallow: /vendor/
Disallow: /src/
Disallow: /?controller=authentication
Disallow: /?controller=cart
Disallow: /api/

User-agent: Googlebot
Allow: /modules/*.css
Allow: /modules/*.js

Sitemap: https://www.maison-eclat.fr/sitemap.xml`;

  if (n.endsWith(".php")) return `<?php
/**
 * ${name}
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class ${name.replace('.php', '')} extends ObjectModel
{
    public $id;
    public $active = true;
    public $date_add;
    public $date_upd;

    public static $definition = [
        'table'  => 'custom_table',
        'primary' => 'id_item',
        'multilang' => false,
        'fields' => [
            'active' => ['type' => self::TYPE_BOOL, 'validate' => 'isBool'],
            'date_add' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
            'date_upd' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
        ],
    ];

    public function __construct($id = null, $id_lang = null, $id_shop = null)
    {
        parent::__construct($id, $id_lang, $id_shop);
    }
}`;

  if (n.endsWith(".js") || n.endsWith(".ts")) return `/**
 * ${name}
 */
'use strict';

const Module = (function() {
    let _config = {
        debug: false,
        apiUrl: window.prestashop?.urls?.base_url || '/',
    };

    function init(options = {}) {
        _config = Object.assign({}, _config, options);
        _bindEvents();
    }

    function _bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            _setup();
        });
    }

    function _setup() {
        if (_config.debug) {
            console.log('[${name}] Initialized');
        }
    }

    return { init };
})();

export default Module;`;

  if (n.endsWith(".css") || n.endsWith(".scss")) return `/* ${name} */

.component {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.component:hover {
    border-color: #0096C3;
    box-shadow: 0 2px 8px rgba(0, 150, 195, 0.1);
}

@media (max-width: 768px) {
    .component {
        flex-direction: column;
        align-items: flex-start;
    }
}`;

  if (n.endsWith(".json")) return `{
    "name": "${n.replace('.json', '')}",
    "version": "1.0.0",
    "description": "Configuration file",
    "settings": {
        "debug": false,
        "cache": true,
        "timeout": 30
    }
}`;

  if (n.endsWith(".xml")) return `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <entry key="name">${name}</entry>
    <entry key="version">1.0.0</entry>
    <entry key="active">true</entry>
</configuration>`;

  return `# ${name}
# Configuration file

[settings]
debug = false
environment = production
cache_enabled = true
log_level = warning`;
}


const MONACO_OPTIONS_BASE = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
  lineHeight: 20,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  minimap: { enabled: true, scale: 1 },
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  renderLineHighlight: "line" as const,
  cursorBlinking: "smooth" as const,
  smoothScrolling: true,
  tabSize: 2,
  wordWrap: "off" as const,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  padding: { top: 12, bottom: 12 },
  overviewRulerLanes: 3,
  folding: true,
  foldingHighlight: true,
  renderWhitespace: "none" as const,
  suggest: { showWords: false },
  quickSuggestions: { other: true, comments: false, strings: false },
};

const MONACO_EDIT_OPTIONS = {
  ...MONACO_OPTIONS_BASE,
  readOnly: false,
  quickSuggestions: { other: true, comments: true, strings: true },
  suggest: {
    showWords: true,
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showMethods: true,
    showClasses: true,
    showModules: true,
    showVariables: true,
    showProperties: true,
    showConstants: true,
    showConstructors: true,
    showEnums: true,
    showInterfaces: true,
    preview: true,
    previewMode: "subwordSmart" as const,
  },
  snippetSuggestions: "top" as const,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on" as const,
  tabCompletion: "on" as const,
  parameterHints: { enabled: true, cycle: true },
  hover: { enabled: true, delay: 300, sticky: true },
  inlineSuggest: { enabled: true, mode: "subwordSmart" as const },
  formatOnType: true,
  formatOnPaste: true,
  autoClosingBrackets: "always" as const,
  autoClosingQuotes: "always" as const,
  autoSurround: "languageDefined" as const,
  autoIndent: "full" as const,
  matchBrackets: "always" as const,
  lightbulb: { enabled: "on" as never },
  codeLens: true,
  wordBasedSuggestions: "currentDocument" as const,
  contextmenu: true,
  multiCursorModifier: "alt" as const,
  columnSelection: false,
  selectionHighlight: true,
  occurrencesHighlight: "singleFile" as const,
  links: true,
  colorDecorators: true,
};

// ─── Interactive Diff Engine ──────────────────────────────────────────────

type DiffHunk = {
  id: string;
  type: "equal" | "replace" | "insert" | "delete";
  origLines: string[];
  modLines: string[];
};

type HunkResolution = "orig" | "mod" | number[];

function computeHunks(originalText: string, modifiedText: string): DiffHunk[] {
  const a = originalText.split("\n");
  const b = modifiedText.split("\n");
  const m = a.length, n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  type Op = { t: "eq" | "del" | "ins"; a: string; b: string };
  const ops: Op[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ t: "eq", a: a[i - 1], b: b[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j])) {
      ops.unshift({ t: "ins", a: "", b: b[j - 1] });
      j--;
    } else {
      ops.unshift({ t: "del", a: a[i - 1], b: "" });
      i--;
    }
  }

  const raw: DiffHunk[] = [];
  let gOrig: string[] = [], gMod: string[] = [], inChange = false;

  const flushChange = () => {
    if (!inChange) return;
    const t: DiffHunk["type"] =
      gOrig.length > 0 && gMod.length > 0 ? "replace" :
      gMod.length > 0 ? "insert" : "delete";
    raw.push({ id: crypto.randomUUID(), type: t, origLines: gOrig, modLines: gMod });
    gOrig = []; gMod = []; inChange = false;
  };

  for (const op of ops) {
    if (op.t === "eq") {
      flushChange();
      raw.push({ id: crypto.randomUUID(), type: "equal", origLines: [op.a], modLines: [op.b] });
    } else {
      inChange = true;
      if (op.t === "del") gOrig.push(op.a);
      else gMod.push(op.b);
    }
  }
  flushChange();

  const merged: DiffHunk[] = [];
  for (const h of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === "equal" && h.type === "equal") {
      last.origLines.push(...h.origLines);
      last.modLines.push(...h.modLines);
    } else merged.push(h);
  }
  return merged;
}

function computeMergedText(hunks: DiffHunk[], res: Record<string, HunkResolution>): string {
  const lines: string[] = [];
  for (const h of hunks) {
    const r = res[h.id] ?? "orig";
    if (h.type === "equal") { lines.push(...h.origLines); continue; }
    if (h.type === "insert") {
      if (r === "mod") lines.push(...h.modLines);
      else if (Array.isArray(r)) lines.push(...(r as number[]).map(x => h.modLines[x]).filter(Boolean));
    } else if (h.type === "delete") {
      if (r === "orig") lines.push(...h.origLines);
      else if (Array.isArray(r)) lines.push(...(r as number[]).map(x => h.origLines[x]).filter(Boolean));
    } else {
      if (r === "orig") lines.push(...h.origLines);
      else if (r === "mod") lines.push(...h.modLines);
      else lines.push(...(r as number[]).map(x => h.modLines[x]).filter(Boolean));
    }
  }
  return lines.join("\n");
}

// ─── InteractiveDiff component ────────────────────────────────────────────

function InteractiveDiff({
  original, modified, prodUrl, saveUrl, onApply,
}: {
  original: string;
  modified: string;
  prodUrl?: string | null;
  saveUrl?: string | null;
  onApply: (merged: string) => void;
}) {
  const hunks = useMemo(() => computeHunks(original, modified), [original, modified]);
  const [res, setRes] = useState<Record<string, HunkResolution>>({});

  const mergedText = useMemo(() => computeMergedText(hunks, res), [hunks, res]);

  const changedHunks = hunks.filter(h => h.type !== "equal");
  const acceptedCount = changedHunks.filter(h => res[h.id] !== undefined && res[h.id] !== "orig").length;
  const hasChanges = changedHunks.length > 0;

  const setHunk = (id: string, r: HunkResolution) =>
    setRes(prev => ({ ...prev, [id]: r }));

  const acceptAll = () => {
    const next: Record<string, HunkResolution> = {};
    for (const h of hunks) if (h.type !== "equal") next[h.id] = "mod";
    setRes(next);
  };
  const rejectAll = () => setRes({});

  // Toggle a single line index inside a changed hunk
  const toggleLine = (hunk: DiffHunk, side: "orig" | "mod", lineIdx: number) => {
    const cur = res[hunk.id];
    const isPartial = Array.isArray(cur);
    const current: number[] = isPartial ? (cur as number[]) : (cur === "mod"
      ? hunk.modLines.map((_, i) => i)
      : cur === "orig" && side === "orig"
        ? hunk.origLines.map((_, i) => i)
        : []);

    const has = current.includes(lineIdx);
    const next = has ? current.filter(x => x !== lineIdx) : [...current, lineIdx].sort((a, b) => a - b);
    if (next.length === 0) {
      setHunk(hunk.id, side === "orig" ? "mod" : "orig");
    } else if (side === "mod" && next.length === hunk.modLines.length) {
      setHunk(hunk.id, "mod");
    } else {
      setHunk(hunk.id, next);
    }
  };

  // Derive which mod line indices are "accepted" for a hunk
  const getAcceptedModLines = (hunk: DiffHunk): Set<number> => {
    const r = res[hunk.id];
    if (r === "mod") return new Set(hunk.modLines.map((_, i) => i));
    if (Array.isArray(r)) return new Set(r as number[]);
    return new Set();
  };

  const lineNoWidth = "w-10 shrink-0 text-right pr-2 select-none text-[10px] text-white/25 font-mono";
  const cellBase = "flex-1 font-mono text-[11px] leading-5 whitespace-pre px-1 overflow-hidden text-ellipsis";

  const renderHunk = (hunk: DiffHunk, hunkIdx: number) => {
    if (hunk.type === "equal") {
      // Show context lines (collapse long equal blocks)
      const lines = hunk.origLines;
      const CONTEXT = 3;
      if (lines.length <= CONTEXT * 2 + 1) {
        return lines.map((line, i) => (
          <tr key={`${hunk.id}-${i}`} className="group">
            <td className={cn(lineNoWidth, "text-white/20 py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
            <td className="w-10 shrink-0" />
            <td className={cn(lineNoWidth, "text-white/20 py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
          </tr>
        ));
      }
      const head = lines.slice(0, CONTEXT);
      const tail = lines.slice(-CONTEXT);
      return [
        ...head.map((line, i) => (
          <tr key={`${hunk.id}-h${i}`}>
            <td className={cn(lineNoWidth, "py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
            <td className="w-10 shrink-0" />
            <td className={cn(lineNoWidth, "py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
          </tr>
        )),
        <tr key={`${hunk.id}-skip`}>
          <td colSpan={5} className="text-center py-1 text-[10px] text-white/25 italic border-y border-white/5">
            ··· {lines.length - CONTEXT * 2} lignes identiques ···
          </td>
        </tr>,
        ...tail.map((line, i) => (
          <tr key={`${hunk.id}-t${i}`}>
            <td className={cn(lineNoWidth, "py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
            <td className="w-10 shrink-0" />
            <td className={cn(lineNoWidth, "py-px")} />
            <td className={cn(cellBase, "text-white/45 py-px")}>{line || " "}</td>
          </tr>
        )),
      ];
    }

    // Changed hunk
    const r = res[hunk.id] ?? "orig";
    const acceptedMod = getAcceptedModLines(hunk);
    const maxLen = Math.max(hunk.origLines.length, hunk.modLines.length);
    const rows = Array.from({ length: maxLen }, (_, i) => i);

    return rows.map((i) => {
      const origLine = hunk.origLines[i];
      const modLine = hunk.modLines[i];
      const modAccepted = acceptedMod.has(i);

      return (
        <tr key={`${hunk.id}-row${i}`} className="group">
          {/* Original side */}
          <td className={cn(lineNoWidth, "py-px", origLine !== undefined ? "text-red-400/40" : "")}>
            {origLine !== undefined ? String(i + 1) : ""}
          </td>
          <td className={cn(
            cellBase, "py-px relative",
            origLine !== undefined
              ? r === "mod"
                ? "bg-red-900/15 text-red-300/40 line-through"
                : "bg-red-900/25 text-red-200"
              : "bg-transparent"
          )}>
            {origLine !== undefined ? (origLine || " ") : ""}
            {/* Per-line ← button (keep this orig line) */}
            {origLine !== undefined && modLine !== undefined && (
              <button
                onClick={() => setHunk(hunk.id, "orig")}
                className="absolute right-1 top-0 bottom-0 hidden group-hover:flex items-center px-1 text-white/30 hover:text-amber-300 transition-colors"
                title="Garder cette ligne (original)"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
          </td>

          {/* Arrow column — only on first row, spans all rows */}
          {i === 0 && (
            <td
              rowSpan={maxLen}
              className="w-10 shrink-0 border-x border-white/10 bg-[#181825] align-middle"
            >
              <div className="flex flex-col items-center justify-center gap-1 py-1 h-full">
                {/* Accept modified → */}
                <button
                  onClick={() => setHunk(hunk.id, "mod")}
                  title="Accepter la version Save (→)"
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded transition-all text-xs font-bold",
                    r === "mod"
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-white/5 text-white/30 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10"
                  )}
                >
                  →
                </button>
                {/* Keep original ← */}
                <button
                  onClick={() => setHunk(hunk.id, "orig")}
                  title="Garder la version Production (←)"
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded transition-all text-xs font-bold",
                    r === "orig" || r === undefined
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-300 border border-white/10"
                  )}
                >
                  ←
                </button>
              </div>
            </td>
          )}

          {/* Modified side */}
          <td className={cn(lineNoWidth, "py-px", modLine !== undefined ? "text-emerald-400/40" : "")}>
            {modLine !== undefined ? String(i + 1) : ""}
          </td>
          <td className={cn(
            cellBase, "py-px relative cursor-pointer",
            modLine !== undefined
              ? modAccepted
                ? "bg-emerald-900/35 text-emerald-200"
                : "bg-emerald-900/15 text-emerald-300/50"
              : "bg-transparent"
          )}
            onClick={() => modLine !== undefined ? toggleLine(hunk, "mod", i) : undefined}
            title={modLine !== undefined ? (modAccepted ? "Cliquer pour désélectionner cette ligne" : "Cliquer pour sélectionner cette ligne") : ""}
          >
            {modLine !== undefined ? (modLine || " ") : ""}
            {modLine !== undefined && (
              <span className={cn(
                "absolute left-0 top-0 bottom-0 w-0.5 transition-all",
                modAccepted ? "bg-emerald-400" : "bg-transparent group-hover:bg-emerald-400/30"
              )} />
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/10 shrink-0 gap-3">
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-300/70">Production</span>
            {prodUrl && <span className="text-white/25 truncate max-w-[120px]">{prodUrl}</span>}
          </div>
          <span className="text-white/20">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300/70">Save / Staging</span>
            {saveUrl && <span className="text-white/25 truncate max-w-[120px]">{saveUrl}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <span className="text-[10px] text-white/30">
              {acceptedCount}/{changedHunks.length} bloc{changedHunks.length > 1 ? "s" : ""} accepté{acceptedCount > 1 ? "s" : ""}
            </span>
          )}
          {hasChanges && <>
            <button onClick={rejectAll} className="px-2 py-1 text-[11px] rounded bg-white/5 text-red-300/60 hover:text-red-300 hover:bg-red-500/15 border border-white/10 transition-all">
              ← Tout rejeter
            </button>
            <button onClick={acceptAll} className="px-2 py-1 text-[11px] rounded bg-white/5 text-emerald-300/60 hover:text-emerald-300 hover:bg-emerald-500/15 border border-white/10 transition-all">
              Tout accepter →
            </button>
          </>}
          <button
            onClick={() => onApply(mergedText)}
            disabled={!hasChanges}
            className={cn(
              "px-3 py-1 text-[11px] font-semibold rounded border transition-all",
              hasChanges
                ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30"
                : "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
            )}
          >
            Appliquer dans l'éditeur →
          </button>
        </div>
      </div>

      {/* Colonne headers */}
      <div className="flex shrink-0 bg-[#13131f] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider">
        <div className="w-10 shrink-0" />
        <div className="flex-1 px-3 py-1.5 text-red-300/50">Production (original)</div>
        <div className="w-10 shrink-0 border-x border-white/10" />
        <div className="w-10 shrink-0" />
        <div className="flex-1 px-3 py-1.5 text-emerald-300/50">Save / Staging (modifié)</div>
      </div>

      {/* Diff table */}
      {!hasChanges ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-white/70">Aucune différence détectée</p>
            <p className="text-[11px] text-white/30 mt-1">Les deux versions sont identiques.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <tbody>
              {hunks.map((hunk, idx) => renderHunk(hunk, idx))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-1.5 bg-[#13131f] border-t border-white/10 text-[10px] text-white/25">
        <span><span className="text-red-300/60">Rouge</span> = ligne supprimée (production)</span>
        <span><span className="text-emerald-300/60">Vert</span> = ligne ajoutée (save)</span>
        <span className="ml-auto">Cliquer sur une ligne verte pour la sélectionner · → accepter · ← rejeter</span>
      </div>
    </div>
  );
}

function CodeViewer({ file, onClose, prodUrl, saveUrl, editContent, onEditChange, scrollToLine, onScrollToLineDone, isFullscreen, onToggleFullscreen, initialTab }: {
  file: FileNode;
  onClose: () => void;
  prodUrl?: string | null;
  saveUrl?: string | null;
  editContent: string;
  onEditChange: (v: string) => void;
  scrollToLine?: number | null;
  onScrollToLineDone?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  initialTab?: "code" | "diff" | "edit";
}) {
  const [tab, setTab] = useState<"code" | "diff" | "edit">(initialTab ?? "code");
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [lintProblems, setLintProblems] = useState<LintMarker[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAnalyseOpts, setSaveAnalyseOpts] = useState({ fonctionnelle: true, revueCode: true });
  const [saveAnalyseRunning, setSaveAnalyseRunning] = useState(false);
  const [saveAnalyseStep, setSaveAnalyseStep] = useState("");
  const [saveRapport, setSaveRapport] = useState<AnalyseRapport | null>(null);
  const [rapportTab, setRapportTab] = useState<"fonctionnelle" | "revueCode">("fonctionnelle");
  const originalCode = useMemo(() => getMockCode(file.name), [file.name]);
  const saveCode = useMemo(() => getMockSaveCode(file.name), [file.name]);
  const language = useMemo(() => getMonacoLanguage(file.name), [file.name]);
  const isEdited = editContent !== originalCode;
  const errCount = lintProblems.filter(m => m.severity === 8).length;
  const warnCount = lintProblems.filter(m => m.severity === 4).length;

  const applyLint = useCallback((editor: any, monaco: any, code: string) => {
    const model = editor?.getModel();
    if (!model) return;
    const markers = getMockLintMarkers(file.name, code);
    monaco.editor.setModelMarkers(model, "oasis-lint", markers);
    setLintProblems(markers);
  }, [file.name]);

  useEffect(() => {
    if (scrollToLine && editorRef.current) {
      if (tab !== "code") setTab("code");
      setTimeout(() => {
        editorRef.current?.revealLineInCenter(scrollToLine);
        editorRef.current?.setPosition({ lineNumber: scrollToLine, column: 1 });
        onScrollToLineDone?.();
      }, 80);
    }
  }, [scrollToLine]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      editorRef.current?.layout();
    }, 50);
    return () => clearTimeout(timeout);
  }, [isFullscreen, tab]);

  const handleCopy = () => {
    const content = tab === "edit" ? editContent : originalCode;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const performSave = () => {
    setSavedAt(new Date());
    try {
      localStorage.setItem(`oasis_file_${file.id}`, editContent);
    } catch {}
  };

  const handleSave = () => {
    setSaveRapport(null);
    setSaveAnalyseRunning(false);
    setSaveAnalyseStep("");
    setSaveModalOpen(true);
  };

  const handleLancerAnalyse = async () => {
    setSaveAnalyseRunning(true);
    const steps = [
      "Interrogation Freshdesk — service client…",
      "Analyse Pipedrive — données commerciales…",
      "Consultation Trackobug — tickets TK…",
      "Lecture Timelines PRE & TC — outil interne…",
      "Analyse fonctionnelle du code modifié…",
      "Génération du rapport de revue…",
    ];
    for (const step of steps) {
      setSaveAnalyseStep(step);
      await new Promise(r => setTimeout(r, 520));
    }
    const rapport = genererRapportMock(file.name, editContent);
    setSaveRapport(rapport);
    setSaveAnalyseRunning(false);
    setSaveAnalyseStep("");
    setRapportTab("fonctionnelle");
  };

  const handleReset = () => {
    onEditChange(originalCode);
    try { localStorage.removeItem(`oasis_file_${file.id}`); } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] rounded-xl border border-border/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#181825] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <File className={cn("w-4 h-4 shrink-0", getFileIconColor(file))} strokeWidth={1.5} />
          <span className="text-sm font-mono text-white/90 truncate">{file.name}</span>
          {file.size && <span className="text-xs text-white/40 shrink-0">{file.size}</span>}
          <span className="shrink-0 text-[10px] text-white/30 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">{language}</span>
          {isEdited && <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">● modifié</span>}
          {errCount > 0 && <span className="shrink-0 flex items-center gap-1 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-full font-medium"><AlertCircle className="w-2.5 h-2.5" />{errCount} erreur{errCount > 1 ? "s" : ""}</span>}
          {warnCount > 0 && <span className="shrink-0 flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full font-medium"><ZapOff className="w-2.5 h-2.5" />{warnCount} avertissement{warnCount > 1 ? "s" : ""}</span>}
          {savedAt && <span className="shrink-0 flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-medium"><Clock className="w-2.5 h-2.5" />Sauvegardé {savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-white/10 rounded-md overflow-hidden">
            <button onClick={() => setTab("code")}
              className={cn("px-3 py-1 text-xs flex items-center gap-1.5 transition-colors", tab === "code" ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white/80 hover:bg-white/5")}>
              <Code2 className="w-3 h-3" />Code
            </button>
            <button onClick={() => setTab("diff")}
              className={cn("px-3 py-1 text-xs flex items-center gap-1.5 transition-colors border-l border-white/10", tab === "diff" ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white/80 hover:bg-white/5")}>
              <GitBranch className="w-3 h-3" />Diff
            </button>
            <button onClick={() => setTab("edit")}
              className={cn("px-3 py-1 text-xs flex items-center gap-1.5 transition-colors border-l border-white/10", tab === "edit" ? "bg-amber-500/20 text-amber-300" : "text-white/50 hover:text-white/80 hover:bg-white/5")}>
              <Pencil className="w-3 h-3" />Éditer
            </button>
          </div>
          {tab === "edit" ? (
            <>
              <button onClick={handleReset} title="Réinitialiser" disabled={!isEdited}
                className={cn("p-1.5 transition-colors rounded", isEdited ? "text-white/50 hover:text-white/80" : "text-white/20 cursor-not-allowed")}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded transition-colors">
                <Save className="w-3 h-3" />Enregistrer
              </button>
            </>
          ) : (
            <button onClick={handleCopy} title="Copier" className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {onToggleFullscreen && (
            <button onClick={onToggleFullscreen} title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onClose} title="Fermer" className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {tab === "code" && (
          <MonacoEditor
            height="100%"
            language={language}
            value={originalCode}
            theme="vs-dark"
            options={{ ...MONACO_OPTIONS_BASE, readOnly: true }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              applyLint(editor, monaco, originalCode);
            }}
          />
        )}
        {tab === "edit" && (
          <MonacoEditor
            height="100%"
            language={language}
            value={editContent}
            theme="vs-dark"
            options={MONACO_EDIT_OPTIONS}
            onChange={v => onEditChange(v ?? "")}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              applyLint(editor, monaco, editContent);
            }}
          />
        )}
        {tab === "diff" && (
          <InteractiveDiff
            original={originalCode}
            modified={saveCode}
            prodUrl={prodUrl}
            saveUrl={saveUrl}
            onApply={(merged) => {
              onEditChange(merged);
              setTab("edit");
            }}
          />
        )}
      </div>

      {/* Modal analyse post-enregistrement */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Rapport en cours */}
            {saveAnalyseRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">Analyse en cours…</p>
                  <p className="text-xs text-muted-foreground animate-pulse">{saveAnalyseStep}</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-xs">
                  {[
                    { label: "Freshdesk", icon: MessageSquare },
                    { label: "Pipedrive", icon: Briefcase },
                    { label: "Trackobug", icon: Bug },
                    { label: "Timelines PRE/TC", icon: CalendarDays },
                    { label: "Analyse fonctionnelle", icon: TrendingUp },
                    { label: "Revue de code", icon: ShieldCheck },
                  ].map((s, i) => {
                    const isDone = saveAnalyseStep && [
                      "Analyse Pipedrive", "Consultation Trackobug", "Lecture Timelines", "Analyse fonctionnelle", "Génération du rapport",
                    ].some(x => saveAnalyseStep.startsWith(x)) && i === 0
                      ? true : ["Consultation Trackobug", "Lecture Timelines", "Analyse fonctionnelle", "Génération du rapport"].some(x => saveAnalyseStep.startsWith(x)) && i <= 1
                      ? true : ["Lecture Timelines", "Analyse fonctionnelle", "Génération du rapport"].some(x => saveAnalyseStep.startsWith(x)) && i <= 2
                      ? true : ["Analyse fonctionnelle", "Génération du rapport"].some(x => saveAnalyseStep.startsWith(x)) && i <= 3
                      ? true : ["Génération du rapport"].some(x => saveAnalyseStep.startsWith(x)) && i <= 4
                      ? true : false;
                    const isActive = (i === 0 && saveAnalyseStep.startsWith("Interrogation Freshdesk"))
                      || (i === 1 && saveAnalyseStep.startsWith("Analyse Pipedrive"))
                      || (i === 2 && saveAnalyseStep.startsWith("Consultation Trackobug"))
                      || (i === 3 && saveAnalyseStep.startsWith("Lecture Timelines"))
                      || (i === 4 && saveAnalyseStep.startsWith("Analyse fonctionnelle"))
                      || (i === 5 && saveAnalyseStep.startsWith("Génération"));
                    return (
                      <div key={s.label} className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all", isActive ? "bg-primary/10 text-primary" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                        {isDone ? <Check className="w-3.5 h-3.5 shrink-0" /> : isActive ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <s.icon className="w-3.5 h-3.5 shrink-0 opacity-40" />}
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : saveRapport ? (
              /* Rapport généré */
              <>
                <div className="px-6 py-4 border-b border-border shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Rapport d'analyse — {file.name}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium ml-1 shrink-0">Non enregistré</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{saveRapport.resume}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border-2 text-sm font-bold",
                        saveRapport.scoreImpact >= 70 ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/20" : saveRapport.scoreImpact >= 50 ? "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20")}>
                        {saveRapport.scoreImpact}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">Score impact</span>
                    </div>
                  </div>

                  {/* Onglets rapport */}
                  <div className="flex gap-1 mt-3">
                    {saveAnalyseOpts.fonctionnelle && (
                      <button onClick={() => setRapportTab("fonctionnelle")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", rapportTab === "fonctionnelle" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                        <TrendingUp className="w-3 h-3" />Analyse fonctionnelle
                      </button>
                    )}
                    {saveAnalyseOpts.revueCode && (
                      <button onClick={() => setRapportTab("revueCode")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", rapportTab === "revueCode" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                        <ShieldCheck className="w-3 h-3" />Revue de code
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {rapportTab === "fonctionnelle" && (
                    <div className="p-5 space-y-5">
                      {/* Freshdesk */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-semibold text-foreground">Service client — Freshdesk</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{saveRapport.fonctionnelle.freshdeskTickets.length} ticket(s) liés</span>
                        </div>
                        <div className="space-y-1.5">
                          {saveRapport.fonctionnelle.freshdeskTickets.map(t => (
                            <div key={t.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                              <span className="text-[10px] font-mono text-primary shrink-0 mt-0.5">{t.id}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{t.titre}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{t.impact}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium", t.statut === "Ouvert" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800" : t.statut === "En attente" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800" : "bg-muted text-muted-foreground border-border")}>{t.statut}</span>
                                <span className={cn("text-[10px]", t.priorite === "Haute" ? "text-red-500" : "text-muted-foreground")}>{t.priorite}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pipedrive */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs font-semibold text-foreground">Commercial — Pipedrive</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{saveRapport.fonctionnelle.pipedriveDeals.length} deal(s) liés</span>
                        </div>
                        <div className="space-y-1.5">
                          {saveRapport.fonctionnelle.pipedriveDeals.map(d => (
                            <div key={d.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                              <span className="text-[10px] font-mono text-orange-500 shrink-0 mt-0.5">{d.id}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{d.titre}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{d.impact}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-medium text-foreground/60">Contact :</span> {d.contact} · {d.valeur}</p>
                              </div>
                              <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0 mt-0.5", d.statut === "Actif" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800")}>{d.statut}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Trackobug */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Bug className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-foreground">Tickets — Trackobug</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{saveRapport.fonctionnelle.trackobugTK.length} TK liés</span>
                        </div>
                        <div className="space-y-1.5">
                          {saveRapport.fonctionnelle.trackobugTK.map(tk => (
                            <div key={tk.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                              <span className="text-[10px] font-mono text-red-500 shrink-0 mt-0.5">{tk.id}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{tk.titre}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tk.impact}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-medium text-foreground/60">Assigné :</span> {tk.assignee}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium", tk.type === "Bug" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800" : tk.type === "Sécurité" ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800")}>{tk.type}</span>
                                <span className="text-[10px] text-muted-foreground">{tk.statut}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timelines */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <CalendarDays className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-xs font-semibold text-foreground">Timelines PRE & TC — outil interne</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{saveRapport.fonctionnelle.timelines.length} jalon(s) liés</span>
                        </div>
                        <div className="space-y-1.5">
                          {saveRapport.fonctionnelle.timelines.map(tl => (
                            <div key={tl.ref} className="p-2.5 bg-muted/30 rounded-lg border border-border/40 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-mono font-bold shrink-0", tl.type === "PRE" ? "text-violet-500" : "text-primary")}>{tl.ref}</span>
                                <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium", tl.type === "PRE" ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800")}>{tl.type}</span>
                                <span className="text-[11px] text-muted-foreground ml-auto shrink-0">Échéance : {tl.echeance}</span>
                              </div>
                              <p className="text-xs font-medium text-foreground truncate">{tl.titre}</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{tl.impact}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-1.5">
                                  <div className={cn("h-1.5 rounded-full", tl.avancement >= 80 ? "bg-emerald-500" : tl.avancement >= 50 ? "bg-primary" : "bg-amber-500")} style={{ width: `${tl.avancement}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">{tl.avancement}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {rapportTab === "revueCode" && (
                    <div className="p-5 space-y-5">
                      {/* Score qualité */}
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 text-lg font-bold shrink-0",
                          saveRapport.revueCode.scoreQualite >= 80 ? "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" : saveRapport.revueCode.scoreQualite >= 60 ? "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/20")}>
                          {saveRapport.revueCode.scoreQualite}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Score qualité du code</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{saveRapport.revueCode.scoreQualite >= 80 ? "Bonne qualité générale" : saveRapport.revueCode.scoreQualite >= 60 ? "Qualité acceptable — améliorations recommandées" : "Qualité insuffisante — corrections requises"}</p>
                        </div>
                      </div>

                      {/* Problèmes */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" />Problèmes détectés ({saveRapport.revueCode.problemes.length})</p>
                        <div className="space-y-1.5">
                          {saveRapport.revueCode.problemes.map((p, i) => (
                            <div key={i} className={cn("p-2.5 rounded-lg border space-y-1", p.gravite === "critique" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" : p.gravite === "majeur" ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" : p.gravite === "mineur" ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" : "bg-muted/30 border-border/40")}>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-bold uppercase", p.gravite === "critique" ? "bg-red-100 text-red-700 border-red-300 dark:text-red-400 dark:border-red-700" : p.gravite === "majeur" ? "bg-amber-100 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700" : p.gravite === "mineur" ? "bg-blue-100 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700" : "bg-muted text-muted-foreground border-border")}>{p.gravite}</span>
                                <span className="text-[11px] text-muted-foreground">Ligne {p.ligne}</span>
                              </div>
                              <p className="text-xs font-medium text-foreground">{p.message}</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed"><span className="font-medium text-foreground/60">Suggestion :</span> {p.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Points positifs */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-emerald-500" />Points positifs</p>
                        <div className="space-y-1">
                          {saveRapport.revueCode.points.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              {pt}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-border shrink-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">Analyse générée le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSaveModalOpen(false)}>
                        <X className="w-3.5 h-3.5 mr-1.5" />Annuler l'enregistrement
                      </Button>
                      <Button size="sm" onClick={() => { performSave(); setSaveModalOpen(false); }}>
                        <Save className="w-3.5 h-3.5 mr-1.5" />Confirmer l'enregistrement
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Prompt initial */
              <>
                <div className="px-6 pt-6 pb-4 shrink-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Analyse avant enregistrement</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <span className="font-mono text-xs text-foreground/70 bg-muted px-1.5 py-0.5 rounded">{file.name}</span> — les modifications ne sont pas encore enregistrées.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Souhaitez-vous analyser les impacts avant de confirmer l'enregistrement ?</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-4 space-y-2 shrink-0">
                  <button
                    onClick={() => setSaveAnalyseOpts(o => ({ ...o, fonctionnelle: !o.fonctionnelle }))}
                    className={cn("w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left", saveAnalyseOpts.fonctionnelle ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80 hover:bg-muted/20")}
                  >
                    <div className={cn("mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors", saveAnalyseOpts.fonctionnelle ? "border-primary bg-primary" : "border-muted-foreground")}>
                      {saveAnalyseOpts.fonctionnelle && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />Analyse fonctionnelle des modifications
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Interroge Freshdesk, Pipedrive, Trackobug et les Timelines PRE/TC pour évaluer les interactions et conséquences métier des changements apportés.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSaveAnalyseOpts(o => ({ ...o, revueCode: !o.revueCode }))}
                    className={cn("w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left", saveAnalyseOpts.revueCode ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80 hover:bg-muted/20")}
                  >
                    <div className={cn("mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors", saveAnalyseOpts.revueCode ? "border-primary bg-primary" : "border-muted-foreground")}>
                      {saveAnalyseOpts.revueCode && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />Revue de code
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Analyse la qualité du code modifié : détection de problèmes, suggestions d'amélioration, score de qualité et points positifs.</p>
                    </div>
                  </button>
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setSaveModalOpen(false)}>Annuler et ne pas enregistrer</Button>
                  <Button variant="destructive" size="sm" onClick={() => { performSave(); setSaveModalOpen(false); }}>Ignorer et enregistrer</Button>
                  <Button size="sm" onClick={handleLancerAnalyse} disabled={!saveAnalyseOpts.fonctionnelle && !saveAnalyseOpts.revueCode}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />Lancer l'analyse
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getMonacoLanguage(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    php: "php", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    css: "css", scss: "scss", sass: "scss", html: "html", htm: "html",
    json: "json", xml: "xml", yaml: "yaml", yml: "yaml", md: "markdown",
    sql: "sql", sh: "shell", bash: "shell", env: "ini", ini: "ini", conf: "ini",
    htaccess: "apache", txt: "plaintext", log: "plaintext",
  };
  return map[ext] ?? "plaintext";
}

function getMockSaveCode(name: string): string {
  const lines = getMockCode(name).split("\n");
  const changeAt = Math.floor(lines.length * 0.3);
  const changeAt2 = Math.floor(lines.length * 0.6);
  const result = [...lines];
  if (result[changeAt]) result[changeAt] = result[changeAt].replace(/\$id|\btrue\b/, m => m === "true" ? "false" : "$id_order");
  result.splice(changeAt + 1, 0, "    // TODO: valider avant traitement");
  if (result[changeAt2 + 1]) result[changeAt2 + 1] = result[changeAt2 + 1] + ` // màj ${new Date().toLocaleDateString("fr-FR")}`;
  return result.join("\n");
}

type LintMarker = { startLineNumber: number; endLineNumber: number; startColumn: number; endColumn: number; message: string; severity: number };

function getMockLintMarkers(filename: string, code: string): LintMarker[] {
  const lines = code.split("\n");
  const markers: LintMarker[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const todoIdx = line.search(/TODO|FIXME|HACK/i);
    if (todoIdx !== -1)
      markers.push({ startLineNumber: ln, endLineNumber: ln, startColumn: todoIdx + 1, endColumn: line.length + 1, message: "TODO / FIXME non résolu", severity: 4 });
    if (filename.endsWith(".php") && /\beval\s*\(/.test(line)) {
      const c = line.search(/\beval\s*\(/) + 1;
      markers.push({ startLineNumber: ln, endLineNumber: ln, startColumn: c, endColumn: c + 4, message: "eval() : risque de sécurité critique", severity: 8 });
    }
    if ((filename.endsWith(".js") || filename.endsWith(".ts")) && /console\.log/.test(line)) {
      const c = line.indexOf("console.log") + 1;
      markers.push({ startLineNumber: ln, endLineNumber: ln, startColumn: c, endColumn: c + 11, message: "console.log() à retirer avant mise en production", severity: 4 });
    }
  }
  return markers;
}

function flattenTree(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  for (const n of nodes) {
    if (n.type === "file") out.push(n);
    else if (n.children) out.push(...flattenTree(n.children));
  }
  return out;
}

type SearchHit = { file: FileNode; lineNo: number; lineText: string };

function searchAcrossFiles(query: string, tree: FileNode[]): Map<string, SearchHit[]> {
  const q = query.toLowerCase();
  const grouped = new Map<string, SearchHit[]>();
  for (const file of flattenTree(tree)) {
    const lines = getMockCode(file.name).split("\n");
    const hits: SearchHit[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) hits.push({ file, lineNo: i + 1, lineText: lines[i] });
    }
    if (hits.length) grouped.set(file.id, hits);
  }
  return grouped;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span className="truncate">{text}</span>;
  return (
    <span className="truncate">
      {text.slice(0, idx)}
      <mark className="bg-primary/40 text-primary font-semibold rounded-sm not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function getFileIconColor(node: FileNode): string {
  const ext = node.ext?.toLowerCase();
  if (["php", "ts", "tsx", "js", "jsx"].includes(ext || "")) return "text-blue-500";
  if (["html", "htm"].includes(ext || "")) return "text-orange-500";
  if (["css", "scss", "sass"].includes(ext || "")) return "text-pink-500";
  if (["json", "xml", "yaml", "yml"].includes(ext || "")) return "text-amber-500";
  if (["jpg", "jpeg", "png", "gif", "svg", "ico"].includes(ext || "")) return "text-green-500";
  return "text-muted-foreground";
}

type ViewMode = "icon" | "list" | "tree";

function FileExplorer({ tree, onFileSelect, selectedFileId }: {
  tree: FileNode[];
  onFileSelect?: (node: FileNode) => void;
  selectedFileId?: string | null;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("icon");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("type");
  const [path, setPath] = useState<{ name: string; nodes: FileNode[] }[]>([{ name: "ROOT_DIR", nodes: tree }]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const currentNodes = path[path.length - 1].nodes;
  const sorted = [...currentNodes].sort((a, b) => {
    if (sortBy === "type" && a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const filtered = filter ? sorted.filter(n => n.name.toLowerCase().includes(filter.toLowerCase())) : sorted;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const navigateInto = (node: FileNode) => {
    if (node.type === "folder") setPath(p => [...p, { name: node.name, nodes: node.children || [] }]);
  };
  const navigateTo = (index: number) => setPath(p => p.slice(0, index + 1));
  const handleNodeClick = (node: FileNode) => {
    if (node.type === "folder") navigateInto(node);
    else onFileSelect?.(node);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
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
            {(["icon", "list", "tree"] as ViewMode[]).map((mode, i) => {
              const Icon = mode === "icon" ? LayoutGrid : mode === "list" ? List : GitBranch;
              const label = mode === "icon" ? "Icône" : mode === "list" ? "Liste" : "Arbo";
              return (
                <button key={mode} onClick={() => setViewMode(mode)} title={label}
                  className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors", i === 1 && "border-x border-border", viewMode === mode ? "bg-primary text-white" : "hover:bg-muted/60 text-muted-foreground")}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SortAsc className="w-3.5 h-3.5" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as "name" | "type")}
              className="bg-card border border-border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground">
              <option value="type">Type</option>
              <option value="name">Nom</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {path.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRightIcon className="w-3 h-3 text-muted-foreground" />}
              <button onClick={() => navigateTo(i)}
                className={cn("flex items-center gap-1 font-mono transition-colors hover:text-primary", i === path.length - 1 ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {i === 0 && <Home className="w-3 h-3" />}
                {seg.name}
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
              <button key={node.id} onClick={() => handleNodeClick(node)} title={node.name}
                className={cn("flex flex-col items-center gap-1 p-2 w-20 rounded group cursor-pointer text-center transition-colors",
                  node.id === selectedFileId ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60"
                )}>
                {node.type === "folder"
                  ? <Folder className="w-9 h-9 text-amber-400 group-hover:text-amber-500 fill-amber-100 group-hover:fill-amber-200 transition-colors" strokeWidth={1.5} />
                  : <File className={cn("w-9 h-9 fill-blue-50", getFileIconColor(node))} strokeWidth={1.5} />
                }
                <span className={cn("text-[10px] leading-tight break-all line-clamp-2", node.id === selectedFileId ? "text-primary font-medium" : "text-foreground/80")}>{node.name}</span>
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
              <div className="col-span-5">Nom</div><div className="col-span-2">Type</div><div className="col-span-2">Taille</div><div className="col-span-3">Modifié</div>
            </div>
            {filtered.map(node => (
              <div key={node.id} onClick={() => handleNodeClick(node)}
                className={cn("grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-border/20 transition-colors cursor-pointer",
                  node.id === selectedFileId ? "bg-primary/5 border-l-2 border-l-primary" : node.type === "folder" ? "hover:bg-muted/40" : "hover:bg-muted/20"
                )}>
                <div className="col-span-5 flex items-center gap-2 truncate">
                  {node.type === "folder" ? <Folder className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} /> : <File className={cn("w-4 h-4 shrink-0", getFileIconColor(node))} strokeWidth={1.5} />}
                  <span className="truncate text-foreground/90">{node.name}</span>
                </div>
                <div className="col-span-2 text-muted-foreground">{node.type === "folder" ? "Dossier" : node.ext?.toUpperCase() || "—"}</div>
                <div className="col-span-2 text-muted-foreground">{node.type === "folder" ? `${node.children?.length || 0} él.` : node.size}</div>
                <div className="col-span-3 text-muted-foreground">{node.modified || "—"}</div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Aucun fichier correspondant</div>}
          </div>
        )}

        {viewMode === "tree" && (
          <TreeView nodes={filtered} expandedIds={expandedIds} toggle={toggleExpand} depth={0} onFileSelect={onFileSelect} selectedFileId={selectedFileId} />
        )}
      </div>
    </div>
  );
}

function TreeView({ nodes, expandedIds, toggle, depth, onFileSelect, selectedFileId }: {
  nodes: FileNode[];
  expandedIds: Set<string>;
  toggle: (id: string) => void;
  depth: number;
  onFileSelect?: (node: FileNode) => void;
  selectedFileId?: string | null;
}) {
  return (
    <div>
      {nodes.map(node => {
        const isExpanded = expandedIds.has(node.id);
        return (
          <div key={node.id}>
            <div className={cn("flex items-center gap-1.5 py-1 px-2 rounded text-xs cursor-pointer group transition-colors",
              node.id === selectedFileId ? "bg-primary/10 text-primary" : "hover:bg-muted/40")}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => node.type === "folder" ? toggle(node.id) : onFileSelect?.(node)}>
              {node.type === "folder" ? (
                <>{isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRightIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
                  {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} /> : <Folder className="w-4 h-4 text-amber-400 fill-amber-50 shrink-0" strokeWidth={1.5} />}</>
              ) : (
                <><span className="w-3 shrink-0" /><File className={cn("w-4 h-4 shrink-0", getFileIconColor(node))} strokeWidth={1.5} /></>
              )}
              <span className="text-foreground/90 truncate">{node.name}</span>
              {node.type === "folder" && node.children && <span className="text-[10px] text-muted-foreground ml-auto">{node.children.length}</span>}
              {node.type === "file" && <span className="text-[10px] text-muted-foreground ml-auto opacity-0 group-hover:opacity-100">{node.size}</span>}
            </div>
            {node.type === "folder" && isExpanded && node.children && (
              <TreeView nodes={node.children} expandedIds={expandedIds} toggle={toggle} depth={depth + 1} onFileSelect={onFileSelect} selectedFileId={selectedFileId} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchPanel({ tree, query, onQueryChange, onFileSelect, onClose }: {
  tree: FileNode[];
  query: string;
  onQueryChange: (q: string) => void;
  onFileSelect: (node: FileNode, lineNo?: number) => void;
  onClose: () => void;
}) {
  const results = useMemo(
    () => query.length >= 2 ? searchAcrossFiles(query, tree) : new Map<string, SearchHit[]>(),
    [query, tree]
  );
  const totalHits = useMemo(() => [...results.values()].reduce((s, r) => s + r.length, 0), [results]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="border-b border-border/60 px-3 py-2.5 bg-muted/20 shrink-0 space-y-2">
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} title="Retour à l'explorateur"
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input ref={inputRef} type="text" placeholder="Rechercher dans tous les fichiers..." value={query}
              onChange={e => onQueryChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40" />
            {query && (
              <button onClick={() => onQueryChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {query.length >= 2 && (
          <p className="text-[10px] text-muted-foreground pl-1">
            {results.size === 0 ? "Aucun résultat" : `${totalHits} occurrence${totalHits > 1 ? "s" : ""} dans ${results.size} fichier${results.size > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <Search className="w-9 h-9 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground leading-relaxed">Tapez au moins 2 caractères<br />pour rechercher dans le code</p>
          </div>
        ) : results.size === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <p className="text-sm text-muted-foreground">Aucun résultat pour</p>
            <code className="text-xs bg-muted rounded px-2 py-1 text-foreground">«&nbsp;{query}&nbsp;»</code>
          </div>
        ) : (
          <div className="py-1">
            {[...results.entries()].map(([fileId, hits]) => {
              const file = hits[0].file;
              return (
                <div key={fileId} className="mb-0.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border/30">
                    <File className={cn("w-3 h-3 shrink-0", getFileIconColor(file))} strokeWidth={1.5} />
                    <span className="text-xs font-medium text-foreground truncate flex-1">{file.name}</span>
                    <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono shrink-0">{hits.length}</span>
                  </div>
                  {hits.map((hit, i) => (
                    <button key={i} onClick={() => onFileSelect(hit.file, hit.lineNo)}
                      className="w-full text-left px-3 py-1 hover:bg-primary/5 group transition-colors">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-muted-foreground shrink-0 w-6 text-right font-mono tabular-nums">{hit.lineNo}</span>
                        <span className="text-[11px] font-mono text-foreground/70 truncate flex-1">
                          <HighlightMatch text={hit.lineText.trim()} query={query} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const [, params] = useRoute("/workspace/:prestationId");
  const prestationId = params?.prestationId || "";


  const { data: prestation } = useGetPrestation(prestationId, { query: { enabled: !!prestationId } });
  const runAnalysis = useRunAnalysis();

  const [taskType, setTaskType] = useState(TASK_TYPES[0].id);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "plan" | "sources">("summary");

  const [urlInput, setUrlInput] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const [docOpen, setDocOpen] = useState(false);
  const [docMode, setDocMode] = useState<"tc" | "upload">("tc");
  const [tcInput, setTcInput] = useState("");
  const [tcResult, setTcResult] = useState<TacheCode | null>(null);
  const [tcNotFound, setTcNotFound] = useState(false);
  const [tcSuggestions, setTcSuggestions] = useState<TacheCode[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; content: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [docAnalyseOpen, setDocAnalyseOpen] = useState(false);
  const [docAnalyseRunning, setDocAnalyseRunning] = useState(false);
  const [docAnalyseStep, setDocAnalyseStep] = useState("");
  const [docRapport, setDocRapport] = useState<AnalyseRapport | null>(null);
  const [docCodeGenRunning, setDocCodeGenRunning] = useState(false);
  const [docCodeGenDone, setDocCodeGenDone] = useState(false);
  const [docRapportTab, setDocRapportTab] = useState<"fonctionnelle">("fonctionnelle");
  const [diffInitTabIds, setDiffInitTabIds] = useState<Set<string>>(new Set());

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [chatDragOver, setChatDragOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [allPrestationUrls, setAllPrestationUrls] = useState<{ url: string; type: "prod" | "save"; name: string }[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollToLine, setScrollToLine] = useState<number | null>(null);

  const activeFile = openTabs.find(t => t.id === activeFileId) ?? null;

  const handleFileSelect = (node: FileNode, lineNo?: number) => {
    setOpenTabs(prev => prev.find(t => t.id === node.id) ? prev : [...prev, node]);
    setActiveFileId(node.id);
    setScrollToLine(lineNo ?? null);
  };

  const handleCloseTab = (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = openTabs.filter(t => t.id !== fileId);
    const idx = openTabs.findIndex(t => t.id === fileId);
    let nextActiveId: string | null = activeFileId;
    if (activeFileId === fileId) {
      nextActiveId = next.length > 0 ? next[Math.min(idx, next.length - 1)].id : null;
    }
    setOpenTabs(next);
    setActiveFileId(nextActiveId);
    setEditedContents(prev => { const n = { ...prev }; delete n[fileId]; return n; });
  };

  const siteRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const tcInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableUrls: string[] = prestation
    ? [prestation.productionUrl, ...(prestation.saveUrls || [])].filter(Boolean)
    : allPrestationUrls.map(e => e.url);
  const filteredSuggestions = availableUrls.filter(u => u.toLowerCase().includes(urlInput.toLowerCase()));

  useEffect(() => {
    if (!prestationId) {
      fetch("/api/prestations", { credentials: "include" })
        .then(r => r.json())
        .then((data: Array<{ productionUrl?: string; saveUrls?: string[]; name: string }>) => {
          const entries: { url: string; type: "prod" | "save"; name: string }[] = [];
          const seen = new Set<string>();
          for (const p of data) {
            if (p.productionUrl && !seen.has(p.productionUrl)) {
              entries.push({ url: p.productionUrl, type: "prod", name: p.name });
              seen.add(p.productionUrl);
            }
            for (const u of p.saveUrls || []) {
              if (!seen.has(u)) {
                entries.push({ url: u, type: "save", name: p.name });
                seen.add(u);
              }
            }
          }
          setAllPrestationUrls(entries);
        })
        .catch(() => {});
    }
  }, [prestationId]);

  useEffect(() => {
    if (prestation?.productionUrl && !urlInput) setUrlInput(prestation.productionUrl);
  }, [prestation]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) setSiteOpen(false);
      if (analysisRef.current && !analysisRef.current.contains(e.target as Node)) setAnalysisOpen(false);
      if (docRef.current && !docRef.current.contains(e.target as Node)) setDocOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setIsEditorFullscreen(false); setDocOpen(false); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTcInput = (value: string) => {
    setTcInput(value);
    setTcNotFound(false);
    setTcResult(null);
    if (value.trim().length >= 2) {
      const q = value.trim().toLowerCase();
      const suggestions = MOCK_TC.filter(
        tc => tc.code.toLowerCase().includes(q) ||
          tc.titre.toLowerCase().includes(q) ||
          tc.client.toLowerCase().includes(q)
      ).slice(0, 5);
      setTcSuggestions(suggestions);
    } else {
      setTcSuggestions([]);
    }
  };

  const handleTcSelect = (tc: TacheCode) => {
    setTcResult(tc);
    setTcInput(tc.code);
    setTcSuggestions([]);
    setTcNotFound(false);
    setUrlInput(tc.url);
    setSelectedUrl(tc.url);
    setOpenTabs([]);
    setActiveFileId(null);
    setEditedContents({});
    setSearchMode(false);
    setSearchQuery("");
    setScrollToLine(null);
    setDocOpen(false);
    setDocRapport(null);
    setDocCodeGenDone(false);
    setDocCodeGenRunning(false);
    setDocAnalyseOpen(true);
  };

  const handleTcSearch = () => {
    const q = tcInput.trim().toUpperCase();
    const found = MOCK_TC.find(tc => tc.code.toUpperCase() === q);
    if (found) {
      handleTcSelect(found);
    } else {
      setTcNotFound(true);
      setTcResult(null);
    }
  };

  const handleFileAccept = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({ name: file.name, size: file.size, content: e.target?.result as string });
      setDocOpen(false);
      setDocRapport(null);
      setDocCodeGenDone(false);
      setDocCodeGenRunning(false);
      setDocAnalyseOpen(true);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileAccept(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAccept(file);
  };

  const docHasContent = tcResult !== null || uploadedFile !== null;

  const handleLancerDocAnalyse = async () => {
    setDocAnalyseRunning(true);
    const steps = [
      "Analyse du document de travail dans le contexte du projet…",
      "Interrogation Freshdesk — service client…",
      "Analyse Pipedrive — données commerciales…",
      "Consultation Trackobug — tickets TK…",
      "Lecture Timelines PRE & TC — outil interne…",
      "Synthèse des interactions et impacts…",
    ];
    for (const step of steps) {
      setDocAnalyseStep(step);
      await new Promise(r => setTimeout(r, 540));
    }
    const rapport = genererRapportMock(tcResult?.titre ?? uploadedFile?.name ?? "document.txt", uploadedFile?.content ?? tcResult?.titre ?? "");
    setDocRapport(rapport);
    setDocAnalyseRunning(false);
    setDocAnalyseStep("");
    setDocRapportTab("fonctionnelle");
  };

  const handleGenererCode = async () => {
    setDocCodeGenRunning(true);
    await new Promise(r => setTimeout(r, 2800));
    const tree = fileTree ?? getTreeForUrl("https://www.boutique-example.fr");
    const allFiles = flattenTree(tree).filter(f => f.type === "file" && f.ext && ["php", "js", "ts", "html", "css"].includes(f.ext));
    const picks = allFiles.slice(0, Math.min(4, allFiles.length));
    const newDiffIds = new Set(picks.map(f => f.id));
    setDiffInitTabIds(newDiffIds);
    setOpenTabs(picks);
    setActiveFileId(picks[0]?.id ?? null);
    setDocCodeGenRunning(false);
    setDocCodeGenDone(true);
    setDocAnalyseOpen(false);
  };

  useEffect(() => {
    if (docAnalyseOpen && !docAnalyseRunning && !docRapport && !docCodeGenRunning) {
      handleLancerDocAnalyse();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docAnalyseOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const addChatFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    files.forEach(file => {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      const isText = file.type.startsWith("text/") || /\.(php|js|ts|tsx|jsx|html|css|json|xml|sql|md|py|rb|java|go|rs|c|cpp|h)$/i.test(file.name);
      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => {
          setChatFiles(prev => [...prev, { id, name: file.name, size: file.size, mimeType: file.type, preview: e.target?.result as string }]);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = e => {
          setChatFiles(prev => [...prev, { id, name: file.name, size: file.size, mimeType: file.type, content: e.target?.result as string }]);
        };
        reader.readAsText(file);
      } else {
        setChatFiles(prev => [...prev, { id, name: file.name, size: file.size, mimeType: file.type }]);
      }
    });
  }, []);

  const removeChatFile = useCallback((id: string) => {
    setChatFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if ((!text && chatFiles.length === 0) || chatLoading) return;
    const filesToSend = [...chatFiles];
    setChatInput("");
    setChatFiles([]);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
      files: filesToSend.length > 0 ? filesToSend : undefined,
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 800));
    const reply = genererReponseMockIA(text || filesToSend.map(f => f.name).join(", "), activeFile?.name ?? null);
    const iaMsg: ChatMessage = { id: crypto.randomUUID(), role: "ia", content: reply, timestamp: new Date() };
    setChatMessages(prev => [...prev, iaMsg]);
    setChatLoading(false);
  };

  const handleSearch = useCallback(() => {
    if (urlInput.trim()) {
      setSelectedUrl(urlInput.trim());
      setSiteOpen(false);
      setShowSuggestions(false);
      setOpenTabs([]);
      setActiveFileId(null);
      setEditedContents({});
      setSearchMode(false);
      setSearchQuery("");
      setScrollToLine(null);
      setIsEditorFullscreen(false);
    }
  }, [urlInput]);

  const handleSelectSuggestion = (url: string) => {
    setUrlInput(url);
    setSelectedUrl(url);
    setShowSuggestions(false);
    setSiteOpen(false);
    setOpenTabs([]);
    setActiveFileId(null);
    setEditedContents({});
    setSearchMode(false);
    setSearchQuery("");
    setScrollToLine(null);
    setIsEditorFullscreen(false);
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;
    setAnalysisOpen(false);
    try {
      const res = await runAnalysis.mutateAsync({ data: { prestationId, projectId: prestation?.projectId || "", taskType, prompt } });
      setResult(res);
      setActiveTab("summary");
    } catch (e) {
      console.error("Échec de l'analyse", e);
    }
  };

  const fileTree = selectedUrl ? getTreeForUrl(selectedUrl) : null;

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-[1600px] mx-auto gap-4">

        <div className="shrink-0 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                {prestation?.projectId ? (
                  <Link href={`/projects/${prestation.projectId}/prestations`} className="hover:text-primary flex items-center transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />Retour aux prestations
                  </Link>
                ) : (
                  <Link href="/projets" className="hover:text-primary flex items-center transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />Retour
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

            <div className="flex items-center gap-2 shrink-0 flex-wrap">

              {/* Sélecteur de document de travail */}
              <div ref={docRef} className="relative">
                <button
                  onClick={() => { setDocOpen(v => !v); setSiteOpen(false); setAnalysisOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    docOpen || docHasContent
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  {uploadedFile ? (
                    <FileUp className="w-4 h-4 shrink-0" />
                  ) : tcResult ? (
                    <Hash className="w-4 h-4 shrink-0" />
                  ) : (
                    <FolderSearch className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {uploadedFile ? uploadedFile.name : tcResult ? tcResult.code : "Document de travail"}
                  </span>
                  {docHasContent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", docOpen && "rotate-180")} />
                </button>

                {docOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[420px] bg-card border border-border rounded-xl shadow-xl z-50">
                    {/* Onglets */}
                    <div className="flex border-b border-border">
                      <button
                        onClick={() => setDocMode("tc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors rounded-tl-xl",
                          docMode === "tc" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        <Hash className="w-3.5 h-3.5" />N° de tâche
                      </button>
                      <button
                        onClick={() => setDocMode("upload")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors rounded-tr-xl",
                          docMode === "upload" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />Import fichier
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {docMode === "tc" ? (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rechercher par N° TC, titre ou client</p>
                          <div className="relative">
                            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              ref={tcInputRef}
                              type="text"
                              value={tcInput}
                              onChange={e => handleTcInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleTcSearch()}
                              placeholder="Ex : TC-2025-001"
                              className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                              autoFocus
                            />
                          </div>

                          {/* Suggestions */}
                          {tcSuggestions.length > 0 && !tcResult && (
                            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/50">
                              {tcSuggestions.map(tc => (
                                <button
                                  key={tc.code}
                                  onMouseDown={e => { e.preventDefault(); handleTcSelect(tc); }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-semibold text-primary">{tc.code}</span>
                                    <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", TC_TYPE_COLORS[tc.type])}>{TC_TYPE_LABELS[tc.type]}</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 mt-0.5 truncate">{tc.titre}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{tc.client} — {tc.prestation}</p>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* TC non trouvé */}
                          {tcNotFound && (
                            <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Aucune tâche trouvée pour ce numéro TC</span>
                            </div>
                          )}

                          {/* Résultat TC trouvé */}
                          {tcResult && (
                            <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-bold text-primary">{tcResult.code}</span>
                                  <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", TC_TYPE_COLORS[tcResult.type])}>{TC_TYPE_LABELS[tcResult.type]}</span>
                                </div>
                                <button onClick={() => { setTcResult(null); setTcInput(""); }} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-sm font-medium text-foreground leading-snug">{tcResult.titre}</p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p><span className="font-medium text-foreground/70">Client :</span> {tcResult.client}</p>
                                <p><span className="font-medium text-foreground/70">Prestation :</span> {tcResult.prestation}</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs border-t border-primary/20 pt-2 mt-1">
                                <Globe className="w-3 h-3 text-primary" />
                                <span className="text-primary font-medium truncate">{tcResult.url}</span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">Site auto-sélectionné</span>
                              </div>
                            </div>
                          )}

                          {!tcResult && (
                            <Button size="sm" onClick={handleTcSearch} className="w-full">
                              <Search className="w-3.5 h-3.5 mr-1.5" />Valider le N° TC
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Importer un document de travail</p>

                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".txt,.md,.pdf,.doc,.docx,.html,.php,.js,.ts,.json,.yaml,.yml,.xml,.csv"
                            onChange={handleFileChange}
                          />

                          {!uploadedFile ? (
                            <div
                              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                              onDragLeave={() => setIsDragOver(false)}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer transition-all",
                                isDragOver
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 hover:bg-muted/30"
                              )}
                            >
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", isDragOver ? "bg-primary/20" : "bg-muted")}>
                                <Upload className={cn("w-5 h-5 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  {isDragOver ? "Relâchez pour importer" : "Glissez un fichier ici"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">ou <span className="text-primary underline underline-offset-2">parcourir</span> vos fichiers</p>
                              </div>
                              <p className="text-[11px] text-muted-foreground">TXT, MD, PDF, HTML, PHP, JS, JSON…</p>
                            </div>
                          ) : (
                            <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                                  <p className="text-xs text-muted-foreground">{uploadedFile.size < 1024 ? `${uploadedFile.size} o` : `${(uploadedFile.size / 1024).toFixed(1)} Ko`}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-primary hover:underline underline-offset-2"
                                  >
                                    Remplacer
                                  </button>
                                  <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />Document importé avec succès
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div ref={siteRef} className="relative">
                <button
                  onClick={() => { setSiteOpen(v => !v); setAnalysisOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    siteOpen || selectedUrl
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="font-medium">
                    {selectedUrl ? "Site sélectionné" : "Sélectionner un site"}
                  </span>
                  {selectedUrl && (
                    <span className="text-xs text-muted-foreground max-w-32 truncate hidden sm:block">
                      {selectedUrl.replace(/^https?:\/\//, "")}
                    </span>
                  )}
                  {selectedUrl && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", siteOpen && "rotate-180")} />
                </button>

                {siteOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL du site courant</p>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={urlInputRef}
                        type="url"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder="https://..."
                        className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        autoFocus
                      />
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
                          {filteredSuggestions.map(url => {
                            const isProd = prestation ? url === prestation.productionUrl : allPrestationUrls.find(e => e.url === url)?.type === "prod";
                            const isSave = prestation ? prestation.saveUrls?.includes(url) : allPrestationUrls.find(e => e.url === url)?.type === "save";
                            const prestName = !prestation ? allPrestationUrls.find(e => e.url === url)?.name : null;
                            return (
                              <button key={url} onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(url); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0">
                                <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-foreground/90">{url}</div>
                                  {prestName && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{prestName}</div>}
                                </div>
                                {isProd && <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">Prod</span>}
                                {isSave && <span className="shrink-0 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">Save</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSearch} className="flex-1">
                        <Search className="w-3.5 h-3.5 mr-1.5" />Charger l'arborescence
                      </Button>
                      {selectedUrl && (
                        <a href={selectedUrl} target="_blank" rel="noopener noreferrer"
                          className="p-2 border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {selectedUrl && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />Arborescence chargée
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div ref={analysisRef} className="relative">
                <button
                  onClick={() => { setAnalysisOpen(v => !v); setSiteOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    analysisOpen
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <Settings2 className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Configurer l'analyse</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", analysisOpen && "rotate-180")} />
                </button>

                {analysisOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Configurer l'analyse</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Type de tâche</label>
                      <div className="grid grid-cols-1 gap-1">
                        {TASK_TYPES.map(type => (
                          <button key={type.id} onClick={() => setTaskType(type.id)}
                            className={cn("text-left px-3 py-1.5 rounded-md text-sm transition-all border", taskType === type.id ? "bg-primary/5 border-primary text-primary font-medium" : "bg-card border-border text-muted-foreground hover:border-border/80")}>
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Requête / Demande</label>
                      <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Décrivez ce que vous souhaitez que l'IA analyse ou construise..."
                        className="w-full h-28 p-3 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                      />
                    </div>

                    <div className="border-2 border-dashed border-border/60 rounded-md p-3 text-center bg-muted/10">
                      <FileText className="w-4 h-4 text-muted-foreground mx-auto mb-1 opacity-50" />
                      <p className="text-xs text-muted-foreground">Glissez-déposez vos documents ici</p>
                    </div>

                    <Button onClick={handleRunAnalysis} disabled={runAnalysis.isPending || !prompt.trim()} className="w-full">
                      {runAnalysis.isPending
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours...</>
                        : <><Sparkles className="w-4 h-4 mr-2" />Lancer l'analyse IA</>
                      }
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex gap-3">
          <div className="flex-1 min-h-0 min-w-0">
          {runAnalysis.isPending ? (
            <div className="h-full bg-card rounded-xl border border-border/60 shadow-sm flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-foreground mt-6">Analyse du contexte en cours...</h3>
              <p className="text-sm text-muted-foreground mt-2">Récupération du code source, de l'historique et des spécifications client.</p>
            </div>
          ) : result ? (
            <div className="h-full flex flex-col bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden animate-fade-in">
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
                  <button onClick={() => setResult(null)} className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />Réinitialiser
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
            <div className={cn("h-full flex gap-3", openTabs.length > 0 ? "flex-row" : "")}>
              {/* Left panel: explorer or search */}
              <div className={cn("h-full shrink-0 transition-all flex flex-col gap-0", openTabs.length > 0 ? "w-[260px]" : "w-full")}>
                {/* Mode toggle strip */}
                {!searchMode && (
                  <div className="flex items-center justify-end mb-1.5 shrink-0">
                    <button onClick={() => setSearchMode(true)} title="Recherche dans les fichiers"
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-card border border-border/60 rounded-lg hover:bg-muted/60 transition-colors shadow-sm">
                      <Search className="w-3.5 h-3.5" />
                      <span>Rechercher</span>
                    </button>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  {searchMode ? (
                    <SearchPanel
                      tree={fileTree}
                      query={searchQuery}
                      onQueryChange={setSearchQuery}
                      onFileSelect={(node, lineNo) => {
                        handleFileSelect(node, lineNo);
                        setSearchMode(false);
                      }}
                      onClose={() => setSearchMode(false)}
                    />
                  ) : (
                    <FileExplorer tree={fileTree} onFileSelect={handleFileSelect} selectedFileId={activeFileId} />
                  )}
                </div>
              </div>

              {/* Tab bar + editor */}
              {openTabs.length > 0 && (
                <div className={cn(
                  "flex flex-col overflow-hidden rounded-xl border border-border/30 shadow-sm",
                  isEditorFullscreen
                    ? "fixed inset-0 z-50 rounded-none border-0 shadow-2xl"
                    : "flex-1 h-full min-w-0"
                )}>
                  {/* Tabs */}
                  <div className="flex items-stretch bg-[#181825] border-b border-white/10 overflow-x-auto shrink-0 scrollbar-none">
                    {openTabs.map(tab => {
                      const isActive = tab.id === activeFileId;
                      const isModified = editedContents[tab.id] !== undefined && editedContents[tab.id] !== getMockCode(tab.name);
                      return (
                        <button key={tab.id} onClick={() => setActiveFileId(tab.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs font-mono whitespace-nowrap border-r border-white/10 group transition-colors min-w-0 max-w-[200px]",
                            isActive
                              ? "bg-[#1e1e2e] text-white/90 border-t-2 border-t-primary"
                              : "text-white/40 hover:text-white/70 hover:bg-white/5"
                          )}>
                          <File className={cn("w-3 h-3 shrink-0", getFileIconColor(tab))} strokeWidth={1.5} />
                          <span className="truncate">{tab.name}</span>
                          {isModified && <span className="text-amber-400 shrink-0">●</span>}
                          <span
                            onClick={e => handleCloseTab(tab.id, e)}
                            className={cn(
                              "shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 transition-colors",
                              isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
                            )}>
                            <X className="w-2.5 h-2.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active editor */}
                  {activeFile && (
                    <div className="flex-1 min-h-0">
                      <CodeViewer
                        key={activeFile.id}
                        file={activeFile}
                        onClose={() => { handleCloseTab(activeFile.id); setIsEditorFullscreen(false); }}
                        editContent={editedContents[activeFile.id] ?? getMockCode(activeFile.name)}
                        onEditChange={v => setEditedContents(prev => ({ ...prev, [activeFile.id]: v }))}
                        scrollToLine={scrollToLine}
                        onScrollToLineDone={() => setScrollToLine(null)}
                        isFullscreen={isEditorFullscreen}
                        onToggleFullscreen={() => setIsEditorFullscreen(f => !f)}
                        prodUrl={prestation?.productionUrl ?? allPrestationUrls.find(e => e.url === selectedUrl && e.type === "prod")?.url ?? (selectedUrl ?? null)}
                        saveUrl={prestation?.saveUrls?.[0] ?? allPrestationUrls.find(e => e.name === allPrestationUrls.find(e2 => e2.url === selectedUrl)?.name && e.type === "save")?.url ?? null}
                        initialTab={diffInitTabIds.has(activeFile.id) ? "diff" : undefined}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-card rounded-xl border border-border/60 shadow-sm flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Ouvrez un document de travail</h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Utilisez le bouton <span className="font-medium text-foreground">Document de travail</span> en haut à gauche pour sélectionner un numéro TC ou importer un fichier, puis lancez l'analyse.
              </p>
            </div>
          )}
          </div>

          {/* Panneau chatbot IA */}
          <div className={cn(
            "flex flex-col border border-border/60 bg-card rounded-xl shadow-sm transition-all duration-200 shrink-0 overflow-hidden",
            chatOpen ? "w-[340px]" : "w-10"
          )}>
            {chatOpen ? (
              <>
                {/* En-tête */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-none">Assistant IA</p>
                      {activeFile && <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[130px]">{activeFile.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {chatMessages.length > 0 && (
                      <button onClick={() => setChatMessages([])} title="Effacer la conversation"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={() => setChatOpen(false)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2 py-8">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Vibecoding IA</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Interagissez avec le code ouvert. Demandez une explication, un refactoring, la correction d'un bug, ou la génération de tests.
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 w-full">
                        {["Explique ce fichier", "Refactorise ce code", "Corrige les bugs", "Génère les tests unitaires"].map(s => (
                          <button key={s} onClick={() => { setChatInput(s); chatInputRef.current?.focus(); }}
                            className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/40">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      {msg.role === "ia" && (
                        <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div className="max-w-[85%] flex flex-col gap-1">
                        {/* Pièces jointes */}
                        {msg.files && msg.files.length > 0 && (
                          <div className={cn("flex flex-wrap gap-1", msg.role === "user" ? "justify-end" : "justify-start")}>
                            {msg.files.map(f => (
                              f.preview ? (
                                <img
                                  key={f.id}
                                  src={f.preview}
                                  alt={f.name}
                                  className="w-28 h-20 object-cover rounded-lg border border-white/20"
                                  title={f.name}
                                />
                              ) : (
                                <div key={f.id} className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border",
                                  msg.role === "user"
                                    ? "bg-primary/80 text-white border-white/20"
                                    : "bg-muted text-foreground border-border/50"
                                )}>
                                  <FileTextIcon className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[100px]">{f.name}</span>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                        {/* Texte */}
                        {msg.content && (
                          <div className={cn(
                            "rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words",
                            msg.role === "user"
                              ? "bg-primary text-white rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm border border-border/60"
                          )}>
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-muted border border-border/60 rounded-xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Saisie */}
                <div className="shrink-0 border-t border-border/60 p-2.5">
                  {/* Input caché pour le sélecteur de fichiers */}
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files) { addChatFiles(e.target.files); e.target.value = ""; } }}
                  />

                  <div
                    className={cn(
                      "flex flex-col gap-1.5 bg-muted/40 rounded-xl border px-2.5 pt-2 pb-1.5 focus-within:border-primary/40 transition-colors relative",
                      chatDragOver ? "border-primary bg-primary/5 border-dashed" : "border-border/60"
                    )}
                    onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setChatDragOver(true); }}
                    onDragLeave={e => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setChatDragOver(false); }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setChatDragOver(false);
                      if (e.dataTransfer.files.length > 0) addChatFiles(e.dataTransfer.files);
                    }}
                  >
                    {/* Overlay drag */}
                    {chatDragOver && (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10 pointer-events-none">
                        <div className="flex flex-col items-center gap-1">
                          <Paperclip className="w-5 h-5 text-primary" />
                          <p className="text-[11px] font-semibold text-primary">Déposer ici</p>
                        </div>
                      </div>
                    )}

                    {/* Prévisualisation des fichiers joints */}
                    {chatFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-1.5 border-b border-border/40">
                        {chatFiles.map(f => (
                          <div key={f.id} className="flex items-center gap-1 bg-muted rounded-lg px-1.5 py-1 border border-border/50 max-w-full group">
                            {f.preview ? (
                              <img src={f.preview} alt={f.name} className="w-7 h-7 rounded object-cover shrink-0" />
                            ) : f.mimeType.startsWith("image/") ? (
                              <ImageIcon className="w-4 h-4 text-violet-500 shrink-0" />
                            ) : (
                              <FileTextIcon className="w-4 h-4 text-primary shrink-0" />
                            )}
                            <span className="text-[10px] text-foreground truncate max-w-[90px]" title={f.name}>{f.name}</span>
                            <button
                              onClick={() => removeChatFile(f.id)}
                              className="text-muted-foreground/60 hover:text-destructive transition-colors ml-0.5 shrink-0"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                      placeholder={chatDragOver ? "" : "Demandez quelque chose sur le code…"}
                      rows={2}
                      className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => chatFileInputRef.current?.click()}
                          title="Joindre des fichiers"
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-muted-foreground/50">↵ Envoyer · ⇧↵ Ligne</span>
                      </div>
                      <button
                        onClick={handleChatSend}
                        disabled={(!chatInput.trim() && chatFiles.length === 0) || chatLoading}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all",
                          (chatInput.trim() || chatFiles.length > 0) && !chatLoading
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        )}>
                        <Zap className="w-3 h-3" />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Réduit */
              <button onClick={() => setChatOpen(true)}
                className="flex flex-col items-center justify-center w-full h-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors group"
                title="Ouvrir l'assistant IA">
                <Sparkles className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/60"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>IA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal analyse documentaire */}
      {docAnalyseOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {docAnalyseRunning ? (
              /* Chargement analyse */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">Analyse du document en cours…</p>
                  <p className="text-xs text-muted-foreground animate-pulse">{docAnalyseStep}</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-xs">
                  {[
                    { label: "Analyse dans le contexte du projet", icon: tcResult ? Hash : FileUp },
                    { label: "Freshdesk", icon: MessageSquare },
                    { label: "Pipedrive", icon: Briefcase },
                    { label: "Trackobug", icon: Bug },
                    { label: "Timelines PRE/TC", icon: CalendarDays },
                    { label: "Synthèse des impacts", icon: TrendingUp },
                  ].map((s, i) => {
                    const stepMap = ["Analyse du document de travail", "Interrogation Freshdesk", "Analyse Pipedrive", "Consultation Trackobug", "Lecture Timelines", "Synthèse"];
                    const isDone = stepMap.slice(i + 1).some(x => docAnalyseStep.startsWith(x));
                    const isActive = docAnalyseStep.startsWith(stepMap[i]);
                    return (
                      <div key={s.label} className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all", isActive ? "bg-primary/10 text-primary" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                        {isDone ? <Check className="w-3.5 h-3.5 shrink-0" /> : isActive ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <s.icon className="w-3.5 h-3.5 shrink-0 opacity-40" />}
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : docCodeGenRunning ? (
              /* Génération code en cours */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-violet-500" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-foreground">Génération du code en cours…</p>
                  <p className="text-xs text-muted-foreground">Analyse des fichiers impactés et production des modifications…</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />Identification des fichiers à modifier…</div>
                  <div className="flex items-center gap-2 opacity-50"><Code2 className="w-3.5 h-3.5" />Génération des modifications par fichier…</div>
                  <div className="flex items-center gap-2 opacity-30"><GitBranch className="w-3.5 h-3.5" />Préparation du diff pour revue…</div>
                </div>
              </div>
            ) : docRapport ? (
              /* Rapport + génération */
              <>
                <div className="px-6 py-4 border-b border-border shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">
                          Rapport d'analyse du document de travail — {tcResult ? tcResult.code : uploadedFile?.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{docRapport.resume}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border-2 text-sm font-bold",
                        docRapport.scoreImpact >= 70 ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/20" : docRapport.scoreImpact >= 50 ? "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20")}>
                        {docRapport.scoreImpact}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">Score impact</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Freshdesk */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-foreground">Service client — Freshdesk</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{docRapport.fonctionnelle.freshdeskTickets.length} ticket(s)</span>
                    </div>
                    <div className="space-y-1.5">
                      {docRapport.fonctionnelle.freshdeskTickets.map(t => (
                        <div key={t.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                          <span className="text-[10px] font-mono text-primary shrink-0 mt-0.5">{t.id}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{t.titre}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t.impact}</p>
                          </div>
                          <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", t.statut === "Ouvert" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800" : t.statut === "En attente" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800" : "bg-muted text-muted-foreground border-border")}>{t.statut}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipedrive */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-foreground">Commercial — Pipedrive</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{docRapport.fonctionnelle.pipedriveDeals.length} deal(s)</span>
                    </div>
                    <div className="space-y-1.5">
                      {docRapport.fonctionnelle.pipedriveDeals.map(d => (
                        <div key={d.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                          <span className="text-[10px] font-mono text-orange-500 shrink-0 mt-0.5">{d.id}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{d.titre}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{d.impact}</p>
                          </div>
                          <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", d.statut === "Actif" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800")}>{d.statut}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trackobug */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Bug className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-foreground">Tickets — Trackobug</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{docRapport.fonctionnelle.trackobugTK.length} TK</span>
                    </div>
                    <div className="space-y-1.5">
                      {docRapport.fonctionnelle.trackobugTK.map(tk => (
                        <div key={tk.id} className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/40">
                          <span className="text-[10px] font-mono text-red-500 shrink-0 mt-0.5">{tk.id}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{tk.titre}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{tk.impact}</p>
                          </div>
                          <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", tk.type === "Bug" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800")}>{tk.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timelines */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <CalendarDays className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-foreground">Timelines PRE & TC</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{docRapport.fonctionnelle.timelines.length} jalons</span>
                    </div>
                    <div className="space-y-1.5">
                      {docRapport.fonctionnelle.timelines.map(tl => (
                        <div key={tl.ref} className="p-2.5 bg-muted/30 rounded-lg border border-border/40 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-mono font-bold shrink-0", tl.type === "PRE" ? "text-violet-500" : "text-primary")}>{tl.ref}</span>
                            <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-full font-medium shrink-0", tl.type === "PRE" ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800")}>{tl.type}</span>
                            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">Échéance : {tl.echeance}</span>
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">{tl.titre}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className={cn("h-1.5 rounded-full", tl.avancement >= 80 ? "bg-emerald-500" : tl.avancement >= 50 ? "bg-primary" : "bg-amber-500")} style={{ width: `${tl.avancement}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{tl.avancement}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer : génération de code */}
                <div className="px-5 py-4 border-t border-border shrink-0 space-y-3">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">Génération automatique du code</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        L'IA peut générer les modifications de code nécessaires pour ce document. Chaque fichier modifié s'ouvrira en mode <span className="font-medium text-foreground/70">Diff</span> pour revue avant validation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDocAnalyseOpen(false)}>
                      <X className="w-3.5 h-3.5 mr-1.5" />Fermer
                    </Button>
                    <Button size="sm" onClick={handleGenererCode}
                      className="bg-violet-600 hover:bg-violet-700 text-white">
                      <Zap className="w-3.5 h-3.5 mr-1.5" />Générer le code automatiquement
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("pb-3 text-sm font-medium transition-colors relative", active ? "text-white" : "text-slate-400 hover:text-slate-200")}>
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
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center"><Server className="w-4 h-4 mr-2 text-primary" />Composants impactés</h3>
            <ul className="space-y-2">{result.impactedComponents.map((c, i) => <li key={i} className="bg-card p-3 rounded border border-border shadow-sm text-sm text-foreground/90 flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-3 shrink-0" />{c}</li>)}</ul>
          </section>
        )}
        {result.identifiedRisks && (
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />Risques identifiés</h3>
            <ul className="space-y-2">{result.identifiedRisks.map((r, i) => <li key={i} className="bg-amber-500/10 p-3 rounded border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3 shrink-0" />{r}</li>)}</ul>
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
        <input type="text" placeholder="Ajouter un commentaire ou une demande d'ajustement..."
          value={comment} onChange={e => setComment(e.target.value)}
          className="w-full bg-muted/30 border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button variant="outline" onClick={() => handleAction("reject")} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 flex-1 md:flex-none">
          <ThumbsDown className="w-4 h-4 mr-2" />Rejeter
        </Button>
        <Button variant="outline" onClick={() => handleAction("adjust")} className="flex-1 md:flex-none">Ajuster</Button>
        <Button onClick={() => handleAction("accept")} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none">
          <ThumbsUp className="w-4 h-4 mr-2" />Accepter
        </Button>
      </div>
    </div>
  );
}
