import React from 'react';
import { NAV_ITEMS } from '@/constants';

interface HomeProps {
    onSelect: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onSelect }) => {
    return (
        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {NAV_ITEMS.map(item => (
                <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-5 flex flex-col"
                >
                    <div className="flex items-center mb-4">
                        <item.icon className="w-6 h-6 text-primary-500 mr-2" />
                        <h3 className="text-lg font-semibold">{item.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600 flex-1">
                        Acesse a funcionalidade {item.label.toLowerCase()} e explore as opções disponíveis.
                    </p>
                    <button
                        onClick={() => onSelect(item.id)}
                        className="mt-4 w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition"
                    >
                        Acessar
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Home;
