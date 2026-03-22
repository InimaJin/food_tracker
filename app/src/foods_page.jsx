import { useEffect, useRef, useState } from "react";
import { redirect, useLoaderData, Form } from "react-router-dom";

export async function foodsPageLoader() {
	const user = localStorage.getItem("user");
	if (!user) {
		return redirect("/");
	}
	const foods = await fetch(`http://localhost:9999/foods?user=${user}`).then(
		(res) => res.json(),
	);

	return { user, foods };
}

export function foodsPageAction() {}

/**
 * A dialog for updating kcal/ protein values of a selected food.
 */
function EditFoodDialog({ ref, food, setEditFood, onSubmit }) {
	const { name, kcal, protein } = food;

	const [kcalInput, setKcalInput] = useState(kcal);
	const [proteinInput, setProteinInput] = useState(protein);
	//TODO: Button for deleting food.
	return (
		<dialog ref={ref} closedby="any" onClose={() => setEditFood({})}>
			<Form
				method="post"
				autoComplete="off"
				onSubmit={() => onSubmit(kcalInput, proteinInput)}
			>
				<h2>{name}</h2>
				<div className="dialog-input-wrapper">
					<label htmlFor="kcal">Kcal/ 100g</label>
					<input
						className="underlined-input"
						name="kcal"
						type="number"
						min="0"
						value={kcalInput}
						onChange={(e) => setKcalInput(e.target.value)}
					/>
				</div>
				<div className="dialog-input-wrapper">
					<label htmlFor="protein">protein/ 100g</label>
					<input
						className="underlined-input"
						name="protein"
						type="number"
						min="0"
						value={proteinInput}
						onChange={(e) => setProteinInput(e.target.value)}
					/>
				</div>
				<div className="form-btn-wrapper">
					<button type="button" onClick={() => ref.current.close()}>
						Cancel
					</button>
					<button type="submit" className="highlight-rect-btn">
						Ok
					</button>
				</div>
			</Form>
		</dialog>
	);
}

/**
 * Overview of a user's foods.
 */
export default function FoodsPage() {
	const { user, foods: foodsArr } = useLoaderData();
	const dialogRef = useRef(null);

	const [foodsState, setFoodsState] = useState(foodsArr);
	//TODO: Button for selecting sorting method
	const foods = foodsState.toSorted((f1, f2) => {
		return f1.name.localeCompare(f2.name);
	});
	const [editFood, setEditFood] = useState({});
	const foodsList = foods.map((food) => {
		const { food_id: foodId, name, kcal, protein } = food;
		return (
			<div
				key={foodId}
				className="food-card"
				onClick={() => {
					setEditFood(food);
				}}
			>
				<h2>{name}</h2>
				<ul>
					<li>{kcal}kcal/ 100g</li>
					<li>{protein !== 0 ? `${protein}g protein/ 100g` : "no protein"}</li>
				</ul>
			</div>
		);
	});

	useEffect(() => {
		if (editFood.name) {
			dialogRef.current.showModal();
		}
	}, [editFood]);

	function onFoodEdit(newKcal, newProtein) {
		fetch(
			`http://localhost:9999/edit-food?user=${user}&foodId=${editFood.food_id}&kcal=${newKcal}&protein=${newProtein}`,
		)
			.then((res) => res.json())
			.then((updatedFood) => {
				let nextFoods = foods.filter(
					(food) => food.food_id !== editFood.food_id,
				);
				setFoodsState([...nextFoods, updatedFood]);
				setEditFood({});
			});
	}

	return (
		<div className="current-window scroll-window foods-window">
			<header>
				<h1>My foods</h1>
			</header>
			<div className="scroll-window-main foods-grid">{foodsList}</div>
			<EditFoodDialog
				key={editFood.food_id}
				ref={dialogRef}
				food={editFood}
				setEditFood={setEditFood}
				onSubmit={onFoodEdit}
			/>
		</div>
	);
}
