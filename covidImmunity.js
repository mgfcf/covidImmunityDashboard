var regionId = undefined;
var region = undefined;
var population = 0;
var r0 = 3.3;   // 2.4-3.3, based on https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Steckbrief.html#doc13776792bodyText3
var unknownMultiplier = 10;

var covidData = {};
var data = {
    confirmed: 0,
    deaths: 0,
    regionName: 0,
    last_update: undefined
}

// Based on https://covid-api.com/
function loadCovidData(callback, callbackArgs) {
    var api_url = 'https://covid-api.com/api/reports?q=' + region.api_query;
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterday_string = yesterday.getUTCFullYear() + "-" +
        ("0" + (yesterday.getUTCMonth() + 1)).slice(-2) + "-" +
        ("0" + yesterday.getUTCDate()).slice(-2);
    if (region.api_query == 'total') {
        api_url = 'https://covid-api.com/api/reports/total?date=' + yesterday_string
    }

    return fetch(api_url)
        .then(response => { return response.json(); })
        .then(json => {
            if (region.api_query == 'total')
                covidData = json.data;
            else
                covidData = json.data[0];

            data.confirmed = covidData.confirmed;
            data.deaths = covidData.deaths;
            if (region.api_query == 'total') {
                data.regionName = 'Earth';
                data.last_update = yesterday_string;
            } else {
                data.regionName = covidData.region.name;
                data.last_update = covidData.last_update;
            }

            population = region.population;

            if (callback !== undefined)
                callback(callbackArgs);
        });
}

function getImmune() {
    return (data.confirmed - data.deaths) * unknownMultiplier;
}

function getImmunityProgress() {
    return getImmunity() / getMinRequiredImmunity();
}

function getImmunity() {
    return getImmune() / (population - data.deaths * unknownMultiplier);
}

// Based on https://de.wikipedia.org/wiki/Herdenimmunit%C3%A4t#Eigenschaften
function getMinRequiredImmunity() {
    return (1 - (1 / r0));
}

function updateStats(collect = true) {
    if (collect && getValue("region_ia") !== undefined)
        collectInteractiveData();

    var decimalPlaces = 2;
    setText("r0", r0);
    setText("progress", (getImmunityProgress() * 100).toFixed(decimalPlaces) + "%");
    setText("population", population);
    setText("region", regionId);
    setText("real_deaths", data.deaths * unknownMultiplier);
    setText("unknown", unknownMultiplier);
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
            dom.innerHTML = value;
    });

}

function collectInteractiveData() {
    regionId = getValue("region_ia");
    region = countries[regionId];
    population = Number(getValue("population_ia"));
    r0 = Number(getValue("r0_ia"));
    data.confirmed = Number(getValue("confirmed_ia"));
    data.deaths = Number(getValue("deaths_ia"));
    unknownMultiplier = Number(getValue("unknown_ia"));
}

function getValue(id) {
    return document.getElementById(id).value;
}

function initStats() {
    regionId = "Earth";
    region = countries[regionId];
    r0 = 3.3;
    unknownMultiplier = 10;

    loadCovidData(updateStats, false);
}

function refreshStats() {
    regionId = getValue("region_ia");
    region = countries[regionId];
    loadCovidData(updateStats, false);
}

function onenter(event, callback) {
    if (event.key == "Enter")
        callback();
}

function initCountries() {
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