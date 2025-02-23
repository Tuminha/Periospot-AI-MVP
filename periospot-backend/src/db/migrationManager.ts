import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class MigrationManager {
    private supabase: SupabaseClient;
    private migrationsDir: string;

    constructor() {
        if (!config.supabase.url || !config.supabase.key) {
            throw new Error('Supabase configuration is missing');
        }
        this.supabase = createClient(config.supabase.url, config.supabase.key);
        this.migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    }

    async runMigrations(): Promise<void> {
        try {
            console.log('Running migrations using Supabase CLI...');
            
            // Run migrations using Supabase CLI
            const { stdout, stderr } = await execAsync('supabase db reset');
            
            if (stderr) {
                console.error('Migration warning:', stderr);
            }
            
            console.log('Migration output:', stdout);
            console.log('Migrations completed successfully');
        } catch (error) {
            console.error('Failed to run migrations:', error);
            throw error;
        }
    }
}

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