// https://d3-graph-gallery.com/graph/bubblemap_template.html
// Geocoding: https://flowmap.blue/geocoding
(function () {
  var width = 1024;
  var height = 630;

  var svg = d3v4.select("#food-waste-map")
    .attr("width", width)
    .attr("height", height);

  // Map and projection
  var projection = d3v4.geoMercator()
    .center([0, 20])                // GPS of location to zoom on
    .scale(99)                       // This is like the zoom
    .translate([width / 2, height / 2])

  d3v4.queue()
    .defer(d3v4.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // World shape
    .defer(d3v4.csv, "Countries_Location.csv") // Position of circles
    .await(ready);

  // https://carto.com/carto-colors/
  const regionColor = {
    'Australia and New Zealand': '#7F3C8D',
    'Western Europe': '#11A579',
    'Northern Europe': '#3969AC',
    'Southern Europe': '#F2B701',
    'Western Asia': '#E73F74',
    'Southern Asia': '#80BA5A',
    'Latin America and the Caribbean': '#E68310',
    'Northern America': '#008695',
    'Eastern Asia': '#CF1C90',
    'Sub-Saharan Africa': '#f97b72',
    'Eastern Europe': '#4b4b8f',
    'South-eastern Asia': '#A5AA99',
    '': '#FFFF00',
  }

  window.updateMapDraw = function () {
    // console.log("recargar");

    let maxRadius = 0;
    const data = locationsData;
    let dataset = window.originalData;
    var sectoral_information2 = d3v4.select("#sectoral_information2").node().value;
    if (sectoral_information2 === "Household") {
      dataset = dataset.filter(d => d['Household'] == 1);
    } else if (sectoral_information2 === "Food_Service") {
      dataset = dataset.filter(d => d['Food_Service'] == 1);
    } else if (sectoral_information2 === "Retail") {
      dataset = dataset.filter(d => d['Retail'] == 1);
    }

    var dataMethod = d3v3.select("#data-method2").node().value;
    var radiusFieldColumn;
    if (dataMethod === "total") {
      radiusFieldColumn = " Standardised_Mass_tonnes/year ";
    } else if (dataMethod === "per-capita") {
      radiusFieldColumn = "Final_kg/cap/yr_estimate";
    }
    // console.log('dataset', dataset);

    for (let index = 0; index < data.length; index++) {
      const country = data[index];
      country.radius = dataset.filter(d => d.Country == country.id).map(d => Number(d[radiusFieldColumn].replaceAll(",", "")));
      // country.radius = country.radius.reduce((a, b) => a + b, 0) / country.radius.length;
      // console.log('country.radius1', country.radius);
      country.radius = Math.max(...country.radius.filter(d => !isNaN(d)));
      // console.log('country.radius2', country.radius);
      country.radius = country.radius === -Infinity ? 0 : country.radius;
      if (country.radius > maxRadius) {
        maxRadius = country.radius;
      }
      let region = dataset.find(d => d.Country == country.id);
      // console.log('region', region);
      region = region?.Region ? region.Region : '';
      // console.log('region2', region);
      country.color = regionColor[region];
    }

    // " Standardised_Mass_tonnes/year "
    svg.selectAll("circle[data-type='map']").remove();

    // Add circles:
    svg
      .selectAll("myCircles")
      // .data(data.sort(function (a, b) { return +b.n - +a.n }).filter(function (d, i) { return i < 1000 }))
      .data(data)
      .enter()
      .append("circle")
      .attr("data-type", "map")
      .attr("cx", function (d) { return projection([+d.lon, +d.lat])[0] })
      .attr("cy", function (d) { return projection([+d.lon, +d.lat])[1] })
      // .attr("r", function (d) { return size(10/*+d.n*/) })
      .attr("r", function (d) { return (d.radius / maxRadius) * 25 })
      .style("fill", function (d) { return d.color })
      // .style("fill", "#f5ea4c")
      .style("stroke", "black")
      // .attr("stroke", function (d) { if (d.n > 2000) { return "black" } else { return "none" } })
      .attr("stroke-width", 1)
      .attr("fill-opacity", .5)
  }

  var locationsData;
  function ready(error, dataGeo, data) {
    locationsData = data;

    // Create a color scale
    // var allContinent = d3v4.map(data, function (d) { return (d.homecontinent) }).keys()
    // var color = d3v4.scaleOrdinal()
    //   .domain(allContinent)
    //   .range(d3v4.schemePaired);

    // Add a scale for bubble size
    // var valueExtent = d3v4.extent(data, function (d) { return +d.n; })
    // var size = d3v4.scaleSqrt()
    //   .domain(valueExtent)  // What's in the data
    //   .range([1, 50])  // Size in pixel

    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(dataGeo.features)
      .enter()
      .append("path")
      .attr("fill", "#b8b8b8")
      .attr("d", d3v4.geoPath()
        .projection(projection)
      )
      .style("stroke", "none")
      .style("opacity", .3)

    window.updateMapDraw();

    // Add title and explanation
    // svg
    //   .append("text")
    //   .attr("text-anchor", "end")
    //   .style("fill", "black")
    //   .attr("x", width - 10)
    //   .attr("y", height - 30)
    //   .attr("width", 90)
    //   .html("WHERE SURFERS LIVE")
    //   .style("font-size", 14)


    // --------------- //
    // ADD LEGEND //
    // --------------- //

    // Add legend: circles
    // https://medium.com/code-kings/adding-legend-to-d3-chart-b06f2ae8667
    var valuesToShow = Object.keys(regionColor).filter(d => d !== '');
    var offsetY = 100;
    var offsetXCircle = 40;
    var offsetXLabel = 60;
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("circle")
      .attr("cx", offsetXCircle)
      .attr("cy", function (d, i) { return (height - offsetY) - (i * 20) })
      .attr("r", function (d) { return 9 })
      .style("fill", d => regionColor[d])
      .attr("stroke", "black")

    // Add legend: segments
    // svg
    //   .selectAll("legend")
    //   .data(valuesToShow)
    //   .enter()
    //   .append("line")
    //   .attr('x1', function (d) { return xCircle + size(d) })
    //   .attr('x2', xLabel)
    //   .attr('y1', function (d) { return height - size(d) })
    //   .attr('y2', function (d) { return height - size(d) })
    //   .attr('stroke', 'black')
    //   .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("text")
      .attr('x', offsetXLabel)
      .attr('y', function (d, i) { return (height - (offsetY - 6)) - (i * 20) })
      .text(function (d) { return d })
      .style("font-size", 10)
      .attr('alignment-baseline', 'middle')
  }


})()