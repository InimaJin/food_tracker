import { redirect, useLoaderData } from "react-router-dom";

export async function mealsPageLoader({ request }) {
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const date = searchParams.get("d");
	if (!date) {
		return redirect("/");
	}

	//TODO: Login prompt at start of app for initializing user email.
	const user = localStorage.getItem("user");
	const meals = await fetch(
		`http://localhost:9999/meals?user=${user}&date=${date}`,
	).then((res) => res.json());

	return {
		date,
		meals,
	};
}

/**
 * A list of the meals consumed on a particular date.
 * Provides inputs and buttons for manipulating that list.
 */
export default function MealsPage() {
	const { date, meals } = useLoaderData();

	const mealsList = meals.map((meal) => {
		const { food_id, name, amount, kcal, protein } = meal;

		return (
			<li key={food_id}>
				<div className="meal-top">
					<h2>{name}</h2>
					<h2>{amount}g</h2>
				</div>
				<ul className="meal-info-list">
					<li>{(kcal * amount) / 100}kcal</li>
					<li>{protein !== 0 ? protein + "g" : "no"} protein</li>
				</ul>
			</li>
		);
	});

	//TODO: List should not push header down when too long. List must be scrollable instead.
	//TODO: Input field for adding a meal to this date, see API endpoint /add-meal.
	//TODO: Button for deleting a meal
	return (
		<div className="current-window meals-window">
			<h1>Meals for {date}</h1>
			<ul className="meals-list">{mealsList}</ul>
		</div>
	);
}
