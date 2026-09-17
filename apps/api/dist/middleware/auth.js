"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = exports.isCitizenUser = exports.isRecyclerUser = exports.isCollectorUser = exports.isRegulatoryUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const isRegulatoryUser = (role) => role === 'ADMIN' || role === 'REGULATORY' || role === 'regulatory';
exports.isRegulatoryUser = isRegulatoryUser;
const isCollectorUser = (role) => role === 'KABADIWALA' || role === 'COLLECTOR' || role === 'collector';
exports.isCollectorUser = isCollectorUser;
const isRecyclerUser = (role) => role === 'RECYCLER' || role === 'recycler';
exports.isRecyclerUser = isRecyclerUser;
const isCitizenUser = (role) => role === 'CITIZEN' || role === 'citizen';
exports.isCitizenUser = isCitizenUser;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication token is required'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired authentication token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const currentRole = req.user.role;
        const matches = allowedRoles.some(r => {
            if (r === currentRole)
                return true;
            if ((r === 'ADMIN' || r === 'REGULATORY' || r === 'regulatory') && (0, exports.isRegulatoryUser)(currentRole))
                return true;
            if ((r === 'KABADIWALA' || r === 'COLLECTOR' || r === 'collector') && (0, exports.isCollectorUser)(currentRole))
                return true;
            if ((r === 'RECYCLER' || r === 'recycler') && (0, exports.isRecyclerUser)(currentRole))
                return true;
            if ((r === 'CITIZEN' || r === 'citizen') && (0, exports.isCitizenUser)(currentRole))
                return true;
            return false;
        });
        if (!matches) {
            return res.status(403).json({
                success: false,
                error: `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
