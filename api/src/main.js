import express from "express";
import cors from "cors";
import postgres from "postgres";

const app = express();
app.use(cors());
const sql = postgres({
	host: "localhost",
	port: 5432,
	database: "food_tracker",
	username: "postgres",
});

/**
 * Retrieve a list of all foods owned by the given user.
 * Request query must contain: user.
 * Each food in the array looks like this: { food_id, name, kcal (per 100g), protein (per 100g) }.
 */
app.get("/foods", async (req, res) => {
	const { user } = req.query;
	if (!user) {
		res.status(400).send("No user specified.");
	}

	const foods = await sql`
		SELECT id AS food_id, name, kcal, protein FROM foods WHERE owner=${user}
	`;

	res.json(foods);
});

/**
 * Add a food for a given user.
 * Request query must contain: user, foodName, kcal, protein.
 * The response is the newly added food: { food_id, name, kcal, protein }.
 */
app.get("/add-food", async (req, res) => {
	const { user, foodName, kcal, protein } = req.query;

	const newFood = await sql`
		INSERT INTO foods (name, owner, kcal, protein) 
		VALUES (${foodName}, ${user}, ${kcal}, ${protein})
		RETURNING id AS food_id, name, kcal, protein;
	`;

	res.json(newFood);
});

/**
 * Retrieve a list of meals for a given user and date.
 * Request query must contain: user, date.
 * Each meal entry in the array looks like this: { food_id, name, amount [g], kcal (per 100g), protein [g / 100g]}.
 */
app.get("/meals", async (req, res) => {
	const { user, date } = req.query;

	if (!user || !date) {
		res.status(400).send("Undefined parameter!");
		return;
	}

	const meals = await sql`
		SELECT food_id, name, amount, kcal, protein
        FROM foods, meals WHERE owner=${user} AND id=food_id AND date=${date};
	`;
	res.json(meals);
});

/**
 * Add a meal to the database. The food must already exist for the specified user.
 * Request query must contain: user, date, foodName, amount.
 * Optional query param: overwrite - if true and the given meal already exists,
 * the existing meal's amount is overwritten with the new amount.
 * If false or not specified and the given meal already exists, the existing meal's amount is
 * incremented by the given amount value.
 * Response is an object for the meal if the food exists: { food_id, name, amount, kcal, protein }.
 */
app.get("/add-meal", async (req, res) => {
	const { user, date, foodName, amount, overwrite } = req.query;

	const idArr = await sql`
		SELECT id FROM foods WHERE name=${foodName} AND owner=${user} 
	`;
	if (idArr.length === 0) {
		res.status(400).send("No such food: " + foodName);
		return;
	}
	const foodId = idArr[0].id;

	await sql.begin(async (sql) => {
		await sql
			.savepoint(
				(sql) =>
					sql`
				INSERT INTO meals (date, food_id, amount) VALUES (${date}, ${foodId}, ${amount});
			`,
			)
			.catch((err) => {
				const baseVal = overwrite === "true" ? sql(0) : sql("amount");
				//If the desired food already has a record for the given day, the above fails due to unique key violation.
				return sql`
					UPDATE meals SET amount = ${baseVal} + ${amount}
					WHERE food_id = ${foodId} AND date = ${date};
				`;
			});
	});

	const addedMeal = await sql`
		SELECT food_id, name, amount, kcal, protein
        FROM foods, meals WHERE food_id=${foodId} AND owner=${user} AND id=food_id AND date=${date};
	`;
	res.json(addedMeal[0]);
});

/**
 * Delete a meal for given day.
 * Request query must contain: user, date, foodId.
 * If no such meal exists, no response is issued. Otherwise, the response is
 * the food object the meal was associated with: { id, name, kcal, owner, protein }.
 */
app.get("/del-meal", async (req, res) => {
	const { user, date, foodId } = req.query;
	const delArr = await sql`
		DELETE FROM meals WHERE food_id = ${foodId} AND date = ${date}
		AND EXISTS (SELECT 1 FROM foods WHERE id = meals.food_id AND owner = ${user});
	`;

	//If a meal actually was deleted, respond with the food data.
	if (delArr.count > 0) {
		const food = (
			await sql`
			SELECT id AS food_id, name, owner, kcal, protein FROM foods 
			WHERE id=${foodId} AND owner=${user};
		`
		)[0];
		res.json(food);
	}
});

const port = 9999;
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
