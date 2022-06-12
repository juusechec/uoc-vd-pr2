// var n = 200, // total number of circles
//   m = 10; // number of distinct clusters
// var maxRadius = 12; // 
// // The largest node for each cluster.
// var clusters = new Array(m);

// var nodesClusters = d3.range(n).map(function () {
//   var i = Math.floor(Math.random() * m),
//     r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
//     d = { cluster: i, radius: r };
//   if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
//   return d;
// });

// console.log('nodesClusters', nodesClusters);
// console.log('clusters', clusters);

var originalData;

function redraw() {
  d3.select("#food-waste").selectAll("circle").remove();
  var data = filterDataWithOptions();
  var { nodes, clusters } = getNodesAndClusters(data);
  drawCluster(nodes, clusters);
}

function filterDataWithOptions() {
  var data = originalData;

  var year = d3.select("#year").node().value;
  if (year !== "") {
    data = data.filter(d => d['Year(s)_covered'] == year);
  }

  var sectoral_information = d3.select("#sectoral_information").node().value;
  if (sectoral_information === "Household") {
    data = data.filter(d => d['Household'] == 1);
  } else if (sectoral_information === "Food_Service") {
    data = data.filter(d => d['Food_Service'] == 1);
  } else if (sectoral_information === "Retail") {
    data = data.filter(d => d['Retail'] == 1);
  }

  var region = d3.select("#region").node().value;
  if (region !== "") {
    data = data.filter(d => d['Region'] == region);
  }

  return data;
}

d3.csv("FWD_database.csv", function (data) {
  originalData = data;
  // console.log("data", data);
  // var data = data.slice(1, 10);
  var data = filterDataWithOptions();

  var { nodes, clusters } = getNodesAndClusters(data);
  console.log('clusters', clusters);
  console.log('nodes', nodes);
  drawCluster(nodes, clusters);
});

function getNodesAndClusters(data) {
  var width = 1024;
  var height = 500;

  var clusterArray = [];
  var nodes = [];

  var massMethod = d3.select("#mass-method").node().value;
  var massFieldColumn = "";
  if (massMethod === "total") {
    massFieldColumn = " Standardised_Mass_tonnes/year ";
  } else if (massMethod === "per-capita") {
    massFieldColumn = "Normalised_Mass_Estimate";
  }

  var maxMassTonnes = 0;
  for (var i = 0; i < data.length; i++) {
    var mass = data[i][massFieldColumn].replaceAll(",", "");
    mass = Number(mass);
    if (mass > maxMassTonnes) {
      maxMassTonnes = mass;
    }
  }

  for (var i = 0; i < data.length; i++) {
    // console.log(data[i].Name);
    if (clusterArray.indexOf(data[i].Region) < 0) {
      clusterArray.push(data[i].Region);
    }

    var mass = data[i][massFieldColumn].replaceAll(",", "");
    mass = Number(mass);
    console.log('mass_before', mass);

    var maxRadiusSize;
    var minRadiusSize;
    var log = d3.select("#log").node().value;
    if (log == "Yes") {
      mass = Math.log(mass + 1) / Math.log(maxMassTonnes);
      maxRadiusSize = 50;
      minRadiusSize = 5;
    } else {
      mass = (mass + 1) / maxMassTonnes;
      maxRadiusSize = 100;
      minRadiusSize = 5;
    }
    console.log('mass_after', mass);
    var rad = mass * maxRadiusSize;
    console.log('rad', rad);

    if (isNaN(rad) || rad < minRadiusSize) rad = minRadiusSize;

    var Sectoral_Information = "";
    if (data[i].Household == 1) {
      Sectoral_Information = "Household";
    } else if (data[i].Food_Service == 1) {
      Sectoral_Information = "Food_Service";
    } else if (data[i].Retail == 1) {
      Sectoral_Information = "Retail";
    }

    var Standardised_Mass_tonnes_year = "No disponible";
    if (data[i][" Standardised_Mass_tonnes/year "].trim() !== "") {
      Standardised_Mass_tonnes_year = data[i][" Standardised_Mass_tonnes/year "];
    }

    var Normalised_Mass_Estimate = "No disponible";
    if (data[i]["Normalised_Mass_Estimate"].trim() !== "") {
      Normalised_Mass_Estimate = data[i]["Normalised_Mass_Estimate"];
    }

    var icluster = clusterArray.indexOf(data[i].Region);
    var node = {
      __index: i,
      cluster: icluster,
      radius: rad,
      Country: data[i].Country,
      Region: data[i].Region,
      Standardised_Mass_tonnes_year: Standardised_Mass_tonnes_year,
      Normalised_Mass_Estimate: Normalised_Mass_Estimate,
      Year: data[i]["Year(s)_covered"],
      Sectoral_Information: Sectoral_Information,
    };
    nodes.push(node);
  }

  const numClusters = clusterArray.size;
  var clusters = new Array(numClusters);

  for (let index = 0; index < nodes.length; index++) {
    const icluster = nodes[index].cluster;
    const r = nodes[index].radius;
    //const r = Math.sqrt((icluster + 1) / numClusters * -Math.log(Math.random())) * maxRadius;
    const x = Math.cos(icluster / numClusters * 2 * Math.PI) * 200 + width / 2 + Math.random();
    const y = Math.sin(icluster / numClusters * 2 * Math.PI) * 200 + height / 2 + Math.random();
    //nodes[index].radius = r;
    nodes[index].x = x;
    nodes[index].y = y;
    if (!clusters[icluster] || (r > clusters[icluster].radius)) clusters[icluster] = nodes[index];
    // console.log('node', nodes[index],'r', r, 'x', x, 'y', y);
  }

  // console.log('clusters', clusters);
  // console.log('nodes', nodes);
  return { nodes: nodes, clusters: clusters };
}


function drawCluster(nodes, clusters) {
  var maxRadius = 12;
  var padding = 1.5; // separation between same-color circles
  var clusterPadding = 6; // separation between different-color circles
  var m = clusters.length;

  var showTooltip = function (d) {
    //console.log('d', d);
    tooltip
      .transition()
      .duration(200)
    tooltip
      .style("display", "block")
      .html(`Region ${d.cluster}: ${d.Region}<br>` +
        `Country: ${d.Country}<br>` +
        `Tonnes / year: ${d.Standardised_Mass_tonnes_year}<br>` +
        `kg / capita / year: ${d.Normalised_Mass_Estimate}<br>` +
        `Sectoral Information: ${d.Sectoral_Information}<br>` +
        `Year: ${d.Year}`)
      .style("left", (d3.mouse(this)[0] + 210) + "px")
      .style("top", (d3.mouse(this)[1] + 50) + "px")
  }
  var moveTooltip = function (d) {
    tooltip
      .style("display", "block")
      .style("left", (d3.mouse(this)[0] + 210) + "px")
      .style("top", (d3.mouse(this)[1] + 50) + "px")
  }
  var hideTooltip = function (d) {
    tooltip
      .transition()
      .duration(200)
      .style("display", "none")
  }

  var color = d3.scale.category10()
    .domain(d3.range(m));

  var svg = d3.select("#food-waste")
    .style("background-color", "#455ca8");

  var width = +svg[0][0].getAttribute("width");
  var height = +svg[0][0].getAttribute("height");

  var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(0)
    .charge(0)
    .on("tick", tick)
    .start();

  var tooltip = d3.select("#tooltip")
    .style("display", "none")
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white");

  var circle = svg.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("r", function (d) { return d.radius; })
    .style("fill", function (d) { return color(d.cluster); })
    .on("mouseover", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .call(force.drag);

  function tick(e) {
    circle
      .each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; });
  }

  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function (d) {
      var cluster = clusters[d.cluster],
        k = 1;

      // console.log('d', d, 'cluster', cluster, 'width', width, 'height', height);

      // For cluster nodes, apply custom gravity.
      if (cluster === d) {
        cluster = { x: width / 2, y: height / 2, radius: -d.radius };
        k = .1 * Math.sqrt(d.radius);
      }

      var x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha * k;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function (d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit(function (quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
}

