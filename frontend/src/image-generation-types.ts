export interface GeneratedImage {
    id: string;
    url: string;
    thumbnailUrl: string;
    prompt: string;
    negativePrompt?: string;
    model: string;
    width: number;
    height: number;
    createdAt: string;
    userId?: string;
}

export interface ImageModel {
    id: string;
    name: string;
    description: string;
    speed: 'ultra-fast' | 'fast' | 'medium' | 'slow';
    quality: 'good' | 'great' | 'excellent';
    free: boolean;
}

export interface GenerateImageRequest {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    model?: string;
}

export interface GenerateImageResponse {
    success: boolean;
    data: GeneratedImage;
}
