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
	const today = new Date().toISOString().split("T")[0];

	return (
		<Form method="post" className="current-window date-form">
			<input
				type="date"
				name="date_input"
				className="underlined-input"
				defaultValue={today}
			/>
			<button className="highlight-btn">Go</button>
		</Form>
	);
}
