
function getBlendedColors(palette, order) {
    for (let key in blended_colors_all) {
        if (key === "bgColor") {
            blended_colors_all[key] = background_color
            continue
        }
        let idx_arr = key.split("-").map(Number)
        let result_order = []
        for (let i = 0; i < order.length; i++) {
            if (idx_arr.indexOf(order[i]) != -1) {
                result_order.push(order[i])
            }
        }
        blended_colors_all[key] = getCompositedColor(palette, result_order)
    }
}

// get all unrelated colors
function getUnrelatedColors(blendColors) {
    let keys = Object.keys(blendColors)
    var index = keys.indexOf('bgColor');
    if (index !== -1) {
        keys.splice(index, 1);
    }
    unrelated_colors_global = []
    for (let i = 0; i < keys.length; i++) {
        let idx_arr = keys[i].split("-").map(Number)
        for (let j = i + 1; j < keys.length; j++) {
            let idx_arr2 = keys[j].split("-").map(Number)
            let bSet = new Set(idx_arr2)
            let intersection = Array.from(new Set(idx_arr.filter(v => bSet.has(v))))
            if (intersection.length == 0) {
                unrelated_colors_global.push([keys[i], keys[j]])
            }
        }
    }

    console.log("unrelated_colors_global", unrelated_colors_global);
}


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
/**
 * A(size, arr.length)
 * @param {*} arr 
 * @param {*} size 
 * @returns 
 */
function queue(arr, size) {
    if (size > arr.length) {
        return;
    }
    var allResult = [];

    (function (arr, size, result) {
        if (result.length == size) {
            allResult.push(result);
        } else {
            for (var i = 0, len = arr.length; i < len; i++) {
                var newArr = [].concat(arr),
                    curItem = newArr.splice(i, 1);
                arguments.callee(newArr, size, [].concat(result, curItem));
            }
        }
    })(arr, size, []);

    return allResult;
}

function normScope(v, vscope) {
    let normV = Math.max(vscope[0], v);
    normV = Math.min(normV, vscope[1]);
    return normV;
}

// color name lookup table
let color_name_map = {};
for (var c = 0; c < c3.color.length; ++c) {
    var x = c3.color[c];
    color_name_map[[x.L, x.a, x.b].join(",")] = c;
}
var name_index_map = {};
for (var i = 0; i < c3.terms.length; ++i) {
    name_index_map[c3.terms[i]] = i;
}

// console.log(color_name_map);
function getColorNameIndex(c) {
    var x = d3.lab(c),
        L = 5 * Math.round(x.L / 5),
        a = 5 * Math.round(x.a / 5),
        b = 5 * Math.round(x.b / 5),
        s = [L, a, b].join(",");
    return color_name_map[s];
}

function getNameDifference(x1, x2) {
    let c1 = getColorNameIndex(x1),
        c2 = getColorNameIndex(x2);
    return 1 - c3.color.cosine(c1, c2);
}
function getColorName(color) {
    let c = getColorNameIndex(color),
        t = c3.color.relatedTerms(c, 3);
    if (t[0] != undefined) {
        return [c3.terms[t[0].index]]
    }
    return [undefined]
}
function getColorName10(color) {
    let c = getColorNameIndex(color),
        t = c3.color.relatedTerms(c, 10);
    let result = []
    for (let i = 0; i < t.length; i++) {
        if (t[i] != undefined) {
            result.push([c3.terms[t[i].index], t[i].score])
        }
    }
    return result
}
//convert rgb to hex
var rgbToHex = function (rgb) {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
var fullColorHex = function (r, g, b) {
    var red = rgbToHex(r);
    var green = rgbToHex(g);
    var blue = rgbToHex(b);
    return "#" + red + green + blue;
};
//color saliency is the degree to which a color value is uniquely named
function getColorSaliency(x) {
    // color saliency range
    let minE = -4.5,
        maxE = 0;
    let c = getColorNameIndex(x);
    return (c3.color.entropy(c) - minE) / (maxE - minE);
}

// 
// traditional color blending
// 
function traditionalColorBlending(a, b) {
    var mix = [];
    mix[3] = 1 - (1 - a[3]) * (1 - b[3]); // alpha
    mix[0] = (a[0] * a[3] / mix[3]) + (b[0] * b[3] * (1 - a[3]) / mix[3]); // red
    mix[1] = (a[1] * a[3] / mix[3]) + (b[1] * b[3] * (1 - a[3]) / mix[3]); // green
    mix[2] = (a[2] * a[3] / mix[3]) + (b[2] * b[3] * (1 - a[3]) / mix[3]); // blue
    return mix;
}

function getCompositedColor(palette, order) {

    let cb = traditionalColorBlending(palette[order[0]], background_color)
    let c = cb
    for (let i = 1; i < order.length; i++) {
        c = traditionalColorBlending(palette[order[i]], cb)
        cb = c
    }

    return c;
}

function traditionalColorBlendingTmp(a, b) {
    var mix = [];
    mix[3] = 1 - (1 - a[3]) * (1 - b[3]); // alpha
    mix[0] = (a[0] * a[3] / mix[3]) + (b[0] * b[3] * (1 - a[3]) / mix[3]); // red
    mix[1] = (a[1] * a[3] / mix[3]) + (b[1] * b[3] * (1 - a[3]) / mix[3]); // green
    mix[2] = (a[2] * a[3] / mix[3]) + (b[2] * b[3] * (1 - a[3]) / mix[3]); // blue
    return mix;
}
// 
// Hue-preserving color blending
// 
function huePreservingColorBlending(c1, c2) {
    let equalHue = function (a, b) {
        let hue_a = d3.hsl(d3.rgb(a[0] * a[3], a[1] * a[3], a[2] * a[3])),
            hue_b = d3.hsl(d3.rgb(b[0] * b[3], b[1] * b[3], b[2] * b[3]))
        return Math.round(hue_a.h) === Math.round(hue_b.h);
    }
    let oppositeColor = function (a, b) {
        let hue_a = d3.hsl(d3.rgb(a[0] * a[3], a[1] * a[3], a[2] * a[3])),
            hue_b = d3.hsl(d3.rgb(b[0] * b[3], b[1] * b[3], b[2] * b[3]))
        let result = d3.rgb(d3.hsl((hue_a.h + 180) % 360, hue_b.s, hue_b.l))
        return [result.r / b[3], result.g / b[3], result.b / b[3], b[3]]
    }
    let color_new;
    if (equalHue(c1, c2)) {
        color_new = traditionalColorBlendingTmp(c1, c2)
    } else {
        let c2_hat = oppositeColor(c1, c2)
        color_new = traditionalColorBlendingTmp(c1, c2_hat)
        if (!equalHue(c1, color_new)) {
            let c1_hat = oppositeColor(c2, c1)
            color_new = traditionalColorBlendingTmp(c1_hat, c2)
        }
    }
    return color_new
}

// 
// Wang et.al's local solution
// 
function wangLocalSolution(c1, c2) {
    // reducing the saturation of the background color while keeping its lightness
    let hsl = d3.hsl(d3.rgb(c2[0], c2[1], c2[2]));
    let color_new = d3.rgb(d3.hsl(hsl.h, hsl.s * 0.5, hsl.l));
    // get the traditional color blending result
    let color = traditionalColorBlendingTmp([color_new.r, color_new.g, color_new.b, c2[3]], background_color);
    color = traditionalColorBlendingTmp(c1, color);
    return color
}

/**
 * get the max x-axis length for given color pixels
 */
function getMaxLength(pixels) {
    let x_arr = new Array(SVGWIDTH + 1).fill(0)
    for (let i = 0; i < pixels.length; i++) {
        x_arr[pixels[i][1]] = 1
    }
    let all_length_arr = [],
        start = -1, end = -1
    for (let i = 0; i < x_arr.length - 1; i++) {
        if (x_arr[i] === 0) {
            start = -1
            end = -1
            continue
        }
        if (start === -1) {
            start = i
        }
        if (x_arr[i + 1] === 0) {
            end = i
            all_length_arr.push([start, end])
        }
    }
    console.log(all_length_arr);
    // calculate the size of each area
    let area_arr = new Array(all_length_arr.length)
    for (let i = 0; i < all_length_arr.length; i++) {
        area_arr[i] = []
        for (let j = 0; j < pixels.length; j++) {
            if (pixels[j][1] >= all_length_arr[i][0] && pixels[j][1] <= all_length_arr[i][1]) {
                area_arr[i].push(pixels[j])
            }
        }
    }
    console.log(area_arr);
    // return the max size
    let max_size = area_arr[0].length
    for (let i = 1; i < area_arr.length; i++) {
        if (max_size < area_arr[i].length) {
            max_size = area_arr[i].length
        }
    }
    return max_size
}

/**
 * get overlapping size of each class
 * get blended colors number of each class
 */
function getDifficultyWeight(pixel_info) {
    overlap_size_arr = {}, blended_num_arr = {}
    let tmp_len_arr = []
    for (let key in pixel_info) {
        if (key.length === 1) {
            let total_size = 0
            overlap_size_arr[key] = 0
            tmp_len_arr.push(blended_colors_arr[+key].length)
            for (let i = 0; i < blended_colors_arr[+key].length; i++) {
                total_size += pixel_info[blended_colors_arr[+key][i]].length
                if (blended_colors_arr[+key][i].length > 1) {
                    overlap_size_arr[key] += pixel_info[blended_colors_arr[+key][i]].length
                }
            }
            overlap_size_arr[key] /= total_size
        }
    }
    let max_len = d3.max(tmp_len_arr)
    for (let i = 0; i < blended_colors_arr.length; i++) {
        blended_num_arr[blended_colors_arr[i][0]] = blended_colors_arr[i].length / max_len
    }
    console.log("overlap_size_arr:", overlap_size_arr, "blended_num_arr:", blended_num_arr);
}

/** process pixels **/

function processPixelArray(cluster_num, pixel_arr) {

    // get all blended colors of each class
    blended_colors_arr = new Array(cluster_num)
    for (let i = 0; i < cluster_num; i++) {
        blended_colors_arr[i] = []
    }
    blended_colors_all = {}
    blended_colors_neighboring_relation = {}
    let pixel_sum = 0
    let pixels_num_arr = {}
    global_pixels_arr = {}
    for (let y in pixel_arr) {
        global_pixels_arr[y] = {}
        for (let x in pixel_arr[y]) {
            if (pixel_arr[y][x].length === 0) continue
            let key = pixel_arr[y][x].join("-")
            global_pixels_arr[y][x] = key
            for (let i = 0; i < pixel_arr[y][x].length; i++) {
                blended_colors_arr[pixel_arr[y][x][i]].push(key)
            }
            blended_colors_all[key] = undefined

            if (!pixels_num_arr[key]) pixels_num_arr[key] = []
            // pixels_num_arr[key].push([(+y) / bars_num, (+x) / svg_height])
            pixels_num_arr[key].push([(+y), (+x)])
            pixel_sum++

            // get the neighborhood of each color
            if (!blended_colors_neighboring_relation[key]) blended_colors_neighboring_relation[key] = []
            for (let i = -1; i <= 1; i++) {
                if ((+y) + i < 0 || !pixel_arr[(+y) + i]) continue
                for (let j = -1; j <= 1; j++) {
                    if ((i == 0 && j == 0)) continue
                    if (!pixel_arr[(+y) + i][(+x) + j]) {
                        // blended_colors_neighboring_relation[key].push("bgColor")
                        continue
                    }
                    if (pixel_arr[(+y) + i][(+x) + j].length === 0) continue
                    if (key != pixel_arr[(+y) + i][(+x) + j].join("-"))
                        blended_colors_neighboring_relation[key].push(pixel_arr[(+y) + i][(+x) + j].join("-"))
                }
            }
        }
    }

    // unique the array
    for (let i = 0; i < cluster_num; i++) {
        blended_colors_arr[i] = Array.from(new Set(blended_colors_arr[i]))
        blended_colors_arr[i].sort(function (a, b) {
            return a.length - b.length
        })
    }

    // for (let key in blended_colors_neighboring_relation) {
    //     blended_colors_neighboring_relation[key] = Array.from(new Set(blended_colors_neighboring_relation[key]))
    // }
    for (let key in blended_colors_neighboring_relation) {
        let adjacent_size_arr = {}
        for (let i = 0; i < blended_colors_neighboring_relation[key].length; i++) {
            if (adjacent_size_arr[blended_colors_neighboring_relation[key][i]] == undefined) {
                adjacent_size_arr[blended_colors_neighboring_relation[key][i]] = 0
            }
            adjacent_size_arr[blended_colors_neighboring_relation[key][i]] += 1
        }

        // console.log(key, adjacent_size_arr);
        let arr = []
        for (let key2 in adjacent_size_arr) {
            arr.push([adjacent_size_arr[key2], key2])
        }
        arr.sort((a, b) => a[0] - b[0])
        blended_colors_neighboring_relation[key] = []
        for (let i = 0; i < arr.length; i++) {
            // if (arr[i][0] > 10)
            blended_colors_neighboring_relation[key].push(arr[i][1])
        }
    }

    // function removeKey(key){

    //     delete blended_colors_all[key]
    //     delete blended_colors_neighboring_relation[key]
    //     for(let i=0;i<blended_colors_arr.length;i++){
    //         let index = blended_colors_arr[i].indexOf(key)
    //         if(index!=-1){
    //             blended_colors_arr[i].splice(index, 1);
    //         }
    //     }
    //     for(let i in blended_colors_neighboring_relation){
    //         let index = blended_colors_neighboring_relation[i].indexOf(key)
    //         if(index!=-1){
    //             blended_colors_neighboring_relation[i].splice(index, 1);
    //         }
    //     }
    // }

    pixels_num_weight = {}
    let blended_colors_pixels_count = 0
    let max_size_arr = []
    for (let key in pixels_num_arr) {
        if (pixels_num_arr[key].length < 10) {
            let str = {}
            for (let key2 in pixels_num_arr)
                str[key2] = pixels_num_arr[key2].length
            console.log(str);
            // return false
            // removeKey(key)
        }
        pixels_num_weight[key] = pixels_num_arr[key].length / pixel_sum
        if (key.length > 1) {
            blended_colors_pixels_count += pixels_num_arr[key].length

            console.log(key + ":");
            max_size_arr.push(getMaxLength(pixels_num_arr[key]))
        }
    }
    console.log("Difficulty", blended_colors_pixels_count / pixel_sum);
    d3.select("#diff-id").text("Size Difficulty = " + (blended_colors_pixels_count / pixel_sum).toFixed(2) + " , " + d3.max(max_size_arr))

    getDifficultyWeight(pixels_num_arr)

    blended_colors_all["bgColor"] = [255, 255, 255, 1]
    console.log("blended_colors_arr", blended_colors_arr);
    console.log("blended_colors_all", blended_colors_all, Object.keys(blended_colors_all).length);
    console.log("pixels_num_arr", pixels_num_arr);
    console.log("pixels_num_weight", pixels_num_weight);
    console.log("blended_colors_neighboring_relation", blended_colors_neighboring_relation);
    return true
}

function renderHistComponent(id, histData, image_data, color) {
    let svgId = "svg-" + id
    let canvasId = "canvas-" + id
    let svg = d3.select("#virtualDiv").append("svg").attr("id", svgId)
        .attr("width", SVGWIDTH)
        .attr("height", SVGHEIGHT)
        .style("background-color", "rgba(" + background_color.join(",") + ")")//.style("margin-left", "10px")
    let standard_result_svg_group = svg.append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")

    for (let n = 0; n < histData[0].length; n++) {
        standard_result_svg_group.append("rect")
            .attr("class", "bar")
            .attr("fill", "rgba(" + color.join(',') + ")")
            .attr("x", n * axis_x_bandwidth)
            .attr("width", axis_x_bandwidth)
            .attr("y", axis_y(histData[0][n]))
            .attr("height", svg_height - axis_y(histData[0][n]))
    }

    d3.select("#virtualDiv").append("canvas").attr("id", canvasId)
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT) //.attr("style", "display:none");

    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        document.getElementById(canvasId).getContext('2d').drawImage(image, 0, 0);
        //get pixels image
        let context = document.getElementById(canvasId).getContext('2d');
        image_data[id] = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        d3.select("#virtualDiv").select("#" + canvasId).remove()
        d3.select("#virtualDiv").select("#" + svgId).remove()
        // console.log(id, data, image_data, color);
    }
    // set it as the source of the img element
    image.src = image64;

}

function renderCircleComponent(id, histData, image_data, color) {
    let svgId = "svg-" + id
    let canvasId = "canvas-" + id
    let svg = d3.select("#virtualDiv").append("svg").attr("id", svgId)
        .attr("width", SVGWIDTH)
        .attr("height", SVGHEIGHT)
        .style("background-color", "rgba(" + background_color.join(",") + ")")//.style("margin-left", "10px")
    let standard_result_svg_group = svg.append("g")
    // .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")

    standard_result_svg_group.append("circle")
        .attr("fill", "rgba(" + color.join(',') + ")")
        .attr("cx", histData[0][0])
        .attr("cy", histData[0][1])
        .attr("r", histData[0][2])

    d3.select("#virtualDiv").append("canvas").attr("id", canvasId)
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT) //.attr("style", "display:none");

    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        document.getElementById(canvasId).getContext('2d').drawImage(image, 0, 0);
        //get pixels image
        let context = document.getElementById(canvasId).getContext('2d');
        image_data[id] = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        d3.select("#virtualDiv").select("#" + canvasId).remove()
        d3.select("#virtualDiv").select("#" + svgId).remove()
        // console.log(id, data, image_data, color);
    }
    // set it as the source of the img element
    image.src = image64;

}

function renderEllipseComponent(id, histData, image_data, color) {
    let svgId = "svg-" + id
    let canvasId = "canvas-" + id
    let svg = d3.select("#virtualDiv").append("svg").attr("id", svgId)
        .attr("width", SVGWIDTH)
        .attr("height", SVGHEIGHT)
        .style("background-color", "rgba(" + background_color.join(",") + ")")//.style("margin-left", "10px")
    let standard_result_svg_group = svg.append("g")
    // .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")

    standard_result_svg_group.append("ellipse")
        .attr("fill", "rgba(" + color.join(',') + ")")
        .attr("cx", histData[0][0])
        .attr("cy", histData[0][1])
        .attr("rx", histData[0][2])
        .attr("ry", histData[0][3])
        .attr("transform", `rotate(${histData[0][4]}, ${histData[0][0]}, ${histData[0][1]})`)

    d3.select("#virtualDiv").append("canvas").attr("id", canvasId)
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT) //.attr("style", "display:none");

    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        document.getElementById(canvasId).getContext('2d').drawImage(image, 0, 0);
        //get pixels image
        let context = document.getElementById(canvasId).getContext('2d');
        image_data[id] = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        d3.select("#virtualDiv").select("#" + canvasId).remove()
        d3.select("#virtualDiv").select("#" + svgId).remove()
        // console.log(id, data, image_data, color);
    }
    // set it as the source of the img element
    image.src = image64;

}

/**
 * @desc 二阶贝塞尔
 * @param {number} t 当前百分比
 * @param {Array} p1 起点坐标
 * @param {Array} p2 终点坐标
 * @param {Array} cp 控制点
 */
function twoBezier(t, p1, cp, p2) {
    const [x1, y1] = p1;
    const [cx, cy] = cp;
    const [x2, y2] = p2;
    let x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2;
    let y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2;
    return [x, y];
}

function getBezierPoints(num = 100, p1, cp, p2) {
    const points = [];

    for (let i = 0; i <= num; i++) {
        points.push(twoBezier(i / num, p1, cp, p2));
    }
    return points;
}

function transferToBezierCurve(case_data) {
    let case_data_arr = []
    for (let j = 0; j < case_data.length; j++) {
        case_data_arr[j] = []
        let end_point = parseInt(case_data[j].length / 2)
        for (let i = 0; i < case_data[j].length; i++) {
            let offset = Math.abs(case_data[j][i][1] - case_data[j][case_data[j].length - 1 - i][1])
            if (i === 0 || i === end_point) {
                case_data_arr[j].push([case_data[j][i][0], case_data[j][i][1]])
            } else if (i < end_point) {
                let data = getBezierPoints(10, case_data[j][i - 1], [(case_data[j][i - 1][0] + case_data[j][i][0]) / 2, (case_data[j][i - 1][1] + case_data[j][i][1]) / 2 - offset * 0.5], case_data[j][i])
                for (let d of data) {
                    case_data_arr[j].push(d)
                }
            } else {
                let data = getBezierPoints(10, case_data[j][i - 1], [(case_data[j][i - 1][0] + case_data[j][i][0]) / 2, (case_data[j][i - 1][1] + case_data[j][i][1]) / 2 + offset * 0.5], case_data[j][i])
                for (let d of data) {
                    case_data_arr[j].push(d)
                }
            }
        }
        case_data_arr[j].push([case_data[j][0][0], case_data[j][0][1]])
    }
    return case_data_arr
}

function renderParallelCoordinatesComponent(id, data, image_data, color, flag = true) {
    const curve = d3.line().curve(d3.curveLinear);
    let svgId = "svg-" + id
    let canvasId = "canvas-" + id
    let svg = d3.select("#virtualDiv").append("svg").attr("id", svgId)
        .attr("width", SVGWIDTH)
        .attr("height", SVGHEIGHT)
        .style("background-color", "rgba(" + background_color.join(",") + ")")//.style("margin-left", "10px")
    let standard_result_svg_group = svg.append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")

    let case_data = data
    if (flag)
        case_data = transferToBezierCurve(data)
    standard_result_svg_group.selectAll("path")
        .data(case_data).enter()
        .append('path')
        .attr("d", function (d) {
            let p = d.map(function (v) {
                return [axis_x(v[0]), axis_y(v[1])];
            })
            return curve(p);
        })
        .attr("fill", "rgba(" + color.join(",") + ")")

    d3.select("#virtualDiv").append("canvas").attr("id", canvasId)
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT) //.attr("style", "display:none");

    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        document.getElementById(canvasId).getContext('2d').drawImage(image, 0, 0);
        //get pixels image
        let context = document.getElementById(canvasId).getContext('2d');
        image_data[id] = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        d3.select("#virtualDiv").select("#" + canvasId).remove()
        d3.select("#virtualDiv").select("#" + svgId).remove()
    }
    // set it as the source of the img element
    image.src = image64;

}

function getAxisPixels() {
    let svgId = "svg-axispixel"
    let canvasId = "canvas-axispixel"
    let svg = d3.select("#virtualDiv").append("svg").attr("id", svgId)
        .attr("width", SVGWIDTH)
        .attr("height", SVGHEIGHT)
        .style("background-color", "rgba(" + background_color.join(",") + ")")//.style("margin-left", "10px")
    let standard_result_svg_group = svg.append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")

    for (let i of axis_x_values.keys()) {
        standard_result_svg_group.append("line")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("x1", axis_x(i))
            .attr("y1", axis_y(axis_y.domain()[0]))
            .attr("x2", axis_x(i))
            .attr("y2", axis_y(axis_y.domain()[1]));
    }

    d3.select("#virtualDiv").append("canvas").attr("id", canvasId)
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT) //.attr("style", "display:none");

    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        document.getElementById(canvasId).getContext('2d').drawImage(image, 0, 0);
        //get pixels image
        let context = document.getElementById(canvasId).getContext('2d');
        let axis_image_data = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        global_axis_pixels = {}
        for (let j = 0; j < SVGHEIGHT; j++) {
            for (let k = 0; k < SVGWIDTH; k++) {
                let index = j * SVGWIDTH + k;
                let tuple = [axis_image_data[index * 4], axis_image_data[index * 4 + 1], axis_image_data[index * 4 + 2], axis_image_data[index * 4 + 3]]
                if (tuple[0] === background_color[0] && tuple[1] === background_color[1] && tuple[2] === background_color[2]) {
                    continue // background
                } else {
                    // console.log(tuple);
                    // break
                    if (global_axis_pixels[j] === undefined) global_axis_pixels[j] = {}
                    if (global_axis_pixels[j][k] === undefined) global_axis_pixels[j][k] = []
                    global_axis_pixels[j][k] = tuple
                }
                // if (tuple[0] === 0 && tuple[1] === 0 && tuple[2] === 0) {
                //     if (global_axis_pixels[j] === undefined) global_axis_pixels[j] = {}
                //     if (global_axis_pixels[j][k] === undefined) global_axis_pixels[j][k] = []
                //     global_axis_pixels[j][k].push(1)
                // }
            }
        }
        d3.select("#virtualDiv").select("#" + canvasId).remove()
        d3.select("#virtualDiv").select("#" + svgId).remove()
        // console.log(id, data, image_data, color);
    }
    // set it as the source of the img element
    image.src = image64;
}

function getAxisColors(palette, order) {
    let tmp = background_color.slice()
    global_axis_colors = {}
    background_color = [0, 0, 0, 1]
    for (let y in global_axis_pixels) {
        for (let x in global_axis_pixels[y]) {
            if (global_pixels_arr[y] != undefined && global_pixels_arr[y][x] != undefined) {
                // background_color = global_axis_pixels[y][x]
                let idx_arr = global_pixels_arr[y][x].split("-").map(Number)
                let result_order = []
                for (let i = 0; i < order.length; i++) {
                    if (idx_arr.indexOf(order[i]) != -1) {
                        result_order.push(order[i])
                    }
                }
                global_axis_colors[global_pixels_arr[y][x]] = getCompositedColor(palette, result_order)
            }
        }
    }
    background_color = tmp
}

function prepareColorPixels(chartData, renderMethod, flag = true) {
    let cluster_num = chartData.length;
    // get distribution data for each class
    let image_data = new Array(cluster_num)
    for (let i = 0; i < cluster_num; i++) {
        let c = d3.rgb(Tableau_10_palette[i])
        renderMethod(i, [chartData[i]], image_data, [c.r, c.g, c.b, 0.5], flag)
    }
    // make sure the image data is ready
    let nIntervId;
    function checkImageData() {
        let flag = false
        for (let i = 0; i < cluster_num; i++) {
            if (image_data[i] === undefined) {
                flag = true
                // break
            }
        }
        if (!flag) {
            clearInterval(nIntervId)
            console.log("image_data", image_data);
            // traverse the image data
            let pixel_arr = traverseImageData()
            processPixelArray(cluster_num, pixel_arr)
        }
    }
    function traverseImageData() {
        let pixel_arr = {}
        for (let j = 0; j < SVGHEIGHT; j++) {
            for (let k = 0; k < SVGWIDTH; k++) {
                let index = j * SVGWIDTH + k;
                for (let i = 0; i < cluster_num; i++) {
                    let tuple = [image_data[i][index * 4], image_data[i][index * 4 + 1], image_data[i][index * 4 + 2], image_data[i][index * 4 + 3]]
                    if (tuple[0] === background_color[0] && tuple[1] === background_color[1] && tuple[2] === background_color[2]) {
                        continue // background
                    } else {
                        if (pixel_arr[j] === undefined) pixel_arr[j] = {}
                        if (pixel_arr[j][k] === undefined) pixel_arr[j][k] = []
                        pixel_arr[j][k].push(i)
                    }
                }
            }
        }
        return pixel_arr
    }

    nIntervId = setInterval(function () {
        checkImageData()
    }, 1000);
}

function getHueDiff(hsl_0, hsl_1) {
    let hue_diff = Math.abs(hsl_0.h - hsl_1.h)
    if (hue_diff > 180) {
        hue_diff = 360 - hue_diff
    }
    if (isNaN(hue_diff)) return 180
    return +hue_diff.toFixed(0)
}

/** download file **/



function saveTable(name = "data.csv") {
    let data = hist_data;
    let str = "";
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            str += data[i][j] + ","
        }
        str += "\n"
    }
    downloadFile(name, str);
}

function downloadFile(fileName, content) {
    var aTag = document.createElement('a');
    var blob = new Blob(['\ufeff' + content], { type: "text/csv" });
    aTag.download = fileName;
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
}

function svg2Png(svg, divObj) {
    let fileName = "result.png";
    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);
    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';
    // prepend a "header"
    var image64 = b64Start + svg64;
    //create a temporary canvas
    divObj.append("canvas").attr("id", "virtual_canvas")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT)//.attr("style", "display:none");

    image.onload = function () {
        document.getElementById("virtual_canvas").getContext('2d').drawImage(image, 0, 0);
        var canvasElement = document.getElementById("virtual_canvas");
        var MIME_TYPE = "image/png";
        var imgURL = canvasElement.toDataURL(MIME_TYPE);

        var dlLink = document.createElement('a');
        dlLink.download = fileName;
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        d3.select("#virtual_canvas").remove();
    };
    image.onerror = function () { console.log("Image failed!"); };
    // set it as the source of the img element
    image.src = image64;

}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function sampleFromGaussian(num, mean, std) {
    let data = new Array(num),
        tmp = 1 / (Math.sqrt(2 * Math.PI) * std)
    for (let i = 0; i < num; i++) {
        let x = getRandomArbitrary(mean - 3 * std, mean + 3 * std)
        data[i] = tmp * Math.exp(-(x - mean) * (x - mean) / (2 * std * std))
    }
    return data
}

/**
 * Gamma function
 * https://blog.csdn.net/A_Pointer/article/details/108021352?spm=1001.2101.3001.6650.5&utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ERate-5-108021352-blog-132936922.235%5Ev40%5Epc_relevant_3m_sort_dl_base1&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ERate-5-108021352-blog-132936922.235%5Ev40%5Epc_relevant_3m_sort_dl_base1&utm_relevant_index=10
 */
//伽马函数（辅助函数，用于求解贝塞尔函数,任意阶数）
//x 变量值
//setAbsRelaErr 相对误差绝对值
function gammaFunc(x, setAbsRelaErr = 0.0001) {
    //初始条件判断
    if (x == 0) return 0
    if (Math.abs(1.0 - x) < 0.00001) {
        return 1.0;
    } else if (Math.abs(x - 0.5) < 0.00001) {
        return Math.sqrt(3.1415926);
    }

    //递归求取伽马函数值
    if (x > 1.0) {
        return (x - 1) * gammaFunc(x - 1, setAbsRelaErr);
    } else if (x < 0.0) {
        return gammaFunc(x + 1, setAbsRelaErr) / x;
    }

    let res = 0.0;
    let temp = 1.0;
    let check = 0.0;
    let i = 1;
    while (Math.abs((check - temp) / temp) > setAbsRelaErr) {
        check = temp;
        temp *= i / (x - 1 + i);
        i++;
    }
    res = temp * Math.pow(i, x - 1);

    return res;
}

// https://www.jianshu.com/p/3759d67ec5d4
function gammaDist(x, alpha, lambda) {
    let gamma_alpha = gammaFunc(alpha)
    return Math.pow(lambda, alpha) / gamma_alpha * Math.pow(x, alpha - 1) * Math.pow(Math.E, -lambda * x)
}



function checkHistData(histData, pixelRate) {

    if (histData.length < 2) return true

    let pixel_arr = {}
    for (let i = 0; i < histData.length; i++) {
        for (let j = 0; j < histData[i].length; j++) {
            let y = Math.round(axis_y(histData[i][j]))
            // if (y === 0) continue
            if (pixel_arr[j] === undefined) pixel_arr[j] = {}
            if (pixel_arr[j][y] === undefined) pixel_arr[j][y] = []
            for (let k = y; k < svg_height; k++) {
                if (pixel_arr[j][k] === undefined) pixel_arr[j][k] = []
                pixel_arr[j][k].push(i)
            }
        }
    }

    let pixel_sum = 0
    let pixels_num_arr = {}
    for (let y in pixel_arr) {
        for (let x in pixel_arr[y]) {
            if (pixel_arr[y][x].length === 0) continue
            let key = pixel_arr[y][x].join("-")
            if (!pixels_num_arr[key]) pixels_num_arr[key] = []
            pixels_num_arr[key].push([(+y), (+x)])
            pixel_sum++

        }
    }

    let str = {}
    for (let key in pixels_num_arr) {
        str[key] = pixels_num_arr[key].length + " , " + (pixels_num_arr[key].length / pixel_sum).toFixed(2)
        console.log(str, pixel_sum);
        if (pixels_num_arr[key].length / pixel_sum < pixelRate) {
            return false
        }
    }
    return true
}