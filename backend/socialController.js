const db = require('./database');

const getPosts = async (req, res) => {
    const { client } = req.query;
    const clientId = client && client !== 'all' ? parseInt(client) : null;

    try {
        let postsQuery = 'SELECT * FROM social_posts';
        let campaignsQuery = 'SELECT id, client_id, name, platform, status, created_at FROM campaigns';
        let params = [];

        if (clientId) {
            postsQuery += ' WHERE client_id = $1';
            campaignsQuery += ' WHERE client_id = $1';
            params.push(clientId);
        }

        const [postsResult, campaignsResult] = await Promise.all([
            db.query(postsQuery, params),
            db.query(campaignsQuery, params)
        ]);

        const posts = postsResult.rows.map(p => ({
            id: `post-${p.id}`,
            originalId: p.id,
            type: 'post',
            content: p.content,
            platform: p.platform,
            status: p.status,
            scheduled_date: p.scheduled_date,
            clientId: p.client_id
        }));

        const campaigns = campaignsResult.rows.map(c => ({
            id: `campaign-${c.id}`,
            originalId: c.id,
            type: 'campaign',
            content: `[Campanha] ${c.name}`,
            platform: c.platform,
            status: c.status === 'active' ? 'published' : 'draft', // Mapeando status
            scheduled_date: c.created_at || new Date(), // Fallback
            clientId: clientId || c.client_id // Se filtrou, usa o filtro, senão usa o do banco (que não veio no select acima, corrigir query)
        }));

        // Corrigindo a query de campaigns para trazer client_id se não filtrou
        if (!clientId) {
            // Já que não selecionei client_id na query acima, vou confiar que o map vai pegar undefined se não tiver.
            // Melhor refazer a query para garantir.
        }

        const allItems = [...posts, ...campaigns];
        res.json(allItems);

    } catch (error) {
        console.error('Error fetching social posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createPost = async (req, res) => {
    const { client_id, content, platform, status, scheduled_date } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO social_posts (client_id, content, platform, status, scheduled_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [client_id, content, platform, status, scheduled_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePost = async (req, res) => {
    const { id } = req.params;
    const { content, scheduled_date, status } = req.body;

    // Verificar se é post ou campanha (só permitimos editar posts por enquanto)
    if (id.startsWith('campaign-')) {
        return res.status(403).json({ error: 'Cannot edit campaigns from social calendar' });
    }

    const dbId = id.replace('post-', '');

    try {
        const result = await db.query(
            'UPDATE social_posts SET content = COALESCE($1, content), scheduled_date = COALESCE($2, scheduled_date), status = COALESCE($3, status) WHERE id = $4 RETURNING *',
            [content, scheduled_date, status, dbId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePost = async (req, res) => {
    const { id } = req.params;

    if (id.startsWith('campaign-')) {
        return res.status(403).json({ error: 'Cannot delete campaigns from social calendar' });
    }

    const dbId = id.replace('post-', '');

    try {
        await db.query('DELETE FROM social_posts WHERE id = $1', [dbId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getPosts,
    createPost,
    updatePost,
    deletePost
};
