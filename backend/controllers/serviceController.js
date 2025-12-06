const { opsPool: pool } = require('../db');

const getServices = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createService = async (req, res) => {
    const { name, description, price, features, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO services (name, description, price, features, category, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [name, description, price, features, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateService = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, features, category } = req.body;
    try {
        const result = await pool.query(
            'UPDATE services SET name = $1, description = $2, price = $3, features = $4, category = $5 WHERE id = $6 RETURNING *',
            [name, description, price, features, category, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService
};
