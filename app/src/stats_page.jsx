import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";

export function statsPageLoader() {
	const user = localStorage.getItem("user");
	return user;
}

export default function StatsPage() {
	const user = useLoaderData();

	const [data, setData] = useState([]);

	function calcDates() {
		const today = new Date();
		const [month, year] = [today.getMonth(), today.getFullYear()];
		const startDate = new Date(year, month, 2).toISOString().split("T")[0];
		const endDate = new Date(year, month + 1, 1).toISOString().split("T")[0];
		return [startDate, endDate];
	}

	const dates = calcDates();
	const [startDate, setStartDate] = useState(dates[0]);
	const [endDate, setEndDate] = useState(dates[1]);

	const buttonRef = useRef();

	const containerRef = useRef();
	useEffect(() => {
		if (data.length === 0) {
			buttonRef.current.click();
			return;
		}

		const plotOptions = {
			margin: 64,
			style: {
				fontSize: 18,
			},
		};

		const kcalPlot = Plot.plot({
			...plotOptions,
			y: {
				grid: true,
				label: "kcal",
			},
			marks: [
				Plot.ruleY([0]),
				Plot.line(data, { x: "date", y: "kcal", sort: "date" }),
			],
		});
		const proteinPlot = Plot.plot({
			...plotOptions,
			y: {
				grid: true,
				label: "protein [g]",
			},
			marks: [
				Plot.ruleY([0]),
				Plot.line(data, { x: "date", y: "protein", sort: "date" }),
			],
		});
		containerRef.current.append(kcalPlot);
		containerRef.current.append(proteinPlot);

		return () => {
			kcalPlot.remove();
			proteinPlot.remove();
		};
	});

	return (
		<div className="current-window scroll-window stats-window">
			<header>
				<h1>Stats</h1>
			</header>
			<div className="scroll-window-main stats-wrapper">
				<div className="date-inputs-wrapper">
					<label htmlFor="start-date">Start</label>
					<label htmlFor="end-date">End</label>
					<input
						type="date"
						name="start-date"
						className="underlined-input"
						value={startDate}
						onChange={(e) => {
							setStartDate(e.target.value);
						}}
					/>
					<input
						type="date"
						name="end-date"
						className="underlined-input"
						value={endDate}
						onChange={(e) => {
							setEndDate(e.target.value);
						}}
					/>
					<button
						disabled={!startDate || !endDate}
						ref={buttonRef}
						className="highlight-btn"
						onClick={async () => {
							fetch(
								`http://localhost:9999/meals?user=${user}&date=${startDate}&endDate=${endDate}`,
							)
								.then((res) => res.json())
								.then((json) => {
									let nextData = json.reduce((map, meal) => {
										const date = meal.date;
										if (!map.has(date)) {
											map.set(date, { kcal: 0, protein: 0 });
										}
										const obj = map.get(date);
										obj.kcal += parseInt(
											((meal.kcal * meal.amount) / 100).toFixed(),
											10,
										);
										obj.protein += parseInt(
											((meal.protein * meal.amount) / 100).toFixed(),
											10,
										);

										return map;
									}, new Map());

									nextData = Array.from(nextData, (day) => {
										const values = day[1];
										return {
											date: new Date(day[0]),
											kcal: values.kcal,
											protein: values.protein,
										};
									});

									setData(nextData);
								});
						}}
					>
						Go!
					</button>
				</div>
				<div ref={containerRef} className="charts-container" />
			</div>
		</div>
	);
}
