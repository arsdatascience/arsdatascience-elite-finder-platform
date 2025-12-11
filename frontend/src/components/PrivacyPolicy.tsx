import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
                <p className="text-gray-500 mb-8">Última atualização: 06 de Dezembro de 2025</p>

                <div className="prose prose-slate max-w-none text-gray-700 space-y-6">
                    <p>
                        A sua privacidade é importante para nós. É política do Elite Finder respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Elite Finder, e outros sites que possuímos e operamos.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Informações que coletamos</h2>
                    <p>
                        Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">2. Retenção de dados</h2>
                    <p>
                        Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Compartilhamento de dados</h2>
                    <p>
                        Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">4. Cookies</h2>
                    <p>
                        O nosso site usa cookies para melhorar a experiência do usuário. Ao continuar a navegar, você concorda com o uso de cookies.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">5. Compromisso do Usuário</h2>
                    <p>
                        O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Elite Finder oferece no site e com caráter enunciativo, mas não limitativo:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
                        <li>Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
                        <li>Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Elite Finder, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">6. Mais informações</h2>
                    <p>
                        Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
                    </p>
                </div>
            </div>
            <Footer className="bg-transparent border-t-0 mt-8" />
        </div>
    );
};

export default PrivacyPolicy;
