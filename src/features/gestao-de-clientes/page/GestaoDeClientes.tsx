import React from 'react';
import { Result,} from 'antd';
import {useLayout} from "../../../shared/components/layout/LayoutContext.tsx";

export const GestaoClientesPage: React.FC = () => {
    const {isDarkMode} = useLayout();


    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'   }}>
                <img src={isDarkMode ? "/svg's/PageInConstructionDark.svg" : "/svg's/PageInConstructionLight.svg"} width={"500px"} style={{marginBottom:0}} alt="" />
                <Result
                    icon={false}
                    subTitle="Desculpe, a Gestão de Clientes está em construção..."
                />
            </div>
        </>

    )
}



