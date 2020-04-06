var regionId = "Germany";
var region = {'population': 83149300, 'api_query': 'Germany'};
var population = 0;
var r0 = 3.3;   // 2.4-3.3, based on https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Steckbrief.html#doc13776792bodyText3
var unknownMultiplier = 10;

var covidData = {};
var data = {
    total: 0,
    active: 0,
    recovered: 0,
    deaths: 0,
    fatality: 0,
    regionName: 0,
    regionIso: 0
}

// Based on https://covid-api.com/
function initialCovidData (callback, callbackArgs) {
    return fetch("https://covid-api.com/api/reports?q=" + region.api_query)
        .then(response => { return response.json(); })
        .then(json => {
            covidData = json.data[0];

            data.total = covidData.confirmed;
            data.active = covidData.active;
            data.deaths = covidData.deaths;
            data.recovered = covidData.recovered;
            data.fatality = covidData.fatality_rate;
            data.regionIso = covidData.region.iso;
            data.regionName = covidData.region.name;

            population = region.population;

            if (callback !== undefined)
                callback(callbackArgs);
        });
}

function getUnknownActive () {
    return (data.active) * unknownMultiplier;
}

function getImmune () {
    return (data.active + data.recovered) * unknownMultiplier;
}

function getImmunityProgress () {
    return getImmunity() / getMinRequiredImmunity();
}

function getImmunity () {
    return getImmune() / (population - data.deaths);
}

// Based on https://de.wikipedia.org/wiki/Herdenimmunit%C3%A4t#Eigenschaften
function getMinRequiredImmunity () {
    return (1 - (1 / r0));
}

function updateStats(collect = true) {
    if (collect && getValue("region_ia") !== undefined)
        collectInteractiveData();

    var decimalPlaces = 2;
    setText("timestamp", covidData.last_update);
    setText("r0", r0);
    setText("progress", (getImmunityProgress() * 100).toFixed(decimalPlaces) + "%");
    setText("population", population);
    setText("region", regionId);
    setText("unknown", unknownMultiplier);
    setText("unknown_active", getUnknownActive());
    setText("immune", getImmune());
    setText("immunity", (getImmunity() * 100).toFixed(decimalPlaces) + "%");
    setText("min_immunity", (getMinRequiredImmunity() * 100).toFixed(decimalPlaces) + "%");

    Object.keys(data).forEach(k => {
        setText(k, data[k]);
    });
}

function setText(valueId, value) {
    Object.values(document.querySelectorAll("[data-value-id='" + valueId + "']")).forEach(dom => {
        if (dom.nodeName == "INPUT" ||
            dom.nodeName == "SELECT")
            dom.value = value;
        else
            dom.innerHTML  = value;
    });

}

function collectInteractiveData () {
    regionId = getValue("region_ia");
    region = countries[regionId];
    population = Number(getValue("population_ia"));
    r0 = Number(getValue("r0_ia"));
    data.active = Number(getValue("active_ia"));
    data.recovered = Number(getValue("recovered_ia"));
    data.deaths = Number(getValue("deaths_ia"));
    unknownMultiplier = Number(getValue("unknown_ia"));
}

function getValue(id) {
    return document.getElementById(id).value;
}

function initStats () {
    regionId = "Germany";
    region = {'population': 83149300, 'api_query': 'Germany'};

    initialCovidData(updateStats, false);
}

function refreshStats () {
    regionId = getValue("region_ia");
    region = countries[regionId];
    initialCovidData(updateStats, false);
}

function onenter (event, callback) {
    if (event.key == "Enter")
        callback();
}

function initCountries () {
    var availableCountries = Object.keys(countries);

    var container = document.getElementById("region_ia");
    availableCountries.forEach(country => {
        var option = document.createElement("option");
        option.innerText = country;
        option.value = country;

        container.appendChild(option);
    });
    container.value = regionId;
}