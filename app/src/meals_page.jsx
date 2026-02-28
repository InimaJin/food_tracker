import { useLoaderData } from "react-router-dom";

export async function mealsPageLoader({ params }) {
	const date = params.date;
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

	//TODO: Input field for adding a meal to this date.
	return (
		<div className="current-window meals-window">
			<h1>Meals for {date}</h1>
			<ul className="meals-list">{mealsList}</ul>
		</div>
	);
}
