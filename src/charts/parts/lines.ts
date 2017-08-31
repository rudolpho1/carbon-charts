import * as d3 from 'd3'
import {Axis} from './axis.ts'
import {Grid} from './grid.ts'
import {Legend} from './legend.ts'
import {Tooltip} from './tooltip.ts'
import '../style.scss'
import {Charts} from '../index.ts'

export namespace Lines {
	export function drawChart(data, parent, options) {
		let {chartID, container} = Charts.setChartIDContainer(parent)
		Charts.setResizable();
		options.chartSize = Charts.getActualChartSize(container, options);

		let svg = Charts.setSVG(container, options);
		let xScale = Charts.setXScale(data, options);
		let yScale = Charts.setYScale(data, options, Charts.getActiveDataSeries(container));

		Axis.drawXAxis(svg, xScale, options, data);
		Axis.drawYAxis(svg, yScale, options, data);
		Grid.drawXGrid(svg, xScale, options, data);
		Grid.drawYGrid(svg, yScale, options, data);
		Legend.addLegend(container, data, options);
		if (options.legendClickable) {
			Charts.setClickableLegend(data, parent, options)
		}
		Charts.redrawFunctions[chartID] = {
			self: this,
			data, parent, options
		}

		draw(svg, xScale, yScale, options, data, Charts.getActiveDataSeries(container));
		setTooltip(chartID, svg);
	}

	export function setTooltip(chartID, svg) {
		Charts.setTooltip(chartID);
		Charts.setTooltipCloseEventListener(chartID, resetLineOpacity);
		Charts.addTooltipEventListener(chartID, svg, svg.selectAll("circle"), reduceOpacity);
	}


	export function draw(svg, xScale, yScale, options, data, activeSeries) {
		let keys: any;
		let dataList = data;
		if (options.dimension) {
			let newKeys = <any>[];
			dataList.forEach(d => {
				if (!newKeys.includes(d[options.dimension])) {
					newKeys.push(d[options.dimension]);
				}
			});
			keys = newKeys;
		} else if (options.y2Domain) {
			keys = options.yDomain.concat(options.y2Domain);
		} else {
			keys = options.yDomain;
		}
		const color = d3.scaleOrdinal().range(options.colors).domain(keys);
		keys = activeSeries ? activeSeries : keys;
		const line = d3.line<any>()
			.x(d => xScale(d.key) + options.chartSize.width / dataList.length / 2)
			.y(d => yScale(d.value));
		keys.forEach((value, idx) => {
			const colorKey = value;
			if (options.dimension) {
				dataList = data.filter(d => d[options.dimension] === value);
				value = options.yDomain[0];
			}
			const valueData = dataList.map(d => (<any>{
				xAxis: options.xDomain,
				key: d[options.xDomain],
				series: value,
				value: d[value],
				dimension: options.dimension,
				dimVal: d[options.dimension]
			}));
			const series = svg.append("g");
			series.append("path")
				.data([valueData])
				.attr("fill", "none")
				.attr("stroke", "steelblue")
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 1.5)
				.attr("d", line)
				.style("stroke", color(colorKey));

			series.selectAll("dot")
				.data(valueData)
				.enter().append("circle")
				.attr("r", 3.5)
				.attr("fill", "white")
				.attr("stroke", color(colorKey))
				.attr("stroke-widget", "10%")
				.attr("cx", d => xScale(d.key) + options.chartSize.width / dataList.length / 2)
				.attr("cy", d => yScale(d.value))
		});
	}

	export function reduceOpacity(svg, exceptionCircle) {
		svg.selectAll("path").attr("stroke-opacity", 0.25)
		svg.selectAll("circle").attr("stroke-opacity", 0.25)
		d3.select(exceptionCircle.parentNode).select("path").attr("stroke-opacity", 1)
		d3.select(exceptionCircle.parentNode).selectAll("circle").attr("stroke-opacity", 1)
		d3.select(exceptionCircle).attr("stroke-opacity", 1)
		d3.select(exceptionCircle).attr("fill", d3.select(exceptionCircle).attr("stroke"))
	}

	export function resetLineOpacity() {
		d3.selectAll("svg").selectAll("path").attr("stroke-opacity", 1)
		d3.selectAll("svg").selectAll("circle").attr("stroke-opacity", 1)
			.attr("fill", "white")
	}
}
