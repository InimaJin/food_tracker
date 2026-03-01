import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import DateSelectPage, { dateSelectAction } from "./date_selection_page.jsx";
import MealsPage, { mealsPageAction, mealsPageLoader } from "./meals_page.jsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				index: true,
				action: dateSelectAction,
				element: <DateSelectPage />,
			},
			{
				path: "/meals",
				loader: mealsPageLoader,
				action: mealsPageAction,
				element: <MealsPage />,
			},
		],
	},
]);

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RouterProvider router={router}>
			<App />
		</RouterProvider>
	</StrictMode>,
);
