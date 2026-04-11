/**
 * Removes the currently stored authorization token from localstorage if response.status === 444.
 * Returns true if and only if the status is 444.
 */
export function handleAuthFail(response) {
	if (!response) {
		return;
	}
	if (response.status === 444) {
		localStorage.removeItem("token");
		return true;
	}
	return false;
}
