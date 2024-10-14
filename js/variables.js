
let hist_data
let blended_colors_all, blended_colors_arr, blended_colors_neighboring_relation
let pixels_num_weight, spatial_distance_arr, spatial_weight
let background_color = [255, 255, 255, 1]
let Tableau_10_palette = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"];

let svg_margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
},
    svg_width = 400,
    svg_height = 300;
let SVGWIDTH = svg_width + svg_margin.left + svg_margin.right,
    SVGHEIGHT = svg_height + svg_margin.top + svg_margin.bottom;
let bars_num = 50//25
let axis_x_bandwidth = 15
axis_x_bandwidth = Math.floor(svg_width / bars_num)
svg_margin.left = svg_margin.right = Math.floor((SVGWIDTH - axis_x_bandwidth * bars_num) / 2)
// svg_width = axis_x_bandwidth * bars_num;
// SVGWIDTH = svg_width + svg_margin.left + svg_margin.right;

var axis_y = d3.scaleLinear()
    .range([svg_height, 0])
    .domain([0, 1.2]);

let global_pixels_arr
let threshold_variables = [3, 5, 0.01, 100]
let weight_global = [1, 1, 1]
let unrelated_colors_global
let curr_blending_method = "Standard Color Blending"
let axis_x_values
let optimizeColorSign = -0.5, optimizeAssignmentSign = 0.5, optimizeDepthSign = 0.5
let canvas_id_global_count = 0

let global_axis_pixels = {}
let global_axis_colors = {}

let dec_factor = 0.99
let opacity_range_global = [0, 1]

let overlap_size_arr, blended_num_arr