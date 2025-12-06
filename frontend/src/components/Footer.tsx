import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    return (
        <footer className={`bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100 flex flex-col gap-2 mt-auto ${className}`}>
            <p>&copy; {new Date().getFullYear()} Elite Finder. Todos os direitos reservados.</p>
            <div className="flex justify-center gap-4">
                <Link to="/privacy-policy" className="hover:text-primary-600 transition-colors">Política de Privacidade</Link>
                <span className="text-gray-300">|</span>
                <Link to="/terms-of-service" className="hover:text-primary-600 transition-colors">Termos de Serviço</Link>
            </div>
        </footer>
    );
};
