/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import App from './app';
import React from 'react';
import {
    createTheme,
    ThemeProvider,
    StyledEngineProvider,
} from '@mui/material/styles';
import {
    CardErrorBoundary,
    LIGHT_THEME,
    login_en,
    login_fr,
    SnackbarProvider,
    top_bar_en,
    top_bar_fr,
    table_fr,
    table_en,
    treeview_finder_fr,
    treeview_finder_en,
    card_error_boundary_fr,
    card_error_boundary_en,
    flat_parameters_en,
    flat_parameters_fr,
    multiple_selection_dialog_en,
    multiple_selection_dialog_fr,
    common_button_en,
    common_button_fr,
    directory_items_input_fr,
    directory_items_input_en,
    element_search_fr,
    element_search_en,
    filter_fr,
    filter_en,
} from '@gridsuite/commons-ui';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import messages_en from '../translations/en.json';
import messages_fr from '../translations/fr.json';
import network_modification_locale_en from '../translations/dynamic/network-modifications-locale-en';
import network_modification_locale_fr from '../translations/dynamic/network-modifications-locale-fr';
import messages_plugins_en from '../plugins/translations/en.json';
import messages_plugins_fr from '../plugins/translations/fr.json';
import aggrid_locale_fr from '../translations/external/aggrid-locale-fr';
import backend_locale_fr from '../translations/external/backend-locale-fr';
import backend_locale_en from '../translations/external/backend-locale-en';
import import_parameters_en from '../translations/external/import-parameters-en';
import import_parameters_fr from '../translations/external/import-parameters-fr';
import { store } from '../redux/store';
import CssBaseline from '@mui/material/CssBaseline';
import { PARAM_THEME } from '../utils/config-params';

let lightTheme = createTheme({
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
    aggrid: 'ag-theme-alpine',
    agGridBackground: {
        color: 'white',
    },
    typography: {
        button: {
            textTransform: 'none',
        },
    },
});

lightTheme = createTheme(lightTheme, {
    palette: {
        cancelButtonColor: {
            main: lightTheme.palette.text.secondary,
        },
    },
    components: {
        CancelButton: {
            defaultProps: {
                color: 'cancelButtonColor',
            },
        },
    },
});

let darkTheme = createTheme({
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
    aggrid: 'ag-theme-alpine-dark',
    agGridBackground: {
        color: '#383838',
    },
    typography: {
        button: {
            textTransform: 'none',
        },
    },
});

darkTheme = createTheme(darkTheme, {
    palette: {
        cancelButtonColor: {
            main: darkTheme.palette.text.secondary,
        },
    },
    components: {
        CancelButton: {
            defaultProps: {
                color: 'cancelButtonColor',
            },
        },
    },
});

const getMuiTheme = (theme) => {
    if (theme === LIGHT_THEME) {
        return lightTheme;
    } else {
        return darkTheme;
    }
};

const messages = {
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
        ...messages_plugins_en, // keep it at the end to allow translation overwritting
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
        ...aggrid_locale_fr, // Only the french locale is needed
        ...directory_items_input_fr,
        ...filter_fr,
        ...messages_plugins_fr, // keep it at the end to allow translation overwritting
    },
};

const basename = new URL(document.querySelector('base').href).pathname;

const AppWrapperWithRedux = () => {
    const computedLanguage = useSelector((state) => state.computedLanguage);

    const theme = useSelector((state) => state[PARAM_THEME]);

    return (
        <IntlProvider
            locale={computedLanguage}
            messages={messages[computedLanguage]}
        >
            <BrowserRouter basename={basename}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={getMuiTheme(theme)}>
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
