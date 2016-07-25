// basic IDs that are useful
// systems: http://eve-marketdata.com/developers/solarsystems.php
items = {
    plex: 29668,
    extractor: 40519,
    injector: 40520,
};

systems = {
    jita: 30000142,
    perimeter: 30000144,
};

accountingPercents = [
    0.02,
    0.018,
    0.016,
    0.014,
    0.012,
    0.01,
]

brokerPercents = [
    0.03,
    0.027,
    0.024,
    0.021,
    0.018,
    0.015,
]



var iskOptions = {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}

function updateCalculatedFields() {
    var brokerRate = brokerPercents[localStorage["broker-relations-skill-level"]];
    var transactionRate = accountingPercents[localStorage["accounting-skill-level"]];
    var brokerFee;
    var transactionFee;

    // plex price with tax
    var plexBuy = parseFloat(localStorage.plexBuy);
    brokerFee = plexBuy * brokerRate;
    localStorage.setItem("plexBuyTax", plexBuy + brokerFee);
    $("#plex-buy-tax").val(parseFloat(localStorage.plexBuyTax).toLocaleString("en-US", iskOptions));

    // extractor price with tax
    var extractorBuy = parseFloat(localStorage.extractorBuy);
    brokerFee = extractorBuy * brokerRate;
    localStorage.setItem("extractorBuyTax", extractorBuy + brokerFee);
    $("#extractor-buy-tax").val(parseFloat(localStorage.extractorBuyTax).toLocaleString("en-US", iskOptions));

    // injector price with tax
    var injectorSell = parseFloat(localStorage.injectorSell);
    brokerFee = injectorSell * brokerRate;
    transactionFee = injectorSell * transactionRate;
    localStorage.setItem("injectorSellTax", injectorSell - (brokerFee + transactionFee));
    $("#injector-sell-tax").val(parseFloat(localStorage.injectorSellTax).toLocaleString("en-US", iskOptions));

    // injectors per month
    var spPerHour = parseFloat(localStorage.getItem("sp-per-hour"));
    var spPerMonth = spPerHour * 24 * 30;
    var injectorsPerMonth = spPerMonth / 500000;
    $("#injectors-per-month").val(injectorsPerMonth);
    console.log(injectorsPerMonth);

    // monthly extractor cost
    var monthlyExtractorCost = parseFloat(localStorage.extractorBuyTax) * injectorsPerMonth;
    $("#monthly-extractor-cost").val(monthlyExtractorCost.toLocaleString("en-US", iskOptions));

    // monthly injector revenue
    var monthlyInjectorRevenue = parseFloat(localStorage.injectorSellTax) * injectorsPerMonth;
    $("#monthly-injector-revenue").val(monthlyInjectorRevenue.toLocaleString("en-US", iskOptions));

    // monthly net profit
    var monthlyNetProfit = monthlyInjectorRevenue - (monthlyExtractorCost + parseFloat(localStorage.plexBuyTax));
    $("#monthly-net-profit").val(monthlyNetProfit.toLocaleString("en-US", iskOptions));

};

var request = new XMLHttpRequest();
request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
        console.log(request.responseXML);

        // save plex price
        localStorage.setItem("plexBuy",
            parseFloat(
                request.responseXML
                       .getElementsByTagName("buy")[0]
                       .getElementsByTagName("max")[0]
                       .childNodes[0]
                       .nodeValue
            ));
        $("#plex-buy").val(parseFloat(localStorage.plexBuy).toLocaleString("en-US", iskOptions));

        // save extractor price
        localStorage.setItem("extractorBuy",
            parseFloat(
                request.responseXML
                       .getElementById("40519")
                       .getElementsByTagName("buy")[0]
                       .getElementsByTagName("max")[0]
                       .childNodes[0]
                       .nodeValue
            ));
        $("#extractor-buy").val(parseFloat(localStorage.extractorBuy).toLocaleString("en-US", iskOptions));

        // save injector price
        localStorage.setItem("injectorSell",
            parseFloat(
                request.responseXML
                       .getElementById("40520")
                       .getElementsByTagName("sell")[0]
                       .getElementsByTagName("min")[0]
                       .childNodes[0]
                       .nodeValue
            ));
        $("#injector-sell").val(parseFloat(localStorage.injectorSell).toLocaleString("en-US", iskOptions));

        updateCalculatedFields();
    }
};
request.open("GET",
    "https://api.eve-central.com/api/marketstat" + "?" +
    "typeid="    + items["plex"]      + "&" +
    "typeid="    + items["extractor"] + "&" +
    "typeid="    + items["injector"]  + "&" +
    "usesystem=" + systems["jita"]
);
request.send();



// listen to user inputs and if they change, save them to localStorage

$("#sp-per-hour").on("input", function() {
    localStorage.setItem("sp-per-hour", $(this).val())
});

$("#accounting-skill-level").on("change", function() {
    localStorage.setItem("accounting-skill-level", $(this).val())
});

$("#broker-relations-skill-level").on("change", function() {
    localStorage.setItem("broker-relations-skill-level", $(this).val())
});


// listens to changes on user inputs and if they change, update calc'ed values
$(".user-input").on('keyup change', function() {
    updateCalculatedFields();
});





//-----------------------------------------------





// values from Eve that don't change
var constants = {
    itemIDs: {plex: 29668, extractor: 40519, injector: 40520,},
    systemIDs: {jita: 30000142, perimeter: 30000144,},
    accountingRate: [0.02, 0.018, 0.016, 0.014, 0.012, 0.01,],
    brokerRate: [0.03, 0.027, 0.024, 0.021, 0.018, 0.015,],
};

// initialize the user inputs state to default values
var userInputs = {
    spPerHour: 2700,
    accountingSkillLevel: 4,
    brokerRelationsSkillLevel: 4,
    plex: "buy",
    extractor: "buy",
    injector: "sell",
}

// read/initialize local storage for all user input keys
for (key in userInputs) {
    // if the key IS NOT in local storage
    if (localStorage.getItem(key) === null) {
        // store the default value into local storage
        localStorage[key] = userInputs[key];
    // if the key IS in local storage
    } else {
        // use the local storage value in the state instead of the default
        userInputs[key] = localStorage[key];
    }
}

new Vue({
    el: "#app",
    data: {
        state: userInputs,
        plex: {buy: "DEADBEEF", sell: "DEADBEEF",},
        extractor: {buy: "DEADBEEF", sell: "DEADBEEF",},
        injector: {buy: "DEADBEEF", sell: "DEADBEEF",},
    },
    computed: {

    },
    methods: {
        tax: function(capital, orderType) {
            if (orderType === "buy") {
                return capital * constants.brokerRate[this.state.brokerRelationsSkillLevel];
            } else if (orderType === "sell") {
                return capital * constants.brokerRate[this.state.brokerRelationsSkillLevel] +
                    capital * constants.accountingRate[this.state.accountingSkillLevel];
            } else {
                console.log("Unexpected orderType");
            }
        },
        swapItemOrderTypeState: function(itemName) {
            if (this.state[itemName] === "buy") {
                this.state[itemName] = "sell";
                localStorage["state-" + itemName] = "sell";
            } else if (this.state[itemName] === "sell") {
                this.state[itemName] = "buy";
                localStorage["state-" + itemName] = "buy";
            } else {
                console.log("Unexpected ItemOrderTypeState");
            }
        },
        setUserInput: function(key, value) {
            this.state[key] = value;
            localStorage[key] = value;
        },
    },
});
