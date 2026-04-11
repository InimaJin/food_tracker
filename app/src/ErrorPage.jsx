import { useEffect, useRef } from "react";

/**
 * A simple error page with a cute little bug walking across the screen.
 */
export default function ErrorPage() {
	const bugRef = useRef();

	useEffect(() => {
		const bug = bugRef.current;
		let animationID;

		let lin = 0;
		let dy = 0;
		let scale = 20;
		function bugStep() {
			const p = dy * 0.06;
			const dx = scale * Math.cos(p) - lin;
			const rotation = -scale * Math.sin(p);
			bug.style.transform = `translate(${dx}px, ${-dy}px) rotate(${rotation}deg)`;

			lin += 0.05;
			dy += 0.7;
			setTimeout(() => {
				animationID = requestAnimationFrame(bugStep);
			}, 30);
		}

		bugStep();

		return () => cancelAnimationFrame(animationID);
	}, []);

	return (
		<div className="current-window scroll-window">
			<header>
				<h1>Oops!</h1>
			</header>
			<div className="scroll-window-main error-page-body">
				<p>Something seems to have gone terribly wrong. Please try again.</p>
			</div>
			<div className="bug-icon-wrapper">
				<i className="bx bx-bug" ref={bugRef} />
			</div>
		</div>
	);
}
