import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaCog, FaUser, FaGamepad, FaPlay, FaListUl } from 'react-icons/fa';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    view: ViewType;
    setView: (view: ViewType) => void;
    onSettingsClick: () => void;
}

interface NavItem {
    viewName: ViewType | 'more';
    icon: any;
    label: string;
    unique?: boolean;
    pulse?: boolean;
    badge?: number;
    isMore?: boolean;
}

const shimmer = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.1); }
    50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.3); }
`;

const ripple = keyframes`
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.2); opacity: 0; }
`;

const NavContainer = styled.nav<{ isDesktop: boolean }>`
    position: fixed;
    bottom: ${({ isDesktop }) => (isDesktop ? 'auto' : '0')};
    left: ${({ isDesktop }) => (isDesktop ? '0' : '0')};
    top: ${({ isDesktop }) => (isDesktop ? '0' : 'auto')};
    z-index: 50;
    display: flex;
    flex-direction: ${({ isDesktop }) => (isDesktop ? 'column' : 'row')};
    ${({ isDesktop }) =>
        isDesktop
            ? 'width: 72px; height: 100vh;'
            : 'width: 100vw; padding: 0 20px 34px 20px; height: auto;'
    }
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
    border-top-left-radius: ${({ isDesktop }) => (isDesktop ? '0' : '24px')};
    border-top-right-radius: ${({ isDesktop }) => (isDesktop ? '0' : '24px')};
    border-bottom-left-radius: ${({ isDesktop }) => (isDesktop ? '24px' : '0')};
    border-bottom-right-radius: ${({ isDesktop }) => (isDesktop ? '24px' : '0')};
    border-top: ${({ isDesktop }) => (isDesktop ? 'none' : '1px solid rgba(255, 255, 255, 0.1)')};
    border-bottom: ${({ isDesktop }) => (isDesktop ? 'none' : '1px solid rgba(255, 255, 255, 0.05)')};
    border-right: ${({ isDesktop }) => (isDesktop ? '1px solid rgba(255, 255, 255, 0.1)' : 'none')};
    min-height: ${({ isDesktop }) => (isDesktop ? '100vh' : '80px')};
    transition: all 0.3s ease;
    box-shadow: ${({ isDesktop }) => (isDesktop ? '2px 0 10px rgba(0,0,0,0.3)' : '0 -2px 20px rgba(0,0,0,0.2)')};
`;

const NavButton = styled(motion.button)<{ active: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    margin: 4px;
    border-radius: 16px;
    background: ${({ active }) =>
        active
            ? 'rgba(255, 255, 255, 0.3)'
            : 'transparent'
    };
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 60px;

    &:hover {
        transform: scale(1.1);
        animation: ${shimmer} 1.5s ease-in-out infinite;
    }

    &:active::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        transform: translate(-50%, -50%);
        animation: ${ripple} 0.6s ease-out;
    }

    @media (max-width: 768px) {
        font-size: 10px;
        padding: 8px;
        min-width: 44px;
    }
`;

const NavIcon = styled.div<{ view: ViewType; currentView: ViewType }>`
    font-size: 20px;
    margin-bottom: 4px;
    opacity: ${({ view, currentView }) => (view === currentView ? 1 : 0.6)};
    transition: all 0.3s ease;

    ${NavButton}:hover & {
        opacity: 1;
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        font-size: 16px;
    }
`;

const Header: React.FC<HeaderProps> = ({ view, setView, onSettingsClick }) => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems: NavItem[] = [
        { viewName: 'screenSearch', icon: FaHome, label: 'Home' },
        { viewName: 'explore', icon: FaSearch, label: 'Explore' },
        { viewName: 'imageGenerator', icon: FaPlay, label: 'ScreenGenAI', unique: true },
        { viewName: 'live', icon: FaPlay, label: 'Live', pulse: true },
        { viewName: 'watchlist', icon: FaListUl, label: 'Watchlist', badge: 3 },
        { viewName: 'game', icon: FaGamepad, label: 'Games' },
        { viewName: 'sports', icon: FaPlay, label: 'Sports' },
    ];

    // For mobile, collapse less-used items
    const mobileItems: NavItem[] = [...navItems.slice(0, 4), {
        viewName: 'more',
        icon: FaCog,
        label: 'More',
    }];

    const [showMore, setShowMore] = useState(false);

    const handleNavClick = (viewName: ViewType | 'more') => {
        if (viewName === 'more') {
            setShowMore(true);
        } else {
            setView(viewName);
        }
    };

    const currentNavItems = isDesktop ? navItems : mobileItems;

    return (
        <>
            <NavContainer isDesktop={isDesktop}>
                {currentNavItems.map((item) => (
                    <NavButton
                        key={item.viewName}
                        active={view === item.viewName}
                        onClick={() => handleNavClick(item.viewName as ViewType)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <NavIcon view={item.viewName as ViewType} currentView={view}>
                            <item.icon />
                            {item.pulse && (
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 8,
                                        height: 8,
                                        backgroundColor: 'red',
                                        borderRadius: '50%',
                                    }}
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                            {item.badge && (
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        width: 16,
                                        height: 16,
                                        backgroundColor: '#007AFF',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                >
                                    {item.badge}
                                </motion.div>
                            )}
                        </NavIcon>
                        {item.label}
                    </NavButton>
                ))}
            </NavContainer>

            {/* More Menu for Mobile */}
            {showMore && !isDesktop && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    style={{
                        position: 'fixed',
                        bottom: 120,
                        left: 20,
                        right: 20,
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 24,
                        padding: 20,
                        zIndex: 100,
                    }}
                >
                    {navItems.slice(4).map((item) => (
                        <motion.button
                            key={item.viewName}
                            onClick={() => {
                                setView(item.viewName as ViewType);
                                setShowMore(false);
                            }}
                            whileHover={{ scale: 1.05 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 12,
                                margin: 4,
                                borderRadius: 16,
                                background: 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <item.icon style={{ marginRight: 12, fontSize: 18 }} />
                            {item.label}
                        </motion.button>
                    ))}
                    <motion.button
                        onClick={() => {
                            onSettingsClick();
                            setShowMore(false);
                        }}
                        whileHover={{ scale: 1.05 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 12,
                            margin: 4,
                            borderRadius: 16,
                            background: 'transparent',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            justifyContent: 'flex-start',
                        }}
                    >
                        <FaCog style={{ marginRight: 12, fontSize: 18 }} />
                        Settings
                    </motion.button>
                </motion.div>
            )}
        </>
    );
};

export default Header;
