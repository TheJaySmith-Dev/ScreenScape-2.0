import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaCog, FaUser, FaGamepad, FaPlay, FaListUl, FaSignOutAlt } from 'react-icons/fa';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useImageGenerator } from '../contexts/ImageGeneratorContext';

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
    const { selectedModel } = useImageGenerator();
    const { user, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

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

    const handleUserMenuToggle = () => {
        setShowUserMenu(!showUserMenu);
    };

    const handleUserMenuClose = () => {
        setShowUserMenu(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setShowUserMenu(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            {/* User Button - Desktop Version */}
            {isDesktop && (
                <motion.button
                    onClick={handleUserMenuToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'fixed',
                        top: 24,
                        right: 24,
                        zIndex: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 12,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(51, 65, 85, 0.3)',
                        color: 'white',
                        fontSize: 18,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                >
                    <FaUser />
                </motion.button>
            )}

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

                {/* User Button for Mobile */}
                {!isDesktop && (
                    <NavButton
                        active={false}
                        onClick={handleUserMenuToggle}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <NavIcon view="screenSearch" currentView="screenSearch" style={{ opacity: 1 }}>
                            <FaUser />
                        </NavIcon>
                        <div style={{ fontSize: '11px', textAlign: 'center' }}>
                            Account
                        </div>
                    </NavButton>
                )}
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

            {/* User Menu */}
            {showUserMenu && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleUserMenuClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: isDesktop ? 'flex-start' : 'flex-end',
                        justifyContent: 'center',
                        zIndex: 70,
                        padding: isDesktop ? '80px 24px 0 0' : '0 20px 120px 20px',
                    }}
                >
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                            backdropFilter: 'blur(24px)',
                            borderRadius: 16,
                            border: '1px solid rgba(51, 65, 85, 0.3)',
                            padding: 16,
                            minWidth: 200,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            position: 'relative',
                        }}
                    >
                        {/* User Info Section */}
                        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                                {user?.email || 'User'}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                                Signed in
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <motion.button
                                onClick={() => {
                                    onSettingsClick();
                                    handleUserMenuClose();
                                }}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 8,
                                    background: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    justifyContent: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                <FaCog style={{ fontSize: 16 }} />
                                Settings
                            </motion.button>

                            <motion.button
                                onClick={handleSignOut}
                                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 8,
                                    background: 'transparent',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    justifyContent: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                <FaSignOutAlt style={{ fontSize: 16 }} />
                                Sign Out
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default Header;
