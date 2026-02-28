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
 * Retrieve a list of meals for a given user and date.
 * Request query must contain: user=<user email> and date=<date>.
 * @returns array holding the meal entries, where each entry looks like this: { food_id, name, amount [g], kcal (per 100g), protein [g / 100g]}
 */
app.get("/meals", async (req, res) => {
	const { user, date } = req.query;

	if (!user || !date) {
		res.status(400).send("Undefined parameter!");
		return;
	}

	const meals = await sql`
		SELECT food_id, name, amount, kcal, protein
        FROM foods, meals WHERE owner=${user} AND id=food_id AND date=${date};`;
	res.json(meals);
});

/**
 * Add a meal to the database. The food must already exist for the specified user.
 * Request query must contain: user, date, foodName, amount.
 */
app.get("/add-meal", async (req, res) => {
	const { user, date, foodName, amount } = req.query;

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
			.catch(
				(err) =>
					//If the desired food already has a record for the given day, the above fails due to unique key violation.
					//So, we simply update the amount in the record.
					sql`
				UPDATE meals SET amount = amount + ${amount} WHERE food_id = ${foodId} AND date = ${date};
			`,
			);
	});

	res.send("Currently no verification.");
});

//TODO: Endpoint for creating a new food for given user.
//TODO: Endpoint for deleting meal.

const port = 9999;
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
