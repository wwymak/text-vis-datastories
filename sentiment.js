/**
 * experimental bar/bubble plot for visualising  a transciprt
 */

const q = d3.queue();

const width = 500;
const height = 500;
const xScale = d3.scaleOrdinal();
const yScale = d3.scaleOrdinal([height, 0]);
const margins = {top: 10, bottom: 30, left: 30, right: 30};
const colorScale = d3.scaleSequential( d3.interpolatePlasma).domain([1, -1]); //for sentiment / polarity
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisRight(yScale);
const dispatch = d3.dispatch("textSelect", "textDeselect");

const circleRadius = 8;

q.defer(d3.json, 'eb.json');

q.await((err, eb) => {
    const ebSentiment = JSON.parse(eb);
    const minSubjectivity = d3.min(ebSentiment.map(d => d3.min(d, f => f.subjectivity)));
    console.log(ebSentiment, d3.min(ebSentiment.map(d => d3.min(d, f => f.subjectivity))));

    let svg = d3.select("#vis").append('svg').attr('width', (ebSentiment.length * 2 * circleRadius + 100)).attr('height', height)
        .append('g').attr('class', 'chart-area');
    // let xAxisG = svg.append('g').attr('class', 'x axis')
    //     .attr('transform', `translate(${margins.left}, ${height- margins.bottom})`)
    //     .call(xAxis);
    // let yAxisG = svg.append('g').attr('class', 'y axis')
    //     .attr('transform', `translate(${margins.left}, ${margins.top})`)
    //     .call(yAxis);
    let transition = d3.transition().duration(2750);
    let dialogueG = svg.selectAll('g.dialogue').data(ebSentiment)
        // .attr('transform', (d, i) => `translate(${circleRadius * 2 * i}, ${height - margins.bottom})`)
        // .attr('class', 'dialogue');
    dialogueG.exit().remove();
    dialogueG.enter().append('g')
        .attr('transform', (d, i) => `translate(${(circleRadius + 1) * 2 * i  }, ${height - margins.bottom})`)
        .attr('class', 'dialogue')
        .each(function (g, j) {
            let svg = d3.select(this);
            let circle = svg.selectAll('circle').data(d => d);
            circle.exit()
                .transition(transition)
                .attr("cy", 0)
                .style("fill-opacity", 1e-6)
                .remove();

            circle.style('stroke', d => colorScale(d.subjectivity))
                .transition(transition)
                .attr('cy', (d, i) => - ( 2 * i + 1) * (circleRadius + 1))

            circle.enter().append('circle')
                .attr('r', circleRadius)
                .attr('cx', circleRadius)
                .attr('fill', d => colorScale(d.subjectivity))
                .style('stroke', d => colorScale(d.subjectivity))
                .style('stroke-width', 0.5)
                .on('mouseover', (d, i) => {
                    console.log(d, i,j,  this.parentNode); // j is the parent g index, ie the gth div
                    dispatch.call("textSelect", this, j, i, d)
                })
                .on('mouseout', (d, i) => {
                    dispatch.call("textDeselect",  this, j, i)
                })
                .transition(transition)
                .attr('cy', (d, i) => - ( 2 * i + 1) * (circleRadius + 1))
                // .merge(circle);
        }).merge(dialogueG);

    let textContainer = d3.select("#textContainer").selectAll('div.speech').data(ebSentiment);
    textContainer.exit().remove();

    textContainer.enter().append('div').attr('class', 'speech')
        .each(function () {
            let div = d3.select(this);
            let sentence = div.selectAll('span').data(d => d);
                sentence.exit().remove();
                sentence.html(d =>{console.log(d); return d.text});
            sentence.enter().append('span')
                .html(d => d.text)
                .on('textSelect', (parentIndex, childIndex) => {
                    console.log(parentIndex, childIndex)
                } );
        });


    let legendSVG = d3.select('#legend').append('svg').attr('width', 400).attr('height', 50);
    let gradient = legendSVG.append('defs').append('linearGradient').attr('id', 'legendGradient')
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(minSubjectivity ))
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(1))
        .attr("stop-opacity", 1);

    legendSVG.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', 300).attr('height', 20)
        .attr('fill', "url(#legendGradient)");

    legendSVG.append('text').attr('transform', 'translate(0, 45)').text(minSubjectivity);
    legendSVG.append('text').attr('transform', 'translate(300, 45)').text(1);

    dispatch.on('textSelect', (parentIndex, childIndex, data) => {
        console.log(data);
        d3.selectAll('div.speech').filter((d, i) => i == parentIndex).classed('selected', true)
            .selectAll('span').filter((d, i) => i == childIndex).style('background-color', colorScale(data.subjectivity));
        d3.select("#mouseover-text").html(data.text).style('color', colorScale(data.subjectivity));
    });
    dispatch.on('textDeselect', (parentIndex, childIndex) => {
        console.log(`parent: ${parentIndex}, child: ${childIndex}`, "mouseout")
        d3.selectAll('div.speech').filter((d, i) => i == parentIndex).classed('selected', false)
            .selectAll('span').filter((d, i) => i == childIndex).style('background-color', 'transparent');
        d3.select("#mouseover-text").html("&nbsp");
    });



});

