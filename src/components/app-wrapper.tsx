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
    type ThemeOptions,
    ThemeProvider,
} from '@mui/material';
import { enUS as MuiCoreEnUS, frFR as MuiCoreFrFR } from '@mui/material/locale';
import {
    CardErrorBoundary,
    cardErrorBoundaryEn,
    cardErrorBoundaryFr,
    commonButtonEn,
    commonButtonFr,
    csvEn,
    csvFr,
    descriptionEn,
    descriptionFr,
    directoryItemsInputEn,
    directoryItemsInputFr,
    elementSearchEn,
    elementSearchFr,
    equipmentsEn,
    equipmentsFr,
    exportParamsEn,
    exportParamsFr,
    filterEn,
    filterExpertEn,
    filterExpertFr,
    filterFr,
    flatParametersEn,
    flatParametersFr,
    GsLangUser,
    GsTheme,
    importParamsEn,
    importParamsFr,
    LANG_ENGLISH,
    LANG_FRENCH,
    LIGHT_THEME,
    loginEn,
    loginFr,
    multipleSelectionDialogEn,
    multipleSelectionDialogFr,
    networkModificationsEn,
    networkModificationsFr,
    SnackbarProvider,
    tableEn,
    tableFr,
    topBarEn,
    topBarFr,
    treeviewFinderEn,
    treeviewFinderFr,
} from '@gridsuite/commons-ui';
import { IntlConfig, IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import App from './app';
import messages_en from '../translations/en.json';
import messages_fr from '../translations/fr.json';
import messages_plugins from '../plugins/translations';
import aggrid_locale_fr from '../translations/external/aggrid-locale-fr';
import backend_locale_fr from '../translations/external/backend-locale-fr';
import backend_locale_en from '../translations/external/backend-locale-en';
import { store } from '../redux/store';
import { PARAM_THEME } from '../utils/config-params';
import { AppState } from '../redux/types';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
    link: {
        color: 'black',
    },
    row: {
        primary: '#E8E8E8',
        hover: '#8E9C9B',
    },
    aggrid: {
        highlightColor: '#CFDFFB',
        valueChangeHighlightBackgroundColor: 'initial', // TODO value?
        overlay: { background: 'initial' }, // TODO value?
        background: {
            color: 'white',
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    link: {
        color: 'white',
    },
    row: {
        primary: '#272727',
        hover: '#545C5B',
    },
    aggrid: {
        highlightColor: '#1F3B5B',
        valueChangeHighlightBackgroundColor: 'initial', // TODO value?
        overlay: { background: 'initial' }, // TODO value?
        background: {
            color: '#383838',
        },
    },
});

// no other way to copy style: https://mui.com/material-ui/customization/theming/#api
function createThemeWithComponents(baseTheme: ThemeOptions, ...args: object[]) {
    return createTheme(
        baseTheme,
        {
            typography: {
                button: {
                    textTransform: 'none',
                },
            },
            palette: {
                cancelButtonColor: {
                    main: baseTheme.palette?.text?.secondary,
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
        ...elementSearchEn,
        ...filterEn,
        ...filterExpertEn,
        ...descriptionEn,
        ...equipmentsEn,
        ...csvEn,
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
        ...aggrid_locale_fr, // Only the French locale is needed
        ...directoryItemsInputFr,
        ...filterFr,
        ...filterExpertFr,
        ...descriptionFr,
        ...equipmentsFr,
        ...csvFr,
        ...messages_plugins.fr, // keep it at the end to allow translation overwriting
    },
};

const basename = new URL(document.querySelector('base')!.href).pathname;

function AppWrapperWithRedux() {
    const computedLanguage = useSelector((state: AppState) => state.computedLanguage);
    const theme = useSelector((state: AppState) => state[PARAM_THEME]);
    const themeCompiled = useMemo(() => getMuiTheme(theme, computedLanguage), [computedLanguage, theme]);

    return (
        <IntlProvider locale={computedLanguage} defaultLocale={LANG_ENGLISH} messages={messages[computedLanguage]}>
            <BrowserRouter basename={basename}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={themeCompiled}>
                        <SnackbarProvider hideIconVariant={false}>
                            <CssBaseline />
                            <CardErrorBoundary>
                                <App />
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
