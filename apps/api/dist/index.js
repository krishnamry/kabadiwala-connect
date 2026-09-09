"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const rates_routes_1 = __importDefault(require("./routes/rates.routes"));
const pickup_routes_1 = __importDefault(require("./routes/pickup.routes"));
const kabadiwala_routes_1 = __importDefault(require("./routes/kabadiwala.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const ml_routes_1 = __importDefault(require("./routes/ml.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Root and healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve frontend static build if available
const possibleStaticDirs = [
    path_1.default.resolve(__dirname, '../../../apps/web/dist'),
    path_1.default.resolve(__dirname, '../../web/dist'),
    path_1.default.resolve(__dirname, '../web/dist'),
    path_1.default.resolve(process.cwd(), 'apps/web/dist'),
    path_1.default.resolve(process.cwd(), 'dist')
];
const staticDir = possibleStaticDirs.find(d => fs_1.default.existsSync(d) && fs_1.default.existsSync(path_1.default.join(d, 'index.html')));
if (staticDir) {
    app.use(express_1.default.static(staticDir));
}
// Mount Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/rates', rates_routes_1.default);
app.use('/api/pickups', pickup_routes_1.default);
app.use('/api/kabadiwala', kabadiwala_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/ml', ml_routes_1.default);
// SPA fallback or API root info
if (staticDir) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
            return next();
        }
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
else {
    app.get('/', (req, res) => {
        res.json({
            name: 'Kabadiwala Connect API',
            version: '1.0.0',
            status: 'online',
            endpoints: {
                auth: '/api/auth',
                pickups: '/api/pickups',
                rates: '/api/rates',
                kabadiwala: '/api/kabadiwala',
                admin: '/api/admin',
                ml: '/api/ml'
            }
        });
    });
}
// Centralized error handler
app.use(errorHandler_1.errorHandler);
const PORT = config_1.config.port;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Kabadiwala Connect Backend API running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
