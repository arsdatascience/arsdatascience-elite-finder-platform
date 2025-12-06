import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';

export const TermsOfService: React.FC = () => {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Serviço</h1>
                <p className="text-gray-500 mb-8">Última atualização: 06 de Dezembro de 2025</p>

                <div className="prose prose-slate max-w-none text-gray-700 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Termos</h2>
                    <p>
                        Ao acessar ao site <span className="font-semibold">Elite Finder</span>, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">2. Uso de Licença</h2>
                    <p>
                        É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Elite Finder , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>modificar ou copiar os materiais;</li>
                        <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
                        <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Elite Finder;</li>
                        <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                        <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
                    </ul>
                    <p className="mt-4">
                        Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por Elite Finder a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Isenção de responsabilidade</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Os materiais no site da Elite Finder são fornecidos 'como estão'. Elite Finder não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</li>
                        <li>Além disso, o Elite Finder não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">4. Limitações</h2>
                    <p>
                        Em nenhum caso o Elite Finder ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Elite Finder, mesmo que Elite Finder ou um representante autorizado da Elite Finder tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">5. Precisão dos materiais</h2>
                    <p>
                        Os materiais exibidos no site da Elite Finder podem incluir erros técnicos, tipográficos ou fotográficos. Elite Finder não garante que qualquer material em seu site seja preciso, completo ou atual. Elite Finder pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, Elite Finder não se compromete a atualizar os materiais.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">6. Links</h2>
                    <p>
                        O Elite Finder não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Elite Finder do site. O uso de qualquer site vinculado é por conta e risco do usuário.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">Modificações</h2>
                    <p>
                        O Elite Finder pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">Lei aplicável</h2>
                    <p>
                        Estes termos e condições são regidos e interpretados de acordo com as leis do Elite Finder e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
                    </p>
                </div>
            </div>
            <Footer className="bg-transparent border-t-0 mt-8" />
        </div>
    );
};

export default TermsOfService;
