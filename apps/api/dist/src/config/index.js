"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret: process.env.JWT_SECRET || 'kabadiwala-super-secret-jwt-key-2026',
    mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    nodeEnv: process.env.NODE_ENV || 'development'
};
