const qdrantService = require('../backend/services/qdrantService');

async function initQdrant() {
    console.log('🚀 Initializing Qdrant Collections...');

    try {
        // 1. Test Connection
        const connection = await qdrantService.testConnection();
        if (!connection.success) {
            console.error('❌ Failed to connect to Qdrant:', connection.error);
            process.exit(1);
        }
        console.log('✅ Connected to Qdrant');

        // 2. Check and Create 'marketing_strategies' Collection
        const collectionName = 'marketing_strategies';
        const collectionInfo = await qdrantService.getCollectionInfo(collectionName);

        if (!collectionInfo.success) {
            console.log(`⚠️ Collection '${collectionName}' not found. Creating...`);

            // Vector size 1536 is standard for OpenAI text-embedding-3-small
            const createResult = await qdrantService.createCollection(collectionName, 1536, 'Cosine');

            if (createResult.success) {
                console.log(`✅ Collection '${collectionName}' created successfully.`);
            } else {
                console.error(`❌ Failed to create collection '${collectionName}':`, createResult.error);
            }
        } else {
            console.log(`✅ Collection '${collectionName}' already exists.`);
        }

    } catch (error) {
        console.error('❌ Unexpected error during Qdrant initialization:', error);
        process.exit(1);
    }
}

initQdrant();
