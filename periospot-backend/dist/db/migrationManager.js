"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationManager = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class MigrationManager {
    constructor() {
        if (!config_1.config.supabase.url || !config_1.config.supabase.key) {
            throw new Error('Supabase configuration is missing');
        }
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.key);
        this.migrationsDir = path_1.default.join(process.cwd(), 'supabase', 'migrations');
    }
    async runMigrations() {
        try {
            console.log('Running migrations using Supabase CLI...');
            // Run migrations using Supabase CLI
            const { stdout, stderr } = await execAsync('supabase db reset');
            if (stderr) {
                console.error('Migration warning:', stderr);
            }
            console.log('Migration output:', stdout);
            console.log('Migrations completed successfully');
        }
        catch (error) {
            console.error('Failed to run migrations:', error);
            throw error;
        }
    }
}
exports.MigrationManager = MigrationManager;
// Allow running migrations directly
if (require.main === module) {
    const migrationManager = new MigrationManager();
    migrationManager.runMigrations()
        .then(() => console.log('Migrations completed'))
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
