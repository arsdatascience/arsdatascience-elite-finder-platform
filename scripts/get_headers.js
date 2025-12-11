const fs = require('fs');
const path = require('path');

function printHeader(file) {
    const p = path.join(__dirname, '../generated_data', file);
    if (!fs.existsSync(p)) {
        // Try synthetic
        const p2 = path.join(__dirname, '../synthetic_data', file);
        if (fs.existsSync(p2)) {
            const content = fs.readFileSync(p2, 'utf8');
            console.log(`${file}: ` + content.split('\n')[0]);
            return;
        }
        console.log(`${file}: NOT FOUND`);
        return;
    }
    const content = fs.readFileSync(p, 'utf8');
    console.log(`${file}: ` + content.split('\n')[0]);
}

printHeader('unified_customers.csv');
printHeader('projects.csv');
