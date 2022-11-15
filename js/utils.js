function getUniquesMenu(df, thisVariable) {
    var thisList = df.map(function(o) {
        return o[thisVariable]
    })

    // uniq() found here https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    function uniq(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        });
    }

    var uniqueList = uniq(thisList);

    return uniqueList;
}

getLabelLength = (label, labelFont = "12px sans-serif") => {
    const dummy = d3.select("body").append("svg");

    let text = dummy.append("text")
        .style("font", labelFont)
        .text(label);

    const width = text.node().getBoundingClientRect().width;

    dummy.remove();

    return width;
  }

function swatches({
    colour,
    swatchRadius = 6,
    swatchPadding = swatchRadius * (2/3),
    labelFont = "12px sans-serif",
    labelFormat = x => x,
    labelPadding = swatchRadius * 1.5,
    marginLeft = 0
  } = {}) {
    
    const spacing = colour
      .domain()
      .map(d => labelFormat(d))
      .map(d => getLabelLength(d, labelFont) + (swatchRadius * 2) + swatchPadding + labelPadding)
      .map((_, i, g) => d3.cumsum(g)[i] + marginLeft)
    
    const width = d3.max(spacing);
    const height = swatchRadius * 2 + swatchPadding * 2
    
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    const g = svg
      .append("g")
        .attr("transform", `translate(0, ${height / 2})`)
      .selectAll("g")
      .data(colour.domain())
      .join("g")
        .attr("transform", (d, i) => `translate(${spacing[i - 1] || marginLeft}, 0)`);
    
    // g.append("circle")
    //     .attr("fill", colour)
    //     .attr("r", swatchRadius)
    //     .attr("cx", swatchRadius)
    //     .attr("cy", 0);

    g.append("rect")
        .attr("fill", colour)
        .attr("width", 2 * swatchRadius)
        .attr("height", 2 * swatchRadius)
        .attr("x", 0)
        .attr("y", -swatchRadius);
    
    g.append("text")
        .attr("x", swatchRadius * 2 + swatchPadding)
        .attr("y", 0)
        .attr("dominant-baseline", "central")
        .style("font", labelFont)
        .text(d => labelFormat(d));
    
    return svg.node()
    
  }