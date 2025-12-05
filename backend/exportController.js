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
    try {
        const leads = await fetchLeadsForExport(req);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Railway/Docker
        });
        const page = await browser.newPage();

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
                    th { bg-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { bg-color: #f9f9f9; }
                    .status { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                    .status-new { bg-color: #e3f2fd; color: #1565c0; }
                    .status-closed_won { bg-color: #e8f5e9; color: #2e7d32; }
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

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="leads_report.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
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

module.exports = {
    exportLeadsPdf,
    exportLeadsExcel
};
