import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";
import { redirect, useLoaderData } from "react-router-dom";
import { apiRoot } from "./constants.json";

export function statsPageLoader() {
	const token = localStorage.getItem("token");
	if (!token) {
		return redirect("/");
	}
	return token;
}

export default function StatsPage() {
	const token = useLoaderData();

	const [data, setData] = useState();
	const [averages, setAverages] = useState({});

	function calcDates() {
		const today = new Date();
		const [month, year] = [today.getMonth(), today.getFullYear()];
		const startDate = new Date(year, month, 2);
		const endDate = new Date(year, month + 1, 1);
		return [startDate, endDate];
	}

	const dates = calcDates();
	const [startDate, setStartDate] = useState(dates[0]);
	const [endDate, setEndDate] = useState(dates[1]);
	const validDates =
		!startDate || !endDate || startDate.getTime() <= endDate.getTime();

	const dayDiff = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / 86_400_000,
	);

	function loadData() {
		fetch(`${apiRoot}/meals?date=${startDate}&endDate=${endDate}`, {
			method: "GET",
			headers: {
				Authorization: token,
			},
		})
			.then((res) => res.json())
			.then((json) => {
				let nextData = json.reduce((map, meal) => {
					const date = meal.date;
					if (!map.has(date)) {
						map.set(date, { kcal: 0, protein: 0 });
					}
					const obj = map.get(date);
					obj.kcal += parseInt(((meal.kcal * meal.amount) / 100).toFixed(), 10);
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

				let kcalAverage = 0;
				let proteinAverage = 0;
				for (const day of nextData) {
					kcalAverage += day.kcal;
					proteinAverage += day.protein;
				}
				setAverages({
					kcal: Math.round(kcalAverage / dayDiff),
					protein: Math.round(proteinAverage / dayDiff),
				});
			});
	}

	const plotContainerRef = useRef();
	useEffect(() => {
		if (!data) {
			loadData();
			return;
		}

		if (data.length === 0) {
			return;
		}

		const plotOptions = {
			grid: true,
			margin: 64,
			style: {
				fontSize: 18,
			},
		};

		const kcalPlot = Plot.plot({
			...plotOptions,
			y: {
				label: `kcal (average: ${averages.kcal})`,
			},
			marks: [
				Plot.ruleY([0]),
				Plot.ruleX(data, {
					x: "date",
					y: "kcal",
					strokeWidth: 2.3,
					markerEnd: "dot",
				}),
			],
		});

		const proteinPlot = Plot.plot({
			...plotOptions,
			y: {
				label: `protein [g] (average: ${averages.protein})`,
			},
			marks: [
				Plot.ruleY([0]),
				Plot.ruleX(data, {
					x: "date",
					y: "protein",
					strokeWidth: 2.3,
					markerEnd: "dot",
				}),
			],
		});

		plotContainerRef.current.append(kcalPlot);
		plotContainerRef.current.append(proteinPlot);

		return () => {
			kcalPlot.remove();
			proteinPlot.remove();
		};
	});

	//Returns the string representing the date-portion of a given date in ISO 8601.
	function toISODateOnly(date) {
		return date.toISOString().split("T")[0];
	}

	//TODO: Disallow button click when invalid date range
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
						value={toISODateOnly(startDate)}
						onChange={(e) => {
							setStartDate(new Date(e.target.value));
						}}
					/>
					<input
						type="date"
						name="end-date"
						className="underlined-input"
						value={toISODateOnly(endDate)}
						onChange={(e) => {
							setEndDate(new Date(e.target.value));
						}}
					/>
					<div>
						<button
							disabled={!validDates}
							className="highlight-btn icon-btn"
							onClick={loadData}
						>
							<i className="bx bx-check" />
						</button>
					</div>
				</div>
				<div ref={plotContainerRef} className="charts-container" />
			</div>
		</div>
	);
}
