const axios = require('axios');

const publishToInstagram = async (instagramAccountId, accessToken, content, imageUrl) => {
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

    return { postId: publishResponse.data.id };
};

const publishToLinkedIn = async (authorId, accessToken, content) => {
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

    return { postId: response.data.id };
};

const publishToTwitter = async (accessToken, content) => {
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

    return { tweetId: response.data.data.id };
};

module.exports = {
    publishToInstagram,
    publishToLinkedIn,
    publishToTwitter
};
