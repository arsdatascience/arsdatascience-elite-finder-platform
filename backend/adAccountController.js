const db = require('./db');

// Get all ad accounts for a client
const getAdAccounts = async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM ad_accounts WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId]
        );
        res.json({ success: true, accounts: result.rows });
    } catch (err) {
        console.error('Error fetching ad accounts:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Add a new ad account (after OAuth flow you will have tokens)
const addAdAccount = async (req, res) => {
    const { clientId, platform, external_account_id, access_token, refresh_token, expires_at } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO ad_accounts (client_id, platform, external_account_id, access_token, refresh_token, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [clientId, platform, external_account_id, access_token, refresh_token, expires_at]
        );
        res.json({ success: true, account: result.rows[0] });
    } catch (err) {
        console.error('Error adding ad account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Update tokens (refresh flow)
const updateAdAccountTokens = async (req, res) => {
    const { accountId } = req.params;
    const { access_token, refresh_token, expires_at } = req.body;
    try {
        const result = await db.query(
            `UPDATE ad_accounts SET access_token=$1, refresh_token=$2, expires_at=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
            [access_token, refresh_token, expires_at, accountId]
        );
        res.json({ success: true, account: result.rows[0] });
    } catch (err) {
        console.error('Error updating ad account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Delete an ad account (disconnect)
const deleteAdAccount = async (req, res) => {
    const { accountId } = req.params;
    try {
        await db.query('DELETE FROM ad_accounts WHERE id=$1', [accountId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting ad account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = {
    getAdAccounts,
    addAdAccount,
    updateAdAccountTokens,
    deleteAdAccount,
};
