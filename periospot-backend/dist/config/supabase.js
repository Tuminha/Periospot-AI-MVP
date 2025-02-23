"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const index_1 = require("./index");
exports.supabase = (0, supabase_js_1.createClient)(index_1.config.supabase.url, index_1.config.supabase.key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
