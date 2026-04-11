import { redirect } from "react-router-dom";

export function signUpInAction() {}

/**
 * Read the selected date and redirect to the corresponding meals URL.
 */
export async function dateSelectAction({ request }) {
	const formData = await request.formData();
	const date = await formData.get("date_input");
	return redirect(`/meals?d=${date}`);
}

export function mealsPageAction() {}

export function foodsPageAction() {}
