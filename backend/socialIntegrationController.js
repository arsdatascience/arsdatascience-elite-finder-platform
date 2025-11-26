const axios = require('axios');

// Meta (Facebook + Instagram) OAuth
const initiateMetaAuth = (req, res) => {
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/meta/callback`;
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_manage_insights';

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    res.redirect(authUrl);
};

const handleMetaCallback = async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: process.env.META_APP_ID,
                client_secret: process.env.META_APP_SECRET,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/meta/callback`,
                code
            }
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
            params: {
                fields: 'id,name,accounts{instagram_business_account}',
                access_token
            }
        });

        // Save token to database (implement this based on your DB structure)
        // await saveIntegrationToken(userId, 'instagram', access_token, userResponse.data);

        res.redirect(`${process.env.FRONTEND_URL}/settings?connected=instagram`);
    } catch (error) {
        console.error('Meta OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/settings?error=meta_auth_failed`);
    }
};

// LinkedIn OAuth
const initiateLinkedInAuth = (req, res) => {
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/linkedin/callback`;
    const scope = 'r_liteprofile,w_member_social,r_organization_social';
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    res.redirect(authUrl);
};

const handleLinkedInCallback = async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/linkedin/callback`
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Save token to database
        // await saveIntegrationToken(userId, 'linkedin', access_token, userResponse.data);

        res.redirect(`${process.env.FRONTEND_URL}/settings?connected=linkedin`);
    } catch (error) {
        console.error('LinkedIn OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/settings?error=linkedin_auth_failed`);
    }
};

// Twitter OAuth 2.0
const initiateTwitterAuth = (req, res) => {
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/twitter/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access';
    const state = Math.random().toString(36).substring(7);
    const codeChallenge = 'challenge'; // In production, generate proper PKCE challenge

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_API_KEY}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

    res.redirect(authUrl);
};

const handleTwitterCallback = async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: process.env.TWITTER_API_KEY,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/twitter/callback`,
                code_verifier: 'challenge'
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`).toString('base64')}`
            }
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Save token to database
        // await saveIntegrationToken(userId, 'twitter', access_token, userResponse.data, refresh_token);

        res.redirect(`${process.env.FRONTEND_URL}/settings?connected=twitter`);
    } catch (error) {
        console.error('Twitter OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/settings?error=twitter_auth_failed`);
    }
};

// Publish to Instagram
const publishToInstagram = async (req, res) => {
    const { content, imageUrl, accessToken, instagramAccountId } = req.body;

    try {
        // Step 1: Create media container
        const containerResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
            {
                image_url: imageUrl,
                caption: content,
                access_token: accessToken
            }
        );

        const creationId = containerResponse.data.id;

        // Step 2: Publish the media
        const publishResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
            {
                creation_id: creationId,
                access_token: accessToken
            }
        );

        res.json({ success: true, postId: publishResponse.data.id });
    } catch (error) {
        console.error('Instagram publish error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to publish to Instagram', details: error.response?.data });
    }
};

// Publish to LinkedIn
const publishToLinkedIn = async (req, res) => {
    const { content, accessToken, authorId } = req.body;

    try {
        const response = await axios.post(
            'https://api.linkedin.com/v2/ugcPosts',
            {
                author: `urn:li:person:${authorId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: content
                        },
                        shareMediaCategory: 'NONE'
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            }
        );

        res.json({ success: true, postId: response.data.id });
    } catch (error) {
        console.error('LinkedIn publish error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to publish to LinkedIn', details: error.response?.data });
    }
};

// Publish to Twitter
const publishToTwitter = async (req, res) => {
    const { content, accessToken } = req.body;

    try {
        const response = await axios.post(
            'https://api.twitter.com/2/tweets',
            {
                text: content
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ success: true, tweetId: response.data.data.id });
    } catch (error) {
        console.error('Twitter publish error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to publish to Twitter', details: error.response?.data });
    }
};

// Get Instagram Insights
const getInstagramInsights = async (req, res) => {
    const { accessToken, instagramAccountId, postId } = req.query;

    try {
        const response = await axios.get(
            `https://graph.facebook.com/v18.0/${postId}/insights`,
            {
                params: {
                    metric: 'engagement,impressions,reach,saved',
                    access_token: accessToken
                }
            }
        );

        res.json({ success: true, insights: response.data.data });
    } catch (error) {
        console.error('Instagram insights error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to get Instagram insights' });
    }
};

// Get LinkedIn Analytics
const getLinkedInAnalytics = async (req, res) => {
    const { accessToken, postId } = req.query;

    try {
        const response = await axios.get(
            `https://api.linkedin.com/v2/socialActions/${postId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        res.json({ success: true, analytics: response.data });
    } catch (error) {
        console.error('LinkedIn analytics error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to get LinkedIn analytics' });
    }
};

// Get Twitter Metrics
const getTwitterMetrics = async (req, res) => {
    const { accessToken, tweetId } = req.query;

    try {
        const response = await axios.get(
            `https://api.twitter.com/2/tweets/${tweetId}`,
            {
                params: {
                    'tweet.fields': 'public_metrics'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        res.json({ success: true, metrics: response.data.data.public_metrics });
    } catch (error) {
        console.error('Twitter metrics error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to get Twitter metrics' });
    }
};

module.exports = {
    // OAuth
    initiateMetaAuth,
    handleMetaCallback,
    initiateLinkedInAuth,
    handleLinkedInCallback,
    initiateTwitterAuth,
    handleTwitterCallback,

    // Publishing
    publishToInstagram,
    publishToLinkedIn,
    publishToTwitter,

    // Analytics
    getInstagramInsights,
    getLinkedInAnalytics,
    getTwitterMetrics
};
