import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    return (
        <footer className={`bg-[#575b5c] p-6 text-center text-xs text-slate-200 border-t border-slate-600 flex flex-col gap-3 mt-auto w-full z-10 ${className}`}>
            <p>&copy; {new Date().getFullYear()} Asr Data Science. Todos os direitos reservados.</p>
            <div className="flex justify-center gap-4">
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Política de Privacidade</Link>
                <span className="text-slate-500">|</span>
                <Link to="/terms-of-service" className="hover:text-white transition-colors">Termos de Serviço</Link>
            </div>
        </footer>
    );
};
