/**
 * CustomerService - Omnichannel Customer Unification Service
 * 
 * Manages unified customer profiles, identity resolution, and interaction tracking
 */

const db = require('../database');
const pool = db;
const opsPool = db.opsPool;

const CustomerService = {
    /**
     * Find or create a unified customer from various identifiers
     */
    async findOrCreateUnifiedCustomer({ email, phone, whatsapp, name, tenantId, clientId, source }) {
        try {
            // 1. Try to find existing customer by email or phone
            let customer = null;

            if (email) {
                const result = await pool.query(
                    'SELECT * FROM unified_customers WHERE email = $1 AND (tenant_id = $2 OR tenant_id IS NULL)',
                    [email, tenantId]
                );
                if (result.rows.length > 0) customer = result.rows[0];
            }

            if (!customer && (phone || whatsapp)) {
                const phoneNum = phone || whatsapp;
                const result = await pool.query(
                    'SELECT * FROM unified_customers WHERE (phone = $1 OR whatsapp_number = $1) AND (tenant_id = $2 OR tenant_id IS NULL)',
                    [phoneNum, tenantId]
                );
                if (result.rows.length > 0) customer = result.rows[0];
            }

            // 2. Create new customer if not found
            if (!customer) {
                const result = await pool.query(`
                    INSERT INTO unified_customers (
                        tenant_id, client_id, email, phone, whatsapp_number, name,
                        current_stage, last_channel, last_interaction, total_touchpoints
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'awareness', $7, NOW(), 1)
                    RETURNING *
                `, [tenantId, clientId, email, phone, whatsapp || phone, name, source || 'unknown']);

                customer = result.rows[0];

                // Add to identity graph
                if (email) {
                    await this.addIdentity(customer.id, 'email', email, 1.0, source);
                }
                if (phone) {
                    await this.addIdentity(customer.id, 'phone', phone, 0.95, source);
                }
                if (whatsapp) {
                    await this.addIdentity(customer.id, 'whatsapp', whatsapp, 0.95, source);
                }
            }

            return customer;
        } catch (error) {
            console.error('Error in findOrCreateUnifiedCustomer:', error);
            throw error;
        }
    },

    /**
     * Add an identity to the identity graph
     */
    async addIdentity(customerId, type, value, confidence = 1.0, source = 'unknown') {
        try {
            await pool.query(`
                INSERT INTO identity_graph (customer_id, identifier_type, identifier_value, confidence_score, source_channel)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (identifier_type, identifier_value) 
                DO UPDATE SET confidence_score = GREATEST(identity_graph.confidence_score, $4), updated_at = NOW()
            `, [customerId, type, value, confidence, source]);
        } catch (error) {
            console.error('Error adding identity:', error);
        }
    },

    /**
     * Track a customer interaction
     */
    async trackInteraction(customerId, { channel, type, tenantId, campaignId, metadata, utm }) {
        try {
            await pool.query(`
                INSERT INTO customer_interactions (
                    customer_id, tenant_id, channel, interaction_type, campaign_id,
                    metadata, utm_source, utm_medium, utm_campaign
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                customerId, tenantId, channel, type, campaignId,
                JSON.stringify(metadata || {}),
                utm?.source, utm?.medium, utm?.campaign
            ]);

            // Update unified customer stats
            await pool.query(`
                UPDATE unified_customers 
                SET total_touchpoints = total_touchpoints + 1,
                    last_channel = $2,
                    last_interaction = NOW(),
                    updated_at = NOW()
                WHERE id = $1
            `, [customerId, channel]);

        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    },

    /**
     * Update customer journey stage
     */
    async updateJourneyStage(customerId, stage) {
        try {
            await pool.query(`
                UPDATE unified_customers 
                SET current_stage = $2, updated_at = NOW()
                WHERE id = $1
            `, [customerId, stage]);
        } catch (error) {
            console.error('Error updating journey stage:', error);
        }
    },

    /**
     * Start a customer journey
     */
    async startJourney(customerId, { type, tenantId, triggerData, totalSteps = 5 }) {
        try {
            const result = await pool.query(`
                INSERT INTO customer_journeys (
                    customer_id, tenant_id, journey_type, total_steps, trigger_data
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [customerId, tenantId, type, totalSteps, JSON.stringify(triggerData || {})]);

            return result.rows[0];
        } catch (error) {
            console.error('Error starting journey:', error);
            throw error;
        }
    },

    /**
     * Track a conversion event with attribution
     */
    async trackConversion(customerId, { type, value, tenantId, orderId, path }) {
        try {
            const touchpointsCount = path?.length || 0;
            const firstTouch = path?.[0] || null;
            const lastTouch = path?.[path.length - 1] || null;

            // Calculate attribution models
            const linear = {};
            const timeDecay = {};
            if (path && path.length > 0) {
                const share = 100 / path.length;
                path.forEach((ch, i) => {
                    linear[ch] = (linear[ch] || 0) + share;
                    // Time decay: later touchpoints get more credit
                    const weight = (i + 1) / path.length;
                    timeDecay[ch] = (timeDecay[ch] || 0) + (weight * 100 / path.reduce((sum, _, idx) => sum + (idx + 1) / path.length, 0));
                });
            }

            await pool.query(`
                INSERT INTO conversion_events (
                    customer_id, tenant_id, conversion_type, conversion_value, order_id,
                    conversion_path, touchpoints_count, first_touch_channel, last_touch_channel,
                    attribution_last_click, attribution_first_click, attribution_linear, attribution_time_decay
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                customerId, tenantId, type, value, orderId,
                JSON.stringify(path || []), touchpointsCount, firstTouch, lastTouch,
                JSON.stringify({ [lastTouch]: 100 }),
                JSON.stringify({ [firstTouch]: 100 }),
                JSON.stringify(linear),
                JSON.stringify(timeDecay)
            ]);

            // Update customer LTV
            await pool.query(`
                UPDATE unified_customers 
                SET lifetime_value = lifetime_value + $2,
                    purchase_count = purchase_count + 1,
                    current_stage = 'retention',
                    updated_at = NOW()
                WHERE id = $1
            `, [customerId, value]);

        } catch (error) {
            console.error('Error tracking conversion:', error);
        }
    },

    /**
     * Get customer journey analytics
     */
    async getCustomerJourneyStats(tenantId) {
        try {
            const stats = await pool.query(`
                SELECT 
                    current_stage,
                    COUNT(*) as count,
                    AVG(total_touchpoints) as avg_touchpoints,
                    AVG(lifetime_value) as avg_ltv
                FROM unified_customers
                WHERE tenant_id = $1 OR $1 IS NULL
                GROUP BY current_stage
            `, [tenantId]);

            return stats.rows;
        } catch (error) {
            console.error('Error getting journey stats:', error);
            return [];
        }
    },

    /**
     * Get channel mix analytics
     */
    async getChannelMixStats(tenantId) {
        try {
            const stats = await pool.query(`
                SELECT 
                    channel,
                    COUNT(*) as interaction_count,
                    COUNT(DISTINCT customer_id) as unique_customers
                FROM customer_interactions
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY channel
                ORDER BY interaction_count DESC
            `, [tenantId]);

            return stats.rows;
        } catch (error) {
            console.error('Error getting channel mix:', error);
            return [];
        }
    }
};

module.exports = CustomerService;
