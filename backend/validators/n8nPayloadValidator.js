const Joi = require('joi');
const n8nLogger = require('../utils/n8nLogger');

const schemas = {
    // Schema genérico para triggers vindos do n8n
    webhookTrigger: Joi.object({
        workflowId: Joi.string().optional(),
        event: Joi.string().required(),
        data: Joi.object().required(),
        timestamp: Joi.date().iso().optional()
    }).unknown(true)
};

const validatePayload = (schemaType) => {
    return (req, res, next) => {
        const schema = schemas[schemaType];
        if (!schema) {
            n8nLogger.error(`Validator schema not found: ${schemaType}`);
            return res.status(500).json({ error: 'Validator schema not found' });
        }

        const { error } = schema.validate(req.body);
        if (error) {
            n8nLogger.warn('Invalid payload received', {
                error: error.details[0].message,
                body: req.body
            });
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

module.exports = { validatePayload };
