import { createContext, useContext, useState,useEffect, type ReactNode } from 'react';
import {Grid} from 'antd';

const {useBreakpoint} = Grid;

interface LayoutContextData {
        collapsed:boolean;
        setCollapsed: (value: boolean) => void;
        isMobile: boolean;
        sideBarWidth:number;
        isDarkMode : boolean;
        toggleTheme: ( ) => void;
    }

const LayoutContext = createContext<LayoutContextData | undefined>(undefined);

export function LayoutProvider({children}: {children:ReactNode}) {
        const screens = useBreakpoint();
        const isMobile = !screens.md;

        //Modo escuro da pagina
        const [isDarkMode, setDarkMode] = useState<boolean>(()=> {
            //salvando no local Storage
            const saved = localStorage.getItem('theme');
            return saved === 'dark' || (!saved && window.matchMedia('prefers-color-scheme: dark').matches)
        });

        const toggleTheme = () => setDarkMode(!isDarkMode);

        useEffect(()=>{
            const html = document.documentElement;
            if(isDarkMode) {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark')
            } else {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light')

            }
        },[isDarkMode]);
        // Definir se o item collapsou
        const  [collapsed, setCollapsed] = useState<boolean>(false);

        useEffect(()=>{
            if (isMobile) {
                setCollapsed(true);
                }
            }, [isMobile]);

        const sideBarWidth = isMobile ? 0 : (collapsed ? 80 : 200);

        return (
            <LayoutContext.Provider value={{collapsed, setCollapsed, isMobile, sideBarWidth, isDarkMode, toggleTheme}}>
                {children}
            </LayoutContext.Provider>
            );
    }

export function useLayout() {
        const context = useContext(LayoutContext);
        if (!context) {
                throw new Error('useLayout deve ser usado dentro de LayoutProvider');
            }
        return context;
    }