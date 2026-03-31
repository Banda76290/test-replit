import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MonacoEditor, { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
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
  X, GitBranch, Code2, Copy, Check, Pencil, RotateCcw, Save
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

function CodeViewer({ file, onClose, prodUrl, saveUrl }: {
  file: FileNode;
  onClose: () => void;
  prodUrl?: string | null;
  saveUrl?: string | null;
}) {
  const [tab, setTab] = useState<"code" | "diff" | "edit">("code");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const originalCode = useMemo(() => getMockCode(file.name), [file.name]);
  const saveCode = useMemo(() => getMockSaveCode(file.name), [file.name]);
  const language = useMemo(() => getMonacoLanguage(file.name), [file.name]);
  const [editContent, setEditContent] = useState(originalCode);
  const isEdited = editContent !== originalCode;

  useEffect(() => {
    setEditContent(getMockCode(file.name));
  }, [file.name]);

  const handleCopy = () => {
    const content = tab === "edit" ? editContent : originalCode;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => setEditContent(originalCode);

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] rounded-xl border border-border/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#181825] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <File className={cn("w-4 h-4 shrink-0", getFileIconColor(file))} strokeWidth={1.5} />
          <span className="text-sm font-mono text-white/90 truncate">{file.name}</span>
          {file.size && <span className="text-xs text-white/40 shrink-0">{file.size}</span>}
          <span className="shrink-0 text-[10px] text-white/30 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">{language}</span>
          {isEdited && (
            <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">● modifié</span>
          )}
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
                {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saved ? "Sauvegardé" : "Sauvegarder"}
              </button>
            </>
          ) : (
            <button onClick={handleCopy} title="Copier" className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onClose} title="Fermer" className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diff URL bar */}
      {tab === "diff" && (
        <div className="flex items-center gap-4 px-4 py-1.5 bg-[#181825] border-b border-white/10 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0" />
            <span className="text-red-300/80 shrink-0">Production</span>
            {prodUrl && <span className="text-white/30 truncate max-w-[180px]">{prodUrl}</span>}
          </div>
          <span className="text-white/20">→</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
            <span className="text-emerald-300/80 shrink-0">Save / Staging</span>
            {saveUrl && <span className="text-white/30 truncate max-w-[180px]">{saveUrl}</span>}
            {!saveUrl && <span className="text-white/20 italic">aucune URL save configurée</span>}
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {tab === "code" && (
          <MonacoEditor
            height="100%"
            language={language}
            value={originalCode}
            theme="vs-dark"
            options={{ ...MONACO_OPTIONS_BASE, readOnly: true }}
          />
        )}
        {tab === "edit" && (
          <MonacoEditor
            height="100%"
            language={language}
            value={editContent}
            theme="vs-dark"
            options={{ ...MONACO_OPTIONS_BASE, readOnly: false }}
            onChange={v => setEditContent(v ?? "")}
          />
        )}
        {tab === "diff" && (
          <MonacoDiffEditor
            height="100%"
            language={language}
            original={originalCode}
            modified={saveCode}
            theme="vs-dark"
            options={{
              ...MONACO_OPTIONS_BASE,
              readOnly: true,
              renderSideBySide: true,
              enableSplitViewResizing: true,
            }}
          />
        )}
      </div>
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
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [allPrestationUrls, setAllPrestationUrls] = useState<{ url: string; type: "prod" | "save"; name: string }[]>([]);

  const siteRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

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
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback(() => {
    if (urlInput.trim()) {
      setSelectedUrl(urlInput.trim());
      setSiteOpen(false);
      setShowSuggestions(false);
      setSelectedFile(null);
    }
  }, [urlInput]);

  const handleSelectSuggestion = (url: string) => {
    setUrlInput(url); setSelectedUrl(url); setShowSuggestions(false); setSiteOpen(false); setSelectedFile(null);
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

        <div className="flex-1 min-h-0">
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
            <div className={cn("h-full flex gap-3 transition-all", selectedFile ? "flex-row" : "")}>
              <div className={cn("h-full transition-all", selectedFile ? "w-[340px] shrink-0" : "w-full")}>
                <FileExplorer tree={fileTree} onFileSelect={setSelectedFile} selectedFileId={selectedFile?.id} />
              </div>
              {selectedFile && (
                <div className="flex-1 h-full min-w-0">
                  <CodeViewer
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    prodUrl={prestation?.productionUrl ?? allPrestationUrls.find(e => e.url === selectedUrl && e.type === "prod")?.url ?? (selectedUrl ?? null)}
                    saveUrl={prestation?.saveUrls?.[0] ?? allPrestationUrls.find(e => e.name === allPrestationUrls.find(e2 => e2.url === selectedUrl)?.name && e.type === "save")?.url ?? null}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-card rounded-xl border border-border/60 shadow-sm flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sélectionnez un site</h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Utilisez le bouton <span className="font-medium text-foreground">Sélectionner un site</span> en haut à droite pour charger l'arborescence de fichiers, puis configurez votre analyse.
              </p>
            </div>
          )}
        </div>
      </div>
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
