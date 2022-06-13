// https://openjicareport.jica.go.jp/pdf/12126843.pdf?page=75
d3.csv("Composition of Household Solid Waste.csv").then(function (data) {
  console.log('data composition', data);

  const categoryList = {
    'Food': {
      'image': 'Food.svg',
      'color': '#66C5CC',
    },
    'Gardening': {
      'image': 'Gardening.svg',
      'color': '#F6CF71',
    },
    'Paper and cardboard': {
      'image': 'Paper and cardboard.svg',
      'color': '#F89C74',
    },
    'Plastics': {
      'image': 'Plastics.svg',
      'color': '#DCB0F2',
    },
    'Rubber and Leather': {
      'image': 'Rubber and Leather.svg',
      'color': '#87C55F',
    },
    'Textiles': {
      'image': 'Textiles.svg',
      'color': '#9EB9F3',
    },
    'Wood': {
      'image': 'Wood.svg',
      'color': '#FE88B1',
    },
    'Metallic products': {
      'image': 'Metallic products.svg',
      'color': '#C9DB74',
    },
    'Glass': {
      'image': 'Glass.svg',
      'color': '#8BE0A4',
    },
    'Ceramic-based, ash, others': {
      'image': 'Ceramic-based.svg',
      'color': '#B497E7',
    },
    'Household hazardous waste': {
      'image': 'Household hazardous waste.svg',
      'color': '#D3B484',
    },
    'Other waste not included on this list': {
      'image': 'Other waste not included on this list.svg',
      'color': '#B3B3B3',
    },
    'Total': {
      'image': 'Total.svg',
      'color': '#B3B3B3',
    },
  };

  var nodes = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    if (row['Category'] === 'Total') continue;
    if (row['Sub-category'] === 'Total') continue;
    const node = {};
    const area = Number(row.Global);
    node.radius = Math.sqrt(area/3.1416) * 43;
    node.text = row['Category'] + ': ' + row['Sub-category'];
    node.image = categoryList[row['Category']].image;
    node.color = categoryList[row['Category']].color;
    node.value = row['Global'];
    nodes.push(node);
  }

  var width = 1024;
  var height = 800;

  console.log('d3.version', d3.version)

  var svg = d3.select("#food-waste-col")
    .attr("width", width)
    .attr("height", height);

  // var valuesToShow = [1];
  var offsetXBigCircle = width / 2;
  var offsetYBigCircle = height / 2;
  svg
    // .selectAll("bigCircle")
    // .data(valuesToShow)
    // .enter()
    .append("circle")
    .attr("cx", offsetXBigCircle)
    .attr("cy", offsetYBigCircle)
    .attr("r", 350)
    .style("fill", "transparent")
    .attr("stroke", "#eee")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "0.3 4")
    .attr("stroke-linecap", "round");


  var tooltip = d3.select("#tooltip2")
    // .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip2")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white")

  // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
  const showTooltip = function (event, d) {
    console.log("Tooltip");
    tooltip
      .transition()
      .duration(200)
    tooltip
      .style("opacity", 1)
      .html(`Percentage: ${d.value}<br>Categoria -> ${d.text}`)
      .style("left", (event.x) / 2 + 300 + "px")
      .style("top", (event.y) / 2 + 1800 + "px")
  }
  const moveTooltip = function (event, d) {
    tooltip
      .style("left", (event.x) / 2 + 300 + "px")
      .style("top", (event.y) / 2 + 1800 + "px")
  }
  const hideTooltip = function (event, d) {
    tooltip
      .transition()
      .duration(200)
      .style("opacity", 0)
  }

  //https://www.d3indepth.com/force-layout/

  // var numNodes = 10
  // var nodes = d3.range(numNodes).map(function (d) {
  //   return { radius: Math.random() * 25 }
  // })

  var simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(5))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(function (d) {
      return d.radius
    }))
    .on('tick', ticked)
    .velocityDecay(0.6);

  function ticked() {
    var u = svg
      .selectAll('circle[data-type="inside"]')
      .data(nodes)
      .join('circle')
      .attr("data-type", "inside")
      .style("fill", (d) => d.color)
      .attr('r', (d) => d.radius)
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip)

    addImageAndText();
  }

  function splitText(textInput) {
    if (textInput.trim() === "") return [textInput];
    let splitString = [];
    for (let i = 0; i < textInput.length; i = i + 18) {
      splitString.push(textInput.slice(i, i + 18));
    }

    return splitString;
  }

  function addImageAndText() {
    const circles = svg
      .selectAll('circle[data-type="inside"]');

    svg.selectAll("g").remove();

    const circleNodes = circles.nodes();

    const g = svg
      .selectAll("myG")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        const c = circleNodes[i];
        d.c = c;
        const x = c.getAttribute("cx") - (c.getAttribute("r") / 2);
        const y = c.getAttribute("cy") - (c.getAttribute("r") / 2);
        return `translate(${x},${y})`;
      })
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);

    var image = g.append('image')
      .attr("dx", (d) => d.c.getAttribute("r"))
      .attr("dy", (d) => d.c.getAttribute("r"))
      .attr("width", (d) => d.c.getAttribute("r"))
      .attr("height", (d) => d.c.getAttribute("r"))
      .attr("xlink:href", (d) => `assets/svg/${d.image}`);

    var text = g.append('text')
      .attr("fill", "#f5ea4c")
      .attr("dx", function (d) {
        const w = this.getBoundingClientRect().x;
        // console.log('text w', this.getBoundingClientRect());
        const x = (d.c.getAttribute("r") / 2) - (w / 2)
        return x;
      })
      .attr("dy", "0.35em")
      .attr("transform", (d) => `scale(${d.radius / 120})`)
      .each(function (d) {
        // https://github.com/d3/d3-selection/blob/main/README.md
        var td3 = d3.select(this);
        const ttext = splitText(d.text);
        // console.log('ttext', ttext);
        for (t of ttext) {
          td3.append('tspan')
            .attr("x", 0)
            .attr("dx", 0)
            .attr("dy", 11)
            .text(t)
        }
      })
  }

});