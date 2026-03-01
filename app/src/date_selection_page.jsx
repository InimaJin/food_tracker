import { Form, redirect } from "react-router-dom";

export async function dateSelectAction({ request }) {
	const formData = await request.formData();
	const date = await formData.get("date_input");
	return redirect(`/meals?d=${date}`);
}

/**
 * For selecting a date.
 */
export default function DateSelectPage() {
	return (
		<Form method="post" className="current-window date-form">
			<input type="date" name="date_input" />
			<button>Go</button>
		</Form>
	);
}
