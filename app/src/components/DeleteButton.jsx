import { useState } from "react";

/**
 * A delete button that needs to be clicked twice.
 * An optional timeout in seconds can be specified during which the delete
 * operation has to be confirmed.
 */
export function DeleteButton({ onDelete, timeout = 3 }) {
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
					}, timeout * 1000);
				}
			}}
		>
			{pending ? "Confirm?" : <i className="bx bx-trash" />}
		</button>
	);
}
