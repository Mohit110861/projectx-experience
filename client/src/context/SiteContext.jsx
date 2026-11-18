import React, { createContext, useCallback, useEffect, useState } from 'react';
import api from '../utils/axios';

export const SiteContext = createContext({ settings: {}, refreshSettings: () => {} });

export const SiteProvider = ({ children }) => {
    const [settings, setSettings] = useState({});

    const refreshSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/settings');
            setSettings(data);
        } catch {
            /* keep defaults if the API is down */
        }
    }, []);

    useEffect(() => { refreshSettings(); }, [refreshSettings]);

    return <SiteContext.Provider value={{ settings, setSettings, refreshSettings }}>{children}</SiteContext.Provider>;
};
