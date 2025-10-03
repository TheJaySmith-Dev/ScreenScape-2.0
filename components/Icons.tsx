import React from 'react';

type IconProps = { className?: string };

export const LockIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

export const StarIcon: React.FC<IconProps & { isActive?: boolean }> = ({ className, isActive }) => (
     <span className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`${isActive ? 'fi fi-sr-star' : 'fi fi-rr-star'} text-2xl leading-none`}></i>
    </span>
);

export const StarIconSolid: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);


export const UserIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const MuteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const UnmuteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
     <span className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fi fi-rr-search`}></i>
    </span>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.5 18.75l1.188-.648a2.25 2.25 0 011.423-1.423L16.25 15.5l.648 1.188a2.25 2.25 0 011.423 1.423L18.5 18.75l-1.188.648a2.25 2.25 0 01-1.423 1.423z" />
    </svg>
);

export const PaperAirplaneIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);

export const GearIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.127c-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


// --- START: BRAND LOGO COMPONENTS ---
export const NetflixLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 115 31" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M109.87 2.49H98.54V28.17H115V24.5h-9.98V2.49H109.87zM4.85 2.49H16.18V28.17H0V24.5h9.98V2.49H4.85zM57.43 2.49L42.52 23.3V2.49H27.61V28.17h11.1L57.43 5.37v22.8H72.34V2.49H57.43zM84.9 2.49c-8.54 0-12.25 5.96-12.25 12.84s3.71 12.84 12.25 12.84c8.53 0 12.24-5.96 12.24-12.84S93.43 2.49 84.9 2.49zm0 22c-2.49 0-3.56-2.28-3.56-9.16s1.07-9.16 3.56-9.16 3.56 2.28 3.56 9.16-1.07 9.16-3.56 9.16z"/>
    </svg>
);

export const DisneyPlusLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 300 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.6 127.4c0 9.2 6.6 15.9 16.3 15.9 8.2 0 16.6-4.6 16.6-14.8 0-14.9-15.1-13.6-16.1-13.6h-5.9v-7.2h6.1c11.7 0 15.1-6.1 15.1-13.3 0-7.3-4.8-13-14.1-13-9.9 0-15.6 5.8-15.6 14.1h10.9c.3-3.6 2.4-5.6 5.3-5.6 2.4 0 4.1 1.6 4.1 4.6 0 4.3-3.2 5.1-7.8 5.1h-5.6v7.3h5.6c4.9 0 9.2.7 9.2 5.9 0 3.3-2.1 4.9-4.8 4.9-3.2 0-5.9-2.6-6.1-6.6H23.6zm49.1-32.9c0-14.1 11.2-25.3 25.3-25.3s25.3 11.2 25.3 25.3c0 14.1-11.2 25.3-25.3-25.3s-25.3-11.2-25.3-25.3zm40.3 0c0-8.3-6.8-15.1-15.1-15.1s-15.1 6.8-15.1 15.1c0 8.3 6.8 15.1 15.1 15.1s15.1-6.7 15.1-15.1zm29.3-24.3h10.4v48.6h-10.4v-48.6zm33.1 24.3c0-14.1 11.2-25.3 25.3-25.3s25.3 11.2 25.3 25.3-11.2 25.3-25.3-25.3-25.3-11.2-25.3-25.3zm40.3 0c0-8.3-6.8-15.1-15.1-15.1s-15.1 6.8-15.1 15.1c0 8.3 6.8 15.1 15.1 15.1s15.1-6.7 15.1-15.1zm52.1-24.3v48.6h-10.1l-11.4-15.4h-6.1v15.4h-10.4v-48.6h16.4c10.1 0 14.3 4.1 14.3 11.7 0 5.3-3.1 8.9-7.2 10.4l10.3 12.9h11.7l-9.6-11.9c4.3-1.6 7-5.9 7-11.1.2-8.3-4.3-13-15.6-13h-5.9v-7.2h5.9c3.3 0 5.4 1.9 5.4 4.9 0 3.1-2.3 4.8-5.6 4.8h-4.3v-9.6h18.4zm-11.6 15.1h-5.9v8.9h5.9c3.8 0 6.3-1.9 6.3-4.4s-2.6-4.5-6.3-4.5z"/>
        <path d="M239 123h19v-19h19v19h19v19h-19v19h-19v-19h-19z"/>
    </svg>
);

export const AppleTVPlusLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 30 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.12 4.06c-1.07 0-2.3.62-3 .93-.78.3-1.64.62-2.8.62-2.3 0-4.4-1.24-6.2-3.1-2.12 1.3-3.6 3.6-3.6 6.5C-.48 14.28 2.63 18 6.1 18c.8 0 1.9-.3 2.8-.6 1.1-.3 2.1-.6 3.2-.6 2.1 0 4 1.2 5.9 3 2.2-1.2 3.8-3.6 3.8-6.4 0-4.2-3.2-6.2-6.5-6.2l-.28-.04zM13.6 2.48c.8-.93 2.1-1.55 3.3-1.55 1.1 0 2.3.62 3 .93.8.3 1.6.62 2.8.62 2.3 0 4.4-1.24 6.2-3.1.5.8.9 1.6.9 2.5 0 2.8-1.5 5.1-3.6 6.5 2 1.2 3.3 3.5 3.3 6.1 0 4.2-3.3 6.5-6.5 6.5-.8 0-2-.31-2.9-.62-.9-.3-2-.62-3.1-.62-2.13 0-4.14 1.24-5.94 3.1-2.2-1.24-3.7-3.6-3.7-6.4 0-2.9 1.5-5.3 3.6-6.6-2-1.3-3.3-3.6-3.3-6.2 0-1.1.3-2.1.9-3l.3.3z"/>
        <path d="M21.2 29.5c.8 0 1.9-.3 2.8-.6 1.1-.3 2.1-.6 3.2-.6 2.1 0 4 1.2 5.9 3-2.1 1.2-4.5 1.9-7.2 1.9-1.6 0-3.1-.3-4.5-.9.1.1.2.1.2.2z"/>
    </svg>
);

export const PrimeVideoLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 2560 541" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2560 361.3c0 99.2-76 179.7-172.8 179.7-93.5 0-169.5-73.3-172.8-164.2h-1.6V541h-95.9V1.3h161.7c90.2 0 159.9 66.4 159.9 154.1 0 54.3-25.5 101.9-66.3 129.5 51.1 22.3 87.5 73.3 87.5 129.5l.2 2.3c-.1 14.7-.1 24.5-.1 24.5zM2387.2 112c0-36.8-27.1-64.8-64.8-64.8h-63.2V280h63.2c37.7 0 64.8-28 64.8-64.8v-103.2zm-128-64.8h-63.2v112.7h63.2c37.7 0 64.8-28 64.8-64.8S2296.9 47.2 2259.2 47.2zm128 300.9c0-36.8-27.1-64.8-64.8-64.8h-63.2v129.6h63.2c37.7 0 64.8-28 64.8-64.8zM1724.8 1.3L1539.2 541h-95.9L1256.1 1.3h100.7l86.7 289.8L1529.5 1.3h99.2l87.5 315.3 84.3-315.3h100.8L1713 541h-97.5L1724.8 1.3zM1084.8 1.3l-195.1 539.7h-95.9L601.7 1.3h100.7l142.1 411.8 142.1-411.8h98.2V1.3zM2110.4 1.3h-99.2v539.7h99.2V1.3zM512 1.3H1.6v539.7h99.2V102h312.1V1.3H512zM512 102H100.8v100.7h312.1V102h99.1zM512 338.7H100.8v100.7h312.1V338.7h99.1zM1964.8 1.3h100.7v539.7h-100.7V1.3zM1182.4 1.3h100.7v539.7h-100.7V1.3z"/>
        <path d="M0 1.3h100.7v539.7H0V1.3z"/>
    </svg>
);

export const HuluLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 33" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M85.4 16.2v16.5H74.1V.3h11.3v13c3.4-3.4 9.4-4.5 13.3-2.6 3.1 1.5 4.1 4.7 4.1 8.2v13.8H91.5V18.1c0-4.6-2-6.5-5.3-6.5-1.5 0-2.8.5-3.8 1.6v13zM62.8 32.7h11.3V.3H62.8v32.4zM40.2 32.7h11.3V.3H40.2v32.4zM11.9 29.3c-2.8 2.2-6.1 3.4-9.9 3.4H0V.3h11.3v19.2c0-4.5 4.3-8.6 11.2-8.6 6.8 0 11.9 4.3 11.9 11.1s-5.1 10.7-12.5 10.7zM24.8 22c0-2.8-2.2-4.5-5-4.5-3.3 0-5.3 2-5.3 5s2 5.2 5.3 5.2c2.8 0 5-1.7 5-5.7z"/>
    </svg>
);

export const MaxLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14h-2V8h2v8zm5.1-6.2c-.3-.2-.7-.3-1.1-.3-1.1 0-2 .9-2 2s.9 2 2 2c.4 0 .8-.1 1.1-.3l.9.8c-.5.4-1.2.7-1.9.7-1.7 0-3-1.3-3-3s1.3-3 3-3c.8 0 1.5.3 2 .8l-.9.8z"/>
    </svg>
);

export const ParamountPlusLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5V7.5l6 4.5-6 4.5z"/>
    </svg>
);

export const PeacockLogo: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);
// --- END: BRAND LOGO COMPONENTS ---