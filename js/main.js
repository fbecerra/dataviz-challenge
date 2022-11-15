const width = 700;
const height = 550;
const padding = 50;

const rMin = 2;
const rMax = 32;

let svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

let g = svg.append("g");

let xAxis = g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + (height - padding) + ")");

let xLabel = xAxis.append("g")
    .append("text")
    .attr("class", "x axis-title")
    .attr("text-anchor", "end")
    .style("font-size", "12px")
    .attr("fill", "black")
    .attr("transform", `translate(${width - padding}, -5)`);

let yAxis = g.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", "translate(" + padding + ",0)");

let yLabel = yAxis.append("g")
    .append("text")
    .attr("class", "y axis-title")
    .attr("text-anchor", "end")
    .style("font-size", "12px")
    .attr("fill", "black")
    .attr("transform", `translate(14, ${padding}) rotate(-90)`);

let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("position", "absolute")
    .style("z-index", 1)
    .style("left", 0)
    .style("top", 0);

Promise.all([
    d3.json("data/rosling.json")
]).then(function(owidData) {

    const y = 'life_expectancy';
    const x = 'gdp';
    const r = 'population';
    const c = 'continent';

    let data = owidData[0].filter(d => d.year === 2015);
    
    let rExtent = d3.extent(data, d => d[r]);
    const xMin = 100;
    const xMax = 200000;
    const yMin = 20;
    const yMax = 90;

    let xScale = d3.scaleLog()
        .range([padding, width - padding])
        .domain([xMin, xMax]);
        
    let yScale = d3.scaleLinear()
        .range([height - padding, padding])
        .domain([yMin, yMax]);

    let rScale = d3.scaleSqrt()
        .range([rMin, rMax])
        .domain(rExtent);

    let color = d3.scaleOrdinal(data.map(d => d[c]), d3.schemeCategory10);

    xAxis.call(d3.axisBottom(xScale))
        .call(g => g.selectAll(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
              .attr("stroke-opacity", 0.1)
              .attr("class", "axis-line")
              .attr("y2", -height + 2 * padding));
    yAxis.call(d3.axisLeft(yScale))
        .call(g => g.selectAll(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
              .attr("stroke-opacity", 0.1)
              .attr("class", "axis-line")
              .attr("x2", width - 2 * padding));;
    xLabel.text('Income per person (dollars)');
    yLabel.text('Life Expectancy (years)');

    function updateChart(filteredData) {
        g.selectAll("circle")
            .data(filteredData)
            .join("circle")
                .sort((a, b) => d3.descending(a.population, b.population))
                .attr("cx", d => xScale(d[x]))
                .attr("cy", d => yScale(d[y]))
                .attr("r", d => rScale(d[r]))
                .style('fill', d => color(d[c]))
                .style("stroke", "black")
                .style("stroke-width", 0.5)
                .on("mouseover", (event, d) => {
                    // Update circles
                    d3.selectAll("circle")
                        .style("opacity", 0.2);
                    d3.select(event.target)
                        .style("opacity", 1.0)
                        .style("stroke", "black")
                        .style("stroke-width", 2.0);

                    // Update tooltip
                    tooltip.html(`<p><strong>Country</strong> ${d.country}</p>
                        <p><strong>Population</strong> ${d.population}</p>
                        <p><strong>GDP per capita</strong> ${d[x]}</p>
                        <p><strong>Life expectancy</strong> ${d[y]}</p>`)
                        .style("left", (event.pageX + 10) + 'px')
                        .style("top", event.pageY + 'px')
                        .style("display", "block");
                })
                .on("mouseout", (event, d) => {
                    d3.selectAll("circle")
                        .style("opacity", 1.0)
                        .style("stroke", "black")
                        .style("stroke-width", 0.5);
                    tooltip.style("display", "none");
                });
    }

    updateChart(data);


    let legend = swatches({
        colour: color
    });

    d3.select("#legend").insert(() => legend);
})