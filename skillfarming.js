// basic IDs that are useful
// systems: http://eve-marketdata.com/developers/solarsystems.php
var typeIdPlex = 29668;
var systemIdPerimeter = 30000144;
var systemIdJita = 30000142;

items = [
    29668,  // plex
    40519,  // extractor
    40520,  // injector
];

systems = {
    "jita": 30000142,
    "perimeter": 30000144
};

/**
 * Given an array of elements, prepends each of them with a parameter name and
 * returns a concatenated string separated by &s.
 *
 * Example:
 * var elements = [12, 34, 56];
 * var paramName = "foo";
 * returns "foo=12&foo=34&foo=56&"
 */
// function makeArgString(paramName, elements) {
//     for (i in elements) {
//         elements[i] = paramName + "=" + elements[i] + "&";
//     }
//     return elements.join("");
// };



// function marketstat(typeid, usesystem) {

//     var marketstatString = "http://api.eve-central.com/api/marketstat?";
//     var muhstring = marketstatString + "?typeid=" + typeid + "&usesystem=" + usesystem;
//     var request = new XMLHttpRequest();
    
//     console.log(muhstring);
//     request.open("GET", muhstring, true);
    
//     console.log(request.responseXML)
//     return request.responseXML;
// };

var request = new XMLHttpRequest();
request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
        console.log(request.responseXML);

        var plexBuy = request
                .responseXML
                .getElementsByTagName("buy")[0]
                .getElementsByTagName("max")[0]
                .childNodes[0]
                .nodeValue;

        document.getElementById("plex-buy").innerHTML = plexBuy;

        console.log(plexBuy);
    }
};
request.open("GET", "http://api.eve-central.com/api/marketstat?typeid=29668&usesystem=30000142");
request.send();
