export function generateId(prefix: string = "id"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8);
}

export function generateToken(): string {
  return `sk_${Math.random().toString(36).substr(2, 24)}`;
}

export function generateSecret(): string {
  return `sec_${Math.random().toString(36).substr(2, 24)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

export function formatDateHuman(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isUrlValid(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function truncateString(str: string, maxLength: number, suffix: string = "..."): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return email;
  const maskedLocal = local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.substring(0, 3) + "*".repeat(phone.length - 7) + phone.substring(phone.length - 4);
}

export function maskToken(token: string): string {
  if (token.length <= 8) return token;
  return token.substring(0, 4) + "*".repeat(token.length - 8) + token.substring(token.length - 4);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function mergeDeep<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }
  return result;
}

export function arrayToMap<T extends { id: string }>(array: T[]): Map<string, T> {
  return new Map(array.map(item => [item.id, item]));
}

export function arrayToObject<T extends { id: string }>(array: T[]): Record<string, T> {
  return array.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, T>);
}

export function groupBy<T>(array: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  array.forEach(item => {
    const groupKey = key(item);
    if (!map.has(groupKey)) {
      map.set(groupKey, []);
    }
    map.get(groupKey)!.push(item);
  });
  return map;
}

export function sortBy<T>(array: T[], key: (item: T) => string | number | Date, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = key(a);
    const bVal = key(b);
    
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter(item => {
    const keyVal = key(item);
    if (seen.has(keyVal)) return false;
    seen.add(keyVal);
    return true;
  });
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function paginateArray<T>(array: T[], page: number, pageSize: number): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = array.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: array.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let inThrottle = false;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(fn: () => Promise<T>, retries: number, delayMs: number): Promise<T> {
  return fn().catch(async (error) => {
    if (retries <= 0) throw error;
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs);
  });
}

export function safeParseJson<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export function getEnvironment(): string {
  return process.env.NODE_ENV || "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export function getConfigValue<T>(key: string, defaultValue: T): T {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

export function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateColor(): string {
  const colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
  
  const color = generateColor();
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='${encodeURIComponent(color)}' width='40' height='40' rx='8'/%3E%3Ctext fill='white' font-family='sans-serif' font-size='16' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function calculateProgress(current: number, total: number): number {
  return Math.min(Math.max(calculatePercentage(current, total), 0), 100);
}

export function formatCurrency(amount: number, currency: string = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("zh-CN").format(num);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟 ${secs}秒`;
  return `${secs}秒`;
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2592000000);
  const years = Math.floor(diff / 31536000000);
  
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (weeks < 4) return `${weeks}周前`;
  if (months < 12) return `${months}个月前`;
  return `${years}年前`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomEmail(): string {
  const domains = ["example.com", "test.com", "demo.com", "mail.com", "email.org"];
  const names = ["user", "admin", "test", "demo", "guest", "john", "jane", "bob", "alice"];
  return `${names[Math.floor(Math.random() * names.length)]}${Math.random().toString(36).substr(2, 4)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

export function randomPhone(): string {
  const prefixes = ["138", "139", "150", "151", "152", "186", "187", "188"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  return str.split(" ").map(capitalize).join(" ");
}

export function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.substring(0, half)}...${str.substring(str.length - half)}`;
}

export function truncateWords(str: string, maxWords: number): string {
  const words = str.split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(" ") + "...";
}

export function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export function truncateHtml(html: string, maxLength: number): string {
  const text = stripHtml(html);
  return truncateString(text, maxLength);
}

export function truncateHtmlWords(html: string, maxWords: number): string {
  const text = stripHtml(html);
  return truncateWords(text, maxWords);
}

export function padStart(str: string, length: number, padChar: string = " "): string {
  if (str.length >= length) return str;
  return padChar.repeat(length - str.length) + str;
}

export function padEnd(str: string, length: number, padChar: string = " "): string {
  if (str.length >= length) return str;
  return str + padChar.repeat(length - str.length);
}

export function padNumber(num: number, length: number): string {
  return num.toString().padStart(length, "0");
}

export function trimStart(str: string, chars: string): string {
  const regex = new RegExp(`^[${chars}]+`);
  return str.replace(regex, "");
}

export function trimEnd(str: string, chars: string): string {
  const regex = new RegExp(`[${chars}]+$`);
  return str.replace(regex, "");
}

export function trim(str: string, chars: string): string {
  return trimEnd(trimStart(str, chars), chars);
}

export function repeat(str: string, times: number): string {
  return str.repeat(times);
}

export function reverseString(str: string): string {
  return str.split("").reverse().join("");
}

export function splitString(str: string, delimiter: string): string[] {
  return str.split(delimiter);
}

export function joinStrings(strings: string[], separator: string = ""): string {
  return strings.join(separator);
}

export function replaceAll(str: string, find: string, replace: string): string {
  return str.split(find).join(replace);
}

export function startsWith(str: string, prefix: string): boolean {
  return str.startsWith(prefix);
}

export function endsWith(str: string, suffix: string): boolean {
  return str.endsWith(suffix);
}

export function includes(str: string, substring: string): boolean {
  return str.includes(substring);
}

export function indexOf(str: string, substring: string): number {
  return str.indexOf(substring);
}

export function lastIndexOf(str: string, substring: string): number {
  return str.lastIndexOf(substring);
}

export function substring(str: string, start: number, end?: number): string {
  return str.substring(start, end);
}

export function substr(str: string, start: number, length?: number): string {
  return str.substr(start, length);
}

export function sliceString(str: string, start: number, end?: number): string {
  return str.slice(start, end);
}

export function charAt(str: string, index: number): string {
  return str.charAt(index);
}

export function charCodeAt(str: string, index: number): number {
  return str.charCodeAt(index);
}

export function fromCharCode(code: number): string {
  return String.fromCharCode(code);
}

export function localeCompare(str1: string, str2: string, locale: string = "zh-CN"): number {
  return str1.localeCompare(str2, locale);
}

export function normalizeString(str: string, form: "NFC" | "NFD" | "NFKC" | "NFKD" = "NFC"): string {
  return str.normalize(form);
}

export function concatStrings(...strings: string[]): string {
  return strings.join("");
}

export function matchString(str: string, regex: RegExp): RegExpMatchArray | null {
  return str.match(regex);
}

export function searchString(str: string, regex: RegExp): number {
  return str.search(regex);
}

export function testRegex(str: string, regex: RegExp): boolean {
  return regex.test(str);
}

export function splitRegex(str: string, regex: RegExp): string[] {
  return str.split(regex);
}

export function replaceString(str: string, regex: RegExp | string, replacement: string): string {
  return str.replace(regex, replacement);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isDefined(value: unknown): boolean {
  return value !== undefined && value !== null;
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

export function isEqual(value1: unknown, value2: unknown): boolean {
  if (value1 === value2) return true;
  if (typeof value1 !== typeof value2) return false;
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    return value1.every((v, i) => isEqual(v, value2[i]));
  }
  if (typeof value1 === "object" && value1 !== null && typeof value2 === "object" && value2 !== null) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => isEqual((value1 as Record<string, unknown>)[key], (value2 as Record<string, unknown>)[key]));
  }
  return false;
}

export function isDeepEqual(value1: unknown, value2: unknown): boolean {
  return isEqual(value1, value2);
}

export function getType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function castString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function castNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

export function castBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

export function castArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  return [value];
}

export function castDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function castObject(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value);
}

export function fromJson<T = unknown>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return json as unknown as T;
  }
}

export function cloneObject<T>(obj: T): T {
  return { ...obj };
}

export function cloneArray<T>(arr: T[]): T[] {
  return [...arr];
}

export function freezeObject<T>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

export function sealObject<T>(obj: T): T {
  Object.seal(obj);
  return obj;
}

export function preventExtensions<T>(obj: T): T {
  Object.preventExtensions(obj);
  return obj;
}

export function hasOwnProperty(obj: unknown, prop: string): boolean {
  return isObject(obj) && Object.prototype.hasOwnProperty.call(obj, prop);
}

export function getOwnPropertyNames(obj: unknown): string[] {
  return isObject(obj) ? Object.getOwnPropertyNames(obj) : [];
}

export function getOwnPropertyDescriptors(obj: unknown): PropertyDescriptorMap {
  return isObject(obj) ? Object.getOwnPropertyDescriptors(obj) : {};
}

export function defineProperty<T>(obj: T, prop: string, descriptor: PropertyDescriptor): T {
  Object.defineProperty(obj, prop, descriptor);
  return obj;
}

export function defineProperties<T>(obj: T, descriptors: Record<string, PropertyDescriptor>): T {
  Object.defineProperties(obj, descriptors);
  return obj;
}

export function assignObject<T extends object>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign(target, ...sources);
}

export function createObject<T>(prototype: object, properties?: PropertyDescriptorMap & ThisType<T>): T {
  return Object.create(prototype, properties as PropertyDescriptorMap) as T;
}

export function getPrototypeOf(obj: unknown): object | null {
  return isObject(obj) ? Object.getPrototypeOf(obj) : null;
}

export function setPrototypeOf<T>(obj: T, prototype: object | null): T {
  Object.setPrototypeOf(obj, prototype);
  return obj;
}

export function isPrototypeOf(prototype: object, obj: object): boolean {
  return prototype.isPrototypeOf(obj);
}

export function getOwnPropertyDescriptor(obj: unknown, prop: string): PropertyDescriptor | undefined {
  return isObject(obj) ? Object.getOwnPropertyDescriptor(obj, prop) : undefined;
}

export function deleteProperty(obj: unknown, prop: string): boolean {
  if (!isObject(obj)) return false;
  delete (obj as Record<string, unknown>)[prop];
  return true;
}

export function keys(obj: unknown): string[] {
  return isObject(obj) ? Object.keys(obj) : [];
}

export function values<T>(obj: Record<string, T>): T[] {
  return Object.values(obj);
}

export function entries<T>(obj: Record<string, T>): [string, T][] {
  return Object.entries(obj);
}

export function fromEntries<T>(entries: [string, T][]): Record<string, T> {
  return Object.fromEntries(entries);
}

export function forEachObject<T>(obj: Record<string, T>, callback: (value: T, key: string) => void): void {
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      callback(obj[key], key);
    }
  }
}

export function mapObject<T, U>(obj: Record<string, T>, mapper: (value: T, key: string) => U): Record<string, U> {
  const result: Record<string, U> = {};
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }
  return result;
}

export function filterObject<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (hasOwnProperty(obj, key) && predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function reduceObject<T, U>(obj: Record<string, T>, reducer: (acc: U, value: T, key: string) => U, initialValue: U): U {
  let acc = initialValue;
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      acc = reducer(acc, obj[key], key);
    }
  }
  return acc;
}

export function someObject<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): boolean {
  for (const key in obj) {
    if (hasOwnProperty(obj, key) && predicate(obj[key], key)) {
      return true;
    }
  }
  return false;
}

export function everyObject<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): boolean {
  for (const key in obj) {
    if (hasOwnProperty(obj, key) && !predicate(obj[key], key)) {
      return false;
    }
  }
  return true;
}

export function findKey<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): string | undefined {
  for (const key in obj) {
    if (hasOwnProperty(obj, key) && predicate(obj[key], key)) {
      return key;
    }
  }
  return undefined;
}

export function findValue<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): T | undefined {
  for (const key in obj) {
    if (hasOwnProperty(obj, key) && predicate(obj[key], key)) {
      return obj[key];
    }
  }
  return undefined;
}

export function sizeObject(obj: unknown): number {
  return isObject(obj) ? Object.keys(obj).length : 0;
}

export function isEmptyObject(obj: unknown): boolean {
  return isObject(obj) && Object.keys(obj).length === 0;
}

export function isPlainObject(obj: unknown): boolean {
  if (!isObject(obj)) return false;
  const prototype = Object.getPrototypeOf(obj);
  return prototype === null || prototype === Object.prototype;
}

export function mergeObjects<T extends Record<string, unknown>>(...objects: T[]): T {
  return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {} as T);
}

export function deepMergeObjects<T extends Record<string, unknown>>(...objects: T[]): T {
  const merge = (target: T, source: T): T => {
    const result = { ...target };
    for (const key in source) {
      if (hasOwnProperty(source, key)) {
        const targetValue = target[key];
        const sourceValue = source[key];
        if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
          result[key] = merge(targetValue as T, sourceValue as T) as T[Extract<keyof T, string>];
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
    return result;
  };
  return objects.reduce((acc, obj) => merge(acc, obj), {} as T);
}

export function invertObject<T extends string | number | symbol>(obj: Record<string, T>): Record<T, string> {
  const result: Record<T, string> = {} as Record<T, string>;
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      result[obj[key]] = key;
    }
  }
  return result;
}

export function pickObject<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omitObject<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete (result as Record<string, unknown>)[key as string];
  });
  return result;
}

export function withoutObject<T>(obj: T, keys: (keyof T)[]): T {
  return omitObject(obj as Record<string, unknown>, keys as string[]) as unknown as T;
}

export function defaultsObject<T extends Record<string, unknown>>(obj: T, defaults: Partial<T>): T {
  const result = { ...defaults, ...obj };
  return result as T;
}

export function defaultsDeepObject<T extends Record<string, unknown>>(obj: T, defaults: Partial<T>): T {
  const result = deepMergeObjects(defaults as T, obj);
  return result as T;
}

export function hasIn(obj: unknown, path: string): boolean {
  if (!isObject(obj)) return false;
  const keys = path.split(".");
  let current = obj as Record<string, unknown>;
  for (const key of keys) {
    if (!hasOwnProperty(current, key)) return false;
    current = current[key] as Record<string, unknown>;
    if (!isObject(current)) return key === keys[keys.length - 1];
  }
  return true;
}

export function getIn(obj: unknown, path: string, defaultValue?: unknown): unknown {
  if (!isObject(obj)) return defaultValue;
  const keys = path.split(".");
  let current = obj as Record<string, unknown>;
  for (const key of keys) {
    if (!hasOwnProperty(current, key)) return defaultValue;
    current = current[key] as Record<string, unknown>;
    if (!isObject(current) && key !== keys[keys.length - 1]) return defaultValue;
  }
  return current;
}

export function setIn<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const result = { ...obj };
  let current = result as Record<string, unknown>;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] ? { ...current[key] as Record<string, unknown> } : {};
      current = current[key] as Record<string, unknown>;
    }
  }
  return result as T;
}

export function deleteIn<T extends Record<string, unknown>>(obj: T, path: string): T {
  const keys = path.split(".");
  const result = { ...obj };
  let current = result as Record<string, unknown>;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === keys.length - 1) {
      delete current[key];
    } else {
      if (!hasOwnProperty(current, key)) return result;
      current[key] = { ...current[key] as Record<string, unknown> };
      current = current[key] as Record<string, unknown>;
    }
  }
  return result as T;
}

export function flattenObject(obj: Record<string, unknown>, prefix: string = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (isPlainObject(value)) {
        Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
  }
  return result;
}

export function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      setIn(result, key, obj[key]);
    }
  }
  return result;
}

export function mapValues<T, U>(obj: Record<string, T>, mapper: (value: T, key: string) => U): Record<string, U> {
  return mapObject(obj, mapper);
}

export function compactArray<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item !== null && item !== undefined);
}

export function flattenArray<T>(array: T[][]): T[] {
  return array.reduce((acc, arr) => [...acc, ...arr], []);
}

export function flattenDeepArray<T>(array: unknown[]): T[] {
  return array.reduce((acc: T[], item) => {
    if (Array.isArray(item)) {
      return [...acc, ...flattenDeepArray<T>(item)];
    }
    return [...acc, item as T];
  }, [] as T[]);
}

export function unionArrays<T>(...arrays: T[][]): T[] {
  return [...new Set(flattenArray(arrays))];
}

export function intersectionArrays<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, arr) => acc.filter(item => arr.includes(item)));
}

export function differenceArrays<T>(base: T[], ...others: T[][]): T[] {
  const excluded = new Set(flattenArray(others));
  return base.filter(item => !excluded.has(item));
}

export function symmetricDifferenceArrays<T>(arr1: T[], arr2: T[]): T[] {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  return [...new Set([...arr1.filter(item => !set2.has(item)), ...arr2.filter(item => !set1.has(item))])];
}

export function pullArray<T>(array: T[], ...values: T[]): T[] {
  const excluded = new Set(values);
  return array.filter(item => !excluded.has(item));
}

export function removeArray<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
  return array.filter((item, index) => !predicate(item, index));
}

export function rejectArray<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
  return removeArray(array, predicate);
}

export function findIndexArray<T>(array: T[], predicate: (item: T, index: number) => boolean): number {
  return array.findIndex(predicate);
}

export function findLastIndexArray<T>(array: T[], predicate: (item: T, index: number) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i)) return i;
  }
  return -1;
}

export function indexOfArray<T>(array: T[], value: T, fromIndex: number = 0): number {
  return array.indexOf(value, fromIndex);
}

export function lastIndexOfArray<T>(array: T[], value: T, fromIndex?: number): number {
  return array.lastIndexOf(value, fromIndex);
}

export function includesArray<T>(array: T[], value: T): boolean {
  return array.includes(value);
}

export function everyArray<T>(array: T[], predicate: (item: T, index: number) => boolean): boolean {
  return array.every(predicate);
}

export function someArray<T>(array: T[], predicate: (item: T, index: number) => boolean): boolean {
  return array.some(predicate);
}

export function forEachArray<T>(array: T[], callback: (item: T, index: number) => void): void {
  array.forEach(callback);
}

export function mapArray<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
  return array.map(mapper);
}

export function filterArray<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
  return array.filter(predicate);
}

export function reduceArray<T, U>(array: T[], reducer: (acc: U, item: T, index: number) => U, initialValue: U): U {
  return array.reduce(reducer, initialValue);
}

export function reduceRightArray<T, U>(array: T[], reducer: (acc: U, item: T, index: number) => U, initialValue: U): U {
  return array.reduceRight(reducer, initialValue);
}

export function sliceArray<T>(array: T[], start: number, end?: number): T[] {
  return array.slice(start, end);
}

export function spliceArray<T>(array: T[], start: number, deleteCount: number = 0, ...items: T[]): T[] {
  return array.splice(start, deleteCount, ...items);
}

export function concatArrays<T>(...arrays: T[][]): T[] {
  return ([] as T[]).concat(...arrays);
}

export function fillArray<T>(array: T[], value: T, start: number = 0, end?: number): T[] {
  return array.fill(value, start, end);
}

export function copyWithinArray<T>(array: T[], target: number, start: number, end?: number): T[] {
  return array.copyWithin(target, start, end);
}

export function reverseArray<T>(array: T[]): T[] {
  return array.reverse();
}

export function sortArray<T>(array: T[], comparator?: (a: T, b: T) => number): T[] {
  return array.sort(comparator);
}

export function joinArray<T>(array: T[], separator: string = ","): string {
  return array.join(separator);
}

export function pushArray<T>(array: T[], ...items: T[]): number {
  return array.push(...items);
}

export function popArray<T>(array: T[]): T | undefined {
  return array.pop();
}

export function shiftArray<T>(array: T[]): T | undefined {
  return array.shift();
}

export function unshiftArray<T>(array: T[], ...items: T[]): number {
  return array.unshift(...items);
}

export function uniqArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function uniqByArray<T>(array: T[], key: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return array.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function zipArrays<T, U>(array1: T[], array2: U[]): [T, U][] {
  const length = Math.min(array1.length, array2.length);
  const result: [T, U][] = [];
  for (let i = 0; i < length; i++) {
    result.push([array1[i], array2[i]]);
  }
  return result;
}

export function unzipArrays<T, U>(array: [T, U][]): [T[], U[]] {
  const result1: T[] = [];
  const result2: U[] = [];
  for (const [item1, item2] of array) {
    result1.push(item1);
    result2.push(item2);
  }
  return [result1, result2];
}

export function partitionArray<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [truthy, falsy];
}

export function sampleArray<T>(array: T[], count: number = 1): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

export function countByArray<T>(array: T[], key: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of array) {
    const k = key(item);
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

export function sumByArray<T>(array: T[], fn: (item: T) => number): number {
  return array.reduce((acc, item) => acc + fn(item), 0);
}

export function maxByArray<T>(array: T[], fn: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((max, item) => fn(item) > fn(max) ? item : max, array[0]);
}

export function minByArray<T>(array: T[], fn: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((min, item) => fn(item) < fn(min) ? item : min, array[0]);
}

export function meanArray(array: number[]): number {
  if (array.length === 0) return 0;
  return sumByArray(array, n => n) / array.length;
}

export function medianArray(array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function rangeArray(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

export function rangeRightArray(start: number, end: number, step: number = 1): number[] {
  return rangeArray(start, end, step).reverse();
}

export function repeatArray<T>(value: T, times: number): T[] {
  return Array(times).fill(value);
}

export function timesArray<T>(times: number, fn: (index: number) => T): T[] {
  const result: T[] = [];
  for (let i = 0; i < times; i++) {
    result.push(fn(i));
  }
  return result;
}

export function fromArray<T>(length: number, fn: (index: number) => T): T[] {
  return timesArray(length, fn);
}

export function isArrayLike(value: unknown): boolean {
  return isArray(value) || (isObject(value) && typeof (value as Record<string, unknown>).length === "number");
}

export function toArray<T>(value: T | T[]): T[] {
  return castArray(value);
}

export function arrayLikeToArray<T>(value: ArrayLike<T>): T[] {
  return Array.from(value);
}

export function arrayToSet<T>(array: T[]): Set<T> {
  return new Set(array);
}

export function setToArray<T>(set: Set<T>): T[] {
  return [...set];
}

export function mapToObject<K, V>(map: Map<K, V>): Record<string, V> {
  const result: Record<string, V> = {};
  for (const [key, value] of map) {
    result[String(key)] = value;
  }
  return result;
}

export function objectToMap<V>(obj: Record<string, V>): Map<string, V> {
  return new Map(Object.entries(obj));
}

export function setToMap<T>(set: Set<T>): Map<T, boolean> {
  const map = new Map<T, boolean>();
  for (const item of set) {
    map.set(item, true);
  }
  return map;
}

export function mapToSet<K>(map: Map<K, unknown>): Set<K> {
  return new Set(map.keys());
}