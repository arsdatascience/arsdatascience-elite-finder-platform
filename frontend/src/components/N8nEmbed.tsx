import { useEffect, useRef, useState } from 'react'

interface N8nEmbedProps {
    width?: string
    height?: string
    className?: string
}

export function N8nEmbed({
    width = '100%',
    height = '800px',
    className = ''
}: N8nEmbedProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // URL com locale PT-BR forçado
    const n8nUrl = 'https://arsdatascience-n8n.aiiam.com.br?locale=pt_BR'

    useEffect(() => {
        // Timeout de 15 segundos
        const timeout = setTimeout(() => {
            if (isLoading) {
                setError('Timeout ao carregar N8N. Verifique sua conexão.')
                setIsLoading(false)
            }
        }, 15000)

        // Configurar cookie para PT-BR
        try {
            document.cookie = `n8n-locale=pt_BR; domain=.aiiam.com.br; path=/; secure; samesite=none; max-age=31536000`
        } catch (e) {
            console.warn('Não foi possível configurar cookie:', e)
        }

        return () => clearTimeout(timeout)
    }, [isLoading])

    const handleLoad = () => {
        setIsLoading(false)
        setError(null)

        // Tentar configurar locale via postMessage
        if (iframeRef.current?.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage(
                    { type: 'n8n.setLocale', locale: 'pt_BR' },
                    'https://arsdatascience-n8n.aiiam.com.br'
                )
            } catch (e) {
                console.warn('PostMessage falhou:', e)
            }
        }
    }

    const handleError = () => {
        setIsLoading(false)
        setError('Erro ao carregar N8N. Por favor, recarregue a página.')
    }

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {/* Loading */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-700 font-medium">Carregando editor de workflows...</p>
                        <p className="text-gray-500 text-sm mt-2">Configurando ambiente em português</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-red-600 text-5xl mb-4">⚠️</div>
                        <h3 className="text-red-800 font-bold text-lg mb-2">Erro ao Carregar</h3>
                        <p className="text-red-700 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                            >
                                🔄 Recarregar Página
                            </button>

                            <a
                                href="https://arsdatascience-n8n.aiiam.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                            >
                                🔗 Abrir em Nova Aba
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Iframe */}
            <iframe
                ref={iframeRef}
                src={n8nUrl}
                width={width}
                height={height}
                className="border-0 w-full h-full"
                title="N8N Workflow Editor - Automação de Marketing"
                allow="clipboard-read; clipboard-write; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="eager"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    )
}
