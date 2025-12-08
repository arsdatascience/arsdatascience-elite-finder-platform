import React, { useState } from 'react';
import {
    TrendingUp, Target, Users, Clock, ChevronDown, ChevronRight,
    Zap, Brain, BarChart3, Activity,
    CheckCircle, XCircle, Info, Star, Search, Settings
} from 'lucide-react';
import AlgorithmConfigModal, { ALGORITHM_CONFIGS } from './AlgorithmConfigModal';

interface Algorithm {
    id: string;
    name: string;
    category: 'regression' | 'classification' | 'clustering' | 'timeseries';
    description: string;
    whenToUse: string[];
    useCases: string[];
    advantages: string[];
    disadvantages: string[];
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    speed: 'instant' | 'fast' | 'moderate' | 'slow' | 'very_slow';
    precision: string;
    hyperparameters?: { name: string; description: string; range: string }[];
}

const ALGORITHMS: Algorithm[] = [
    // REGRESSION
    {
        id: 'linear_regression',
        name: 'Linear Regression',
        category: 'regression',
        description: 'Modelo estatístico que prevê valores criando uma linha reta que melhor se ajusta aos dados históricos. Equação: y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ',
        whenToUse: [
            'Relação linear entre variáveis',
            'Dados sem muitos outliers',
            'Interpretabilidade importante',
            'Baseline rápido'
        ],
        useCases: ['Prever receita baseado em marketing', 'Estimar tráfego', 'Calcular CLV', 'Projetar crescimento'],
        advantages: ['Rápido', 'Fácil interpretar', 'Baixa memória', 'Funciona com poucos dados'],
        disadvantages: ['Assume linearidade', 'Sensível a outliers', 'Performance ruim com relações não-lineares'],
        complexity: 'low',
        speed: 'instant',
        precision: 'R² ~0.70-0.85',
        hyperparameters: [
            { name: 'fit_intercept', description: 'Calcular intercepto', range: 'true/false' },
            { name: 'normalize', description: 'Normalizar features', range: 'true/false' }
        ]
    },
    {
        id: 'ridge_regression',
        name: 'Ridge Regression',
        category: 'regression',
        description: 'Versão melhorada da regressão linear com regularização L2 para evitar overfitting. Minimiza: ∑(y - ŷ)² + α∑β²',
        whenToUse: [
            'Muitas features correlacionadas',
            'Prevenir overfitting',
            'Dataset pequeno com muitas variáveis',
            'Features redundantes'
        ],
        useCases: ['Atribuição multi-canal', 'Prever conversões', 'Análise de sentimento', 'ROI multi-touch'],
        advantages: ['Reduz overfitting', 'Funciona com features correlacionadas', 'Mantém todas features', 'Estável'],
        disadvantages: ['Menos interpretável', 'Requer tuning de α', 'Não faz seleção de features'],
        complexity: 'medium',
        speed: 'fast',
        precision: 'R² ~0.75-0.88',
        hyperparameters: [
            { name: 'alpha', description: 'Força da regularização', range: '0.1 a 100' }
        ]
    },
    {
        id: 'lasso_regression',
        name: 'Lasso Regression',
        category: 'regression',
        description: 'Regressão com regularização L1 que elimina features irrelevantes zerando coeficientes. Faz seleção automática de variáveis.',
        whenToUse: [
            'Suspeita de features irrelevantes',
            'Quer simplificar modelo',
            'Interpretabilidade crítica',
            'Feature selection automática'
        ],
        useCases: ['Identificar canais importantes', 'Descobrir métricas-chave', 'Simplificar dashboards', 'Reduzir coleta de dados'],
        advantages: ['Seleção automática de features', 'Modelo simples', 'Elimina ruído', 'Reduz overfitting'],
        disadvantages: ['Pode eliminar features importantes', 'Instável com features correlacionadas', 'Escolhe arbitrariamente entre features similares'],
        complexity: 'medium',
        speed: 'fast',
        precision: 'R² ~0.73-0.86',
        hyperparameters: [
            { name: 'alpha', description: 'Força da seleção', range: '0.1 a 10' }
        ]
    },
    {
        id: 'elasticnet',
        name: 'ElasticNet Regression',
        category: 'regression',
        description: 'Combinação de Ridge + Lasso que balanceia as vantagens de ambos. Ratio L1/L2 controla comportamento.',
        whenToUse: [
            'Features correlacionadas + irrelevantes',
            'Quer seleção de features mais estável',
            'Melhor de dois mundos',
            'Muitas features (>100)'
        ],
        useCases: ['Atribuição multi-canal com redundância', 'Modelos de mix de marketing', 'Previsão com múltiplas fontes'],
        advantages: ['Mais estável que Lasso', 'Mantém grupos correlacionados', 'Faz seleção de features', 'Flexível'],
        disadvantages: ['Dois hiperparâmetros', 'Mais lento', 'Requer mais dados'],
        complexity: 'medium',
        speed: 'moderate',
        precision: 'R² ~0.76-0.88',
        hyperparameters: [
            { name: 'alpha', description: 'Força total da regularização', range: '0.1-10' },
            { name: 'l1_ratio', description: 'Mix L1/L2', range: '0-1' }
        ]
    },
    {
        id: 'random_forest_regressor',
        name: 'Random Forest Regressor',
        category: 'regression',
        description: 'Ensemble de múltiplas árvores de decisão que votam para dar a previsão final. Cada árvore treina com subset aleatório.',
        whenToUse: [
            'Relações não-lineares complexas',
            'Interações entre features',
            'Dados com outliers',
            'Não quer feature engineering'
        ],
        useCases: ['Prever LTV complexo', 'Scoring de leads', 'Previsão de churn', 'Otimização de lances'],
        advantages: ['Captura não-linearidades', 'Robusto a outliers', 'Feature importance built-in', 'Pouco overfitting'],
        disadvantages: ['Difícil interpretar', 'Mais lento', 'Maior uso de memória'],
        complexity: 'high',
        speed: 'slow',
        precision: 'R² ~0.82-0.92',
        hyperparameters: [
            { name: 'n_estimators', description: 'Número de árvores', range: '100-500' },
            { name: 'max_depth', description: 'Profundidade máxima', range: '5-20' }
        ]
    },
    {
        id: 'xgboost_regressor',
        name: 'XGBoost Regressor',
        category: 'regression',
        description: 'Algoritmo de boosting que constrói árvores sequencialmente, cada uma corrigindo erros da anterior. Estado-da-arte.',
        whenToUse: [
            'Máxima precisão é crítica',
            'Dados tabulares estruturados',
            'Features numéricas e categóricas',
            'Competições / produção séria'
        ],
        useCases: ['Previsão de vendas de alta precisão', 'Otimização de budget', 'Scoring avançado', 'Previsão de churn'],
        advantages: ['Melhor precisão', 'Lida com missing values', 'Regularização built-in', 'Paralelização eficiente'],
        disadvantages: ['Muitos hiperparâmetros', 'Requer tuning cuidadoso', 'Difícil interpretar'],
        complexity: 'very_high',
        speed: 'moderate',
        precision: 'R² ~0.85-0.93',
        hyperparameters: [
            { name: 'n_estimators', description: 'Número de árvores', range: '100-1000' },
            { name: 'learning_rate', description: 'Taxa de aprendizado', range: '0.01-0.3' },
            { name: 'max_depth', description: 'Profundidade', range: '3-10' }
        ]
    },
    {
        id: 'lightgbm_regressor',
        name: 'LightGBM Regressor',
        category: 'regression',
        description: 'Variante do Gradient Boosting otimizada para velocidade e datasets grandes. 10-20x mais rápido que XGBoost.',
        whenToUse: [
            'Datasets grandes (>100k linhas)',
            'Muitas features (>50)',
            'Velocidade é importante',
            'Recursos limitados'
        ],
        useCases: ['Análise de milhões de eventos GA4', 'CRM grande', 'Real-time bidding', 'Histórico longo'],
        advantages: ['Extremamente rápido', 'Baixo uso de memória', 'Precisão similar ao XGBoost', 'Suporta GPU'],
        disadvantages: ['Pode overfit em datasets pequenos', 'Sensível a hiperparâmetros', 'Menos estável'],
        complexity: 'very_high',
        speed: 'fast',
        precision: 'R² ~0.85-0.92'
    },
    {
        id: 'gradient_boosting',
        name: 'Gradient Boosting Regressor',
        category: 'regression',
        description: 'Implementação clássica de Gradient Boosting do scikit-learn. Predecessor do XGBoost/LightGBM.',
        whenToUse: [
            'Ambiente Python puro',
            'Dataset pequeno-médio',
            'Não quer libs externas',
            'Simplicidade > Performance'
        ],
        useCases: ['Prototipagem rápida', 'Ambientes restritos', 'Ensino de ML'],
        advantages: ['Built-in no scikit-learn', 'API simples', 'Sem dependências'],
        disadvantages: ['Mais lento que XGBoost', 'Menos features avançadas', 'Não paraleliza bem'],
        complexity: 'high',
        speed: 'very_slow',
        precision: 'R² ~0.80-0.88'
    },
    // CLASSIFICATION
    {
        id: 'logistic_regression',
        name: 'Logistic Regression',
        category: 'classification',
        description: 'Modelo linear que prevê probabilidades de classes usando função sigmoide. Apesar do nome, é um classificador.',
        whenToUse: [
            'Classificação binária',
            'Precisa de probabilidades',
            'Interpretabilidade crítica',
            'Baseline rápido'
        ],
        useCases: ['Churn prediction', 'Lead scoring', 'Email marketing', 'Click prediction'],
        advantages: ['Retorna probabilidades calibradas', 'Fácil interpretar', 'Rápido', 'Funciona com poucos dados'],
        disadvantages: ['Assume linearidade', 'Performance ruim com relações complexas', 'Sensível a features não normalizadas'],
        complexity: 'low',
        speed: 'instant',
        precision: 'AUC ~0.70-0.82',
        hyperparameters: [
            { name: 'C', description: 'Inverso da regularização', range: '0.1-10' },
            { name: 'penalty', description: 'Tipo de regularização', range: 'l1, l2, elasticnet' }
        ]
    },
    {
        id: 'decision_tree',
        name: 'Decision Tree Classifier',
        category: 'classification',
        description: 'Árvore de decisões que faz perguntas sequenciais sobre as features até chegar em uma classe. Muito interpretável.',
        whenToUse: [
            'Interpretabilidade máxima',
            'Features categóricas e numéricas',
            'Não quer pré-processamento',
            'Explicar decisões para stakeholders'
        ],
        useCases: ['Regras de segmentação', 'Decision flows', 'Qualificação de leads', 'A/B test analysis'],
        advantages: ['Fácil visualizar e explicar', 'Não precisa normalizar', 'Captura não-linearidades', 'Feature importance'],
        disadvantages: ['Muito propenso a overfitting', 'Instável', 'Performance inferior a ensemble'],
        complexity: 'medium',
        speed: 'fast',
        precision: 'AUC ~0.68-0.78'
    },
    {
        id: 'random_forest_classifier',
        name: 'Random Forest Classifier',
        category: 'classification',
        description: 'Ensemble de múltiplas Decision Trees que votam na classe final. Versão robusta e precisa.',
        whenToUse: [
            'Quer precisão alta sem muito tuning',
            'Dados com outliers ou ruído',
            'Features categóricas e numéricas',
            'Não linear e complexo'
        ],
        useCases: ['Churn prediction', 'Lead scoring multi-classe', 'Propensão de compra', 'Segmentação comportamental'],
        advantages: ['Muito preciso', 'Robusto a overfitting', 'Lida com outliers', 'Feature importance confiável'],
        disadvantages: ['Menos interpretável', 'Mais lento', 'Maior uso de memória'],
        complexity: 'high',
        speed: 'moderate',
        precision: 'AUC ~0.82-0.89'
    },
    {
        id: 'xgboost_classifier',
        name: 'XGBoost Classifier',
        category: 'classification',
        description: 'Versão de classificação do XGBoost. Estado-da-arte para problemas de classificação em dados tabulares.',
        whenToUse: [
            'Máxima precisão obrigatória',
            'Competições / produção crítica',
            'Dados desbalanceados',
            'Features numéricas estruturadas'
        ],
        useCases: ['Churn de alta performance', 'Fraud detection', 'Lead scoring avançado', 'Conversão de campanhas'],
        advantages: ['Melhor precisão', 'Lida com dados desbalanceados', 'Regularização built-in', 'Early stopping'],
        disadvantages: ['Muitos hiperparâmetros', 'Requer conhecimento avançado', 'Difícil interpretar'],
        complexity: 'very_high',
        speed: 'moderate',
        precision: 'AUC ~0.88-0.94'
    },
    {
        id: 'lightgbm_classifier',
        name: 'LightGBM Classifier',
        category: 'classification',
        description: 'Versão otimizada de Gradient Boosting para velocidade extrema mantendo alta precisão.',
        whenToUse: [
            'Datasets grandes (>100k)',
            'Muitas features (>100)',
            'Velocidade crítica (real-time)',
            'Recursos limitados'
        ],
        useCases: ['Real-time lead scoring', 'Click prediction em escala', 'Segmentação de milhões', 'Fraud detection real-time'],
        advantages: ['Extremamente rápido', 'Baixo uso de memória', 'Precisão similar ao XGBoost', 'Suporta GPU'],
        disadvantages: ['Pode overfit em datasets pequenos', 'Menos estável', 'Requer mais tuning'],
        complexity: 'very_high',
        speed: 'fast',
        precision: 'AUC ~0.86-0.93'
    },
    {
        id: 'naive_bayes',
        name: 'Naive Bayes',
        category: 'classification',
        description: 'Classificador probabilístico baseado no Teorema de Bayes. Assume independência entre features (naive).',
        whenToUse: [
            'Text classification',
            'Features categóricas ou binárias',
            'Dataset pequeno',
            'Baseline rápido'
        ],
        useCases: ['Spam detection', 'Sentiment analysis', 'Classificação de tickets', 'Categorização de conteúdo'],
        advantages: ['Muito rápido', 'Funciona com poucos dados', 'Simples', 'Eficiente com alta dimensionalidade'],
        disadvantages: ['Assume independência', 'Performance inferior', 'Ruim com features numéricas'],
        complexity: 'low',
        speed: 'instant',
        precision: 'Accuracy ~0.75-0.88'
    },
    {
        id: 'svm',
        name: 'Support Vector Machine',
        category: 'classification',
        description: 'Encontra o hiperplano ótimo que separa as classes com máxima margem. Pode usar kernel trick.',
        whenToUse: [
            'Datasets pequenos-médios (<10k)',
            'Alta dimensionalidade',
            'Fronteira de decisão clara',
            'Outliers não são problema'
        ],
        useCases: ['Classificação de imagens', 'Detecção de fraude', 'Segmentação clara', 'Text classification'],
        advantages: ['Efetivo em alta dimensionalidade', 'Funciona com poucos dados', 'Kernels permitem não-linearidade'],
        disadvantages: ['Muito lento em datasets grandes', 'Difícil interpretar', 'Sensível a escala'],
        complexity: 'high',
        speed: 'slow',
        precision: 'Accuracy ~0.78-0.86'
    },
    // CLUSTERING
    {
        id: 'kmeans',
        name: 'K-Means',
        category: 'clustering',
        description: 'Agrupa dados em K clusters minimizando distância de cada ponto ao centróide do cluster.',
        whenToUse: [
            'Sabe quantos grupos quer',
            'Clusters esféricos/compactos',
            'Dataset grande',
            'Segmentação simples'
        ],
        useCases: ['Segmentação RFM', 'Persona clusters', 'Segmentação geográfica', 'Agrupamento de produtos'],
        advantages: ['Muito rápido', 'Simples de entender', 'Escala bem', 'Funciona com clusters esféricos'],
        disadvantages: ['Precisa definir K', 'Sensível a outliers', 'Assume clusters esféricos', 'Resultados variam'],
        complexity: 'medium',
        speed: 'fast',
        precision: 'Silhouette >0.5 = bom'
    },
    {
        id: 'dbscan',
        name: 'DBSCAN',
        category: 'clustering',
        description: 'Agrupa pontos densamente conectados e identifica outliers automaticamente. Não precisa definir K.',
        whenToUse: [
            'Não sabe quantos clusters',
            'Clusters de formas irregulares',
            'Precisa detectar outliers',
            'Densidade variável'
        ],
        useCases: ['Detecção de fraude', 'Segmentação geográfica', 'Comportamento anômalo', 'Grupos naturais'],
        advantages: ['Não precisa definir K', 'Detecta outliers', 'Funciona com formas complexas', 'Robusto a ruído'],
        disadvantages: ['Sensível a hiperparâmetros', 'Ruim com densidades variadas', 'Não escala bem'],
        complexity: 'high',
        speed: 'slow',
        precision: 'Depende do dataset'
    },
    {
        id: 'hierarchical',
        name: 'Hierarchical Clustering',
        category: 'clustering',
        description: 'Cria hierarquia de clusters (árvore/dendrograma) agregando pontos similares progressivamente.',
        whenToUse: [
            'Quer visualizar hierarquia',
            'Número de clusters incerto',
            'Dataset pequeno (<5k)',
            'Relações hierárquicas fazem sentido'
        ],
        useCases: ['Taxonomia de produtos', 'Segmentação hierárquica', 'Análise de mercado', 'Customer journey'],
        advantages: ['Dendrograma visual', 'Não precisa definir K', 'Determinístico', 'Mostra relações'],
        disadvantages: ['Muito lento', 'Não escala', 'Decisões irreversíveis', 'Alto uso de memória'],
        complexity: 'very_high',
        speed: 'very_slow',
        precision: 'Boa + Visual'
    },
    // TIME SERIES
    {
        id: 'prophet',
        name: 'Prophet (Facebook)',
        category: 'timeseries',
        description: 'Modelo desenvolvido pelo Facebook para séries temporais com sazonalidade, feriados e outliers.',
        whenToUse: [
            'Dados com sazonalidade forte',
            'Efeitos de feriados',
            'Dados com missing/outliers',
            'Intervalos de confiança'
        ],
        useCases: ['Previsão de vendas', 'Tráfego do site', 'Demanda sazonal', 'Forecast de leads'],
        advantages: ['Robusto a dados problemáticos', 'Lida com sazonalidade', 'Feriados fáceis', 'Intervalos de confiança'],
        disadvantages: ['Mais lento que ARIMA', 'Pode ser demais para séries simples', 'Requer instalação extra'],
        complexity: 'medium',
        speed: 'moderate',
        precision: 'MAPE ~5-12%'
    },
    {
        id: 'arima',
        name: 'ARIMA',
        category: 'timeseries',
        description: 'Modelo estatístico clássico que usa valores passados e erros passados para prever futuros. ARIMA(p,d,q).',
        whenToUse: [
            'Série temporal estacionária',
            'Padrões de curto prazo',
            'Poucos dados (<365)',
            'Quer modelo estatístico clássico'
        ],
        useCases: ['Previsão de tráfego diário', 'KPIs estáveis', 'Métricas sem sazonalidade', 'Forecasts curtos'],
        advantages: ['Modelo estatístico robusto', 'Funciona com séries simples', 'Rápido', 'Interpretável'],
        disadvantages: ['Difícil escolher p,d,q', 'Assume estacionariedade', 'Não lida com sazonalidade complexa'],
        complexity: 'high',
        speed: 'fast',
        precision: 'MAPE ~6-15%'
    },
    {
        id: 'sarima',
        name: 'SARIMA',
        category: 'timeseries',
        description: 'Extensão do ARIMA que adiciona componentes sazonais. SARIMA(p,d,q)(P,D,Q,s).',
        whenToUse: [
            'Série com sazonalidade clara',
            'Padrão repetitivo',
            'Mais controle que Prophet',
            'Dados históricos suficientes'
        ],
        useCases: ['Vendas com padrão semanal', 'Tráfego mensal', 'Leads trimestrais', 'Demanda anual'],
        advantages: ['Captura sazonalidade', 'Mais flexível que ARIMA', 'Modelo estatístico robusto'],
        disadvantages: ['7 parâmetros para escolher', 'Requer muitos dados', 'Lento', 'Sensível a configuração'],
        complexity: 'very_high',
        speed: 'slow',
        precision: 'MAPE ~5-10%'
    },
    {
        id: 'exponential_smoothing',
        name: 'Exponential Smoothing',
        category: 'timeseries',
        description: 'Família de modelos que dá pesos maiores para observações recentes. Variantes: Simple, Holt, Holt-Winters.',
        whenToUse: [
            'Forecast de curto prazo (1-7 dias)',
            'Série sem sazonalidade complexa',
            'Precisa de velocidade',
            'Baseline rápido'
        ],
        useCases: ['Inventário', 'Demanda curto prazo', 'KPIs estáveis', 'Alertas de anomalias'],
        advantages: ['Muito rápido', 'Simples', 'Funciona para curto prazo', 'Baixa memória'],
        disadvantages: ['Ruim para longo prazo', 'Não captura sazonalidade complexa', 'Poucos parâmetros'],
        complexity: 'medium',
        speed: 'instant',
        precision: 'MAPE ~8-15%'
    }
];

const CATEGORIES = [
    { id: 'regression', name: 'Regressão', icon: TrendingUp, color: 'blue', description: 'Prever valores numéricos contínuos' },
    { id: 'classification', name: 'Classificação', icon: Target, color: 'green', description: 'Prever categorias' },
    { id: 'clustering', name: 'Clustering', icon: Users, color: 'purple', description: 'Agrupar dados similares' },
    { id: 'timeseries', name: 'Time Series', icon: Clock, color: 'amber', description: 'Prever valores futuros' }
];

const getComplexityBadge = (complexity: string) => {
    const badges: Record<string, { color: string; label: string }> = {
        low: { color: 'bg-green-500/20 text-green-400', label: '🟢 Baixa' },
        medium: { color: 'bg-yellow-500/20 text-yellow-400', label: '🟡 Média' },
        high: { color: 'bg-orange-500/20 text-orange-400', label: '🔴 Alta' },
        very_high: { color: 'bg-red-500/20 text-red-400', label: '🔴🔴 Muito Alta' }
    };
    return badges[complexity] || badges.medium;
};

const getSpeedBadge = (speed: string) => {
    const badges: Record<string, { color: string; label: string }> = {
        instant: { color: 'bg-green-500/20 text-green-400', label: '⚡⚡⚡ Instantânea' },
        fast: { color: 'bg-green-500/20 text-green-400', label: '⚡⚡ Rápida' },
        moderate: { color: 'bg-yellow-500/20 text-yellow-400', label: '⚡ Moderada' },
        slow: { color: 'bg-orange-500/20 text-orange-400', label: '🐌 Lenta' },
        very_slow: { color: 'bg-red-500/20 text-red-400', label: '🐌🐌 Muito Lenta' }
    };
    return badges[speed] || badges.moderate;
};

const AlgorithmCard: React.FC<{ algorithm: Algorithm; isExpanded: boolean; onToggle: () => void; onConfigure: () => void }> = ({
    algorithm, isExpanded, onToggle, onConfigure
}) => {
    const complexityBadge = getComplexityBadge(algorithm.complexity);
    const speedBadge = getSpeedBadge(algorithm.speed);
    const hasConfig = ALGORITHM_CONFIGS[algorithm.id] !== undefined;

    return (
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition"
            >
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <div className="text-left">
                        <h3 className="font-semibold text-white">{algorithm.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-1">{algorithm.description.substring(0, 80)}...</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${complexityBadge.color}`}>
                        {complexityBadge.label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${speedBadge.color}`}>
                        {speedBadge.label}
                    </span>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
            </button>

            {isExpanded && (
                <div className="p-4 pt-0 border-t border-gray-700 space-y-4">
                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Descrição
                        </h4>
                        <p className="text-sm text-gray-400">{algorithm.description}</p>
                    </div>

                    {/* When to Use */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" /> Quando Usar
                        </h4>
                        <ul className="grid grid-cols-2 gap-2">
                            {algorithm.whenToUse.map((item, i) => (
                                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                    <span className="text-green-400">✅</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Use Cases */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" /> Casos de Uso no Marketing
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {algorithm.useCases.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Vantagens
                            </h4>
                            <ul className="space-y-1">
                                {algorithm.advantages.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                        <span>✅</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> Desvantagens
                            </h4>
                            <ul className="space-y-1">
                                {algorithm.disadvantages.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                        <span>❌</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Hyperparameters */}
                    {algorithm.hyperparameters && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" /> Hiperparâmetros Principais
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 text-left">
                                            <th className="pb-2">Parâmetro</th>
                                            <th className="pb-2">Descrição</th>
                                            <th className="pb-2">Range</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300">
                                        {algorithm.hyperparameters.map((hp, i) => (
                                            <tr key={i} className="border-t border-gray-700">
                                                <td className="py-2 font-mono text-primary">{hp.name}</td>
                                                <td className="py-2">{hp.description}</td>
                                                <td className="py-2 text-gray-400">{hp.range}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Metrics & Configure Button */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Precisão:</span>
                            <span className="text-sm font-medium text-white">🎯 {algorithm.precision}</span>
                        </div>
                        {hasConfig && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onConfigure(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition"
                            >
                                <Settings className="w-4 h-4" />
                                Configurar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MLAlgorithmsGuide: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedAlgorithm, setExpandedAlgorithm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [configModalAlgorithm, setConfigModalAlgorithm] = useState<string | null>(null);

    const filteredAlgorithms = ALGORITHMS.filter(alg => {
        const matchesCategory = !selectedCategory || alg.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            alg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alg.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            regression: 'from-blue-600 to-blue-800',
            classification: 'from-green-600 to-green-800',
            clustering: 'from-purple-600 to-purple-800',
            timeseries: 'from-amber-600 to-amber-800'
        };
        return colors[category] || 'from-gray-600 to-gray-800';
    };

    return (
        <div className="p-6 space-y-6 min-h-screen bg-gray-900">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Brain className="w-8 h-8 text-primary" />
                    Guia Completo de Algoritmos ML
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Documentação técnica de todos os algoritmos disponíveis no Elite Finder.
                    Escolha o melhor para seu caso de uso.
                </p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar algoritmo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const count = ALGORITHMS.filter(a => a.category === cat.id).length;
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                            className={`p-4 rounded-xl border transition-all ${isSelected
                                ? `bg-gradient-to-br ${getCategoryColor(cat.id)} border-transparent`
                                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                            <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {cat.name}
                            </h3>
                            <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                {count} algoritmos
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Quick Reference */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Guia Rápido de Seleção
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                        <h3 className="font-medium text-blue-400">📈 Previsão de Vendas</h3>
                        <ol className="text-gray-400 list-decimal list-inside">
                            <li>Prophet (primeiro)</li>
                            <li>XGBoost (máxima precisão)</li>
                            <li>SARIMA (sazonalidade clara)</li>
                        </ol>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium text-green-400">🔮 Churn Prediction</h3>
                        <ol className="text-gray-400 list-decimal list-inside">
                            <li>XGBoost Classifier</li>
                            <li>LightGBM (dataset grande)</li>
                            <li>Random Forest</li>
                        </ol>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium text-purple-400">👥 Segmentação</h3>
                        <ol className="text-gray-400 list-decimal list-inside">
                            <li>K-Means (primeiro)</li>
                            <li>DBSCAN (formas irregulares)</li>
                            <li>Hierarchical (hierarquia)</li>
                        </ol>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium text-amber-400">🎯 Lead Scoring</h3>
                        <ol className="text-gray-400 list-decimal list-inside">
                            <li>XGBoost (máxima precisão)</li>
                            <li>Logistic (interpretável)</li>
                            <li>Random Forest</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Algorithms List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">
                    {selectedCategory
                        ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name} (${filteredAlgorithms.length})`
                        : `Todos os Algoritmos (${filteredAlgorithms.length})`
                    }
                </h2>

                {filteredAlgorithms.map((algorithm) => (
                    <AlgorithmCard
                        key={algorithm.id}
                        algorithm={algorithm}
                        isExpanded={expandedAlgorithm === algorithm.id}
                        onToggle={() => setExpandedAlgorithm(
                            expandedAlgorithm === algorithm.id ? null : algorithm.id
                        )}
                        onConfigure={() => setConfigModalAlgorithm(algorithm.id)}
                    />
                ))}
            </div>

            {/* Configuration Modal */}
            <AlgorithmConfigModal
                algorithmId={configModalAlgorithm || ''}
                isOpen={configModalAlgorithm !== null}
                onClose={() => setConfigModalAlgorithm(null)}
            />

            {/* Comparison Table */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Tabela Comparativa
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 text-left border-b border-gray-700">
                                <th className="pb-3">Algoritmo</th>
                                <th className="pb-3">Categoria</th>
                                <th className="pb-3">Complexidade</th>
                                <th className="pb-3">Velocidade</th>
                                <th className="pb-3">Precisão</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {ALGORITHMS.slice(0, 10).map((alg) => {
                                const complexityBadge = getComplexityBadge(alg.complexity);
                                const speedBadge = getSpeedBadge(alg.speed);
                                const category = CATEGORIES.find(c => c.id === alg.category);

                                return (
                                    <tr key={alg.id} className="border-b border-gray-700/50">
                                        <td className="py-3 font-medium text-white">{alg.name}</td>
                                        <td className="py-3">{category?.name}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${complexityBadge.color}`}>
                                                {complexityBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${speedBadge.color}`}>
                                                {speedBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-400">{alg.precision}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MLAlgorithmsGuide;
