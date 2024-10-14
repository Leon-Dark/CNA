

function getPaletteScore(palette, order) {
    // get composited colors
    getBlendedColors(palette, order)

    // calculate all color distance and name difference
    let diff_arr = {}
    let blended_colors_all_arr = Object.keys(blended_colors_all)
    for (let i = 0; i < blended_colors_all_arr.length; i++) {
        let key = blended_colors_all_arr[i]
        if (!diff_arr[key]) diff_arr[key] = {}
        let cj = blended_colors_all[key]
        if (key.length === 1 && getColorName(d3.rgb(cj[0], cj[1], cj[2]))[0] === 'grey') {
            return -1000000
        }
        let lab_cj = d3.lab(d3.rgb(cj[0], cj[1], cj[2]))
        for (let j = i + 1; j < blended_colors_all_arr.length; j++) {
            let key2 = blended_colors_all_arr[j]
            if (!diff_arr[key2]) diff_arr[key2] = {}
            let ck = blended_colors_all[key2]
            let lab_ck = d3.lab(d3.rgb(ck[0], ck[1], ck[2]))

            let cd = d3_ciede2000(lab_cj, lab_ck)
            if (cd < threshold_variables[0]) return -1000000
            cd *= 0.02
            let nd = 1 - getNameDifference(lab_cj, lab_ck)
            let ld = Math.abs(lab_cj.L - lab_ck.L)// / 100
            // using name similarity
            diff_arr[key][key2] = [cd, nd, ld]
            diff_arr[key2][key] = [cd, nd, ld]
        }
    }


    // relateness score
    let relateness_score = 0, sum_len = 0, all_ns_arr = []
    for (let i = 0; i < blended_colors_arr.length; i++) {
        let tmp = []
        for (let j = 1; j < blended_colors_arr[i].length; j++) {
            let ns = diff_arr[blended_colors_arr[i][j]][blended_colors_arr[i][0]][1]
            // if (ns < threshold_variables[2]) return -1000000
            tmp.push(ns)
        }
        if (tmp.length == 0) tmp = [0]
        sum_len += tmp.length
        relateness_score += d3.sum(tmp) * Math.sqrt(overlap_size_arr[blended_colors_arr[i][0]] * blended_num_arr[blended_colors_arr[i][0]])

        for (let j = 0; j < blended_colors_arr[i].length; j++) {
            for (let k = j + 1; k < blended_colors_arr[i].length; k++) {
                let ns = diff_arr[blended_colors_arr[i][j]][blended_colors_arr[i][k]][1]
                if (ns < threshold_variables[2]) return -1000000
                all_ns_arr.push(ns)
            }
        }
    }
    relateness_score /= sum_len
    relateness_score += d3.min(all_ns_arr)

    // unrelateness score
    let unrelateness_score = []
    for (let i = 0; i < unrelated_colors_global.length; i++) {
        unrelateness_score.push(diff_arr[unrelated_colors_global[i][0]][unrelated_colors_global[i][1]][1])
    }
    unrelateness_score = -d3.max(unrelateness_score) - d3.mean(unrelateness_score)
    // unrelateness_score = d3.mean(unrelateness_score)

    // separability score
    let separability_score = [], background_score = []
    for (let j = 0; j < blended_colors_all_arr.length; j++) {
        let key = blended_colors_all_arr[j]
        if (key === 'bgColor') continue
        for (let i = 0; i < blended_colors_neighboring_relation[key].length; i++) {
            separability_score.push(diff_arr[key][blended_colors_neighboring_relation[key][i]][0] * (1 + pixels_num_weight[key]))
        }
        background_score.push(diff_arr[key]['bgColor'][2])
    }
    separability_score = d3.min(separability_score)
    background_score = d3.min(background_score)
    if (background_score < threshold_variables[1]) {
        return -1000000
    }
    if (d3.max(background_score) > threshold_variables[3]) {
        return -1000000
    }

    let total_score = weight_global[0] * relateness_score + weight_global[1] * unrelateness_score + weight_global[2] * separability_score

    return total_score
}

function simulatedAnnealing(histData, used_colors, initial_order) {
    let palette_size = histData.length;
    let initial_colors = []
    if (used_colors.length === 0) {
        for (let i = 0; i < palette_size; i++) {
            initial_colors.push([getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255), 0.01 * getRandomIntInclusive(20, 80)])
        }
    } else {
        for (let i = 0; i < palette_size; i++) {
            initial_colors.push([used_colors[i][0], used_colors[i][1], used_colors[i][2], 0.01 * getRandomIntInclusive(20, 80)])
        }
    }

    let iterate_times = 0;
    //default parameters
    let max_temper = 100000,
        dec = dec_factor,
        max_iteration_times = 10000000,
        end_temper = 0.001;
    cur_temper = max_temper;

    let o = {
        palette: initial_colors,
        order: initial_order,
        score: getPaletteScore(initial_colors, initial_order)
    },
        preferredObj = o;

    let intermediate_scores = []

    function deepCopy(arr) {
        let array = []
        for (let i = 0; i < arr.length; i++) {
            array.push(arr[i].slice())
        }
        return array
    }

    let disturbColor = function (c) {
        return normScope(c + getRandomIntInclusive(-10, 10), [0, 255])
    }
    let disturbColorL = function (c) {
        let color_rgb = d3.rgb(disturbColor(c[0]), disturbColor(c[1]), disturbColor(c[2])),
            color_lab = d3.lab(color_rgb),
            color_new = d3.rgb(d3.lab(normScope(color_lab.l, [35, 95]), color_lab.a, color_lab.b))
        return [color_new.r, color_new.g, color_new.b, c[3]]
    }

    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            intermediate_scores.push([iterate_times, getPaletteScore2(o.palette, o.order)])
            iterate_times++;

            // disturb the parameters
            let curr_colors = deepCopy(o.palette)
            let curr_order = (o.order).slice()
            let idx = getRandomIntInclusive(0, palette_size - 1), idx_1
            if (Math.random() >= optimizeDepthSign) {
                if (Math.random() >= optimizeColorSign) {
                    // import new color or opacity
                    if (Math.random() >= optimizeAssignmentSign) {
                        if (palette_size < used_colors.length && Math.random() > 0.5) {
                            // exchange colors from unused colors
                            idx_1 = getRandomIntInclusive(palette_size, used_colors.length - 1)
                        } else {
                            // exchange current colors
                            idx_1 = getRandomIntInclusive(0, palette_size - 1)
                            while (idx_1 == idx) {
                                idx_1 = getRandomIntInclusive(0, palette_size - 1)
                            }
                        }
                        // exchange colors
                        let tmp = used_colors[idx].slice()
                        used_colors[idx] = used_colors[idx_1]
                        used_colors[idx_1] = tmp

                        for (let i = 0; i < palette_size; i++) {
                            curr_colors[i] = used_colors[i].slice(0, 3).concat([curr_colors[i][3]])
                        }
                    } else {
                        // disturb opacity
                        curr_colors[idx][3] = normScope(curr_colors[idx][3] + 0.01 * getRandomIntInclusive(-10, 10), opacity_range_global)
                    }

                } else {
                    // change the color
                    if (Math.random() > 0.5) {
                        if (Math.random() > 0.5) {
                            curr_colors[idx] = [disturbColor(curr_colors[idx][0]), disturbColor(curr_colors[idx][1]), disturbColor(curr_colors[idx][2]), curr_colors[idx][3]]
                            // curr_colors[idx] = disturbColorL(curr_colors[idx])
                            while (getColorName(d3.rgb(curr_colors[idx][0], curr_colors[idx][1], curr_colors[idx][2]))[0] === 'grey') {
                                curr_colors[idx] = [disturbColor(curr_colors[idx][0]), disturbColor(curr_colors[idx][1]), disturbColor(curr_colors[idx][2]), curr_colors[idx][3]]
                            }
                        } else {
                            // exchange current colors
                            idx_1 = getRandomIntInclusive(0, palette_size - 1)
                            while (idx_1 == idx) {
                                idx_1 = getRandomIntInclusive(0, palette_size - 1)
                            }
                            // exchange colors
                            let tmp = curr_colors[idx].slice()
                            curr_colors[idx] = curr_colors[idx_1]
                            curr_colors[idx_1] = tmp
                        }
                    } else {
                        curr_colors[idx][3] = normScope(curr_colors[idx][3] + 0.01 * getRandomIntInclusive(-10, 10), opacity_range_global)
                    }
                }
            } else {
                // change the depth order
                idx_1 = getRandomIntInclusive(0, palette_size - 1)
                while (idx_1 == idx) {
                    idx_1 = getRandomIntInclusive(0, palette_size - 1)
                }
                let tmp = curr_order[idx]
                curr_order[idx] = curr_order[idx_1]
                curr_order[idx_1] = tmp
            }

            let o2 = {
                palette: curr_colors,
                order: curr_order,
                score: getPaletteScore(curr_colors, curr_order)
            };

            let delta_score = o.score - o2.score;
            let prob = Math.exp((-delta_score) / cur_temper)
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= prob) {
                o = o2;
                if (preferredObj.score - o.score < 0) {
                    preferredObj = o;
                }
            }
            if (iterate_times > max_iteration_times) {
                break;
            }
        }

        cur_temper *= dec;
    }
    console.log("preferredObj", preferredObj, iterate_times);
    preferredObj.intermediate_scores = intermediate_scores
    preferredObj.initilization = {
        palette: initial_colors,
        order: initial_order
    }
    return preferredObj;
}

function getPaletteScore2(palette, order) {
    // get composited colors
    getBlendedColors(palette, order)

    // calculate all color distance and name difference
    let diff_arr = {}
    let blended_colors_all_arr = Object.keys(blended_colors_all)
    for (let i = 0; i < blended_colors_all_arr.length; i++) {
        let key = blended_colors_all_arr[i]
        if (!diff_arr[key]) diff_arr[key] = {}
        let cj = blended_colors_all[key]
        // if (key.length === 1 && getColorName(d3.rgb(cj[0], cj[1], cj[2]))[0] === 'grey') {
        //     return -1000000
        // }
        let lab_cj = d3.lab(d3.rgb(cj[0], cj[1], cj[2]))
        for (let j = i + 1; j < blended_colors_all_arr.length; j++) {
            let key2 = blended_colors_all_arr[j]
            if (!diff_arr[key2]) diff_arr[key2] = {}
            let ck = blended_colors_all[key2]
            let lab_ck = d3.lab(d3.rgb(ck[0], ck[1], ck[2]))

            let cd = d3_ciede2000(lab_cj, lab_ck)
            // if (cd < threshold_variables[0]) return -1000000
            cd *= 0.02
            let nd = 1 - getNameDifference(lab_cj, lab_ck)
            let ld = Math.abs(lab_cj.L - lab_ck.L)// / 100
            // using name similarity
            diff_arr[key][key2] = [cd, nd, ld]
            diff_arr[key2][key] = [cd, nd, ld]
        }
    }


    // relateness score
    let relateness_score = 0, sum_len = 0, all_ns_arr = []
    for (let i = 0; i < blended_colors_arr.length; i++) {
        let tmp = []
        for (let j = 1; j < blended_colors_arr[i].length; j++) {
            let ns = diff_arr[blended_colors_arr[i][j]][blended_colors_arr[i][0]][1]
            // if (ns < threshold_variables[2]) return -1000000
            tmp.push(ns)
        }
        if (tmp.length == 0) tmp = [0]
        sum_len += tmp.length
        relateness_score += d3.sum(tmp) * Math.sqrt(overlap_size_arr[blended_colors_arr[i][0]] * blended_num_arr[blended_colors_arr[i][0]])

        for (let j = 0; j < blended_colors_arr[i].length; j++) {
            for (let k = j + 1; k < blended_colors_arr[i].length; k++) {
                let ns = diff_arr[blended_colors_arr[i][j]][blended_colors_arr[i][k]][1]
                // if (ns < threshold_variables[2]) return -1000000
                all_ns_arr.push(ns)
            }
        }
    }
    relateness_score /= sum_len
    relateness_score += d3.min(all_ns_arr)

    // unrelateness score
    let unrelateness_score = []
    for (let i = 0; i < unrelated_colors_global.length; i++) {
        unrelateness_score.push(diff_arr[unrelated_colors_global[i][0]][unrelated_colors_global[i][1]][1])
    }
    unrelateness_score = -d3.max(unrelateness_score) - d3.mean(unrelateness_score)
    // unrelateness_score = d3.mean(unrelateness_score)

    // separability score
    let separability_score = [], background_score = []
    for (let j = 0; j < blended_colors_all_arr.length; j++) {
        let key = blended_colors_all_arr[j]
        if (key === 'bgColor') continue
        for (let i = 0; i < blended_colors_neighboring_relation[key].length; i++) {
            separability_score.push(diff_arr[key][blended_colors_neighboring_relation[key][i]][0] * (1 + pixels_num_weight[key]))
        }
        background_score.push(diff_arr[key]['bgColor'][2])
    }
    separability_score = d3.min(separability_score)
    background_score = d3.min(background_score)
    // if (background_score < threshold_variables[1]) {
    //     return -1000000
    // }
    // if (d3.max(background_score) > threshold_variables[3]) {
    //     return -1000000
    // }

    let total_score = weight_global[0] * relateness_score + weight_global[1] * unrelateness_score + weight_global[2] * separability_score

    return total_score
}
function showTrend(data, div, x = 0, y = 1) {
    console.log(data);

    let linechart_svg = div.append("svg").attr("id", "renderSvg").attr("typeId", "line")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT)
        .on("dblclick", function () {
            svg2Png(linechart_svg, div)
        });
    let linechart = linechart_svg.style("background-color", "rgba(" + background_color.join(",") + ")")
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

    let m_xScale = d3.scaleLinear().range([0, svg_width]), // value -> display
        m_yScale = d3.scaleLinear().range([svg_height, 0]); // value -> display
    // Scale the range of the data
    m_xScale.domain(d3.extent(data, function (d) {
        return d[x];
    }));
    m_yScale.domain(d3.extent(data, function (d) {
        return d[y];
    }));
    // define the line
    let valueline = d3.line()
        .x(function (d) {
            return m_xScale(d[x]);
        })
        .y(function (d) {
            return m_yScale(d[y]);
        })//.curve(d3.curveCatmullRom);

    let sampled_data = data
    // if (y === 1) {
    //     valueline.curve(d3.curveCatmullRom);
    // }
    let samples_num = 100
    let samples_interval = 10; Math.floor(data.length / samples_num)
    sampled_data = []
    for (let i = 0; i < data.length; i++) {
        if (i % samples_interval === 0)
            sampled_data.push(data[i])
    }
    sampled_data.push(data[data.length - 1])
    // console.log("sampled_data", sampled_data);

    // Add the valueline path.
    linechart.selectAll('path')
        .data([sampled_data]).enter().append("path")
        .attr("d", function (d) {
            return valueline(d);
        })
        .attr("class", "linechart")
        .attr("fill", "none")
        // .attr("stroke", "#444")
        .attr("stroke", function () {
            if (y === 1) {
                return "#c30d23"
            }
            return "#036eb8"
        })
        .style("stroke-width", 1)

    // Add the X Axis
    linechart.append("g")
        .attr("transform", "translate(0," + svg_height + ")")
        .call(d3.axisBottom(m_xScale)); //.tickFormat("")

    // Add the Y Axis
    linechart.append("g")
        .call(d3.axisLeft(m_yScale)); //.tickFormat("")

    linechart_svg.append("text").attr("x", 0).attr("y", 20).text("prob");
}