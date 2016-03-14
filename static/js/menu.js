/**
 * creates the tree node structure and creates takes care of requesting for state information
 * AJAX requests to the flask server
 */
var curr_state = "Illinois";
var started = false;
function menu() {
    "use strict";
    var states = [{
        text: "Northeast",
        nodes: [{
                text: "Maine"
            }, {
                text: "New York"
            }, {
                text: "New Hampshire"
            }, {
                text: "Pennsylvania"
            }, {
                text: "Vermont"
            }, {
                text: "New Jersey"
            }, {
                text: "Massachusetts"
            }, {
                text: "Rhode Island"
            }, {
                text: "Connecticut"
            }

        ]
    }, {
        text: "Midwest",
        nodes: [{
                text: "Wisconsin"
            }, {
                text: "North Dakota"
            }, {
                text: "Michigan"
            }, {
                text: "South Dakota"
            }, {
                text: "Illinois"
            }, {
                text: "Nebraska"
            }, {
                text: "Indiana"
            }, {
                text: "Kansas"
            }, {
                text: "Ohio"
            }, {
                text: "Minnesota"
            }, {
                text: "Iowa"
            }

        ]
    }, {
        text: "South",
        nodes: [{
                text: "Delaware"
            }, {
                text: "Kentucky"
            }, {
                text: "Maryland"
            }, {
                text: "Tennessee"
            }, {
                text: "District of Columbia"
            }, {
                text: "Mississippi"
            }, {
                text: "Virginia"
            }, {
                text: "Alabama"
            }, {
                text: "West Virginia"
            }, {
                text: "North Carolina"
            }, {
                text: "South Carolina"
            }, {
                text: "Oklahoma"
            }, {
                text: "Georgia"
            }, {
                text: "Texas"
            }, {
                text: "Florida"
            }, {
                text: "Arkansas"
            }

        ]
    }, {
        text: "West",
        nodes: [{
                text: "Idaho"
            }, {
                text: "Alaska"
            }, {
                text: "Montana"
            }, {
                text: "Washington"
            }, {
                text: "Wyoming"
            }, {
                text: "Oregon"
            }, {
                text: "Nevada"
            }, {
                text: "California"
            }, {
                text: "Utah	Hawaii"
            }, {
                text: "Colorado"
            }, {
                text: "Arizona"
            }, {
                text: "New Mexico"
            }

        ]
    }];
    $('#treeview-selectable').treeview({
        data: states,
        multiSelect: $('#chk-select-multi').is(':checked'),
        onNodeSelected: function(event, node) {
            console.log(node);
            if (node.hasOwnProperty('nodes')) {
                console.log("REGION");
            } else {
                curr_state = node.text
                $.ajax({ // ajax call for revision data for file is mades
                    url: '/info',
                    data: JSON.stringify({ // data that is sent to the flask server
                        state: node.text
                    }),
                    type: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    success: function(response) { // response that is sent back from the flask server
                        if (response['msg'] === 'YES') {
                            console.log("PRINTING AJAX RESPONSE");
                            console.log("YES");
                            console.log(response);

                            $('#slider3').empty();
                            started = false;
                            init(response['data'], response['min'], response['max']);
                        }
                    },
                    dataType: "json",
                    error: function(error) {
                        console.log("ERROR")
                        console.log(error); // log error on invalid ajax request
                    }
                });
            }
            console.log("selected");
            console.log(node);

        },
        onNodeUnselected: function(event, node) { // when the node is unselected/another file is selected
            console.log("UNSELCETED")
            console.log(node);



        }
    });
}


function init(temp, min_val, max_val) {
    console.log(min_val);
    console.log(max_val);
    console.log("START");
    console.log(temp);
    var width = 800;
    var height = 700;
    var padding = 10;
    var k;
    var node;
    var pixelLoc = d3.geo.mercator();
    pixelLoc.scale(2000);
    $('#map svg').remove();
    svg = d3.select('#map')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height);
    d3.json('static/res/coordinates.json', function(coordinates) {
        console.log("STARTING TO READ COORDINATES");
        var coords = [];
        var xs = [];
        var ys = []
        for (alias in coordinates) {
            coords.push(coordinates[alias]);
            xs.push(coordinates[alias][0]);
            ys.push(coordinates[alias][1]);
        }
        var minX = d3.min(xs);
        var maxX = d3.max(xs);
        var xScale = d3.scale.linear().domain([minX, maxX]).range([-50, -
            30
        ]);
        var minY = d3.min(ys);
        var maxY = d3.max(ys);
        var yScale = d3.scale.linear().domain([minY, maxY]).range([-20, -
            10
        ]);
        countries = temp;
        //console.log(countries);
        console.log(min_val, max_val);
        var pointScale = d3.scale.sqrt().domain([min_val, max_val]).range([0, 100]);
        console.log(pointScale);
        console.log("done with scale");
        nodes = []
        for (i = 0; i < countries.length; i++) {

            console.log("in countries looop");
            node = countries[i];
            node.coordinates = coordinates[node.alias];
            if(node.coordinates !== undefined) {

                node.cx = xScale(pixelLoc(node.coordinates)[0]);
                node.cy = yScale(pixelLoc(node.coordinates)[1]);
                node.radius = pointScale(node.points);
                nodes.push(node);
            }
        }
        console.log("CREATING NODES");
        console.log(nodes);
        console.log("DONE");
        force = d3.layout.force()
            .nodes(nodes)
            .links([])
            .size([width, height])
            .charge(function(d) {
                 -Math.pow(d.radius * 5.0, 2.0) / 8;
            })
            .gravity(1.7)
            .on('tick', function(e) {
                k = 10 * e.alpha;
                for (i = 0; i < nodes.length; i++) {
                    nodes[i].x += k * nodes[i].cx
                    nodes[i].y += k * nodes[i].cy
                }
                svg.selectAll('circle')
                    .each(collide(.1, nodes, pointScale))
                    .attr('cx', function(node) {
                        return node.x;
                    })
                    .attr('cy', function(node) {
                        return node.y;
                    });
                svg.selectAll('text')
                    .attr('x', function(node) {
                        return node.x;
                    })
                    .attr('y', function(node) {
                        return node.y + 5;
                    })
                    .attr('opacity', function(node) {
                        if (node.radius < 17) {
                            return 0;
                        }
                        return 1;
                    })

                    //.attr('font-color', 'black');
            })
            .start();

        svg.selectAll('circle')
            .data(nodes)
            .enter().append('svg:circle')
            .attr('cx', function(node) {
                return node.cx;
            })
            .attr('cy', function(node) {
                return node.cy;
            })
            .attr('r', function(node) {
                console.log(node);
                return node.radius;
            })
            .attr('class', function(node) {
                return node.continent.replace(' ', '');
            });
        svg.selectAll('text')
            .data(nodes)
            .enter().append('svg:text')
            .text(function(node) {
                return node.alias + ": " + node.points ;
            })
            .style("font-size", function(d) { return Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 12) + "px"; })
            .attr("dy", ".35em");;
        $('svg circle').tipsy({
        gravity: 'w',
        html: true,
        title: function() {
            var colors = d3.scale.category20();
          var d = this.__data__, c = colors(d.i);
            console.log(d);
          return 'Country :  <span>' + d.name + ' , Immigrants: ' + d.points + '</span>';
        }
      });
        //});
    });
    // Adapted from http://bl.ocks.org/3116713
    var collide = function(alpha, nodes, scale) {
        var quadtree = d3.geom.quadtree(nodes);
        return function(d) {
            var r = d.radius + scale.domain()[1] + padding;
            var nx1 = d.x - r;
            var nx2 = d.x + r;
            var ny1 = d.y - r;
            var ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && quad.point !== d) {
                    var x = d.x - quad.point.x;
                    var y = d.y - quad.point.y;
                    var l = Math.sqrt(x * x + y * y)
                    var r = d.radius + quad.point.radius +
                        padding;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 <
                    ny1;
            });
        }
    }
    if(!started) {
        console.log("GOING TO SET SLIDER");
        set_slider();
    }
    else
        started = true;
};

function set_slider(){
    d3.select('#slider3').call(d3.slider()
    .axis(true).min(1999).max(2010).step(1)
    .on("slide", function(evt, value) {

        console.log("here");
        console.log(value);
        if(value === 1999 || value === 2000){
            $.ajax({ // ajax call for revision data for file is mades
                    url: '/year',
                    data: JSON.stringify({ // data that is sent to the flask server
                        state: curr_state,
                        year: value
                    }),
                    type: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    success: function(response) { // response that is sent back from the flask server
                        if (response['msg'] === 'YES') {
                            console.log("PRINTING AJAX RESPONSE");
                            console.log("YES");
                            console.log(response);

                            //$('#slider3').empty();
                            started = true;
                            init(response['data'], response['min'], response['max']);
                        }
                    },
                    dataType: "json",
                    error: function(error) {
                        console.log("ERROR")
                        console.log(error); // log error on invalid ajax request
                    }
                });

        }})


    );

}