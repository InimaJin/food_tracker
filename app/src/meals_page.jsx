import { useState, useRef, useEffect } from "react";
import { redirect, useLoaderData, Form } from "react-router-dom";

/**
 * Load all meals for given user and date.
 */
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
		user,
		date,
		meals,
	};
}

/**
 * Add new meal to database for current date.
 */
export async function mealsPageAction({ request }) {
	const urlSearchParams = new URLSearchParams(request.url.split("?")[1]);
	const date = urlSearchParams.get("d");
	if (!date) {
		return redirect("/");
	}
	const formData = await request.formData();
	const foodName = formData.get("food");
	const amount = formData.get("amount");
	const user = localStorage.getItem("user");
	await fetch(
		`http://localhost:9999/add-meal?user=${user}&date=${date}&foodName=${foodName}&amount=${amount}`,
	);
	return redirect(request.url);
}

/**
 * An overview of the meals consumed on a particular date.
 */
export default function MealsPage() {
	const { user, date, meals } = useLoaderData();

	//Descending by total calories per meal.
	meals.sort((m1, m2) => {
		const m1Kcal = (m1.kcal * m1.amount) / 100;
		const m2Kcal = (m2.kcal * m2.amount) / 100;
		if (m1Kcal > m2Kcal) {
			return -1;
		} else if (m1Kcal < m2Kcal) {
			return 1;
		}
		return 0;
	});
	const mealsList = meals.map((meal) => {
		const { food_id, name, amount, kcal, protein } = meal;

		return (
			<li key={food_id}>
				<div className="meal-top">
					<h2>{name}</h2>
					<h2>{amount}g</h2>
				</div>
				<ul className="meal-info-list">
					<li>
						<div>
							<span>{kcal}kcal/ 100g</span>
							<span>{(kcal * (amount / 100)).toFixed()}kcal</span>
						</div>
					</li>
					<li>
						<div>
							<span>
								{protein !== 0 ? protein + "g protein/ 100g" : "no protein"}
							</span>
							<span>
								{protein !== 0 &&
									`${(protein * (amount / 100)).toFixed()}g protein`}
							</span>
						</div>
					</li>
				</ul>
			</li>
		);
	});

	const dialogRef = useRef(null);
	const [allFoods, setAllFoods] = useState([]);
	const [matchingFoods, setMatchingFoods] = useState([]);
	function openAddMealDialog() {
		dialogRef.current.showModal();
		fetch(`http://localhost:9999/foods?user=${user}`)
			.then((res) => res.json())
			.then((foodsArr) => {
				setAllFoods(foodsArr);
				setMatchingFoods(foodsArr);
			});
	}

	//TODO: Button for deleting a meal
	return (
		<div className="current-window meals-window">
			<h1>Meals for {date}</h1>
			<ul className="meals-list">{mealsList}</ul>
			<AddMealDialog
				dialogRef={dialogRef}
				allFoods={allFoods}
				{...{ matchingFoods, setMatchingFoods }}
			/>
			<button className="add-meal-btn" onClick={openAddMealDialog}>
				+
			</button>
		</div>
	);
}

/**
 * A dialog with a form for adding a new meal to the currently viewed date.
 */
function AddMealDialog({
	dialogRef,
	allFoods,
	matchingFoods,
	setMatchingFoods,
}) {
	const [selectedFoodName, setSelectedFoodName] = useState("");
	const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

	//TODO: Form should only be submittable when input is valid (food exists etc.).
	return (
		<dialog className="add-meal-dialog" closedby="any" ref={dialogRef}>
			<h2>Add meal</h2>
			<Form
				method="post"
				autoComplete="off"
				onSubmit={(e) => {
					dialogRef.current.close();
				}}
			>
				<div className="add-meal-input-div">
					<label htmlFor="food">Food</label>
					<input
						name="food"
						type="text"
						value={selectedFoodName}
						onFocus={(e) => {
							setShowFoodSuggestions(true);
						}}
						onBlur={(e) => {
							//TODO: Find a more reliable solution for hiding the food suggestions upon blur while still registering click on li.
							setTimeout(() => {
								setShowFoodSuggestions(false);
							}, 100);
						}}
						onChange={(e) => {
							const input = e.target.value.toLowerCase();
							const nextMatchingFoods = allFoods.filter(({ name }) => {
								name = name.toLowerCase();
								return name.includes(input);
							});
							setSelectedFoodName(e.target.value);
							setMatchingFoods(nextMatchingFoods);
						}}
					/>
					{showFoodSuggestions && (
						<ul className="food-suggestions-list">
							{matchingFoods.map((food) => {
								return (
									<li
										key={food.id}
										onClick={(e) => {
											setSelectedFoodName(food.name);
											setShowFoodSuggestions(false);
											document.querySelector("input[name='amount']").focus();
										}}
									>
										<span className="suggestions-foodname">{food.name}</span>
										<span>{food.kcal}kcal/ 100g</span>
									</li>
								);
							})}
						</ul>
					)}
				</div>
				<div className="add-meal-input-div">
					<label htmlFor="amount">Amount in grams</label>
					<input name="amount" type="number" min="0" />
				</div>
				<div className="add-meal-btn-wrapper">
					<button type="button" onClick={(e) => dialogRef.current.close()}>
						Cancel
					</button>
					<button type="submit">Ok</button>
				</div>
			</Form>
		</dialog>
	);
}
