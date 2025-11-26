/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import {
    createTheme,
    CssBaseline,
    responsiveFontSizes,
    StyledEngineProvider,
    Theme,
    ThemeProvider,
} from '@mui/material';
import { enUS as MuiCoreEnUS, frFR as MuiCoreFrFR } from '@mui/material/locale';
import {
    CardErrorBoundary,
    cardErrorBoundaryEn,
    cardErrorBoundaryFr,
    businessErrorsEn,
    businessErrorsFr,
    commonButtonEn,
    commonButtonFr,
    csvEn,
    csvFr,
    descriptionEn,
    descriptionFr,
    directoryItemsInputEn,
    directoryItemsInputFr,
    dndTableEn,
    dndTableFr,
    elementSearchEn,
    elementSearchFr,
    equipmentsEn,
    equipmentsFr,
    equipmentShortEn,
    equipmentShortFr,
    equipmentTagEn,
    equipmentTagFr,
    filterEn,
    filterExpertEn,
    filterExpertFr,
    filterFr,
    flatParametersEn,
    flatParametersFr,
    GsLangUser,
    GsTheme,
    LANG_ENGLISH,
    LANG_FRENCH,
    LIGHT_THEME,
    loginEn,
    loginFr,
    networkModificationsEn,
    networkModificationsFr,
    multipleSelectionDialogEn,
    multipleSelectionDialogFr,
    parametersEn,
    parametersFr,
    SnackbarProvider,
    tableEn,
    tableFr,
    topBarEn,
    topBarFr,
    treeviewFinderEn,
    treeviewFinderFr,
    importParamsEn,
    importParamsFr,
    exportParamsEn,
    exportParamsFr,
    useUniqueNameValidationEn,
    useUniqueNameValidationFr,
    NotificationsProvider,
    PARAM_THEME,
} from '@gridsuite/commons-ui';
import { IntlConfig, IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router';
import { Provider, useSelector } from 'react-redux';
import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';
import useNotificationsUrlGenerator from 'hooks/use-notifications-url-generator';
import App from './app';
import messages_en from '../translations/en.json';
import messages_fr from '../translations/fr.json';
import messages_plugins from '../plugins/translations';
import backend_locale_fr from '../translations/external/backend-locale-fr';
import backend_locale_en from '../translations/external/backend-locale-en';
import { store } from '../redux/store';
import { AppState } from '../redux/types';

// Register all community features (migration to V33)
ModuleRegistry.registerModules([AllCommunityModule]);

// Mark all grids as using legacy themes (migration to V33)
provideGlobalGridOptions({ theme: 'legacy' });

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
    arrow: {
        fill: '#212121',
        stroke: '#212121',
    },
    arrow_hover: {
        fill: 'white',
        stroke: 'white',
    },
    circle: {
        stroke: 'white',
        fill: 'white',
    },
    circle_hover: {
        stroke: '#212121',
        fill: '#212121',
    },
    link: {
        color: 'black',
    },
    row: {
        primary: '#E8E8E8',
        secondary: '#F4F4F4',
        hover: '#8E9C9B',
    },
    aggrid: {
        theme: 'ag-theme-alpine',
        highlightColor: '#CFDFFB',
    },
    agGridBackground: {
        color: 'white',
    },
    typography: {
        button: {
            textTransform: 'none',
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    arrow: {
        fill: 'white',
        stroke: 'white',
    },
    arrow_hover: {
        fill: '#424242',
        stroke: '#424242',
    },
    circle: {
        stroke: '#424242',
        fill: '#424242',
    },
    circle_hover: {
        stroke: 'white',
        fill: 'white',
    },
    link: {
        color: 'white',
    },
    row: {
        primary: '#272727',
        secondary: '#323232',
        hover: '#545C5B',
    },
    aggrid: {
        theme: 'ag-theme-alpine-dark',
        highlightColor: '#1F3B5B',
    },
    agGridBackground: {
        color: '#383838',
    },
    typography: {
        button: {
            textTransform: 'none',
        },
    },
});

// no other way to copy style: https://mui.com/material-ui/customization/theming/#api
function createThemeWithComponents(baseTheme: Theme, ...args: object[]) {
    return createTheme(
        baseTheme,
        {
            palette: {
                cancelButtonColor: {
                    main: baseTheme.palette.text.secondary,
                },
            },
            components: {
                CancelButton: {
                    defaultProps: {
                        color: 'cancelButtonColor',
                    },
                },
            },
        },
        ...args
    );
}

function getMuiTheme(theme: GsTheme, locale: GsLangUser) {
    return responsiveFontSizes(
        createThemeWithComponents(
            theme === LIGHT_THEME ? lightTheme : darkTheme,
            locale === LANG_FRENCH ? MuiCoreFrFR : MuiCoreEnUS // MUI core translations
        )
    );
}

const messages: Record<GsLangUser, IntlConfig['messages']> = {
    en: {
        ...messages_en,
        ...networkModificationsEn,
        ...importParamsEn,
        ...exportParamsEn,
        ...loginEn,
        ...topBarEn,
        ...tableEn,
        ...treeviewFinderEn,
        ...cardErrorBoundaryEn,
        ...flatParametersEn,
        ...multipleSelectionDialogEn,
        ...commonButtonEn,
        ...backend_locale_en,
        ...directoryItemsInputEn,
        ...dndTableEn,
        ...elementSearchEn,
        ...businessErrorsEn,
        ...filterEn,
        ...filterExpertEn,
        ...descriptionEn,
        ...equipmentsEn,
        ...equipmentShortEn,
        ...equipmentTagEn,
        ...csvEn,
        ...parametersEn,
        ...useUniqueNameValidationEn,
        ...messages_plugins.en, // keep it at the end to allow translation overwriting
    },
    fr: {
        ...messages_fr,
        ...networkModificationsFr,
        ...importParamsFr,
        ...exportParamsFr,
        ...loginFr,
        ...topBarFr,
        ...tableFr,
        ...treeviewFinderFr,
        ...cardErrorBoundaryFr,
        ...flatParametersFr,
        ...multipleSelectionDialogFr,
        ...commonButtonFr,
        ...backend_locale_fr,
        ...elementSearchFr,
        ...directoryItemsInputFr,
        ...dndTableFr,
        ...filterFr,
        ...businessErrorsFr,
        ...filterExpertFr,
        ...descriptionFr,
        ...equipmentsFr,
        ...equipmentShortFr,
        ...equipmentTagFr,
        ...csvFr,
        ...parametersFr,
        ...useUniqueNameValidationFr,
        ...messages_plugins.fr, // keep it at the end to allow translation overwriting
    },
};

const basename = new URL(document.querySelector('base')!.href).pathname;

function AppWrapperWithRedux() {
    const computedLanguage = useSelector((state: AppState) => state.computedLanguage);
    const theme = useSelector((state: AppState) => state[PARAM_THEME]);
    const themeCompiled = useMemo(() => getMuiTheme(theme, computedLanguage), [computedLanguage, theme]);

    const urlMapper = useNotificationsUrlGenerator();

    return (
        <IntlProvider locale={computedLanguage} defaultLocale={LANG_ENGLISH} messages={messages[computedLanguage]}>
            <BrowserRouter basename={basename}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={themeCompiled}>
                        <SnackbarProvider hideIconVariant={false}>
                            <CssBaseline />
                            <CardErrorBoundary>
                                <NotificationsProvider urls={urlMapper}>
                                    <App />
                                </NotificationsProvider>
                            </CardErrorBoundary>
                        </SnackbarProvider>
                    </ThemeProvider>
                </StyledEngineProvider>
            </BrowserRouter>
        </IntlProvider>
    );
}

export default function AppWrapper() {
    return (
        <Provider store={store}>
            <AppWrapperWithRedux />
        </Provider>
    );
}
