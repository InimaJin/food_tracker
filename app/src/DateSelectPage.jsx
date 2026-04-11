import { Form } from "react-router-dom";

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
