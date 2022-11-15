const width = 700;
const height = 550;
const padding = 50;

let currentYear;
let playing = false;
let timer;

const rMin = 2;
const rMax = 32;

const minYear = 1950;
const maxYear = 2018;

const sliderWidth = 500;

let sliderSvg = d3.select("#slider").append("svg")
    .attr('width', sliderWidth)
    .attr('height', 60)
    .append('g')
    .attr("transform", 'translate(20,10)');

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

let voronoi = svg.append("g")
    .attr("class", "voronoiWrapper")
    .attr("fill", "none");

let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("position", "absolute")
    .style("z-index", 1)
    .style("left", 0)
    .style("top", 0);

const circleOpacity = 0.8;

Promise.all([
    d3.json("data/rosling.json")
]).then(function(owidData) {

    const y = 'life_expectancy';
    const x = 'gdp';
    const r = 'population';
    const c = 'continent';

    currentYear = minYear;
    let data = owidData[0].filter(d => d.year === currentYear);
    
    let rExtent = d3.extent(data, d => d[r]);
    const xMin = 300;
    const xMax = 200000;
    const yMin = 10;
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

    let slider = d3.sliderHorizontal()
        .min(minYear)
        .max(maxYear)
        .step(1)
        .width(sliderWidth - 60)
        .ticks(5)
        .tickFormat(d => String(d))
        .default(minYear)
        .handle("M -8, 0 m 0, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0")
        .on('onchange', val => {
            currentYear = val;
            let filteredData = owidData[0].filter(d => d.year === currentYear);
            updateChart(filteredData);
        })
        .on('start', () => {
            if (playing === true) stopAnimation();
        })

    sliderSvg.call(slider);

    let color = d3.scaleOrdinal(data.map(d => d[c]), d3.schemeCategory10);

    xAxis.call(d3.axisBottom(xScale).tickFormat(d => {
            if ((d === 100) || (d === 1000) || (d === 10000) || (d === 100000)) {
                return d3.format(',')(d);
            } else {
                return '';
            }
        }))
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

        // Plot circles        
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
                .style("opacity", circleOpacity)
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
                        .style("opacity", circleOpacity)
                        .style("stroke", "black")
                        .style("stroke-width", 0.5);
                    tooltip.style("display", "none");
                });


        // Calculate Voronoi cells
        let delaunay = d3.Delaunay.from(filteredData, d => xScale(d[x]), d => yScale(d[y]));
        let voronoiData = delaunay.voronoi([padding, padding, width - padding, height - padding]);
        let dataV = filteredData.map((d, i) => [d, voronoiData.cellPolygon(i)]);

        // Add cells
        voronoi.selectAll("path")
            .data(dataV)
            .join("path")
                .style("pointer-events", 'all')
                .style("opacity", 0.0)
                .attr("stroke", "#ccc")
                .attr("d", d => "M" + d[1].join("L") + "Z")
                .on("mousemove", (event, d) => {
                    svg.selectAll("circle")
                        .style("opacity", c => c.country === d[0].country ? 1.0 : 0.2)
                        .style("stroke-width", c => c.country === d[0].country ? 2.0 : 1.0);
        
                    tooltip.html(`<p><strong>Country</strong> ${d[0].country}</p>
                        <p><strong>Population</strong> ${d[0].population}</p>
                        <p><strong>GDP per capita</strong> ${d[0][x]}</p>
                        <p><strong>Life expectancy</strong> ${d[0][y]}</p>`)
                        .style("left", (event.pageX + 10) + 'px')
                        .style("top", event.pageY + 'px')
                        .style("display", "block");
                })
                .on("mouseout", () => {
                    svg.selectAll("circle")
                        .style("opacity", circleOpacity);
                    tooltip.style("display", "none");
                });
    }

    updateChart(data);


    let legend = swatches({
        colour: color
    });

    d3.select("#legend").insert(() => legend);

    let button =  d3.select("#slider-play");

    let stopAnimation = () => {
        playing = false;
        clearInterval(timer);
        button.html("Play");
    }

    button
        .on("click", () => {
            if (playing === false) {
                button.html("Stop");
                playing = true;
                timer = setInterval(() => {
                    currentYear = currentYear + 1;
                    slider.value(currentYear);
                    if (currentYear === maxYear) stopAnimation();
                }, 100);
            } else {
                stopAnimation();
            }            
        });
})