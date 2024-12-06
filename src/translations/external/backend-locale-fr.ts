/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const BackendLocaleFr = {
    DIE: 'ARCADE',
    XIIDM: 'XIIDM',
    CGMES: 'CGMES',
    'PSS/E': 'PSS/E',
    UCTE: 'UCTE',
    MATPOWER: 'MATPOWER',
    POWERFACTORY: 'POWERFACTORY',
    'IEEE CDF': 'IEEE CDF',
    EXPERT_FILTER: 'Filtre (Par critères)',
    FORM_FILTER: 'Filtre (Formulaire)',
    IDENTIFIERS_CONTINGENCY_LIST: "Liste d'aléas (Par nommage)",
    FORM_CONTINGENCY_LIST: "Liste d'aléas (Par critères)",
    SCRIPT_FILTER: 'Filtre (Script)',
    SCRIPT_CONTINGENCY_LIST: "Liste d'aléas (Script)",
    IDENTIFIER_LIST_FILTER: 'Filtre (Par nommage)',

    // spreadsheet config metadata
    Load: 'Consommation',
    Generator: 'Groupe',
    Battery: 'Batterie',
    Line: 'Ligne',
    Two_windings_transformer: 'Transfo à 2 enroulements',
    Three_windings_transformer: 'Transfo à 3 enroulements',
    Busbar_section: 'Section de jeux de barre',
    Bus: 'Noeud électrique',
    Dangling_line: 'Ligne frontière',
    Hvdc_line: 'Ligne HVDC',
    Lcc_converter_station: 'Station de conversion LCC',
    Vsc_converter_station: 'Station de conversion VSC',
    Static_var_compensator: 'CSPR',
    Voltage_level: 'Poste',
    Tie_line: 'Interconnexion',
    Shunt_compensator: 'Moyen de compensation',
    Substation: 'Site',
};

export default BackendLocaleFr;
