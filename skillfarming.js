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

        // plex price with tax
        var brokerRate = brokerPercents[localStorage["broker-relations-skill-level"]];
        var plexBuy = parseFloat(localStorage.plexBuy);
        var brokerFee = plexBuy * brokerRate;
        localStorage.setItem("plexBuyTax", plexBuy + brokerFee);
        $("#plex-buy-tax").val(parseFloat(localStorage.plexBuyTax).toLocaleString("en-US", iskOptions));



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

        // extractor price with tax
        var brokerRate = brokerPercents[localStorage["broker-relations-skill-level"]];
        var extractorBuy = parseFloat(localStorage.extractorBuy);
        var brokerFee = extractorBuy * brokerRate;
        localStorage.setItem("extractorBuyTax", extractorBuy + brokerFee);
        $("#extractor-buy-tax").val(parseFloat(localStorage.extractorBuyTax).toLocaleString("en-US", iskOptions));


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

        // injector price with tax
        var brokerRate = brokerPercents[localStorage["broker-relations-skill-level"]];
        var transactionRate = accountingPercents[localStorage["accounting-skill-level"]];
        var injectorSell = parseFloat(localStorage.injectorSell);
        var brokerFee = injectorSell * brokerRate;
        var transactionFee = injectorSell * transactionRate
        localStorage.setItem("injectorSellTax", injectorSell + brokerFee + transactionFee);
        $("#injector-sell-tax").val(parseFloat(localStorage.injectorSellTax).toLocaleString("en-US", iskOptions));


    }
};
request.open("GET",
    "http://api.eve-central.com/api/marketstat" + "?" +
    "typeid="    + items["plex"]      + "&" +
    "typeid="    + items["extractor"] + "&" +
    "typeid="    + items["injector"]  + "&" +
    "usesystem=" + systems["jita"]
);
request.send();



// monitor user inputs and if they change, save them to localStorage

$("#sp-per-hour").on("input", function() {
    localStorage.setItem("sp-per-hour", $(this).val())
});

$("#accounting-skill-level").on("change", function() {
    localStorage.setItem("accounting-skill-level", $(this).val())
});

$("#broker-relations-skill-level").on("change", function() {
    localStorage.setItem("broker-relations-skill-level", $(this).val())
});


// check if localStorage has any saved user-input values - if it does,
// substitute them for the default form values

if (localStorage.getItem("sp-per-hour") === null) {
} else {
    $("#sp-per-hour").val(localStorage.getItem("sp-per-hour"));
}

if (localStorage.getItem("accounting-skill-level") === null) {
} else {
    $("#accounting-skill-level").val(localStorage.getItem("accounting-skill-level"));
}

if (localStorage.getItem("broker-relations-skill-level") === null) {
} else {
    $("#broker-relations-skill-level").val(localStorage.getItem("broker-relations-skill-level"));
}
