import React from 'react';
import { N8nEmbed } from './N8nEmbed';

const AutomationPage: React.FC = () => {
    return (
        <div className="h-full bg-white animate-fade-in flex flex-col">
            {/* N8N Embed - Full Screen Area */}
            <div className="flex-1 w-full h-full">
                <N8nEmbed height="100%" />
            </div>
        </div>
    )
}

export default AutomationPage;
