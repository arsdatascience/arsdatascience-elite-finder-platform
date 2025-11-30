const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const saveSocialPost = async (postData: any) => {
    const formData = new FormData();

    formData.append('platform', postData.platform);
    formData.append('content', postData.content);
    formData.append('type', postData.type);

    if (postData.scheduledDate && postData.scheduledTime) {
        const scheduledAt = new Date(`${postData.scheduledDate}T${postData.scheduledTime}`);
        formData.append('scheduled_at', scheduledAt.toISOString());
        formData.append('status', 'scheduled');
    } else {
        formData.append('status', 'draft');
    }

    if (postData.image) {
        formData.append('media', postData.image);
    } else if (postData.imageUrl) {
        formData.append('media_url', postData.imageUrl);
    }

    // Default client ID for now
    formData.append('client_id', '1');

    try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/social-posts`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to save post');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving post:', error);
        throw error;
    }
};
