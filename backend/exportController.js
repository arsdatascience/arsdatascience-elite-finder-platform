const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const pool = require('./database');
const { getTenantScope } = require('./utils/tenantSecurity');

// Helper to fetch leads (reusing logic from dbController)
const fetchLeadsForExport = async (req) => {
    const { client_id, status } = req.query;
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    let query = `
        SELECT 
            l.id, l.name, l.email, l.phone, l.source, l.value::float, l.status, l.notes, l.tags,
            l.client_id as "clientId", 
            l.product_interest as "productInterest", 
            l.assigned_to as "assignedTo", 
            l.last_contact as "lastContact", 
            l.created_at as "createdAt",
            c.name as "clientName"
        FROM leads l
        LEFT JOIN clients c ON l.client_id = c.id
    `;
    let params = [];

    // Tenant filtering (commented out in original, keeping consistent)
    // if (!isSuperAdmin) {
    //    query += ` WHERE c.tenant_id = $1`;
    //    params.push(tenantId);
    // }

    if (client_id && client_id !== 'all') {
        const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
        query += ` ${whereOrAnd} l.client_id = $${params.length + 1}`;
        params.push(client_id);
    }

    if (status) {
        const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
        query += ` ${whereOrAnd} l.status = $${params.length + 1}`;
        params.push(status);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
};

const exportLeadsPdf = async (req, res) => {
    console.log('Starting PDF export...');
    let browser = null;
    try {
        const leads = await fetchLeadsForExport(req);
        console.log(`Fetched ${leads.length} leads for export.`);

        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Addresses memory issues in some environments
                '--disable-gpu'
            ],
            timeout: 60000
        });
        console.log('Puppeteer launched successfully.');

        const page = await browser.newPage();
        console.log('New page created.');

        // Basic HTML Template
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .status { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                    .status-new { background-color: #e3f2fd; color: #1565c0; }
                    .status-closed_won { background-color: #e8f5e9; color: #2e7d32; }
                    .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #777; }
                </style>
            </head>
            <body>
                <h1>Relatório de Leads</h1>
                <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Total de registros: ${leads.length}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Origem</th>
                            <th>Status</th>
                            <th>Valor</th>
                            <th>Responsável</th>
                            <th>Data Criação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map(lead => `
                            <tr>
                                <td>${lead.name || '-'}</td>
                                <td>${lead.email || '-'}</td>
                                <td>${lead.phone || '-'}</td>
                                <td>${lead.source || '-'}</td>
                                <td><span class="status status-${lead.status}">${lead.status}</span></td>
                                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value || 0)}</td>
                                <td>${lead.assignedTo || '-'}</td>
                                <td>${new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Elite Finder Platform
                </div>
            </body>
            </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        console.log('Page content set.');

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        console.log('PDF generated successfully.');

        await browser.close();
        browser = null;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="leads_report.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('CRITICAL ERROR generating PDF:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
    }
};

const exportLeadsExcel = async (req, res) => {
    try {
        const leads = await fetchLeadsForExport(req);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Telefone', key: 'phone', width: 20 },
            { header: 'Origem', key: 'source', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Valor', key: 'value', width: 15 },
            { header: 'Responsável', key: 'assignedTo', width: 20 },
            { header: 'Cliente', key: 'clientName', width: 20 },
            { header: 'Data Criação', key: 'createdAt', width: 20 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        leads.forEach(lead => {
            worksheet.addRow({
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                source: lead.source,
                status: lead.status,
                value: lead.value,
                assignedTo: lead.assignedTo,
                clientName: lead.clientName,
                createdAt: new Date(lead.createdAt).toLocaleDateString('pt-BR')
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="leads_export.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel export' });
    }
};

const fetchCampaignsForExport = async (req) => {
    const { client_id } = req.query;
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    let query = `
        SELECT cmp.*, c.name as "clientName"
        FROM campaigns cmp
        JOIN clients c ON cmp.client_id = c.id
    `;
    let params = [];

    // if (!isSuperAdmin) {
    //    query += ` WHERE c.tenant_id = $1`;
    //    params.push(tenantId);
    // }

    if (client_id && client_id !== 'all') {
        const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
        query += ` ${whereOrAnd} cmp.client_id = $${params.length + 1}`;
        params.push(client_id);
    }

    query += ` ORDER BY cmp.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

const exportCampaignsPdf = async (req, res) => {
    console.log('Starting Campaign PDF export...');
    let browser = null;
    try {
        const campaigns = await fetchCampaignsForExport(req);
        console.log(`Fetched ${campaigns.length} campaigns for export.`);

        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            timeout: 60000
        });

        const page = await browser.newPage();

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #777; }
                </style>
            </head>
            <body>
                <h1>Relatório de Campanhas</h1>
                <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Total de registros: ${campaigns.length}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Plataforma</th>
                            <th>Status</th>
                            <th>Investimento</th>
                            <th>Impressões</th>
                            <th>Cliques</th>
                            <th>Conversões</th>
                            <th>Receita</th>
                            <th>ROAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns.map(camp => `
                            <tr>
                                <td>${camp.name || '-'}</td>
                                <td>${camp.platform || '-'}</td>
                                <td>${camp.status || '-'}</td>
                                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(camp.spend || 0)}</td>
                                <td>${new Intl.NumberFormat('pt-BR').format(camp.impressions || 0)}</td>
                                <td>${new Intl.NumberFormat('pt-BR').format(camp.clicks || 0)}</td>
                                <td>${new Intl.NumberFormat('pt-BR').format(camp.conversions || 0)}</td>
                                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(camp.revenue || 0)}</td>
                                <td>${(Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2)}x</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Elite Finder Platform
                </div>
            </body>
            </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, landscape: true });

        await browser.close();
        browser = null;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="campaigns_report.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('CRITICAL ERROR generating Campaign PDF:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
    }
};

const exportCampaignsExcel = async (req, res) => {
    try {
        const campaigns = await fetchCampaignsForExport(req);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Campanhas');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Plataforma', key: 'platform', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Investimento', key: 'spend', width: 15 },
            { header: 'Impressões', key: 'impressions', width: 15 },
            { header: 'Cliques', key: 'clicks', width: 15 },
            { header: 'Conversões', key: 'conversions', width: 15 },
            { header: 'Receita', key: 'revenue', width: 15 },
            { header: 'ROAS', key: 'roas', width: 10 },
            { header: 'Cliente', key: 'clientName', width: 20 },
            { header: 'Data Criação', key: 'createdAt', width: 20 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        campaigns.forEach(camp => {
            worksheet.addRow({
                id: camp.id,
                name: camp.name,
                platform: camp.platform,
                status: camp.status,
                spend: camp.spend,
                impressions: camp.impressions,
                clicks: camp.clicks,
                conversions: camp.conversions,
                revenue: camp.revenue,
                roas: (Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2),
                clientName: camp.clientName,
                createdAt: new Date(camp.created_at).toLocaleDateString('pt-BR')
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="campaigns_export.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Campaign Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel export' });
    }
};

const fetchClientsForExport = async (req) => {
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    let query = `
        SELECT 
            c.id, c.name, c.email, c.phone, c.company, c.status, c.notes,
            c.created_at as "createdAt",
            c.updated_at as "updatedAt"
        FROM clients c
    `;
    let params = [];

    // if (!isSuperAdmin) {
    //    query += ` WHERE c.tenant_id = $1`;
    //    params.push(tenantId);
    // }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

const exportClientsExcel = async (req, res) => {
    try {
        const clients = await fetchClientsForExport(req);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Telefone', key: 'phone', width: 20 },
            { header: 'Empresa', key: 'company', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Notas', key: 'notes', width: 40 },
            { header: 'Data Criação', key: 'createdAt', width: 20 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        clients.forEach(client => {
            worksheet.addRow({
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                company: client.company,
                status: client.status,
                notes: client.notes,
                createdAt: new Date(client.createdAt).toLocaleDateString('pt-BR')
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="clients_export.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Clients Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel export' });
    }
};

module.exports = {
    exportLeadsPdf,
    exportLeadsExcel,
    exportCampaignsPdf,
    exportCampaignsExcel,
    exportClientsExcel
};
