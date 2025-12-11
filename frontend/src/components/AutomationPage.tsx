import React from 'react';
import { N8nEmbed } from './N8nEmbed';

const AutomationPage: React.FC = () => {
    return (
        <div className="h-full w-full bg-white animate-fade-in">
            <N8nEmbed height="100%" />
        </div>
    )
}

export default AutomationPage;
