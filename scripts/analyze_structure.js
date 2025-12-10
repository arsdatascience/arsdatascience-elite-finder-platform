const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const LOG_FILE = path.join(__dirname, '../analysis_report.log');
fs.writeFileSync(LOG_FILE, ''); // Clear log

function log(msg) {
    console.log(msg);
    // Strip ANSI codes for file
    const cleanMsg = msg.replace(/\x1b\[[0-9;]*m/g, '') + '\n';
    fs.appendFileSync(LOG_FILE, cleanMsg);
}

const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m"
};

// DB Connections
const crossoverPool = new Pool({
    connectionString: process.env.CLIENTS_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const maglevPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL,
    ssl: { rejectUnauthorized: false }
});

// Folders
const FOLDERS = {
    'synthetic_data': { pool: maglevPool, name: 'Maglev (Ops)' }, // User said syntetic->Maglev
    'generated_data': { pool: crossoverPool, name: 'Crossover (Core)' } // User said generated->Crossover
};

async function getTableSchema(pool, tableName) {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [tableName]);
        return res.rows.map(r => r.column_name);
    } catch (e) {
        return [];
    }
}

async function getCsvHeaders(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const firstLine = content.split('\n')[0];
    return firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
}

async function analyze() {
    log(`${COLORS.blue}🔍 Starting Structural Analysis...${COLORS.reset}\n`);

    for (const [folder, config] of Object.entries(FOLDERS)) {
        const folderPath = path.join(__dirname, '..', folder);
        if (!fs.existsSync(folderPath)) {
            log(`${COLORS.red}❌ Folder not found: ${folder}${COLORS.reset}`);
            continue;
        }

        log(`${COLORS.yellow}📂 Analyzing folder: ${folder} -> Target: ${config.name}${COLORS.reset}`);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.csv'));

        for (const file of files) {
            const tableName = file.replace('.csv', '');
            const filePath = path.join(folderPath, file);

            // 1. Check if table exists
            const dbCols = await getTableSchema(config.pool, tableName);
            if (dbCols.length === 0) {
                // Try checking the OTHER db?
                // For now just report missing
                log(`   🔸 ${tableName}: ${COLORS.red}Table NOT FOUND in ${config.name}${COLORS.reset}`);
                continue;
            }

            // 2. Check headers
            const csvCols = await getCsvHeaders(filePath);
            const missingInDb = csvCols.filter(c => !dbCols.includes(c));
            const missingInCsv = dbCols.filter(c => !csvCols.includes(c) && c !== 'id' && c !== 'created_at' && c !== 'updated_at');

            if (missingInDb.length === 0) {
                log(`   ✅ ${tableName}: Structure OK (${csvCols.length} cols)`);
            } else {
                log(`   ⚠️  ${tableName}: ${COLORS.red}Mismatch!${COLORS.reset}`);
                if (missingInDb.length > 0) log(`      CSV cols missing in DB: ${missingInDb.join(', ')}`);
                // if (missingInCsv.length > 0) log(`      DB cols missing in CSV: ${missingInCsv.join(', ')}`);
            }
        }
        log('');
    }

    crossoverPool.end();
    maglevPool.end();
}

analyze();
