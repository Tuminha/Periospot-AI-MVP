"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../../config");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.key);
router.get('/analytics', async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            throw new errorHandler_1.AppError(401, 'Unauthorized');
        }
        // TODO: Implement actual analytics fetching from database
        const analytics = {
            articlesAnalyzed: 0,
            issuesFound: 0,
            statisticalTests: 0,
            reportsGenerated: 0
        };
        res.json({
            status: 'success',
            data: analytics
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/history', async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            throw new errorHandler_1.AppError(401, 'Unauthorized');
        }
        // TODO: Implement actual history fetching from database
        const history = [];
        res.json({
            status: 'success',
            data: {
                history
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
