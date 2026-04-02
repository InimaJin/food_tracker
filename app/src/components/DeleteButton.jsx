import { useState } from "react";

/**
 * A delete button that needs to be clicked twice.
 */
export function DeleteButton({ onDelete }) {
	const [pending, setPending] = useState(false);

	return (
		<button
			className={`del-btn ${pending ? "highlight-btn" : ""}`}
			type="button"
			onClick={() => {
				if (pending) {
					setPending(false);
					onDelete();
				} else {
					setPending(true);
					setTimeout(() => {
						setPending(false);
					}, 3000);
				}
			}}
		>
			{pending ? "Confirm?" : <i className="bx bx-trash" />}
		</button>
	);
}
