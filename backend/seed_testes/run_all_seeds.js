/**
 * SEED PRINCIPAL - Executa todos os seeds de teste
 * Popula o banco com dados sintéticos de 5 verticais de negócio
 * 
 * Uso: node seed_testes/run_all_seeds.js
 */

const seedEcommerce = require('./seed_ecommerce');
const seedEstetica = require('./seed_estetica');
const seedVarejo = require('./seed_varejo');
const seedBensConsumo = require('./seed_bens_consumo');
const seedTecnologia = require('./seed_tecnologia');

const runAllSeeds = async () => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   🌱 ELITE FINDER - SEEDS DE DADOS SINTÉTICOS');
    console.log('   Populando banco com dados de 5 verticais de negócio');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const startTime = Date.now();
    const results = {};

    try {
        // 1. E-Commerce
        console.log('📦 [1/5] E-COMMERCE');
        console.log('─────────────────────────────────────────────────────────────────');
        results.ecommerce = await seedEcommerce();

        // 2. Clínica de Estética
        console.log('💆 [2/5] CLÍNICA DE ESTÉTICA');
        console.log('─────────────────────────────────────────────────────────────────');
        results.estetica = await seedEstetica();

        // 3. Varejo
        console.log('🏪 [3/5] VAREJO');
        console.log('─────────────────────────────────────────────────────────────────');
        results.varejo = await seedVarejo();

        // 4. Bens de Consumo
        console.log('📦 [4/5] BENS DE CONSUMO (CPG)');
        console.log('─────────────────────────────────────────────────────────────────');
        results.bensConsumo = await seedBensConsumo();

        // 5. Tecnologia/Serviços
        console.log('💻 [5/5] TECNOLOGIA/SERVIÇOS');
        console.log('─────────────────────────────────────────────────────────────────');
        results.tecnologia = await seedTecnologia();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('   ✅ SEEDS CONCLUÍDOS COM SUCESSO!');
        console.log(`   ⏱️  Tempo total: ${elapsed} segundos`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n📊 RESUMO:');
        console.log('───────────────────────────────────────────────────────────────');
        console.log(`   E-Commerce:      Tenant ID ${results.ecommerce?.tenantId}, ${results.ecommerce?.clientIds?.length || 0} clientes`);
        console.log(`   Estética:        Tenant ID ${results.estetica?.tenantId}, ${results.estetica?.clientIds?.length || 0} clientes`);
        console.log(`   Varejo:          Tenant ID ${results.varejo?.tenantId}, ${results.varejo?.clientIds?.length || 0} clientes`);
        console.log(`   Bens Consumo:    Tenant ID ${results.bensConsumo?.tenantId}, ${results.bensConsumo?.clientIds?.length || 0} clientes`);
        console.log(`   Tecnologia:      Tenant ID ${results.tecnologia?.tenantId}, ${results.tecnologia?.clientIds?.length || 0} clientes`);
        console.log('───────────────────────────────────────────────────────────────\n');

        return results;

    } catch (error) {
        console.error('\n❌ ERRO DURANTE EXECUÇÃO DOS SEEDS:');
        console.error(error);
        process.exit(1);
    }
};

// Executar se chamado diretamente
if (require.main === module) {
    runAllSeeds()
        .then(() => {
            console.log('👋 Finalizando...\n');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Erro fatal:', err);
            process.exit(1);
        });
}

module.exports = runAllSeeds;
