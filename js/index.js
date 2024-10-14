function processHist() {
    d3.select("#status_running").text("Processing Data...")

    d3.select("#inputDataDiv").selectAll("*").remove()
    let orders = Array.from(new Array(hist_data.length).keys())
    let solution = { palette: [], order: orders }
    for (let i = 0; i < Tableau_10_palette.length; i++) {
        let c = d3.rgb(Tableau_10_palette[i])
        solution.palette.push([c.r, c.g, c.b, 0.5])
    }
    drawStepHistogram(hist_data, solution, d3.select("#inputDataDiv"))

    global_axis_pixels = {}
    blended_colors_all = {}
    prepareColorPixels(hist_data, renderHistComponent)
    let nIntervId = setInterval(function () {
        if (Object.keys(blended_colors_all).length != 0
            && blended_colors_arr.length != 0
            && Object.keys(pixels_num_weight).length != 0
            && Object.keys(blended_colors_neighboring_relation).length != 0) {
            clearInterval(nIntervId)
            getUnrelatedColors(blended_colors_all)
            reGenerateFast()
            d3.select("#status_running").text("")
        }
    }, 500);
}


function processParallel() {
    d3.select("#status_running").text("Processing Data...")
    axis_x = d3.scaleLinear()
        .range([0, svg_width])
        .domain(d3.extent(hist_data.flat(), function (d) {
            return +d[0]
        }));
    axis_y = d3.scaleLinear()
        .range([svg_height, 0])
        .domain(d3.extent(hist_data.flat(), function (d) {
            return +d[1]
        }));

    d3.select("#inputDataDiv").selectAll("*").remove()
    let orders = Array.from(new Array(hist_data.length).keys())
    let solution = { palette: [], order: orders }
    for (let i = 0; i < Tableau_10_palette.length; i++) {
        let c = d3.rgb(Tableau_10_palette[i])
        solution.palette.push([c.r, c.g, c.b, 0.5])
    }
    drawParallelCoordinates(hist_data, solution, d3.select("#inputDataDiv"))

    global_axis_pixels = {}
    blended_colors_all = {}
    prepareColorPixels(hist_data, renderParallelCoordinatesComponent)
    getAxisPixels()
    let nIntervId = setInterval(function () {
        if (Object.keys(blended_colors_all).length != 0
            && blended_colors_arr.length != 0
            && Object.keys(pixels_num_weight).length != 0
            && Object.keys(blended_colors_neighboring_relation).length != 0
            && Object.keys(global_axis_pixels).length != 0) {
            clearInterval(nIntervId)
            getUnrelatedColors(blended_colors_all)
            reGenerateFast()
            d3.select("#status_running").text("")
        }
    }, 500);
}

function processHull() {
    d3.select("#status_running").text("Processing Data...")
    axis_x = d3.scaleLinear()
        .range([0, svg_width])
        .domain(d3.extent(hist_data.flat(), function (d) {
            return +d[0]
        }));
    axis_y = d3.scaleLinear()
        .range([0, svg_height])
        .domain(d3.extent(hist_data.flat(), function (d) {
            return +d[1]
        }));

    let orders = Array.from(new Array(hist_data.length).keys())
    let solution = { palette: [], order: orders }
    for (let i = 0; i < Tableau_10_palette.length; i++) {
        let c = d3.rgb(Tableau_10_palette[i])
        solution.palette.push([c.r, c.g, c.b, 0.5])
    }
    d3.select("#inputDataDiv").selectAll("*").remove()
    drawConvexHull(hist_data, solution, d3.select("#inputDataDiv"))

    global_axis_pixels = {}
    blended_colors_all = {}
    prepareColorPixels(hist_data, renderParallelCoordinatesComponent, false)
    let nIntervId = setInterval(function () {
        if (Object.keys(blended_colors_all).length != 0
            && blended_colors_arr.length != 0
            && Object.keys(pixels_num_weight).length != 0
            && Object.keys(blended_colors_neighboring_relation).length != 0) {
            clearInterval(nIntervId)
            getUnrelatedColors(blended_colors_all)
            reGenerateFast()
            d3.select("#status_running").text("")
        }
    }, 500);
}

function processVenn() {
    d3.select("#status_running").text("Processing Data...")

    d3.select("#inputDataDiv").selectAll("*").remove();
    let orders = Array.from(new Array(hist_data.length).keys());
    let solution = { palette: [], order: orders };
    for (let i = 0; i < Tableau_10_palette.length; i++) {
        let c = d3.rgb(Tableau_10_palette[i]);
        solution.palette.push([c.r, c.g, c.b, 0.5]);
    }
    drawVennDiagrams(hist_data, solution, d3.select("#inputDataDiv"))

    global_axis_pixels = {}
    blended_colors_all = {}
    prepareColorPixels(hist_data, renderEllipseComponent)
    let nIntervId = setInterval(function () {
        if (Object.keys(blended_colors_all).length != 0
            && blended_colors_arr.length != 0
            && Object.keys(pixels_num_weight).length != 0
            && Object.keys(blended_colors_neighboring_relation).length != 0) {
            clearInterval(nIntervId)
            getUnrelatedColors(blended_colors_all)
            reGenerateFast()
            d3.select("#status_running").text("")
        }
    }, 500);
}