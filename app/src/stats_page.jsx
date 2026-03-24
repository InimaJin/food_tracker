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
    const [startDate, setStartDate] = useState("2026-02-20");
    const [endDate, setEndDate] = useState("2026-03-24");

    const containerRef = useRef();
    useEffect(() => {
        if (data.length === 0) {
            return;
        }

        const kcalPlot = Plot.plot({
            y: {
                grid: true,
                label: "kcal"
            },
            marks: [
                Plot.ruleY([0]),
                Plot.line(data, {x: "date", y: "kcal", sort: "date"}),
            ]
        })
        const proteinPlot = Plot.plot({
            y: {
                grid: true,
                label: "protein [g]"
            },
            marks: [
                Plot.ruleY([0]),
                Plot.line(data, {x: "date", y: "protein", sort: "date"})
            ]
        });
        containerRef.current.append(kcalPlot);
        containerRef.current.append(proteinPlot)

        return () => {
            kcalPlot.remove();
            proteinPlot.remove();
        };
    })

	return (
		<div className="current-window scroll-window stats-window">
			<header>
				<h1>Stats</h1>
			</header>
			<div className="scroll-window-main">
                <button onClick={async () => {
                    fetch(`http://localhost:9999/meals?user=${user}&date=${startDate}&endDate=${endDate}`)
                    .then(res => res.json())
                    .then(json => {
                        let nextData = json.reduce((map, meal) => {
                            const date = meal.date;
                            if (!map.has(date)) {
                                map.set(date, {kcal: 0, protein: 0});
                            }
                            const obj = map.get(date);
                            obj.kcal += parseInt((meal.kcal * meal.amount / 100).toFixed(), 10);
                            obj.protein += parseInt((meal.protein * meal.amount / 100).toFixed(), 10);

                            return map;
                        }, new Map());
                        
                        nextData = Array.from(nextData, day => {
                            const values = day[1];
                            return {
                                date: new Date(day[0]),
                                kcal: values.kcal,
                                protein: values.protein
                            };
                        });

                        setData(nextData);
                    });
                }}>TEST</button>
                <div ref={containerRef} className="stats-container" />
            </div>
		</div>
	);
}
