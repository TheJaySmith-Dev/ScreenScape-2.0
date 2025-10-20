export const isMobileDevice = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

export const isIOS = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

export const isAndroid = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
};
