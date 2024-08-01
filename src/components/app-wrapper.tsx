/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import App from './app';
import { useMemo } from 'react';
import {
    createTheme,
    responsiveFontSizes,
    StyledEngineProvider,
    ThemeProvider,
} from '@mui/material/styles';
import { enUS as MuiCoreEnUS, frFR as MuiCoreFrFR } from '@mui/material/locale';
import {
    card_error_boundary_en,
    card_error_boundary_fr,
    CardErrorBoundary,
    common_button_en,
    common_button_fr,
    directory_items_input_en,
    directory_items_input_fr,
    element_search_en,
    element_search_fr,
    filter_en,
    filter_expert_en,
    filter_expert_fr,
    filter_fr,
    flat_parameters_en,
    flat_parameters_fr,
    GsLangUser,
    GsTheme,
    LANG_ENGLISH,
    LANG_FRENCH,
    LIGHT_THEME,
    login_en,
    login_fr,
    multiple_selection_dialog_en,
    multiple_selection_dialog_fr,
    SnackbarProvider,
    table_en,
    table_fr,
    top_bar_en,
    top_bar_fr,
    treeview_finder_en,
    treeview_finder_fr,
} from '@gridsuite/commons-ui';
import { IntlConfig, IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import messages_en from '../translations/en.json';
import messages_fr from '../translations/fr.json';
import network_modification_locale_en from '../translations/dynamic/network-modifications-locale-en';
import network_modification_locale_fr from '../translations/dynamic/network-modifications-locale-fr';
import messages_plugins from '../plugins/translations';
import aggrid_locale_fr from '../translations/external/aggrid-locale-fr';
import backend_locale_fr from '../translations/external/backend-locale-fr';
import backend_locale_en from '../translations/external/backend-locale-en';
import import_parameters_en from '../translations/external/import-parameters-en';
import import_parameters_fr from '../translations/external/import-parameters-fr';
import { store } from '../redux/store';
import CssBaseline from '@mui/material/CssBaseline';
import { PARAM_THEME } from '../utils/config-params';
import { AppState } from '../redux/reducer';
import { Theme } from '@mui/material';

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
        highlightColor: '#E8E8E8',
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
        highlightColor: '#272727',
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
        ...network_modification_locale_en,
        ...login_en,
        ...top_bar_en,
        ...table_en,
        ...treeview_finder_en,
        ...card_error_boundary_en,
        ...import_parameters_en,
        ...flat_parameters_en,
        ...multiple_selection_dialog_en,
        ...common_button_en,
        ...backend_locale_en,
        ...directory_items_input_en,
        ...element_search_en,
        ...filter_en,
        ...filter_expert_en,
        ...messages_plugins.en, // keep it at the end to allow translation overwriting
    },
    fr: {
        ...messages_fr,
        ...network_modification_locale_fr,
        ...login_fr,
        ...top_bar_fr,
        ...table_fr,
        ...treeview_finder_fr,
        ...card_error_boundary_fr,
        ...import_parameters_fr,
        ...flat_parameters_fr,
        ...multiple_selection_dialog_fr,
        ...common_button_fr,
        ...backend_locale_fr,
        ...element_search_fr,
        ...aggrid_locale_fr, // Only the French locale is needed
        ...directory_items_input_fr,
        ...filter_fr,
        ...filter_expert_fr,
        ...messages_plugins.fr, // keep it at the end to allow translation overwriting
    },
};

const basename = new URL(document.querySelector('base')!.href).pathname;

const AppWrapperWithRedux = () => {
    const computedLanguage = useSelector(
        (state: AppState) => state.computedLanguage
    );
    const theme = useSelector((state: AppState) => state[PARAM_THEME]);
    const themeCompiled = useMemo(
        () => getMuiTheme(theme, computedLanguage),
        [computedLanguage, theme]
    );

    return (
        <IntlProvider
            locale={computedLanguage}
            defaultLocale={LANG_ENGLISH}
            messages={messages[computedLanguage]}
        >
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
};

const AppWrapper = () => {
    return (
        <Provider store={store}>
            <AppWrapperWithRedux />
        </Provider>
    );
};

export default AppWrapper;
