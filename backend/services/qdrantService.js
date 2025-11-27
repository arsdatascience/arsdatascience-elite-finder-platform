const { QdrantClient } = require('@qdrant/js-client-rest');

class QdrantService {
    constructor() {
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL || 'https://e9459d08-5654-4794-a278-b3251bfbce21.us-east4-0.gcp.cloud.qdrant.io:6333',
            apiKey: process.env.QDRANT_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.GVIPFCWOEbpQlYdhK4i0aOEZCuXIv3tNO5ALBZFjx0Q',
        });
    }

    /**
     * Lista todas as coleções disponíveis no Qdrant
     */
    async getCollections() {
        try {
            const result = await this.client.getCollections();
            return {
                success: true,
                collections: result.collections.map(col => ({
                    name: col.name,
                    vectorsCount: col.vectors_count || 0,
                    pointsCount: col.points_count || 0,
                    status: col.status || 'unknown'
                }))
            };
        } catch (error) {
            console.error('Erro ao buscar coleções do Qdrant:', error);
            return {
                success: false,
                error: error.message,
                collections: []
            };
        }
    }

    /**
     * Obtém informações detalhadas de uma coleção específica
     */
    async getCollectionInfo(collectionName) {
        try {
            const info = await this.client.getCollection(collectionName);
            return {
                success: true,
                info: {
                    name: info.name,
                    vectorsCount: info.vectors_count || 0,
                    pointsCount: info.points_count || 0,
                    status: info.status,
                    config: {
                        vectorSize: info.config?.params?.vectors?.size || 'N/A',
                        distance: info.config?.params?.vectors?.distance || 'N/A',
                        onDisk: info.config?.params?.on_disk_payload || false
                    }
                }
            };
        } catch (error) {
            console.error(`Erro ao buscar info da coleção ${collectionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Busca vetores similares em uma coleção
     */
    async searchVectors(collectionName, queryVector, limit = 5, filter = null) {
        try {
            const searchParams = {
                vector: queryVector,
                limit: limit,
                with_payload: true,
                with_vector: false
            };

            if (filter) {
                searchParams.filter = filter;
            }

            const results = await this.client.search(collectionName, searchParams);

            return {
                success: true,
                results: results.map(hit => ({
                    id: hit.id,
                    score: hit.score,
                    payload: hit.payload
                }))
            };
        } catch (error) {
            console.error(`Erro ao buscar vetores em ${collectionName}:`, error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Adiciona pontos (vetores) a uma coleção
     */
    async upsertPoints(collectionName, points) {
        try {
            await this.client.upsert(collectionName, {
                points: points
            });

            return {
                success: true,
                message: `${points.length} ponto(s) adicionado(s) com sucesso`
            };
        } catch (error) {
            console.error(`Erro ao adicionar pontos em ${collectionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cria uma nova coleção
     */
    async createCollection(collectionName, vectorSize, distance = 'Cosine') {
        try {
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distance
                }
            });

            return {
                success: true,
                message: `Coleção '${collectionName}' criada com sucesso`
            };
        } catch (error) {
            console.error(`Erro ao criar coleção ${collectionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deleta uma coleção
     */
    async deleteCollection(collectionName) {
        try {
            await this.client.deleteCollection(collectionName);
            return {
                success: true,
                message: `Coleção '${collectionName}' deletada com sucesso`
            };
        } catch (error) {
            console.error(`Erro ao deletar coleção ${collectionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Testa a conexão com o Qdrant
     */
    async testConnection() {
        try {
            await this.client.getCollections();
            return {
                success: true,
                message: 'Conexão com Qdrant estabelecida com sucesso'
            };
        } catch (error) {
            console.error('Erro ao testar conexão com Qdrant:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new QdrantService();
