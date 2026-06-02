var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
function ownerChatDevPlugin() {
    return {
        name: "owner-chat-dev",
        apply: "serve",
        configureServer: function (server) {
            var _this = this;
            var middleware = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var chunks, chunk, e_1_1, body, url, fetchRequest, mod, handler, response, _a, _b;
                var _c, req_1, req_1_1;
                var _d, e_1, _e, _f;
                var _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            if (req.url !== "/api/owner-chat") {
                                next();
                                return [2 /*return*/];
                            }
                            chunks = [];
                            _h.label = 1;
                        case 1:
                            _h.trys.push([1, 6, 7, 12]);
                            _c = true, req_1 = __asyncValues(req);
                            _h.label = 2;
                        case 2: return [4 /*yield*/, req_1.next()];
                        case 3:
                            if (!(req_1_1 = _h.sent(), _d = req_1_1.done, !_d)) return [3 /*break*/, 5];
                            _f = req_1_1.value;
                            _c = false;
                            chunk = _f;
                            chunks.push(chunk);
                            _h.label = 4;
                        case 4:
                            _c = true;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_1_1 = _h.sent();
                            e_1 = { error: e_1_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _h.trys.push([7, , 10, 11]);
                            if (!(!_c && !_d && (_e = req_1.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _e.call(req_1)];
                        case 8:
                            _h.sent();
                            _h.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_1) throw e_1.error;
                            return [7 /*endfinally*/];
                        case 11: return [7 /*endfinally*/];
                        case 12:
                            body = Buffer.concat(chunks).toString("utf-8");
                            url = "http://".concat((_g = req.headers.host) !== null && _g !== void 0 ? _g : "localhost").concat(req.url);
                            fetchRequest = new Request(url, {
                                method: req.method,
                                headers: req.headers,
                                body: body.length > 0 ? body : undefined,
                            });
                            return [4 /*yield*/, server.ssrLoadModule("/api/owner-chat.ts")];
                        case 13:
                            mod = _h.sent();
                            handler = mod.default;
                            return [4 /*yield*/, handler(fetchRequest)];
                        case 14:
                            response = _h.sent();
                            res.statusCode = response.status;
                            response.headers.forEach(function (value, key) {
                                res.setHeader(key, value);
                            });
                            _b = (_a = res).end;
                            return [4 /*yield*/, response.text()];
                        case 15:
                            _b.apply(_a, [_h.sent()]);
                            return [2 /*return*/];
                    }
                });
            }); };
            server.middlewares.use(middleware);
        },
    };
}
function devImageSavePlugin() {
    return {
        name: "dev-image-save",
        apply: "serve",
        configureServer: function (server) {
            var _this = this;
            var middleware = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var chunks, chunk, e_2_1, body, base64, buffer, safe, dest, publicPath, err_1;
                var _a, req_2, req_2_1;
                var _b, e_2, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (req.url !== "/api/dev/save-image" || req.method !== "POST") {
                                next();
                                return [2 /*return*/];
                            }
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 14, , 15]);
                            chunks = [];
                            _e.label = 2;
                        case 2:
                            _e.trys.push([2, 7, 8, 13]);
                            _a = true, req_2 = __asyncValues(req);
                            _e.label = 3;
                        case 3: return [4 /*yield*/, req_2.next()];
                        case 4:
                            if (!(req_2_1 = _e.sent(), _b = req_2_1.done, !_b)) return [3 /*break*/, 6];
                            _d = req_2_1.value;
                            _a = false;
                            chunk = _d;
                            chunks.push(chunk);
                            _e.label = 5;
                        case 5:
                            _a = true;
                            return [3 /*break*/, 3];
                        case 6: return [3 /*break*/, 13];
                        case 7:
                            e_2_1 = _e.sent();
                            e_2 = { error: e_2_1 };
                            return [3 /*break*/, 13];
                        case 8:
                            _e.trys.push([8, , 11, 12]);
                            if (!(!_a && !_b && (_c = req_2.return))) return [3 /*break*/, 10];
                            return [4 /*yield*/, _c.call(req_2)];
                        case 9:
                            _e.sent();
                            _e.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            if (e_2) throw e_2.error;
                            return [7 /*endfinally*/];
                        case 12: return [7 /*endfinally*/];
                        case 13:
                            body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
                            base64 = body.dataUrl.replace(/^data:image\/\w+;base64,/, "");
                            buffer = Buffer.from(base64, "base64");
                            safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
                            dest = path.resolve(__dirname, "public", "backdrops", safe);
                            fs.mkdirSync(path.dirname(dest), { recursive: true });
                            fs.writeFileSync(dest, buffer);
                            publicPath = "/backdrops/".concat(safe);
                            console.log("[dev-image-save] Saved \u2192 ".concat(dest));
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ ok: true, path: publicPath }));
                            return [3 /*break*/, 15];
                        case 14:
                            err_1 = _e.sent();
                            console.error("[dev-image-save] Error:", err_1);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ ok: false, error: String(err_1) }));
                            return [3 /*break*/, 15];
                        case 15: return [2 /*return*/];
                    }
                });
            }); };
            server.middlewares.use(middleware);
        },
    };
}
export default defineConfig({
    plugins: [react(), ownerChatDevPlugin(), devImageSavePlugin()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
