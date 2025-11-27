require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const agentTemplates = require('./config/agentTemplates');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedTemplates() {
    try {
        console.log('🌱 Seeding agent templates...\n');

        for (const [key, template] of Object.entries(agentTemplates)) {
            console.log(`📝 Processing template: ${template.meta.templateName}`);

            // 1. Inserir ou atualizar template
            const templateResult = await pool.query(`
                INSERT INTO agent_templates (
                    template_id, template_name, template_description, template_version,
                    base_config, default_parameters, category
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (template_id) 
                DO UPDATE SET
                    template_name = EXCLUDED.template_name,
                    template_description = EXCLUDED.template_description,
                    template_version = EXCLUDED.template_version,
                    base_config = EXCLUDED.base_config,
                    default_parameters = EXCLUDED.default_parameters,
                    category = EXCLUDED.category,
                    updated_at = NOW()
                RETURNING id
            `, [
                template.meta.templateId,
                template.meta.templateName,
                template.meta.templateDescription,
                template.meta.version,
                JSON.stringify(template.baseConfig),
                JSON.stringify(template.parameters),
                template.meta.category
            ]);

            console.log(`   ✅ Template saved (ID: ${templateResult.rows[0].id})`);

            // 2. Registrar parâmetros individuais (para consulta)
            console.log(`   📋 Registering ${template.parameters.length} parameters...`);

            for (const param of template.parameters) {
                await pool.query(`
                    INSERT INTO agent_custom_parameters (
                        chatbot_id, parameter_key, parameter_value, parameter_type,
                        category, display_label, display_order, helper_text,
                        is_required, validation_rules
                    )
                    SELECT 
                        NULL, -- chatbot_id será NULL para templates
                        $1, $2, $3, $4, $5, $6, $7, $8, $9
                    WHERE NOT EXISTS (
                        SELECT 1 FROM agent_custom_parameters 
                        WHERE chatbot_id IS NULL AND parameter_key = $1
                    )
                `, [
                    `${template.meta.templateId}.${param.key}`,
                    param.defaultValue || '',
                    param.type,
                    param.category,
                    param.label,
                    param.displayOrder || 0,
                    param.helperText || '',
                    param.required || false,
                    JSON.stringify(param.validation || {})
                ]);
            }

            // 3. Registrar grupos de parâmetros
            if (template.groups && template.groups.length > 0) {
                console.log(`   📁 Registering ${template.groups.length} parameter groups...`);

                for (const group of template.groups) {
                    await pool.query(`
                        INSERT INTO agent_parameter_groups (
                            chatbot_id, group_id, group_label, display_order
                        )
                        SELECT NULL, $1, $2, $3
                        WHERE NOT EXISTS (
                            SELECT 1 FROM agent_parameter_groups 
                            WHERE chatbot_id IS NULL AND group_id = $1
                        )
                    `, [
                        `${template.meta.templateId}.${group.id}`,
                        group.label,
                        group.order
                    ]);
                }
            }

            console.log(`   ✅ Template '${template.meta.templateName}' completed!\n`);
        }

        console.log('✅ All templates seeded successfully!');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        await pool.end();
        process.exit(1);
    }
}

seedTemplates();
