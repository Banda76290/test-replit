import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

// ─── TypeScript / JavaScript global options ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monacoTs = (monaco.languages as any).typescript;
monacoTs.typescriptDefaults.setCompilerOptions({
  target: monacoTs.ScriptTarget.ESNext,
  allowNonTsExtensions: true,
  moduleResolution: monacoTs.ModuleResolutionKind.NodeJs,
  module: monacoTs.ModuleKind.CommonJS,
  noEmit: true,
  esModuleInterop: true,
  jsx: monacoTs.JsxEmit.React,
  allowJs: true,
  typeRoots: ["node_modules/@types"],
});

monacoTs.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});

// ─── PHP completion provider ──────────────────────────────────────────────

const PHP_KEYWORDS: string[] = [
  "abstract", "and", "array", "as", "break", "callable", "case", "catch",
  "class", "clone", "const", "continue", "declare", "default", "die", "do",
  "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach",
  "endif", "endswitch", "endwhile", "enum", "extends", "final", "finally",
  "fn", "for", "foreach", "function", "global", "goto", "if", "implements",
  "include", "include_once", "instanceof", "insteadof", "interface", "isset",
  "list", "match", "namespace", "new", "or", "print", "private", "protected",
  "public", "readonly", "require", "require_once", "return", "static",
  "switch", "throw", "trait", "try", "unset", "use", "var", "while", "xor",
  "yield", "null", "true", "false", "self", "parent", "static", "__CLASS__",
  "__DIR__", "__FILE__", "__FUNCTION__", "__LINE__", "__METHOD__",
  "__NAMESPACE__", "__TRAIT__",
];

const PHP_FUNCTIONS: Array<{ name: string; signature: string; doc: string }> = [
  { name: "array_map", signature: "array_map(callable $callback, array $array)", doc: "Applies the callback to the elements of the given array." },
  { name: "array_filter", signature: "array_filter(array $array, ?callable $callback = null)", doc: "Filters elements of an array using a callback function." },
  { name: "array_reduce", signature: "array_reduce(array $array, callable $callback, mixed $initial = null)", doc: "Iteratively reduce the array to a single value using a callback." },
  { name: "array_merge", signature: "array_merge(array ...$arrays)", doc: "Merge one or more arrays together." },
  { name: "array_slice", signature: "array_slice(array $array, int $offset, ?int $length = null)", doc: "Extract a slice of the array." },
  { name: "array_push", signature: "array_push(array &$array, mixed ...$values)", doc: "Push one or more elements onto the end of array." },
  { name: "array_pop", signature: "array_pop(array &$array)", doc: "Pop the element off the end of array." },
  { name: "array_shift", signature: "array_shift(array &$array)", doc: "Shift an element off the beginning of array." },
  { name: "array_unshift", signature: "array_unshift(array &$array, mixed ...$values)", doc: "Prepend one or more elements to the beginning of an array." },
  { name: "array_keys", signature: "array_keys(array $array)", doc: "Return all the keys or a subset of the keys of an array." },
  { name: "array_values", signature: "array_values(array $array)", doc: "Return all the values of an array." },
  { name: "array_unique", signature: "array_unique(array $array)", doc: "Removes duplicate values from an array." },
  { name: "array_flip", signature: "array_flip(array $array)", doc: "Exchanges all keys with their associated values in an array." },
  { name: "array_reverse", signature: "array_reverse(array $array)", doc: "Return an array with elements in reverse order." },
  { name: "array_search", signature: "array_search(mixed $needle, array $haystack)", doc: "Searches the array for a given value and returns the first corresponding key if successful." },
  { name: "array_key_exists", signature: "array_key_exists(string|int $key, array $array)", doc: "Checks if the given key or index exists in the array." },
  { name: "array_chunk", signature: "array_chunk(array $array, int $length)", doc: "Split an array into chunks." },
  { name: "array_combine", signature: "array_combine(array $keys, array $values)", doc: "Creates an array by using one array for keys and another for its values." },
  { name: "array_diff", signature: "array_diff(array $array, array ...$arrays)", doc: "Computes the difference of arrays." },
  { name: "array_intersect", signature: "array_intersect(array $array, array ...$arrays)", doc: "Computes the intersection of arrays." },
  { name: "array_column", signature: "array_column(array $array, int|string|null $column_key)", doc: "Return the values from a single column in the input array." },
  { name: "array_fill", signature: "array_fill(int $start_index, int $count, mixed $value)", doc: "Fill an array with values." },
  { name: "array_sum", signature: "array_sum(array $array)", doc: "Calculate the sum of values in an array." },
  { name: "array_count_values", signature: "array_count_values(array $array)", doc: "Counts all the values of an array." },
  { name: "in_array", signature: "in_array(mixed $needle, array $haystack, bool $strict = false)", doc: "Checks if a value exists in an array." },
  { name: "count", signature: "count(Countable|array $array)", doc: "Count all elements in an array, or something in an object." },
  { name: "sort", signature: "sort(array &$array)", doc: "Sort an array." },
  { name: "usort", signature: "usort(array &$array, callable $callback)", doc: "Sort an array by values using a user-defined comparison function." },
  { name: "ksort", signature: "ksort(array &$array)", doc: "Sort an array by key." },
  { name: "asort", signature: "asort(array &$array)", doc: "Sort an array and maintain index association." },
  { name: "strlen", signature: "strlen(string $string)", doc: "Get string length." },
  { name: "substr", signature: "substr(string $string, int $offset, ?int $length = null)", doc: "Return part of a string." },
  { name: "strpos", signature: "strpos(string $haystack, string $needle, int $offset = 0)", doc: "Find the position of the first occurrence of a substring in a string." },
  { name: "strrpos", signature: "strrpos(string $haystack, string $needle, int $offset = 0)", doc: "Find the position of the last occurrence of a substring in a string." },
  { name: "str_replace", signature: "str_replace(array|string $search, array|string $replace, string|array $subject)", doc: "Replace all occurrences of the search string with the replacement string." },
  { name: "str_contains", signature: "str_contains(string $haystack, string $needle)", doc: "Determine if a string contains a given substring." },
  { name: "str_starts_with", signature: "str_starts_with(string $haystack, string $needle)", doc: "Checks if a string starts with a given substring." },
  { name: "str_ends_with", signature: "str_ends_with(string $haystack, string $needle)", doc: "Checks if a string ends with a given substring." },
  { name: "str_split", signature: "str_split(string $string, int $length = 1)", doc: "Convert a string to an array." },
  { name: "str_pad", signature: "str_pad(string $input, int $length, string $pad_string = ' ')", doc: "Pad a string to a certain length with another string." },
  { name: "str_repeat", signature: "str_repeat(string $string, int $times)", doc: "Repeat a string." },
  { name: "strtolower", signature: "strtolower(string $string)", doc: "Make a string lowercase." },
  { name: "strtoupper", signature: "strtoupper(string $string)", doc: "Make a string uppercase." },
  { name: "ucfirst", signature: "ucfirst(string $string)", doc: "Make a string's first character uppercase." },
  { name: "ucwords", signature: "ucwords(string $string)", doc: "Uppercase the first character of each word in a string." },
  { name: "trim", signature: "trim(string $string, string $characters = \" \\t\\n\\r\\0\\x0B\")", doc: "Strip whitespace (or other characters) from the beginning and end of a string." },
  { name: "ltrim", signature: "ltrim(string $string)", doc: "Strip whitespace (or other characters) from the beginning of a string." },
  { name: "rtrim", signature: "rtrim(string $string)", doc: "Strip whitespace (or other characters) from the end of a string." },
  { name: "explode", signature: "explode(string $separator, string $string, int $limit = PHP_INT_MAX)", doc: "Split a string by a string." },
  { name: "implode", signature: "implode(string $separator, array $array)", doc: "Join array elements with a string." },
  { name: "sprintf", signature: "sprintf(string $format, mixed ...$values)", doc: "Return a formatted string." },
  { name: "printf", signature: "printf(string $format, mixed ...$values)", doc: "Output a formatted string." },
  { name: "number_format", signature: "number_format(float $num, int $decimals = 0)", doc: "Format a number with grouped thousands." },
  { name: "nl2br", signature: "nl2br(string $string)", doc: "Inserts HTML line breaks before all newlines in a string." },
  { name: "htmlspecialchars", signature: "htmlspecialchars(string $string, int $flags = ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401)", doc: "Convert special characters to HTML entities." },
  { name: "htmlspecialchars_decode", signature: "htmlspecialchars_decode(string $string)", doc: "Convert special HTML entities back to characters." },
  { name: "strip_tags", signature: "strip_tags(string $string, array|string|null $allowed_tags = null)", doc: "Strip HTML and PHP tags from a string." },
  { name: "preg_match", signature: "preg_match(string $pattern, string $subject, array &$matches = null)", doc: "Perform a regular expression match." },
  { name: "preg_replace", signature: "preg_replace(array|string $pattern, array|string $replacement, array|string $subject)", doc: "Perform a regular expression search and replace." },
  { name: "preg_split", signature: "preg_split(string $pattern, string $subject, int $limit = -1)", doc: "Split string by a regular expression." },
  { name: "json_encode", signature: "json_encode(mixed $value, int $flags = 0)", doc: "Returns the JSON representation of a value." },
  { name: "json_decode", signature: "json_decode(string $json, ?bool $associative = null)", doc: "Decodes a JSON string." },
  { name: "var_dump", signature: "var_dump(mixed $value, mixed ...$values)", doc: "Dumps information about a variable." },
  { name: "var_export", signature: "var_export(mixed $value, bool $return = false)", doc: "Outputs or returns a parsable string representation of a variable." },
  { name: "print_r", signature: "print_r(mixed $value, bool $return = false)", doc: "Prints human-readable information about a variable." },
  { name: "isset", signature: "isset(mixed $var, mixed ...$vars)", doc: "Determine if a variable is declared and is different than null." },
  { name: "empty", signature: "empty(mixed $var)", doc: "Determine whether a variable is empty." },
  { name: "unset", signature: "unset(mixed $var, mixed ...$vars)", doc: "Unset a given variable." },
  { name: "is_array", signature: "is_array(mixed $value)", doc: "Finds whether a variable is an array." },
  { name: "is_string", signature: "is_string(mixed $value)", doc: "Find whether the type of a variable is string." },
  { name: "is_int", signature: "is_int(mixed $value)", doc: "Find whether the type of a variable is integer." },
  { name: "is_float", signature: "is_float(mixed $value)", doc: "Finds whether the type of a variable is float." },
  { name: "is_bool", signature: "is_bool(mixed $value)", doc: "Finds out whether a variable is a boolean." },
  { name: "is_null", signature: "is_null(mixed $value)", doc: "Finds whether a variable is null." },
  { name: "is_numeric", signature: "is_numeric(mixed $value)", doc: "Finds whether a variable is a number or a numeric string." },
  { name: "is_object", signature: "is_object(mixed $value)", doc: "Finds whether a variable is an object." },
  { name: "intval", signature: "intval(mixed $value, int $base = 10)", doc: "Get the integer value of a variable." },
  { name: "floatval", signature: "floatval(mixed $value)", doc: "Get float value of a variable." },
  { name: "strval", signature: "strval(mixed $value)", doc: "Get string value of a variable." },
  { name: "boolval", signature: "boolval(mixed $value)", doc: "Get the boolean value of a variable." },
  { name: "abs", signature: "abs(int|float $num)", doc: "Absolute value." },
  { name: "ceil", signature: "ceil(int|float $num)", doc: "Round fractions up." },
  { name: "floor", signature: "floor(int|float $num)", doc: "Round fractions down." },
  { name: "round", signature: "round(int|float $num, int $precision = 0)", doc: "Rounds a float." },
  { name: "max", signature: "max(mixed $value, mixed ...$values)", doc: "Find highest value." },
  { name: "min", signature: "min(mixed $value, mixed ...$values)", doc: "Find lowest value." },
  { name: "rand", signature: "rand(int $min = 0, int $max = PHP_INT_MAX)", doc: "Generate a random integer." },
  { name: "time", signature: "time()", doc: "Return current Unix timestamp." },
  { name: "date", signature: "date(string $format, ?int $timestamp = null)", doc: "Format a Unix timestamp." },
  { name: "strtotime", signature: "strtotime(string $datetime, ?int $baseTimestamp = null)", doc: "Parse about any English textual datetime description into a Unix timestamp." },
  { name: "mktime", signature: "mktime(int $hour, int $minute, int $second, int $month, int $day, int $year)", doc: "Get Unix timestamp for a date." },
  { name: "microtime", signature: "microtime(bool $as_float = false)", doc: "Return current Unix timestamp with microseconds." },
  { name: "file_get_contents", signature: "file_get_contents(string $filename, bool $use_include_path = false)", doc: "Reads entire file into a string." },
  { name: "file_put_contents", signature: "file_put_contents(string $filename, mixed $data, int $flags = 0)", doc: "Write data to a file." },
  { name: "file_exists", signature: "file_exists(string $filename)", doc: "Checks whether a file or directory exists." },
  { name: "is_file", signature: "is_file(string $filename)", doc: "Tells whether the filename is a regular file." },
  { name: "is_dir", signature: "is_dir(string $filename)", doc: "Tells whether the filename is a directory." },
  { name: "mkdir", signature: "mkdir(string $directory, int $permissions = 0777, bool $recursive = false)", doc: "Makes directory." },
  { name: "unlink", signature: "unlink(string $filename)", doc: "Deletes a file." },
  { name: "basename", signature: "basename(string $path, string $suffix = '')", doc: "Returns trailing name component of path." },
  { name: "dirname", signature: "dirname(string $path, int $levels = 1)", doc: "Returns a parent directory's path." },
  { name: "pathinfo", signature: "pathinfo(string $path, int $options = PATHINFO_ALL)", doc: "Returns information about a file path." },
  { name: "header", signature: "header(string $header, bool $replace = true, int $response_code = 0)", doc: "Send a raw HTTP header." },
  { name: "setcookie", signature: "setcookie(string $name, string $value = '', int $expires_or_options = 0)", doc: "Send a cookie." },
  { name: "session_start", signature: "session_start(array $options = [])", doc: "Start new or resume existing session." },
  { name: "session_destroy", signature: "session_destroy()", doc: "Destroys all data registered to a session." },
  { name: "ob_start", signature: "ob_start(?callable $callback = null)", doc: "Turn on output buffering." },
  { name: "ob_get_clean", signature: "ob_get_clean()", doc: "Get current buffer contents and delete current output buffer." },
  { name: "call_user_func", signature: "call_user_func(callable $callback, mixed ...$args)", doc: "Call the callback given by the first parameter." },
  { name: "call_user_func_array", signature: "call_user_func_array(callable $callback, array $args)", doc: "Call a callback with an array of parameters." },
  { name: "function_exists", signature: "function_exists(string $function)", doc: "Return true if the given function has been defined." },
  { name: "class_exists", signature: "class_exists(string $class, bool $autoload = true)", doc: "Checks if the class has been defined." },
  { name: "method_exists", signature: "method_exists(object|string $object_or_class, string $method)", doc: "Checks if the class method exists." },
  { name: "property_exists", signature: "property_exists(object|string $object_or_class, string $property)", doc: "Checks if the object or class has a property." },
  { name: "get_class", signature: "get_class(object $object = ?)", doc: "Returns the name of the class of an object." },
  { name: "get_parent_class", signature: "get_parent_class(object|string $object_or_class = ?)", doc: "Retrieves the parent class name for object or class." },
  { name: "is_a", signature: "is_a(mixed $object_or_string, string $class_name, bool $allow_string = false)", doc: "Checks whether the object is of this class or has this class as one of its parents." },
  { name: "error_reporting", signature: "error_reporting(?int $error_level = null)", doc: "Sets which PHP errors are reported." },
  { name: "trigger_error", signature: "trigger_error(string $message, int $error_level = E_USER_NOTICE)", doc: "Generates a user-level error/warning/notice message." },
  { name: "set_error_handler", signature: "set_error_handler(?callable $callback, int $error_levels = E_ALL)", doc: "Sets a user-defined error handler function." },
  { name: "set_exception_handler", signature: "set_exception_handler(?callable $callback)", doc: "Sets a user-defined exception handler function." },
  { name: "debug_backtrace", signature: "debug_backtrace(int $options = DEBUG_BACKTRACE_PROVIDE_OBJECT, int $limit = 0)", doc: "Generates a backtrace." },
];

const PHP_SNIPPETS: Array<{ label: string; insert: string; doc: string }> = [
  {
    label: "class",
    insert: "class ${1:ClassName}\n{\n\tpublic function __construct(${2})\n\t{\n\t\t${3}\n\t}\n}",
    doc: "PHP class skeleton",
  },
  {
    label: "interface",
    insert: "interface ${1:InterfaceName}\n{\n\tpublic function ${2:method}(${3}): ${4:void};\n}",
    doc: "PHP interface skeleton",
  },
  {
    label: "trait",
    insert: "trait ${1:TraitName}\n{\n\t${2}\n}",
    doc: "PHP trait skeleton",
  },
  {
    label: "function",
    insert: "function ${1:name}(${2}): ${3:void}\n{\n\t${4}\n}",
    doc: "PHP function declaration",
  },
  {
    label: "foreach",
    insert: "foreach (\\$${1:array} as \\$${2:key} => \\$${3:value}) {\n\t${4}\n}",
    doc: "PHP foreach loop",
  },
  {
    label: "for",
    insert: "for (\\$${1:i} = 0; \\$${1:i} < ${2:count}; \\$${1:i}++) {\n\t${3}\n}",
    doc: "PHP for loop",
  },
  {
    label: "while",
    insert: "while (${1:condition}) {\n\t${2}\n}",
    doc: "PHP while loop",
  },
  {
    label: "if",
    insert: "if (${1:condition}) {\n\t${2}\n}",
    doc: "PHP if statement",
  },
  {
    label: "if-else",
    insert: "if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}",
    doc: "PHP if-else statement",
  },
  {
    label: "switch",
    insert: "switch (\\$${1:var}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n\t\tbreak;\n}",
    doc: "PHP switch statement",
  },
  {
    label: "try-catch",
    insert: "try {\n\t${1}\n} catch (\\Exception \\$${2:e}) {\n\t${3}\n}",
    doc: "PHP try-catch block",
  },
  {
    label: "try-catch-finally",
    insert: "try {\n\t${1}\n} catch (\\Exception \\$${2:e}) {\n\t${3}\n} finally {\n\t${4}\n}",
    doc: "PHP try-catch-finally block",
  },
  {
    label: "phpdoc",
    insert: "/**\n * ${1:Description}\n *\n * @param ${2:type} \\$${3:param} ${4:description}\n * @return ${5:type}\n */",
    doc: "PHPDoc block",
  },
  {
    label: "namespace",
    insert: "namespace ${1:App\\\\${2:Module}};",
    doc: "PHP namespace declaration",
  },
  {
    label: "use",
    insert: "use ${1:Namespace\\\\${2:ClassName}};",
    doc: "PHP use statement",
  },
  {
    label: "match",
    insert: "match (\\$${1:var}) {\n\t${2:value} => ${3:result},\n\tdefault => ${4:default},\n}",
    doc: "PHP match expression",
  },
  {
    label: "arrow-fn",
    insert: "fn(\\$${1:param}) => ${2:expression}",
    doc: "PHP arrow function",
  },
  {
    label: "null-coalesce",
    insert: "\\$${1:var} ?? ${2:default}",
    doc: "PHP null coalescing operator",
  },
];

// ── Provider 1 : variables PHP ($variable) ───────────────────────────────
// Monaco ne traite pas '$' comme un caractère de mot, donc on gère
// séparément le cas où l'utilisateur tape '$xxx'.
monaco.languages.registerCompletionItemProvider("php", {
  triggerCharacters: ["$"],
  provideCompletionItems(model, position) {
    // Texte de la ligne jusqu'au curseur
    const linePrefix = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // On n'active ce provider que si le curseur est après un '$'
    const varMatch = linePrefix.match(/\$([a-zA-Z_]\w*)$/);
    const afterDollarOnly = linePrefix.match(/\$$/);
    if (!varMatch && !afterDollarOnly) return { suggestions: [] };

    const typed = varMatch ? varMatch[1] : "";
    const dollarCol = position.column - typed.length - 1; // colonne du '$'

    // Extraire toutes les variables du document
    const fullText = model.getValue();
    const varRegex = /\$([a-zA-Z_]\w*)/g;
    const vars = new Map<string, number>(); // name → occurrences
    let m: RegExpExecArray | null;
    while ((m = varRegex.exec(fullText)) !== null) {
      const v = m[1];
      vars.set(v, (vars.get(v) ?? 0) + 1);
    }

    // Variables PHP superglobales toujours disponibles
    const superglobals = [
      "_GET", "_POST", "_REQUEST", "_SESSION", "_COOKIE",
      "_SERVER", "_ENV", "_FILES", "_GLOBALS", "this",
    ];
    superglobals.forEach((s) => vars.set(s, (vars.get(s) ?? 0) + 100));

    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: dollarCol,
      endColumn: position.column,
    };

    const suggestions = Array.from(vars.entries())
      .sort((a, b) => b[1] - a[1]) // trier par fréquence d'usage
      .map(([name, count]) => ({
        label: "$" + name,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: superglobals.includes(name) ? "Superglobale PHP" : `Variable (×${count})`,
        insertText: "$" + name,
        filterText: "$" + name,
        sortText: String(1000 - Math.min(count, 999)).padStart(4, "0") + name,
        range,
      }));

    return { suggestions };
  },
});

// ── Provider 2 : fonctions, mots-clés, snippets PHP ─────────────────────
monaco.languages.registerCompletionItemProvider("php", {
  triggerCharacters: ["->", "::", "("],
  provideCompletionItems(model, position) {
    // Si le curseur est après un '$', laisser le provider 1 gérer
    const linePrefix = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
    if (/\$[a-zA-Z_\w]*$/.test(linePrefix)) return { suggestions: [] };

    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    const fnItems = PHP_FUNCTIONS.map((fn) => ({
      label: fn.name,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: fn.signature,
      documentation: { value: fn.doc },
      insertText: fn.name,
      range,
    }));

    const kwItems = PHP_KEYWORDS.map((kw) => ({
      label: kw,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: kw,
      range,
    }));

    const snItems = PHP_SNIPPETS.map((sn) => ({
      label: sn.label,
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: sn.doc,
      documentation: { value: sn.doc },
      insertText: sn.insert,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    }));

    return { suggestions: [...fnItems, ...kwItems, ...snItems] };
  },
});

// Hover provider for PHP functions
monaco.languages.registerHoverProvider("php", {
  provideHover(model, position) {
    const word = model.getWordAtPosition(position);
    if (!word) return null;
    const fn = PHP_FUNCTIONS.find((f) => f.name === word.word);
    if (!fn) return null;
    return {
      range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
      contents: [
        { value: `**\`${fn.signature}\`**` },
        { value: fn.doc },
      ],
    };
  },
});

// Signature help for PHP functions
monaco.languages.registerSignatureHelpProvider("php", {
  signatureHelpTriggerCharacters: ["("],
  signatureHelpRetriggerCharacters: [","],
  provideSignatureHelp(model, position) {
    const lineText = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
    const match = lineText.match(/(\w+)\s*\(([^)]*)?$/);
    if (!match) return null;
    const fnName = match[1];
    const fn = PHP_FUNCTIONS.find((f) => f.name === fnName);
    if (!fn) return null;
    const argsBefore = (match[2] || "").split(",");
    const activeParam = Math.max(0, argsBefore.length - 1);
    const paramMatches = fn.signature.match(/\(([^)]*)\)/);
    const paramStr = paramMatches?.[1] ?? "";
    const params = paramStr ? paramStr.split(",").map((p) => ({ label: p.trim() })) : [];
    return {
      value: {
        signatures: [{
          label: fn.signature,
          documentation: fn.doc,
          parameters: params,
        }],
        activeSignature: 0,
        activeParameter: Math.min(activeParam, Math.max(0, params.length - 1)),
      },
      dispose: () => {},
    };
  },
});
