const db = require('./db'); // assuming you have a db module for queries

// Get all social accounts for a client
const getSocialAccounts = async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM social_accounts WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId]
        );
        res.json({ success: true, accounts: result.rows });
    } catch (err) {
        console.error('Error fetching social accounts:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Add a new social account (after OAuth flow you will have tokens)
const addSocialAccount = async (req, res) => {
    const { clientId, platform, external_account_id, access_token, refresh_token, expires_at } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO social_accounts (client_id, platform, external_account_id, access_token, refresh_token, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [clientId, platform, external_account_id, access_token, refresh_token, expires_at]
        );
        res.json({ success: true, account: result.rows[0] });
    } catch (err) {
        console.error('Error adding social account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Update tokens (refresh flow)
const updateSocialAccountTokens = async (req, res) => {
    const { accountId } = req.params;
    const { access_token, refresh_token, expires_at } = req.body;
    try {
        const result = await db.query(
            `UPDATE social_accounts SET access_token=$1, refresh_token=$2, expires_at=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
            [access_token, refresh_token, expires_at, accountId]
        );
        res.json({ success: true, account: result.rows[0] });
    } catch (err) {
        console.error('Error updating social account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Delete an account (disconnect)
const deleteSocialAccount = async (req, res) => {
    const { accountId } = req.params;
    try {
        await db.query('DELETE FROM social_accounts WHERE id=$1', [accountId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting social account:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = {
    getSocialAccounts,
    addSocialAccount,
    updateSocialAccountTokens,
    deleteSocialAccount,
};
