/**
 * Route Whitelist — extracted from heartflow.js
 *
 * Replaces the static `HeartFlow.ALLOWED_ROUTES` Set, which was
 * effectively frozen at class-definition time and could not reliably
 * accept runtime additions from all code paths.
 *
 * This module exposes:
 *  - `ALLOWED_ROUTES` mutable Set-like store
 *  - `add(route)` / `addAll(routes)` runtime append helpers
 *  - `has(route)` checker
 *  - `snapshot()` for iteration / serialization
 */

const RouteWhitelist = function RouteWhitelist(initial = []) {
  this._routes = new Set(initial);
};

RouteWhitelist.prototype.add = function add(route) {
  if (!route || typeof route !== 'string') return false;
  this._routes.add(route);
  return true;
};

RouteWhitelist.prototype.addAll = function addAll(routes) {
  let count = 0;
  for (const route of routes) {
    if (this.add(route)) count++;
  }
  return count;
};

RouteWhitelist.prototype.has = function has(route) {
  return this._routes.has(route);
};

RouteWhitelist.prototype.entries = function entries() {
  return [...this._routes.values()];
};

RouteWhitelist.prototype.size = function size() {
  return this._routes.size;
};

RouteWhitelist.prototype.snapshot = function snapshot() {
  return [...this._routes.values()];
};

module.exports = RouteWhitelist;
