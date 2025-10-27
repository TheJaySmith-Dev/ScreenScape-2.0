import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaCog, FaGamepad, FaPlay, FaListUl, FaSync } from 'react-icons/fa';
import { ViewType } from '../App';
import { useImageGenerator } from '../contexts/ImageGeneratorContext';
import { useDeviceSync } from '../hooks/useDeviceSync';

interface HeaderProps {
    view: ViewType;
    setView: (view: ViewType) => void;
    onSettingsClick: () => void;
    onSyncClick?: () => void;
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

const NavContainer = styled.nav<{ isDesktop: boolean }>`
    position: fixed;
    bottom: ${({ isDesktop }) => (isDesktop ? 'auto' : '0')};
    left: ${({ isDesktop }) => (isDesktop ? '0' : '0')};
    top: ${({ isDesktop }) => (isDesktop ? '50%' : 'auto')};
    transform: ${({ isDesktop }) => (isDesktop ? 'translateY(-50%)' : 'none')};
    z-index: 50;
    display: flex;
    flex-direction: ${({ isDesktop }) => (isDesktop ? 'column' : 'row')};
    ${({ isDesktop }) =>
        isDesktop
            ? `
                left: 24px;
                width: 78px;
                height: auto;
                padding: 10px;
                gap: 4px;
              `
            : 'width: 100vw; padding: 0 20px 34px 20px; height: auto;'
    }
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(24px);
    border-radius: ${({ isDesktop }) => (isDesktop ? '24px' : '32px 32px 0 0')};
    border: ${({ isDesktop }) => (isDesktop ? '1px solid rgba(51, 65, 85, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)')};
    min-height: ${({ isDesktop }) => (isDesktop ? 'auto' : '88px')};
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${({ isDesktop }) => (isDesktop
        ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
        : '0 -8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(148, 163, 184, 0.1)')};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const NavButton = styled(motion.button)<{ active: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    margin: 2px;
    border-radius: 12px;
    background: ${({ active }) =>
        active
            ? 'rgba(255, 255, 255, 0.3)'
            : 'transparent'
    };
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 50px;

    &:hover {
        transform: scale(1.1);
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

const Header: React.FC<HeaderProps> = ({ view, setView, onSettingsClick, onSyncClick }) => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const { selectedModel } = useImageGenerator();
    const { syncState, disconnect } = useDeviceSync();

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
        { viewName: 'watchlist', icon: FaListUl, label: 'Watchlist' },
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
            {/* Sync Status Indicator */}
            <motion.div
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 60,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: '16px',
                        background: syncState.isConnected
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))'
                            : 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        border: syncState.isConnected
                            ? '1px solid rgba(34, 197, 94, 0.3)'
                            : '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }}
                    onClick={() => {
                        if (onSyncClick) {
                            onSyncClick();
                        }
                    }}
                    title={syncState.isConnected ? `Synced (${syncState.deviceCount} devices)` : 'Not synced'}
                >
                    <motion.div
                        animate={syncState.isSyncing ? { rotate: 360 } : {}}
                        transition={syncState.isSyncing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                        style={{
                            color: syncState.isConnected ? '#22c55e' : '#94a3b8',
                            fontSize: '18px',
                        }}
                    >
                        <FaSync />
                    </motion.div>
                    {syncState.isConnected && (
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                width: 12,
                                height: 12,
                                backgroundColor: '#22c55e',
                                borderRadius: '50%',
                                border: '2px solid rgba(15, 23, 42, 0.8)',
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        />
                    )}
                </div>
            </motion.div>

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
                        <div style={{ fontSize: '11px', textAlign: 'center' }}>
                            {item.label}
                            {item.viewName === 'imageGenerator' && isDesktop && selectedModel && (
                                <div style={{
                                    fontSize: '9px',
                                    opacity: 0.8,
                                    marginTop: '2px',
                                    fontWeight: '400',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {selectedModel}
                                </div>
                            )}
                        </div>
                    </NavButton>
                ))}
            </NavContainer>

            {/* Desktop Settings Button */}
            {isDesktop && (
                <motion.button
                    style={{
                        position: 'fixed',
                        top: 20,
                        right: 80, // Next to the sync button
                        zIndex: 60,
                        width: 48,
                        height: 48,
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        color: 'white',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSettingsClick}
                    title="Settings"
                >
                    <FaCog style={{ fontSize: '18px' }} />
                </motion.button>
            )}

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
