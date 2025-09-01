"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = void 0;
const cors_1 = __importDefault(require("cors"));
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://souk-el-syarat.web.app',
            'https://souk-el-syarat.firebaseapp.com',
            'http://localhost:3000',
            'http://localhost:5173'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin || '*');
        }
        else {
            callback(null, false);
        }
    },
    credentials: true, // THIS FIXES THE CORS CREDENTIALS ISSUE
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count']
});
//# sourceMappingURL=cors-fix.js.map