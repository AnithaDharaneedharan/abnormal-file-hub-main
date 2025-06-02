import React from 'react';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({
    title = "File Upload Hub",
    subtitle = "Upload and manage your files securely"
}) => {
    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
                {title}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
                {subtitle}
            </p>
        </div>
    );
};

export default Header;