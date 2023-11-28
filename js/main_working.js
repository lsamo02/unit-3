//begin script when window loads
window.onload = setMap;

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
    height = 500;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);


    var projection = d3.geoRobinson()
        .scale(150)
        .translate([width / 2, height / 2])
            .rotate([180,0])
        .precision(.1);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv"));                    
    promises.push(d3.json("data/BackgroundCountries.topojson"));                   
    promises.push(d3.json("data/Top15MostPopulousCountries.topojson"));                                     
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            allCountries = data[1],
            topFifteen = data[2];
        console.log(csvData);
        console.log(allCountries);
        console.log(topFifteen);


        // if (typeof allCountries !== 'undefined' && allCountries !== null && typeof topFifteen !== 'undefined' && topFifteen !== null) {
        //     // Now it's safe to access allCountries.objects.worldCountries and topFifteen.objects.selectCountries
        //     var worldCountries = topojson.feature(allCountries, allCountries.objects.worldCountries),
        //         selectCountries = topojson.feature(topFifteen, topFifteen.objects.selectCountries).features;
        // } else {
        //     console.error('allCountries or topFifteen is not defined');
        // }

        var worldCountries = allCountries;
        var selectCountries = topFifteen, topFifteen;


        //add Europe countries to map
        var countries = map.append("path")
            .datum(worldCountries)
            .attr("class", "countries")
            .attr("d", path);

        //add France regions to map
        var regions = map.selectAll(".regions")
            .data(selectCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.Country_Code;
            })
            .attr("d", path);
    }
};
